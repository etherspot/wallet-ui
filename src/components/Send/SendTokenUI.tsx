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

import React, { useState, useEffect } from 'react';

// Contexts
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

// Utils
import { openTxExplorer } from '../../utils/index';
import { primeNativeAssets } from '../../utils/chain';

// SDK and Library
import { TokenListToken } from '@etherspot/prime-sdk';
import { SendNativeToken } from '@etherspot/etherspot-ui';
import { ethers } from 'ethers';

// Components
import Tab from './Tab';
import NetworkSelector from './NetworkSelector';
import InputField from './InputField';

// SendToken UI with functionality
const SendTokenUI: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('Native Asset'); // State for the selected tab
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(null); // State for the selected network
  const [recipientAddress, setRecipientAddress] = useState<string>(''); // State for the recipient address
  const [tokenArray, setTokenArray] = useState<TokenListToken[]>([]); // State for the token
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for the error messages
  const [inputValue, setInputValue] = useState(''); // State for the input value (amount)
  const [txHash, setTxHash] = useState<string | null>(null); // State for the Transaction hash

  const { sdkPerChain, walletProvider, networks } = useAuth();
  const { showNotification } = useNotification();

  // Function to handle tab click
  const handleTabClick = (tabName: string) => {
    setSelectedTab(tabName);
  };

  // Function to handle recipient address change
  const handleRecipientAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientAddress(e.target.value);
  };

  const getTokensForNetwork = (networkId: number) => {
    const tokens = Object.values(primeNativeAssets);
    const filteredTokens = tokens.filter((token) => token.chainId === networkId);
    return filteredTokens;
  };

  // useEffect hook to update tokenArray when selectedNetwork changes
  useEffect(() => {
    if (selectedNetwork !== null) {
      const tokens = getTokensForNetwork(selectedNetwork); // Getting tokens for the selected network
      setTokenArray(tokens); // Setting tokenArray state
    }
  }, [selectedNetwork]);

  // Function to handle sending tokens
  const handleSend = async (sentRes: any) => {
    try {
      if (sentRes && sentRes.length > 0) {
        const { estimatedBatches, sentBatches } = sentRes[0]; // Destructuring estimated and sent batches from response
        const batch = sentBatches && sentBatches.length > 0 ? sentBatches[0] : estimatedBatches[0]; // Selecting the first batch
        const errorMessage = batch.errorMessage; // Getting error message from batch
        // Showing toast error notification if there's an error message
        if (errorMessage) {
          showNotification({
            type: 'error',
            message: `Error: ${errorMessage}`,
            options: { position: 'top-center' },
          });
          setErrorMessage(`Error: ${errorMessage}`);
        } else {
          if (batch?.userOpHash) {
            // ... Wait for the token transaction receipt and handle the response ...
            let tokenOpReceipt = null;
            const tokenTimeout = Date.now() + 60000; // Setting timeout for waiting
            while (tokenOpReceipt == null && Date.now() < tokenTimeout) {
              tokenOpReceipt = await sdkPerChain?.getUserOpReceipt(batch?.userOpHash); // Getting user operation receipt
            }

            // Setting transaction hash
            const tokenTxHash = tokenOpReceipt ? tokenOpReceipt.receipt.transactionHash : null;
            setTxHash(tokenTxHash);

            // Showing toast success notification
            showNotification({
              type: 'success',
              message: 'Transaction successful',
              options: { position: 'top-center' },
            });
          } else {
            // Showing toast error notification if something went wrong
            showNotification({
              type: 'error',
              message: 'Something went wrong. please try again.',
              options: { position: 'top-center' },
            });
            setErrorMessage('Something went wrong. please check logs in console and try again.');
          }
        }
      }
    } catch (error) {
      // Showing toast error notification if there's an error
      showNotification({
        type: 'error',
        message: `Error:`,
        options: { position: 'top-center' },
      });
      setErrorMessage('Something went wrong. please check logs in console and try again.');
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex">
        <div className="w-full">
          {/* Rendering the Tab component */}
          <Tab selectedTab={selectedTab} handleTabClick={handleTabClick} />

          {/* Checking if selected tab is 'Native Asset' */}
          {selectedTab === 'Native Asset' && (
            <div className="p-4 border-2 border-purple-100 rounded ">
              <h2 className="text-lg font-semibold">Native Asset</h2>
              {/* Rendering the NetworkSelector component */}
              <NetworkSelector
                supportedNetworks={networks}
                setSelectedNetwork={setSelectedNetwork}
                selectedNetwork={selectedNetwork}
              />
              {/* Checking if selectedNetwork and tokenArray are not empty */}
              {selectedNetwork && tokenArray.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h2>
                      Tokens for Network{' '}
                      {networks
                        ?.find((network: { chainId: number }) => network.chainId === selectedNetwork)
                        ?.name.toUpperCase()}
                    </h2>
                    <div className="mb-2">
                      <ul>
                        {/* Mapping over tokenArray to display tokens */}
                        {tokenArray.map((token) => (
                          <li className="flex" key={token.chainId}>
                            {token.logoURI && (
                              <img
                                src={token.logoURI}
                                alt={`${token.name} (${token.symbol}) image`}
                                aria-hidden="true"
                                className="mr-2 h-7 w-7"
                                style={{ borderRadius: '50%' }}
                              />
                            )}
                            <span className="text-lg">
                              {token.name} ({token.symbol})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Rendering the InputField component */}
                  <InputField
                    label="Recipient Address:"
                    value={recipientAddress}
                    onChange={handleRecipientAddressChange}
                  />

                  {/* Rendering the SendNativeToken component from etherspot-ui library */}
                  <div className="mt-4">
                    <SendNativeToken
                      receiverAddress={recipientAddress}
                      chainId={selectedNetwork !== null ? selectedNetwork : 1}
                      value={inputValue}
                      onChangeValue={setInputValue}
                      className="block w-1/2 rounded-md border-1 border-gray-300 px-3.5xp py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      errorMessageClassName="text-sm"
                      debug={true}
                      disableSendOnEnter={false}
                      onlyEstimate={false}
                      provider={walletProvider}
                      onEstimated={(res: any) => console.log('ON Estimates', res)}
                      onExecutionStatus={(status: any) => console.log('ON Execution', status)}
                      onSent={handleSend}
                    />
                    {/* Displaying error message if present */}
                    {errorMessage && <div className="pt-2 text-sm text-pink-600">{errorMessage}</div>}
                    {/* Displaying transaction hash if present */}
                    {txHash && (
                      <div className="pt-2">
                        Click to View Transaction on Explore:
                        <br />
                        <button
                          className="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900"
                          onClick={() => openTxExplorer(txHash, selectedNetwork)}
                        >
                          View Tx
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mb-4">
                  <h2>No tokens found for selected network. Please change network.</h2>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendTokenUI;
