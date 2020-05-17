import { Text, View } from 'react-native';
import styles from './styles';
import { SegmentButton } from './buttons';
import React from 'react';

const RenderServer = ({ server, select, sshTerminal, destroy }) => {
    return (
        <View style={styles.server_container}>
            <View style={{ padding: 15 }}>
                <Text>Provider: {server.provider.name}</Text>
                <Text>
                    Location: {server.region.name} ({server.name})
                </Text>
                <Text>IP Address: {server.ipv4_address}</Text>
            </View>
            <View style={styles.button_container}>
                <SegmentButton label={'Destroy'} labelStyle={{ color: 'red' }} onPress={destroy(server.uid)} />
                <View style={styles.button_separator} />
                <SegmentButton label={'Terminal'} onPress={sshTerminal(server.uid, server.ipv4_address)} />
                <View style={styles.button_separator} />
                <SegmentButton label={'Select'} onPress={select(server)} />
            </View>
        </View>
    );
};

export default RenderServer;
