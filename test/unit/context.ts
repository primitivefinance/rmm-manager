import { createFixtureLoader, MockProvider } from 'ethereum-waffle'
import { Contracts } from '../../types'
import { Wallet } from 'ethers'
import createTestContracts from './createTestContracts'
import { parseWei } from '../shared/Units'
import { Percentage, Wei, Time, YEAR } from '../shared/sdk/Units'

interface Config {
  strike: Wei
  sigma: Percentage
  maturity: Time
  lastTimestamp: Time
  spot: Wei
}

export const config: Config = {
  strike: parseWei('2500'),
  sigma: new Percentage(1.1),
  maturity: new Time(YEAR + +Date.now() / 1000),
  lastTimestamp: new Time(+Date.now() / 1000),
  spot: parseWei('1750'),
}

export default async function loadContext(
  provider: MockProvider,
  action?: (signers: Wallet[], contracts: Contracts) => Promise<void>
): Promise<void> {
  const loadFixture = createFixtureLoader(provider.getWallets(), provider)

  beforeEach(async function () {
    const loadedFixture = await loadFixture(async function (signers: Wallet[]) {
      const [deployer] = signers
      let loadedContracts: Contracts = {} as Contracts

      loadedContracts = await createTestContracts(deployer)

      if (action) await action(signers, loadedContracts)

      return { contracts: loadedContracts }
    })

    this.signers = provider.getWallets()
    this.deployer = this.signers[0]
    this.bob = this.signers[1]

    Object.assign(this, loadedFixture.contracts)
  })
}
