import { Wallet, constants } from 'ethers'
import { Contracts } from '../../../types'
import { parseWei } from '../../shared/Units'
import { config } from '../context'
import { computePoolId } from '../../shared/utilities'

const { strike, sigma, maturity, spot } = config

export async function createFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await contracts.stable.mint(signers[0].address, constants.MaxUint256)
  await contracts.risky.mint(signers[0].address, constants.MaxUint256)
  await contracts.stable.approve(contracts.house.address, constants.MaxUint256)
  await contracts.risky.approve(contracts.house.address, constants.MaxUint256)
}

export async function depositFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await createFragment(signers, contracts)
  await contracts.house.create(
    contracts.risky.address,
    contracts.stable.address,
    parseWei('1').raw,
    strike.raw,
    sigma.raw,
    maturity.raw,
    spot.raw
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

export async function allocateFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await withdrawFragment(signers, contracts)
}

export async function removeFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await allocateFragment(signers, contracts)
  const poolId = computePoolId(contracts.factory.address, maturity.raw, sigma.raw, strike.raw)
  await contracts.house.allocate(
    signers[0].address,
    contracts.risky.address,
    contracts.stable.address,
    poolId,
    parseWei('10').raw,
    true
  )
}

export async function borrowFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await withdrawFragment(signers, contracts)
  const poolId = computePoolId(contracts.factory.address, maturity.raw, sigma.raw, strike.raw)
  await contracts.house.allocate(
    signers[0].address,
    contracts.risky.address,
    contracts.stable.address,
    poolId,
    parseWei('10').raw,
    true
  )
}

export async function repayFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await borrowFragment(signers, contracts)
  const poolId = computePoolId(contracts.factory.address, maturity.raw, sigma.raw, strike.raw)
  await contracts.house.borrow(
    signers[0].address,
    contracts.risky.address,
    contracts.stable.address,
    poolId,
    parseWei('10').raw,
    true,
    constants.MaxUint256
  )
}

export async function swapFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await borrowFragment(signers, contracts)
}
