import { createStore, createHook } from 'react-sweet-state';
import RNNetworkExtension from 'react-native-network-extension';
import AsyncStorage from '@react-native-community/async-storage';
import logger from '../logger';

export const INITIAL_STATE_KEY = 'INITIAL_STATE_KEY';

const initialState = {
    provider_tokens: [],
    current_vpn_server: null,
    vpn_status: 'Disconnected',
    notifications: [],
};

const actions = {
    addProviderToken: token => ({ setState, getState, dispatch }) => {
        setState({ provider_tokens: [...getState().provider_tokens, token] });

        dispatch(actions.persistState());
    },
    setCurrentVPNServer: server => ({ setState, dispatch }) => {
        setState({ current_vpn_server: server });

        dispatch(actions.persistState());
    },
    setVPNStatus: status => ({ setState }) => {
        setState({ vpn_status: status });
    },
    toggleVPN: () => async ({ setState, getState, dispatch }) => {
        if (getState().vpn_status === 'Connected') {
            RNNetworkExtension.disconnect();
        } else {
            setState({ vpn_status: 'Connecting' });

            try {
                await RNNetworkExtension.connect();
            } catch (e) {
                dispatch(actions.notify('error', `Failed to start VPN connection: ${e.message}`));
            }
        }
    },
    triggerSignOut: provider => ({ setState, getState, dispatch }) => {
        setState({ provider_tokens: getState().provider_tokens.filter(token => token.provider !== provider.id) });

        dispatch(actions.persistState());
    },
    notify: (type, notification) => ({ setState, getState }) => {
        setState({ notifications: [{ type, notification }, ...getState().notifications] });

        logger.log(type, notification);
    },
    initState: state => ({ setState }) => setState(state),
    persistState: () => ({ setState, getState }) => {
        const state = {
            provider_tokens: getState().provider_tokens,
            current_vpn_server: getState().current_vpn_server,
        };

        AsyncStorage.setItem(INITIAL_STATE_KEY, JSON.stringify(state));
    },
};

const Store = createStore({
    name: 'main_store',
    initialState,
    actions,
});

export const useStore = createHook(Store);
