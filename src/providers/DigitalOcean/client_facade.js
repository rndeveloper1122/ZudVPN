'use strict';

import { SERVER_TAG } from './constants';
import Deploy from './deploy';
import ApiClient from './api_client';

class ClientFacade {
    constructor(token) {
        this.token = token;

        this.api_client = new ApiClient(token);
    }

    async getAccount() {
        return await this.api_client.getAccount();
    }

    async createServer(region, notify) {
        const deploy = Deploy({
            client: this.api_client,
            token: this.token,
            region: region.slug,
            notify,
        });
        return await deploy.run();
    }

    async readServerVPN(server) {
        // @todo implement
    }

    async getServers() {
        let droplets = await this.api_client.getDropletsByTag(SERVER_TAG);

        return droplets.map(droplet => {
            return {
                provider: {
                    id: 'digitalocean',
                    name: 'DigitalOcean',
                },
                uid: droplet.id,
                name: droplet.name,
                region: {
                    name: droplet.region.name,
                    slug: droplet.region.slug,
                },
                ipv4_address: droplet.networks.v4[0].ip_address,
            };
        });
    }

    deleteServer(server) {
        this.api_client.deleteDroplet(server.uid);
    }

    async getRegions() {
        return await this.api_client.getRegions();
    }
}

export default ClientFacade;
