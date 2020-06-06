import { Navigation } from 'react-native-navigation';
import {
    LOG_FILE_VIEWER_SCREEN,
    PROVIDER_REGION_SCREEN,
    PROVIDER_REGISTER_SCREEN,
    SETTINGS_SCREEN,
    SSH_TERMINAL_SCREEN,
} from './screen_constants';

const useScreen = () => {
    return {
        ProviderRegisterScreenPush: props =>
            Navigation.push(props.componentId, {
                component: {
                    name: PROVIDER_REGISTER_SCREEN,
                    options: {
                        topBar: {
                            title: {
                                text: props.provider.name,
                            },
                        },
                    },
                    passProps: props,
                },
            }),
        ProviderRegionScreenPush: (componentId, provider) =>
            Navigation.push(componentId, {
                component: {
                    name: PROVIDER_REGION_SCREEN,
                    options: {
                        topBar: {
                            title: {
                                text: 'Regions',
                            },
                            leftButtons: [],
                            rightButtons: [
                                {
                                    id: 'sign_out',
                                    text: 'Sign out',
                                    color: 'red',
                                },
                            ],
                        },
                    },
                    passProps: {
                        provider,
                    },
                },
            }),
        LogFileViewerScreenPush: componentId =>
            Navigation.push(componentId, {
                component: {
                    name: LOG_FILE_VIEWER_SCREEN,
                    options: {
                        topBar: {
                            title: {
                                text: 'Log Viewer',
                            },
                            leftButtons: [],
                            rightButtons: [
                                {
                                    id: 'clear_log',
                                    text: 'Clear',
                                    color: 'red',
                                },
                            ],
                        },
                    },
                },
            }),
        SettingsScreenModel: () =>
            Navigation.showModal({
                stack: {
                    children: [
                        {
                            component: {
                                name: SETTINGS_SCREEN,
                                options: {
                                    topBar: {
                                        title: {
                                            text: 'Settings',
                                        },
                                        leftButtons: [],
                                        rightButtons: [
                                            {
                                                id: 'done_button',
                                                text: 'Done',
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            }),
        SSHTerminalScreenModal: (name, ipv4_address) =>
            Navigation.showModal({
                stack: {
                    children: [
                        {
                            component: {
                                name: SSH_TERMINAL_SCREEN,
                                passProps: {
                                    name,
                                    ipv4_address,
                                },
                            },
                        },
                    ],
                },
            }),
    };
};

export default useScreen;
