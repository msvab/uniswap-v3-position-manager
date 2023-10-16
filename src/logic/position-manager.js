import { getContract } from 'viem';
import { ACCOUNT_ADDRESS, publicClient, walletClient } from './clients.js';

import UniswapFactoryABI from '../../abi/uniswap-v3-factory.abi.json';
import UniswapPoolABI from '../../abi/uniswap-v3-pool.abi.json';
import UniswapPositionManagerABI from '../../abi/uniswap-v3-position-manager.abi.json';
import { getTokenInfo } from './tokens.js';
import Cache from './cache.js';
import { getCurrentValue, getUncollectedFees } from './uniswap-math.js';
import { FACTORY_CONTRACT, POSITION_MANAGER } from './contract-addresses.js';

const MAX_UINT_128 = 340282366920938463463374607431768211455n;

const getPosition = async (positionManagerContract, factoryContract, positionId) => {
  const [, , token0, token1, fee, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128] =
    await positionManagerContract.read.positions([positionId]);

  const activePosition = liquidity > BigInt(0);

  if (activePosition) {
    const poolAddress = await factoryContract.read.getPool([token0, token1, fee]);

    const poolContract = getContract({
      address: poolAddress,
      abi: UniswapPoolABI,
      publicClient,
    });

    const [sqrtPriceX96] = await poolContract.read.slot0();
    const [, , feeGrowth0Low, feeGrowth1Low] = await poolContract.read.ticks([tickLower]);
    const [, , feeGrowth0Hi, feeGrowth1Hi] = await poolContract.read.ticks([tickUpper]);

    const feeGrowthGlobal0 = await poolContract.read.feeGrowthGlobal0X128();
    const feeGrowthGlobal1 = await poolContract.read.feeGrowthGlobal1X128();

    const tokenInfo0 = await getTokenInfo(token0);
    const tokenInfo1 = await getTokenInfo(token1);

    const currentValue = await getCurrentValue(
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      feeGrowth0Low,
      feeGrowth0Hi,
      feeGrowthInside0LastX128,
      feeGrowth1Low,
      feeGrowth1Hi,
      feeGrowthInside1LastX128,
      liquidity,
      tokenInfo0.decimals,
      tokenInfo1.decimals,
      tickLower,
      tickUpper,
      sqrtPriceX96,
    );

    const fees = await getUncollectedFees(
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      feeGrowth0Low,
      feeGrowth0Hi,
      feeGrowthInside0LastX128,
      feeGrowth1Low,
      feeGrowth1Hi,
      feeGrowthInside1LastX128,
      liquidity,
      tokenInfo0.decimals,
      tokenInfo1.decimals,
      tickLower,
      tickUpper,
      sqrtPriceX96,
    );

    return {
      currentValue,
      fees,
      liquidity,
      tickLower,
      tickUpper,
      tokenInfo0,
      tokenInfo1,
    };
  }
};

/**
 * Returns all active positions for current account.
 *
 * @returns {Promise<Object[]>}
 */
export const getPositions = async () => {
  const factoryContract = getContract({
    address: FACTORY_CONTRACT,
    abi: UniswapFactoryABI,
    publicClient,
  });

  const positionManagerContract = getContract({
    address: POSITION_MANAGER,
    abi: UniswapPositionManagerABI,
    publicClient,
    walletClient,
  });

  const positionCount = await positionManagerContract.read.balanceOf([ACCOUNT_ADDRESS]);
  console.log(`Found ${positionCount} positions.`);

  let positionIds = [];
  const cachedPositionIds = Cache.getPositionIds();

  if (BigInt(cachedPositionIds.length) === positionCount) {
    positionIds = cachedPositionIds;
  } else {
    for (let index = 0; index < positionCount; index++) {
      const positionId = await positionManagerContract.read.tokenOfOwnerByIndex([ACCOUNT_ADDRESS, index]);
      positionIds.push(positionId);
      Cache.savePositionIds(positionIds);
    }
  }

  const activePositions = [];

  for (const positionId of positionIds) {
    // ignore inactive positions
    if (Cache.getInactivePosition(positionId)) {
      continue;
    }

    const position = await getPosition(positionManagerContract, factoryContract, positionId);

    if (position) {
      activePositions.push({
        chainId: publicClient.chain.id,
        currentValue: position.currentValue,
        liquidity: position.liquidity,
        positionId,
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        token0: position.tokenInfo0,
        token1: position.tokenInfo1,
        fees0: position.fees.fees0,
        feesFormatted0: position.fees.feesFormatted0,
        fees1: position.fees.fees1,
        feesFormatted1: position.fees.feesFormatted1,
      });
    } else {
      // mark inactive positions, so we don't fetch them next time
      Cache.saveInactivePosition(positionId);
    }
  }

  return activePositions;
};

/**
 * Collects fees on given position.
 *
 * @param {Object} position Position.
 * @returns {Promise<void>}
 */
export const collectFees = async (position) => {
  if (publicClient.chain.id !== position.chainId) {
    alert('Wrong chain is currently active!');
  }

  const positionManagerContract = getContract({
    address: POSITION_MANAGER,
    abi: UniswapPositionManagerABI,
    publicClient,
    walletClient,
  });

  await positionManagerContract.write.collect([[position.positionId, ACCOUNT_ADDRESS, MAX_UINT_128, MAX_UINT_128]]);
};
