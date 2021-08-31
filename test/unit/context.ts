import { createFixtureLoader, MockProvider } from 'ethereum-waffle'
import { Contracts } from '../../types'
import { Wallet } from 'ethers'
import createTestContracts from './createTestContracts'
import { Time, parsePercentage } from 'web3-units'
import { Calibration } from '../shared/calibration'

export const DEFAULT_CONFIG: Calibration = new Calibration(10, 1, 1633113818, 1, 10, parsePercentage(0.0015))

export default function loadContext(
  provider: MockProvider,
  action?: (signers: Wallet[], contracts: Contracts) => Promise<void>
): void {
  const loadFixture = createFixtureLoader(provider.getWallets(), provider)

  beforeEach(async function () {
    const loadedFixture = await loadFixture(async function (signers: Wallet[]) {
      const [deployer] = signers
      let loadedContracts: Contracts = {} as Contracts

      loadedContracts = await createTestContracts(deployer)

      if (action) await action(signers, loadedContracts)

      return { contracts: loadedContracts }
    })

    this.contracts = {} as Contracts
    this.signers = provider.getWallets()
    this.deployer = this.signers[0]
    this.bob = this.signers[1]

    Object.assign(this, loadedFixture.contracts)
  })
}
