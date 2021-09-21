import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import { DEFAULT_CONFIG } from '../../context'
import { computePoolId } from '../../../shared/utilities'
import expect from '../../../shared/expect'
import { runTest } from '../../context'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG
let poolId: string

runTest('swap', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)

    await this.house.create(
      this.engine.address,
      this.risky.address,
      this.stable.address,
      strike.raw,
      sigma.raw,
      maturity.raw,
      parseWei(delta).raw,
      parseWei('1').raw,
      false
    )

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)

    await this.house.allocate(
      this.engine.address,
      this.risky.address,
      this.stable.address,
      poolId,
      parseWei('10').raw,
      false,
      false,
    )
  })

  describe('success cases', function () {
    describe('from margin / to margin', function () {
      beforeEach(async function () {
        await this.house.deposit(
          this.deployer.address,
          this.engine.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      })

      it('swaps risky for stable', async function () {
        await this.house.swap({
          engine: this.engine.address,
          risky: this.risky.address,
          stable: this.stable.address,
          poolId: poolId,
          riskyForStable: true,
          deltaIn: parseWei('1').raw,
          deltaOutMin: 0,
          fromMargin: true,
          toMargin: true,
          deadline: 1000000000000,
        })
      })

      it('swaps stable for risky', async function () {
        await this.house.swap({
          engine: this.engine.address,
          risky: this.risky.address,
          stable: this.stable.address,
          poolId: poolId,
          riskyForStable: false,
          deltaIn: parseWei('1').raw,
          deltaOutMin: 0,
          fromMargin: true,
          toMargin: true,
          deadline: 1000000000000,
        })
      })

      it('emits the Swapped event', async function () {
        await expect(
          this.house.swap({
            engine: this.engine.address,
            risky: this.risky.address,
            stable: this.stable.address,
            poolId: poolId,
            riskyForStable: true,
            deltaIn: parseWei('1').raw,
            deltaOutMin: 0,
            fromMargin: true,
            toMargin: true,
            deadline: 1000000000000,
          })
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
