/* MIT License
 *
 * Copyright (c) 2024 Etherspot
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useState, useEffect, createContext, PropsWithChildren, useContext, useCallback } from 'react';

// Libraries
import detectEthereumProvider from '@metamask/detect-provider';
import { useSDK } from '@metamask/sdk-react';
import { PrimeSdk, MetaMaskWalletProvider, WalletProviderLike, Network } from '@etherspot/prime-sdk';
import { useNotification } from '../context/NotificationContext';

// Define wallet state
interface WalletState {
  accounts: string[];
  balance: string;
  chainId: string;
}

// Define the authentication context data
interface AuthContextData {
  wallet: WalletState; // Wallet state containing accounts, balance, and chainId
  hasProvider: boolean | null; // Whether MetaMask provider is available
  isConnecting: boolean; // Whether MetaMask is currently connecting or not
  sdkPerChain: PrimeSdk | null; // PrimeSdk instance
  walletProvider: WalletProviderLike | null | undefined; // PrimeSdk instance
  networks: Network[] | undefined;
  connectMetaMask: () => void; // Function to connect MetaMask
  logout: () => void; // Function to log out
}

// Define the initial disconnected state of the wallet
const disconnectedState: WalletState = { accounts: [], balance: '', chainId: '' };

// Create the authentication context
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// AuthContextProvider component provides the authentication context to its children
export const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null); // Whether MetaMask provider is available
  const [isConnecting, setIsConnecting] = useState(false); // Whether MetaMask is currently connecting
  const [wallet, setWallet] = useState(disconnectedState); // Wallet state
  const [sdkPerChain, setSdkPerChain] = useState<PrimeSdk | null>(null); // PrimeSdk instance
  const [walletProvider, setWalletProvider] = useState<WalletProviderLike | null>(null); // Metamask instance
  const [networks, setNetworks] = useState<Network[]>([]); // Metamask instance
  const { sdk } = useSDK(); // MetaMask SDK hook
  const { showNotification } = useNotification(); // notification contexts

  const setStates = (walletProviderValue: any, sdkPerChainValue: any, networksValue: any) => {
    setWalletProvider(walletProviderValue);
    setSdkPerChain(sdkPerChainValue);
    setNetworks(networksValue);
  };

  // Get ChainID
  const getChainId = async () => {
    const chainId = (await window.ethereum?.request({
      method: 'eth_chainId',
    })) as string;
    return chainId;
  };

  // Initialization of SDK and getting supported networks
  const initializeSdkPerChainFromMetaMask = async () => {
    const chainId = await getChainId();
    const walletProvider = await MetaMaskWalletProvider.connect();
    const sdkPerChain = new PrimeSdk(walletProvider, { chainId: Number(chainId), projectKey: '' });
    const networks = sdkPerChain?.supportedNetworks;
    return { walletProvider, sdkPerChain, networks };
  };

  // Update wallet state
  const _updateWallet = useCallback(async (providedAccounts?: string[]) => {
    const accounts = providedAccounts || ((await window.ethereum?.request({ method: 'eth_accounts' })) as string[]);

    if (accounts.length === 0) {
      // If there are no accounts, then the user is disconnected
      setWallet(disconnectedState);
      return;
    }

    // Get balance of account
    const balance = (await window.ethereum?.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    })) as string;

    // Call function to get chainID
    const chainId = await getChainId();

    // Set wallet state
    setWallet({ accounts, balance, chainId });

    if (window.ethereum) {
      const { walletProvider, sdkPerChain, networks } = await initializeSdkPerChainFromMetaMask();
      setStates(walletProvider, sdkPerChain, networks);
    } else {
      showNotification({
        type: 'error',
        message: `MetaMask or compatible Ethereum provider not detected`,
        options: { position: 'top-center' },
      });
    }
  }, []);

  const updateWalletAndAccounts = useCallback(() => _updateWallet(), [_updateWallet]);
  const updateWallet = useCallback((accounts: any) => _updateWallet(accounts), [_updateWallet]);

  /**
   * This logic checks if MetaMask is installed. If it is, some event handlers are set up
   * to update the wallet state when MetaMask changes. The function returned by useEffect
   * is used as a "cleanup": it removes the event handlers whenever the MetaMaskProvider
   * is unmounted.
   */
  useEffect(() => {
    const getProvider = async () => {
      try {
        const provider = await detectEthereumProvider({ silent: true });
        setHasProvider(Boolean(provider));

        if (provider) {
          updateWalletAndAccounts();
          const { walletProvider, sdkPerChain, networks } = await initializeSdkPerChainFromMetaMask();
          setStates(walletProvider, sdkPerChain, networks);

          window.ethereum?.on('accountsChanged', updateWallet);
          window.ethereum?.on('chainChanged', updateWalletAndAccounts);
        }
      } catch (error) {
        showNotification({
          type: 'error',
          message: `Error detecting Ethereum provider: ${error}`,
          options: { position: 'top-center' },
        });
      }
    };
    getProvider();
    // Cleanup function to remove event listeners
    return () => {
      try {
        window.ethereum?.removeListener('accountsChanged', updateWallet);
        window.ethereum?.removeListener('chainChanged', updateWalletAndAccounts);
      } catch (error) {
        showNotification({
          type: 'error',
          message: `Error removing event listeners: ${error}`,
          options: { position: 'top-center' },
        });
      }
    };
  }, [updateWallet, updateWalletAndAccounts]);

  // Function to connect MetaMask
  const connectMetaMask = async () => {
    setIsConnecting(true);
    if (!window.ethereum) {
      // Show error notification if MetaMask is not installed or not accessible
      showNotification({
        type: 'error',
        message: 'MetaMask is not installed or not accessible.',
        options: { position: 'top-center' },
      });
      setIsConnecting(false);
      return;
    }

    try {
      // Request account
      const accounts: any = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length > 0) {
        // Request for sign verification
        const message = 'Connect + Sign';
        await window.ethereum.request({
          method: 'personal_sign',
          params: [message, accounts[0]],
        });
        updateWallet(accounts);
      } else {
        // Show error notification if there's no account
        showNotification({
          type: 'error',
          message: 'No accounts were found, please add an account first.',
          options: { position: 'top-center' },
        });
      }
    } catch (err: any) {
      showNotification({
        type: 'error',
        message: `Error connecting MetaMask. Please check log and try again: ${err}`,
        options: { position: 'top-center' },
      });
    }
    setIsConnecting(false);
  };
  // Function to log out
  const logout = () => {
    try {
      sdk?.terminate();
      setWallet(disconnectedState);
      setIsConnecting(false);
    } catch (error) {
      showNotification({
        type: 'error',
        message: `Error logging out. Please check log and try again: ${error}`,
        options: { position: 'top-center' },
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        wallet,
        hasProvider,
        isConnecting,
        sdkPerChain,
        walletProvider,
        networks,
        connectMetaMask,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a "MetaMaskContextProvider"');
  }
  return context;
};
