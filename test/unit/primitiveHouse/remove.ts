import { constants } from 'ethers'
import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../context'
import { computePoolId } from '../../shared/utilities'
import expect from '../../shared/expect'
import { runTest } from '../context'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG
let poolId: string
let delRisky: Wei, delStable: Wei
const delLiquidity = parseWei('10')

runTest('remove', function () {
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
      parseWei(1).sub(parseWei(delta)).raw,
      delLiquidity.raw
    )

    await this.house.deposit(
      this.deployer.address,
      this.risky.address,
      this.stable.address,
      parseWei('1000').raw,
      parseWei('1000').raw
    )

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)

    const res = await this.engine.reserves(poolId)
    delRisky = delLiquidity.mul(res.reserveRisky).div(res.liquidity)
    delStable = delLiquidity.mul(res.reserveStable).div(res.liquidity)

    await this.house.allocate(poolId, this.risky.address, this.stable.address, delRisky.raw, delStable.raw, true)
  })

  describe('success cases', function () {
    it('removes 1 LP share', async function () {
      await this.house.remove(this.engine.address, poolId, parseWei('1').raw)
    })

    it('decreases the position of the sender', async function () {
      await expect(this.house.remove(this.engine.address, poolId, parseWei('1').raw)).to.decreasePositionLiquidity(
        this.house,
        this.deployer.address,
        poolId,
        parseWei('1').raw
      )
    })

    it('increases the margin of the sender', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(this.house.remove(this.engine.address, poolId, parseWei('1').raw)).to.updateMargin(
        this.house,
        this.deployer.address,
        this.engine.address,
        deltaRisky.raw,
        true,
        deltaStable.raw,
        true
      )
    })

    it('emits the Rmove event', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)

      await expect(this.house.remove(this.engine.address, poolId, parseWei('1').raw))
        .to.emit(this.house, 'Remove')
        .withArgs(this.deployer.address, this.engine.address, poolId, parseWei('1').raw, deltaRisky.raw, deltaStable.raw)
    })
  })

  describe('fail cases', function () {
    it('fails to remove more than the position', async function () {
      await expect(this.house.remove(this.engine.address, poolId, parseWei('10000').raw)).to.be.reverted
    })

    it('fails to remove 0 liquidity', async function () {
      await expect(this.house.remove(this.engine.address, poolId, parseWei('0').raw)).to.revertWithCustomError(
        'ZeroLiquidityError'
      )
    })
  })
})
