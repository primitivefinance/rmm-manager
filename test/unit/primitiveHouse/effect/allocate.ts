import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { allocateFragment } from '../fragments'

const { strike, sigma, maturity } = config

describe('allocate', function () {
  before(async function () {
    await loadContext(waffle.provider, allocateFragment)
  })

  describe('when the parameters are valid', function () {
    it('allocates 10 LP shares from margin', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await this.contracts.house.allocate(poolId, this.signers[0].address, parseWei('10').raw, true)
    })

    it('allocates 10 LP shares from external', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await this.contracts.house.allocate(poolId, this.signers[0].address, parseWei('10').raw, false)
    })
  })

  describe('when the parameters are not valid', function () {
    it('fails to allocate more than margin balance', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await expect(this.contracts.house.allocate(poolId, this.signers[0].address, parseWei('100000').raw, true)).to.be
        .reverted
    })
  })
})
