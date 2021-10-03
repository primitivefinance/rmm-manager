import { constants } from 'ethers'
import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../../context'
import { computePoolId } from '../../../shared/utilities'
import expect from '../../../shared/expect'
import { runTest } from '../../context'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG
let poolId: string
let delLiquidity: Wei, delRisky: Wei, delStable: Wei

runTest('swapExactOut', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)

    await this.house.create(
      this.risky.address,
      this.stable.address,
      strike.raw,
      sigma.raw,
      maturity.raw,
      parseWei(delta).raw,
      parseWei('1000').raw,
    )

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)

/*

    const amount = parseWei('1000')
    const res = await this.engine.reserves(poolId)
    delLiquidity = amount
    delRisky = amount.mul(res.reserveRisky).div(res.liquidity)
    delStable = amount.mul(res.reserveStable).div(res.liquidity)

    await this.house.allocate(
      poolId,
      this.risky.address,
      this.stable.address,
      delRisky.raw,
      delStable.raw,
      false,
    )

    */
  })

  describe('success cases', function () {
    describe('from margin / to margin', function () {
      beforeEach(async function () {
        await this.house.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('100').raw,
          parseWei('100').raw
        )
      })

      it('swaps risky for stable', async function () {
        await this.house.swapExactOut({
          recipient: this.deployer.address,
          risky: this.risky.address,
          stable: this.stable.address,
          poolId: poolId,
          riskyForStable: true,
          deltaOut: parseWei('20').raw,
          deltaInMax: parseWei('1000000').raw,
          fromMargin: false,
          toMargin: true,
          deadline: 1000000000000,
        })
      })
    })
  })
})
