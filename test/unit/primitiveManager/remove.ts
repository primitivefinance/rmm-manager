import { constants } from 'ethers'
import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../context'
import { computePoolId } from '../../shared/utilities'
import expect from '../../shared/expect'
import { runTest } from '../context'

const { strike, sigma, maturity, delta, gamma } = DEFAULT_CONFIG
let poolId: string
let delRisky: Wei, delStable: Wei
const delLiquidity = parseWei('10')

runTest('remove', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.manager.address, constants.MaxUint256)
    await this.stable.approve(this.manager.address, constants.MaxUint256)

    await this.manager.create(
      this.risky.address,
      this.stable.address,
      strike.raw,
      sigma.raw,
      maturity.raw,
      gamma.raw,
      parseWei(1).sub(parseWei(delta)).raw,
      delLiquidity.raw
    )

    await this.manager.deposit(
      this.deployer.address,
      this.risky.address,
      this.stable.address,
      parseWei('1000').raw,
      parseWei('1000').raw
    )

    poolId = computePoolId(this.engine.address, maturity.raw, sigma.raw, strike.raw, gamma.raw)

    const res = await this.engine.reserves(poolId)
    delRisky = delLiquidity.mul(res.reserveRisky).div(res.liquidity)
    delStable = delLiquidity.mul(res.reserveStable).div(res.liquidity)

    await this.manager.allocate(poolId, this.risky.address, this.stable.address, delRisky.raw, delStable.raw, true, delLiquidity.raw)
  })

  describe('success cases', function () {
    it('removes 1 LP share', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await this.manager.remove(this.engine.address, poolId, parseWei('1').raw, deltaRisky.raw, deltaStable.raw)
    })

    it('decreases the position of the sender', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(
        this.manager.remove(this.engine.address, poolId, parseWei('1').raw, deltaRisky.raw, deltaStable.raw)
      ).to.decreasePositionLiquidity(
        this.manager,
        this.deployer.address,
        poolId,
        parseWei('1').raw
      )
    })

    it('increases the margin of the sender', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(this.manager.remove(
        this.engine.address, poolId, parseWei('1').raw, deltaRisky.raw, deltaStable.raw
      )).to.updateMargin(
        this.manager,
        this.deployer.address,
        this.engine.address,
        deltaRisky.raw,
        true,
        deltaStable.raw,
        true
      )
    })

    it('emits the Remove event', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(this.manager.remove(
        this.engine.address, poolId, parseWei('1').raw, deltaRisky.raw, deltaStable.raw
      )).to.emit(this.manager, 'Remove')
        .withArgs(this.deployer.address, this.engine.address, poolId, parseWei('1').raw, deltaRisky.raw, deltaStable.raw)
    })

    it('removes entire liquidity balance', async function () {
      await this.manager.remove(
        this.engine.address,
        poolId,
        await this.manager.balanceOf(this.deployer.address, poolId),
        '0',
        '0',
      )
    })
  })

  describe('fail cases', function () {
    it('reverts if the amount of risky out is lower than the expected', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(
        this.manager.remove(this.engine.address, poolId, parseWei('1').raw, deltaRisky.add(1).raw, deltaStable.raw)
      ).to.revertWithCustomError('MinRemoveOutError')
    })

    it('reverts if the amount of risky out is lower than the expected', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(
        this.manager.remove(this.engine.address, poolId, parseWei('1').raw, deltaRisky.raw, deltaStable.add(1).raw)
      ).to.revertWithCustomError('MinRemoveOutError')
    })

    it('fails to remove more than the position', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(this.manager.remove(
        this.engine.address, poolId, parseWei('10000').raw, deltaRisky.raw, deltaStable.raw
      )).to.be.reverted
    })

    it('fails to remove 0 liquidity', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(this.manager.remove(
        this.engine.address, poolId, parseWei('0').raw, deltaRisky.raw, deltaStable.raw
      )).to.revertWithCustomError('ZeroLiquidityError')
    })
  })
})
