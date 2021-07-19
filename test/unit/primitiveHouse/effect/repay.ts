import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { repayFragment } from '../fragments'

const { strike, sigma, maturity } = config

let poolId: string

describe('repay', function () {
  before(async function () {
    await loadContext(waffle.provider, repayFragment)
  })

  beforeEach(async function () {
    poolId = await this.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
  })

  describe('when the parameters are valid', function () {
    describe('when repaying from margin', async function () {
      it('repays 10 LP share debt from margin', async function () {
        await this.house.repay(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          true
        )
      })
    })

    describe('when repaying from external', async function () {
      it('repays 10 LP share debt from external', async function () {
        await this.house.repay(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          false
        )
      })

      it('emits the Repaid event', async function () {
        await expect(
          this.house.repay(this.deployer.address, this.risky.address, this.stable.address, poolId, parseWei('1').raw, false)
        ).to.emit(this.house, 'Repaid')
      })
    })
  })

  describe('when the parameters are not valid', function () {
    it('fails to repay more than existing debt', async function () {
      await expect(
        this.house.repay(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('100000').raw,
          true
        )
      ).to.be.reverted
    })
  })
})
