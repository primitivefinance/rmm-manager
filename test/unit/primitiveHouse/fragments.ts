import { Wallet, constants } from 'ethers'
import { Contracts } from '../../../types'
import { parseWei } from '../../shared/Units'
import { config } from '../context'

const { strike, sigma, maturity, spot } = config

const empty = constants.HashZero

export async function initializeFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  // do nothing
}

export async function createFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await contracts.house.initialize(contracts.engine.address)
  await contracts.stable.mint(signers[0].address, constants.MaxUint256)
  await contracts.risky.mint(signers[0].address, constants.MaxUint256)
  await contracts.stable.approve(contracts.house.address, constants.MaxUint256)
  await contracts.risky.approve(contracts.house.address, constants.MaxUint256)
}

export async function depositFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await createFragment(signers, contracts)
  await contracts.house.create(strike.raw, sigma.raw, maturity.raw, spot.raw, empty)
}

export async function withdrawFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await depositFragment(signers, contracts)
  await contracts.house.deposit(signers[0].address, parseWei('100000').raw, parseWei('100000').raw, empty)
}

export async function allocateFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await withdrawFragment(signers, contracts)
}

export async function borrowFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await withdrawFragment(signers, contracts)
  const poolId = await contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
  await contracts.house.allocate(poolId, signers[0].address, parseWei('10').raw, true, empty)
}

export async function repayFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  await borrowFragment(signers, contracts)
  const poolId = await contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
  await contracts.house.borrow(poolId, signers[0].address, parseWei('10').raw, constants.MaxUint256, empty)
}
