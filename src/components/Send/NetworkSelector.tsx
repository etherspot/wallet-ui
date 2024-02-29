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

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

// NetworkSelector component that takes supportedNetworks, setSelectedNetwork, and selectedNetwork as props
const NetworkSelector: React.FC<{
  supportedNetworks?: any[];
  setSelectedNetwork: (networkId: number | null) => void;
  selectedNetwork: number | null;
}> = ({ supportedNetworks, setSelectedNetwork, selectedNetwork }) => (
  <div className="flex items-center mb-4">
    {/* Label for the network selector */}
    <label htmlFor="network" className="mr-2">
      Select Network:
    </label>
    {/* Headless UI Menu component */}
    <Menu as="div" className="relative inline-block text-left">
      <div>
        {/* Menu Button */}
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {selectedNetwork
            ? supportedNetworks?.find((network) => network.chainId === selectedNetwork)?.name.toUpperCase()
            : 'Select Network'}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      {/* Transition for menu items */}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        {/* Menu Items */}
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {/* Map over supportedNetworks to display network options */}
            {supportedNetworks?.map((network) => (
              <Menu.Item key={network.name}>
                {/* Menu item button */}
                {({ active }) => (
                  <button
                    onClick={() => setSelectedNetwork(network.chainId)}
                    className={`${
                      active ? 'bg-blue-400 text-white' : 'text-gray-900'
                    } flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    {/* Display network name */}
                    {network.name.toUpperCase()}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  </div>
);

export default NetworkSelector;
