import { waffle } from 'hardhat'
import { expect } from 'chai'
import { parseWei } from 'web3-units'

import loadContext, { DEFAULT_CONFIG } from '../../context'

import { removeLiquidityFragment } from '../fragments'
import { computePoolId, getTokenId, computePositionId } from '../../../shared/utilities'

const { strike, sigma, maturity } = DEFAULT_CONFIG
let poolId: string

describe('removeLiquidity', function () {
  before(async function () {
    loadContext(waffle.provider, removeLiquidityFragment)
  })

  beforeEach(async function () {
    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)
  })

  describe('success cases', function () {
    it('removes 1 LP share', async function () {
      await this.house.removeLiquidity(
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
      )
    })

    it('decreases the position of the sender', async function () {
      const tokenId = getTokenId(this.engine.address, poolId, 0)
      const liquidity = await this.house.balanceOf(this.deployer.address, tokenId)

      await this.house.removeLiquidity(
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
      )

      expect(
        await this.house.balanceOf(this.deployer.address, tokenId)
      ).to.equal(liquidity.sub(parseWei('1').raw))
    })

    it('increases the margin of the sender', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)
      const initialMargin = await this.house.margins(this.engine.address, this.deployer.address)

      await this.house.removeLiquidity(
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
      )

      const newMargin = await this.house.margins(this.engine.address, this.deployer.address)

      expect(newMargin.balanceRisky).to.equal(initialMargin.balanceRisky.add(deltaRisky.raw))
      expect(newMargin.balanceStable).to.equal(initialMargin.balanceStable.add(deltaStable.raw))
    })

    it('emits the LiquidityRemoved event', async function () {
      // TODO: Check args
      await expect(this.house.removeLiquidity(
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
      )).to.emit(this.house, 'LiquidityRemoved')
    })
  })

  describe('fail cases', function () {
    it('fails to remove more than the position', async function () {
      await expect(this.house.removeLiquidity(
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('10').raw
      )).to.be.reverted
    })
  })
})
