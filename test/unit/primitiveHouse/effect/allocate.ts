import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { allocateFragment } from '../fragments'

const { strike, sigma, maturity } = config
let poolId: string

describe('allocate', function () {
  before(async function () {
    await loadContext(waffle.provider, allocateFragment)
  })

  describe('when the parameters are valid', function () {
    it('allocates 10 LP shares from margin', async function () {
      poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await this.contracts.house.allocate(poolId, this.signers[0].address, parseWei('10').raw, true)
    })

    it('allocates 10 LP shares from external', async function () {
      poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await this.contracts.house.allocate(poolId, this.signers[0].address, parseWei('10').raw, false)
    })

    it('emits the AllocatedAndLent event', async function () {
      poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await expect(
        this.contracts.house.allocate(poolId, this.signers[0].address, parseWei('10').raw, true)
      ).to.emit(this.contracts.house, 'AllocatedAndLent')
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
