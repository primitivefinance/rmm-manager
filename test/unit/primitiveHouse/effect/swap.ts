import { waffle } from 'hardhat'
import { expect } from 'chai'

import loadContext, { config } from '../../context'
import { parseWei } from '../../../shared/Units'
import { computePoolId } from '../../../shared/utilities'
import { swapFragment } from '../fragments'

const { strike, sigma, maturity } = config
let poolId: string

describe('swap', function () {
  before(async function () {
    await loadContext(waffle.provider, swapFragment)
  })

  beforeEach(async function () {
    poolId = computePoolId(this.contracts.factory.address, maturity.raw, sigma.raw, strike.raw)
  })

  describe('when the parameters are valid', function () {
    it('swaps risky for stable', async function () {
      await this.house.swap(
        this.risky.address,
        this.stable.address,
        poolId,
        true,
        parseWei('1').raw,
        parseWei('1').raw,
        false
      )
    })

    it('emits the Swapped event', async function () {
      await expect(
        this.house.swap(this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, parseWei('1').raw, false)
      ).to.emit(this.house, 'Swapped')
    })
  })
})
