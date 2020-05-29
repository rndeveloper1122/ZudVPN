import React, { useEffect, useState } from 'react';
import { Text, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { APPLICATION_LOG_FILENAME } from '../../logger';
import { Navigation } from 'react-native-navigation';

const LogFileViewerScreen = props => {
    const [logs, setLogs] = useState(null);
    const logFile = RNFS.DocumentDirectoryPath + '/' + APPLICATION_LOG_FILENAME + '.txt';

    Navigation.events().registerNavigationButtonPressedListener(({ buttonId, componentId }) => {
        if (componentId === props.componentId && buttonId === 'clear_log') {
            Alert.alert('Warning!', 'Are you sure you want to clear application logs?', [
                {
                    text: 'Clear',
                    onPress: () => clearLogs(),
                    style: 'destructive',
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]);
        }
    });

    const clearLogs = () => {
        RNFS.writeFile(logFile, '').then(() => {
            setLogs('');
        });
    };

    useEffect(() => {
        const read_log_file = async () => {
            try {
                setLogs(await RNFS.readFile(logFile));
            } catch (e) {
                setLogs('');
            }
        };

        read_log_file();
    }, []);

    if (logs === null) {
        return (
            <ScrollView style={{ flex: 1 }}>
                <ActivityIndicator size={'large'} />
            </ScrollView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }}>
                <Text selectable={true}>{logs}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default LogFileViewerScreen;
