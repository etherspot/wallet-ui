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

import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import axios from 'axios';

// Utility function to convert wei to Ether
export function tokenHexStringToEther(hexTokenAmount: string): string {
  const tokenAmount = new BigNumber(hexTokenAmount);
  const ether = ethers.formatEther(tokenAmount.toString());
  return ether;
}

// Utility function to convert Ether to USD
export async function etherToUSD(etherAmount: string): Promise<number> {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
  const usdRate = response.data.ethereum.usd;
  const usdValue = new BigNumber(etherAmount).multipliedBy(usdRate).toNumber();
  return usdValue;
}

// Utility function to format balance in USD
export async function BalanceDisplayInUSD(rawBalance: string): Promise<string> {
  const etherAmount = tokenHexStringToEther(rawBalance);
  const USDAmount = await etherToUSD(etherAmount);
  return `${USDAmount.toFixed(2)} $`;
}

export const formatBalance = (rawBalance: string) => {
  const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(2);
  return balance;
};

export const formatChainAsNum = (chainIdHex: string) => {
  const chainIdNum = parseInt(chainIdHex);
  return chainIdNum;
};

export const truncateAddress = (addr: string) => {
  return `${addr.substring(0, 8)}...`;
};
