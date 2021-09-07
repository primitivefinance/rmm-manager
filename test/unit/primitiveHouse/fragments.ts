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
  await addLiquidityFragment(signers, contracts)
  const poolId = computePoolId(contracts.engine.address, strike.raw, sigma.raw, maturity.raw)
  await contracts.house.addLiquidity(
    contracts.risky.address,
    contracts.stable.address,
    poolId,
    parseWei('1').raw,
    true
  )
}

export async function borrowFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await withdrawFragment(signers, contracts)
  await contracts.stable.mint(contracts.router.address, parseWei('1000000').raw)
  await contracts.risky.mint(contracts.router.address, parseWei('1000000').raw)
  await contracts.risky.approve(contracts.router.address, constants.MaxUint256)
  await contracts.stable.approve(contracts.router.address, constants.MaxUint256)
  const poolId = computePoolId(contracts.engine.address, strike.raw, sigma.raw, maturity.raw)
  await contracts.house.addLiquidity(
    contracts.risky.address,
    contracts.stable.address,
    poolId,
    parseWei('2').raw,
    false
  )
}

export async function repayFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await borrowFragment(signers, contracts)
  const poolId = computePoolId(contracts.factory.address, strike.raw, sigma.raw, maturity.raw)
  await contracts.house.borrow(
    contracts.risky.address,
    contracts.stable.address,
    poolId,
    parseWei('10').raw,
    parseWei('10').raw,
    parseWei('10').raw,
    parseWei('10').raw,
    true
  )
}

export async function swapFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await borrowFragment(signers, contracts)
}
