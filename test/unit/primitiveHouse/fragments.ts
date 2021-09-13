import { Wallet, constants } from 'ethers'
import { parseWei } from 'web3-units'

import { Contracts } from '../../../types'
import { DEFAULT_CONFIG } from '../context'
import { computePoolId } from '../../shared/utilities'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG

export async function createFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await contracts.stable.mint(signers[0].address, parseWei('1000000').raw)
  await contracts.risky.mint(signers[0].address, parseWei('1000000').raw)
  await contracts.stable.approve(contracts.house.address, constants.MaxUint256)
  await contracts.risky.approve(contracts.house.address, constants.MaxUint256)
}

export async function depositFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await createFragment(signers, contracts)
  await contracts.house.create(
    contracts.risky.address,
    contracts.stable.address,
    strike.raw,
    sigma.raw,
    maturity.raw,
    parseWei(delta).raw,
    parseWei('1').raw
  )
}

export async function withdrawFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await depositFragment(signers, contracts)
  await contracts.house.deposit(
    signers[0].address,
    contracts.risky.address,
    contracts.stable.address,
    parseWei('100000').raw,
    parseWei('100000').raw
  )
}

export async function addLiquidityFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await withdrawFragment(signers, contracts)
}

export async function removeLiquidityFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await createFragment(signers, contracts)
  await contracts.house.create(
    contracts.risky.address,
    contracts.stable.address,
    strike.raw,
    sigma.raw,
    maturity.raw,
    parseWei(delta).raw,
    parseWei('10').raw
  )
  /*
  const poolId = computePoolId(contracts.engine.address, strike.raw, sigma.raw, maturity.raw)
  await contracts.house.addLiquidity(
    contracts.risky.address,
    contracts.stable.address,
    poolId,
    parseWei('1').raw,
    true
  )
  */
}

export async function swapFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await createFragment(signers, contracts)
  await contracts.house.create(
    contracts.risky.address,
    contracts.stable.address,
    strike.raw,
    sigma.raw,
    maturity.raw,
    parseWei(delta).raw,
    parseWei('10000').raw
  )
}
