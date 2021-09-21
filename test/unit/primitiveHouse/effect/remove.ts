import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import { DEFAULT_CONFIG } from '../../context'
import { computePoolId } from '../../../shared/utilities'
import expect from '../../../shared/expect'
import { runTest } from '../../context'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG
let poolId: string

runTest('remove', function () {
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

    await this.house.deposit(
      this.deployer.address,
      this.engine.address,
      this.risky.address,
      this.stable.address,
      parseWei('1000').raw,
      parseWei('1000').raw
    )

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)

    await this.house.allocate(
      this.engine.address,
      this.risky.address,
      this.stable.address,
      poolId,
      parseWei('1').raw,
      true,
      false,
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

    it.skip('decreases the position of the sender', async function () {
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
      const initialMargin = await this.house.margins(this.engine.address, this.deployer.address)

      await this.house.remove(
        this.engine.address,
        poolId,
        parseWei('1').raw,
      )

      const newMargin = await this.house.margins(this.engine.address, this.deployer.address)

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
        parseWei('10').raw,
      )).to.be.reverted
    })
  })
})
