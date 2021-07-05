import { Wallet, constants } from 'ethers'
import { Contracts } from '../../../types'
import { parseWei, PERCENTAGE } from '../../shared/Units'

const [strike, sigma, time, riskyPrice] = [parseWei('1000').raw, 0.85 * PERCENTAGE, 1655655140, parseWei('1100').raw]
const empty = constants.HashZero

export async function initializeFragment(signers: Wallet[], contracts: Contracts): Promise<void> {
  // do nothing
}
