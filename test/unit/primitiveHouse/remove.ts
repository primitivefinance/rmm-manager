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
      delLiquidity.raw,
    )

    await this.house.deposit(
      this.deployer.address,
      this.risky.address,
      this.stable.address,
      parseWei('1000').raw,
      parseWei('1000').raw
    )

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)

    const amount = parseWei('10')
    const res = await this.engine.reserves(poolId)
    delRisky = amount.mul(res.reserveRisky).div(res.liquidity)
    delStable = amount.mul(res.reserveStable).div(res.liquidity)

    await this.house.allocate(
      poolId,
      this.risky.address,
      this.stable.address,
      delRisky.raw,
      delStable.raw,
      true,
    )
  })

  describe('success cases', function () {
    it('removes 1 LP share', async function () {
      await this.house.remove(
        this.engine.address,
        poolId,
        parseWei('1').raw,
      )
    })

    it('decreases the position of the sender', async function () {
      const liquidity = await this.house.balanceOf(this.deployer.address, poolId)

      await this.house.remove(
        this.engine.address,
        poolId,
        parseWei('1').raw,
      )

      expect(
        await this.house.balanceOf(this.deployer.address, poolId)
      ).to.equal(liquidity.sub(parseWei('1').raw))
    })

    it('increases the margin of the sender', async function () {
      const reserve = await this.engine.reserves(poolId)
      const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)
      const initialMargin = await this.house.margins(this.deployer.address, this.engine.address)

      await this.house.remove(
        this.engine.address,
        poolId,
        parseWei('1').raw,
      )

      const newMargin = await this.house.margins(this.deployer.address, this.engine.address)

      expect(newMargin.balanceRisky).to.equal(initialMargin.balanceRisky.add(deltaRisky.raw))
      expect(newMargin.balanceStable).to.equal(initialMargin.balanceStable.add(deltaStable.raw))
    })

    it('emits the LiquidityRemoved event', async function () {
      // TODO: Check args
      await expect(this.house.remove(
        this.engine.address,
        poolId,
        parseWei('1').raw,
      )).to.emit(this.house, 'Remove')
    })
  })

  describe('fail cases', function () {
    it('fails to remove more than the position', async function () {
      await expect(this.house.remove(
        this.engine.address,
        poolId,
        parseWei('10000').raw,
      )).to.be.reverted
    })
  })
})
