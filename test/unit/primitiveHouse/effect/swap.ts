import { waffle } from 'hardhat'
import { expect } from 'chai'
import { parseWei } from 'web3-units'

import loadContext, { DEFAULT_CONFIG } from '../../context'
import { computePoolId } from '../../../shared/utilities'
import { swapFragment } from '../fragments'

const { strike, sigma, maturity } = DEFAULT_CONFIG
let poolId: string

describe('swap', function () {
  before(async function () {
    loadContext(waffle.provider, swapFragment)
  })

  beforeEach(async function () {
    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)
  })

  describe('success cases', function () {
    describe('when using margins', function () {
      beforeEach(async function () {
        await this.house.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('100000').raw,
          parseWei('100000').raw
        )
      })

      it('swaps risky for stable', async function () {
        await this.house.swap(
          this.risky.address,
          this.stable.address,
          poolId,
          true,
          parseWei('1').raw,
          0,
          true
        )
      })

      it('swaps stable for risky', async function () {
        await this.house.swap(
          this.risky.address,
          this.stable.address,
          poolId,
          false,
          parseWei('1').raw,
          0,
          true
        )
      })

      it('emits the Swapped event', async function () {
        await expect(
          this.house.swap(this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, parseWei('1').raw, false)
        ).to.emit(this.house, 'Swapped')
      })
    })

    describe('when using externals', function () {
      it('swaps risky for stable', async function () {
        await this.house.swap(
          this.risky.address,
          this.stable.address,
          poolId,
          true,
          parseWei('1').raw,
          0,
          false
        )
      })

      it('swaps stable for risky', async function () {
        await this.house.swap(
          this.risky.address,
          this.stable.address,
          poolId,
          false,
          parseWei('1').raw,
          0,
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
})
