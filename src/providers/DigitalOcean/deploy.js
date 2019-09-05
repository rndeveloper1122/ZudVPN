'use strict'

import Client from './do_client'
import SSHClient from './../../ssh/client'
import AsyncStorage from '@react-native-community/async-storage'
import GenerateUserData from './generate_userdata'
import { sleep } from './../../helper'
import Keygen from './../../ssh/keygen'

const DropletBaseName = 'anyvpn'
const DropletImage = 'coreos-stable'
const DropletSize = 's-1vcpu-1gb'
const AutogeneratedSSHKey = 'anyvpn'

class Deploy {
    constructor(token, region) {
        this.name = `${DropletBaseName}-${region}`
        this.region = region
        this.doClient = new Client(token)
    }

    async run() {
        console.log('Reading SSH keys from provider.')
        let sshKeys = await this.doClient.getAccountSSHKeys()
        let sshKeyId = null
        let sshKeyPair = null

        for (let i = 0, l = sshKeys.length; i < l; i++) {
            sshKeyId = sshKeys[i]
            sshKeyPair = await AsyncStorage.getItem('SSH_KEY_PAIR' + sshKeyId)
            if (sshKeyPair) {
                console.log('Found SSH keypair in storage, parsing.')
                sshKeyPair = JSON.parse(sshKeyPair)
                break
            }
        }

        if (!sshKeyPair) {
            console.log('SSH keypair not available, generating.')
            sshKeyPair = await Keygen.generateKeyPair()

            console.log('Creating SSH key with generated keypair.')
            sshKeyId = await this.doClient.createSSHKey(AutogeneratedSSHKey, sshKeyPair.authorizedKey)
            sshKeys.push(sshKeyId)

            console.log('Saving SSH keypair by SSH key id to storage.')
            AsyncStorage.setItem('SSH_KEY_PAIR' + sshKeyId, JSON.stringify(sshKeyPair))
        }

        console.log('SSH Keypair:', sshKeyPair)

        console.log('Reading instance from provider.')
        const droplets = await this.doClient.getDropletsByTag(DropletBaseName);

        let droplet
        if (droplets.length > 0) {
            droplet = droplets.find(d => d.region.slug == this.region)
        }

        if (!droplet) {
            console.log(`Instance not available in ${this.region} region, creating.`)
            let userData = GenerateUserData(sshKeyPair.authorizedKey)
            console.log('generated user data: ', userData)
            droplet = await this.doClient.createDroplet(sshKeys, this.name, this.region, DropletSize, userData, DropletImage, [DropletBaseName])
            
            console.log('Creating firewall for the instance.')
            await this.addFirewallToDroplet(DropletBaseName, droplet.id)
        }

        console.log('Waiting for the instance IP address.')
        let ipAddress = await this.getIpAddress(droplet)
        console.log('IP address to be used for VPN:', ipAddress)

        console.log('Starting SSH connection to the instance.')
        let sshClient = new SSHClient(sshKeyPair, 'core', ipAddress, 22)

        await this.waitForSSHConnection(sshClient)

        console.log('Waiting for VPN service to become active.')
        let countWaitingForVPN = 3;
        do {
            console.log('Cheking VPN service, attemt: ', 4 - countWaitingForVPN)
            countWaitingForVPN--
            try {
                await sshClient.run('until docker logs dosxvpn &>/dev/null; do sleep 2; done; sleep 5;')
                countWaitingForVPN = 0
            } catch (e) {
                console.warn(`Attemt ${countWaitingForVPN} failed.`, e)
                if (countWaitingForVPN === 0) {
                    throw e
                }
            }
        } while (countWaitingForVPN > 0)

        console.log('Reading authentication data from VPN service.')
        let [privateKeyPassword, privateKeyCertificate, caCertificate, serverCertificate] = await Promise.all([
            sshClient.run(`docker exec dosxvpn /bin/sh -c "cat /etc/ipsec.d/client.cert.p12.password"`),
            // sshClient.run(`docker exec dosxvpn /bin/sh -c "cat /etc/ipsec.d/client.cert.p12.password | sed 's/\r$//'"`),
            sshClient.run(`docker exec dosxvpn /bin/sh -c "cat /etc/ipsec.d/client.cert.p12 | base64"`),
            sshClient.run(`docker exec dosxvpn /bin/sh -c "cat /etc/ipsec.d/cacerts/ca.cert.pem | base64"`),
            sshClient.run(`docker exec dosxvpn /bin/sh -c "cat /etc/ipsec.d/certs/server.cert.pem | base64"`)
        ])

        privateKeyPassword = privateKeyPassword.replace(/[\n\r]+/g, '')
        privateKeyCertificate = privateKeyCertificate.replace(/^\s+|\s+$/g, '')
        caCertificate = caCertificate.replace(/^\s+|\s+$/g, '')
        serverCertificate = serverCertificate.replace(/^\s+|\s+$/g, '')

        console.log('Closing SSH connection.')
        sshClient.closeSession()

        return {
            ipAddress,
            privateKeyPassword,
            privateKeyCertificate,
            caCertificate,
            serverCertificate
        }
    }

    async addFirewallToDroplet(name, dropletId) {
        const firewallName = name + '_firewall';

        const firewalls = await this.doClient.getAllFirewalls()

        if (firewalls.length > 0) {
            const firewall = firewalls.find(f => f.name == firewallName)

            if (firewall) {
                await this.doClient.addDropletToFirewall(firewall.id, dropletId)
            }
        } else {
            await this.doClient.createFirewall(firewallName, dropletId)
        }
    }

    async waitForSSHConnection(sshClient) {
        let trialLeft = 5
        do {
            console.log('Waiting for SSH, attempt:', 6 - trialLeft)
            trialLeft--
            try {
                let isConnected = await sshClient.openSession()
                if (isConnected) {
                    trialLeft = 0
                }
            } catch(e) {
                console.warn('ssh connection not ready, trial left:', trialLeft)
                await sleep(trialLeft*1000)
            }
        } while (trialLeft > 0)
        
    }

    async getIpAddress(droplet) {
        for (let i = 1; i < 10; i++) {
            for (const ip of droplet.networks.v4) {
                if (ip.ip_address) {
                    return ip.ip_address
                }
            }

            await sleep(i*1000)

            droplet = await this.doClient.getDropletById(droplet.id)
        }

        throw new Error('Timed out waiting for Droplet provision.')
    }
}

export default Deploy