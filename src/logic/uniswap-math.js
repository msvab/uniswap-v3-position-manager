import { formatTokenValue } from './tokens.js';

const Q96 = 2n ** 96n;
const Q128 = 2n ** 128n;
const Q256 = 2n ** 256n;

const getTickAtSqrtPrice = (sqrtPrice) => {
  return Math.floor(Math.log(sqrtPrice ** 2) / Math.log(1.0001));
};

const subIn256 = (x, y) => {
  const difference = x - y;
  return difference < 0n ? difference + Q256 : difference;
};

export async function getCurrentValue(
  feeGrowthGlobal0,
  feeGrowthGlobal1,
  feeGrowth0Low,
  feeGrowth0Hi,
  feeGrowthInside0,
  feeGrowth1Low,
  feeGrowth1Hi,
  feeGrowthInside1,
  liquidity,
  decimals0,
  decimals1,
  tickLower,
  tickUpper,
  sqrtPriceX96,
) {
  const sqrtRatioA = Math.sqrt(1.0001 ** Number(tickLower));
  const sqrtRatioB = Math.sqrt(1.0001 ** Number(tickUpper));
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
  const tickCurrent = getTickAtSqrtPrice(sqrtPrice);
  let value0 = 0;
  let value1 = 0;

  if (tickCurrent < tickLower) {
    value0 = Math.floor(Number(liquidity) * ((sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB)));
  } else if (tickCurrent >= tickUpper) {
    value1 = Math.floor(Number(liquidity) * (sqrtRatioB - sqrtRatioA));
  } else if (tickCurrent >= tickLower && tickCurrent < tickUpper) {
    value0 = Math.floor(Number(liquidity) * ((sqrtRatioB - sqrtPrice) / (sqrtPrice * sqrtRatioB)));
    value1 = Math.floor(Number(liquidity) * (sqrtPrice - sqrtRatioA));
  }

  const valueFormatted0 = formatTokenValue(value0, decimals0);
  const valueFormatted1 = formatTokenValue(value1, decimals1);

  return { value0, value1, valueFormatted0, valueFormatted1 };
}

export async function getUncollectedFees(
  feeGrowthGlobal0,
  feeGrowthGlobal1,
  feeGrowth0Low,
  feeGrowth0Hi,
  feeGrowthInside0,
  feeGrowth1Low,
  feeGrowth1Hi,
  feeGrowthInside1,
  liquidity,
  decimals0,
  decimals1,
  tickLower,
  tickUpper,
  sqrtPriceX96,
) {
  const tickCurrent = getTickAtSqrtPrice(Number(sqrtPriceX96) / Number(Q96));
  let tickLowerFeeGrowthBelow0 = 0n;
  let tickLowerFeeGrowthBelow1 = 0n;
  let tickUpperFeeGrowthAbove0 = 0n;
  let tickUpperFeeGrowthAbove1 = 0n;

  // As stated above there is different math needed if the position is in or out of range
  // If current tick is above the range fg- fo,iu Growth Above range
  if (tickCurrent >= tickUpper) {
    tickUpperFeeGrowthAbove0 = subIn256(feeGrowthGlobal0, feeGrowth0Hi);
    tickUpperFeeGrowthAbove1 = subIn256(feeGrowthGlobal1, feeGrowth1Hi);
  } else {
    // Else if current tick is in range only need fg for upper growth
    tickUpperFeeGrowthAbove0 = feeGrowth0Hi;
    tickUpperFeeGrowthAbove1 = feeGrowth1Hi;
  }

  // If current tick is in range  only need fg for lower growth
  if (tickCurrent >= tickLower) {
    tickLowerFeeGrowthBelow0 = feeGrowth0Low;
    tickLowerFeeGrowthBelow1 = feeGrowth1Low;
  } else {
    // If current tick is above the range fg- fo,il Growth below range
    tickLowerFeeGrowthBelow0 = subIn256(feeGrowthGlobal0, feeGrowth0Low);
    tickLowerFeeGrowthBelow1 = subIn256(feeGrowthGlobal1, feeGrowth1Low);
  }

  // fr(t1) For both token0 and token1
  const frt10 = subIn256(subIn256(feeGrowthGlobal0, tickLowerFeeGrowthBelow0), tickUpperFeeGrowthAbove0);
  const frt11 = subIn256(subIn256(feeGrowthGlobal1, tickLowerFeeGrowthBelow1), tickUpperFeeGrowthAbove1);

  // The final calculations uncollected fees formula
  // for both token 0 and token 1 since we now know everything that is needed to compute it
  // subtracting the two values and then multiplying with liquidity l *(fr(t1) - fr(t0))
  const fees0 = (liquidity * subIn256(frt10, feeGrowthInside0)) / Q128;
  const fees1 = (liquidity * subIn256(frt11, feeGrowthInside1)) / Q128;

  // Decimal adjustment to get final results
  const feesFormatted0 = formatTokenValue(Number(fees0), decimals0);
  const feesFormatted1 = formatTokenValue(Number(fees1), decimals1);

  return {
    fees0,
    fees1,
    feesFormatted0,
    feesFormatted1,
  };
}
