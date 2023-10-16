import { getContract } from 'viem';
import { publicClient } from './clients.js';

import ERC20ABI from '../../abi/erc20.abi.json';
import Cache from './cache.js';

export const getTokenInfo = async (address) => {
  let tokenInfo = Cache.getTokenInfo(address);

  if (!tokenInfo) {
    const tokenContract = getContract({
      address,
      abi: ERC20ABI,
      publicClient,
    });

    tokenInfo = {
      address,
      name: await tokenContract.read.name(),
      decimals: await tokenContract.read.decimals(),
      symbol: await tokenContract.read.symbol(),
    };
    Cache.saveTokenInfo(tokenInfo);
  }

  return tokenInfo;
};

export const formatTokenValue = (value, decimals) => (value / 10 ** decimals).toFixed(2);
