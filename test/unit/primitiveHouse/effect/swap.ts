import { ethers, waffle } from 'hardhat'
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
    describe('from margin / to margin', function () {
      beforeEach(async function () {
        await this.house.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      })

      it('swaps risky for stable', async function () {
        await this.house.swap(
          this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, 0, true, true
        )
      })

      it('swaps stable for risky', async function () {
        await this.house.swap(
          this.risky.address, this.stable.address, poolId, false, parseWei('500').raw, 0, true, true
        )
      })

      it('emits the Swapped event', async function () {
        await expect(
          this.house.swap(this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, parseWei('1').raw, true, true)
        ).to.emit(this.house, 'Swap')
      })
    })
/*
    describe('from margin / to external', function () {
      beforeEach(async function () {
        await this.house.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      })

      it('swaps risky for stable', async function () {
        await this.house.swap(
          this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, 0, true, false
        )
      })

      it('swaps stable for risky', async function () {
        await this.house.swap(
          this.risky.address, this.stable.address, poolId, false, parseWei('1').raw, 0, true, false
        )
      })

      it('emits the Swapped event', async function () {
        await expect(
          this.house.swap(this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, parseWei('1').raw, true, false)
        ).to.emit(this.house, 'Swapped')
      })
    })

    describe('from external / to margin', function () {
      beforeEach(async function () {
        await this.house.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      })

      it('swaps risky for stable', async function () {
        await this.house.swap(
          this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, 0, false, true
        )
      })

      it('swaps stable for risky', async function () {
        await this.house.swap(
          this.risky.address, this.stable.address, poolId, false, parseWei('1').raw, 0, false, true
        )
      })

      it('emits the Swapped event', async function () {
        await expect(
          this.house.swap(this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, parseWei('1').raw, false, true)
        ).to.emit(this.house, 'Swapped')
      })
    })

    describe('from external / to external', function () {
      beforeEach(async function () {
        await this.house.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      })

      it('swaps risky for stable', async function () {
        await this.house.swap(
          this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, 0, false, false
        )
      })

      it('swaps stable for risky', async function () {
        await this.house.swap(
          this.risky.address, this.stable.address, poolId, false, parseWei('1').raw, 0, false, false
        )
      })

      it('emits the Swapped event', async function () {
        await expect(
          this.house.swap(this.risky.address, this.stable.address, poolId, true, parseWei('1').raw, parseWei('1').raw, true, false)
        ).to.emit(this.house, 'Swapped')
      })
    })
    */
  })
})
