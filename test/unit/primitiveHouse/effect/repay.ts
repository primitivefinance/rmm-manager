import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { repayFragment } from '../fragments'

const { strike, sigma, maturity } = config

describe('repay', function () {
  before(async function () {
    await loadContext(waffle.provider, repayFragment)
  })

  describe('when the parameters are valid', function () {
    it('repays 10 LP share debt from margin', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await this.contracts.house.repay(poolId, this.signers[0].address, parseWei('1').raw, true)
    })

    it('repays 10 LP share debt from external', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await this.contracts.house.repay(poolId, this.signers[0].address, parseWei('1').raw, false)
    })
  })

  describe('when the parameters are not valid', function () {
    it('fails to repay more than existing debt', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await expect(this.contracts.house.repay(poolId, this.signers[0].address, parseWei('100000').raw, true)).to.be.reverted
    })
  })
})
