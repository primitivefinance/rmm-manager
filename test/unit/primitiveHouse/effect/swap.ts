import { waffle } from 'hardhat'
import { expect } from 'chai'

import loadContext, { config } from '../../context'
import { parseWei, constants, BytesLike } from '../../../shared/Units'
import { swapFragment } from '../fragments'

const { strike, sigma, maturity } = config

describe('swap', function () {
  before(async function () {
    await loadContext(waffle.provider, swapFragment)
  })

  describe('when the parameters are valid', function () {
    it('swaps risky for stable', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await this.contracts.house.swap(this.contracts.engine.address, poolId, true, parseWei('1').raw, parseWei('1').raw, false)
    })

    it('emits the Swapped event', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)

      await expect(
        this.contracts.house.swap(this.contracts.engine.address, poolId, true, parseWei('1').raw, parseWei('1').raw, false)
      ).to.emit(
        this.contracts.house,
        'Swapped'
      )
    })
  })
})
