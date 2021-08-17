import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils, BytesLike, constants } from 'ethers'
import { parseWei } from 'web3-units'

import loadContext, { config } from '../../context'

import { removeFragment } from '../fragments'
import { computePoolId } from '../../../shared/utilities'

const { strike, sigma, maturity } = config
let poolId, userPosId: string

const empty: BytesLike = constants.HashZero

describe('remove', function () {
  before(async function () {
    loadContext(waffle.provider, removeFragment)
  })

  beforeEach(async function () {
    poolId = computePoolId(this.contracts.factory.address, maturity.raw, sigma.raw, strike.raw)
    userPosId = utils.solidityKeccak256(['address', 'bytes32'], [this.deployer.address, poolId])
  })

  describe('success cases', function () {
    describe('when removing to margin', function () {
      it('removes 10 LP shares', async function () {
        await this.house.remove(this.risky.address, this.stable.address, poolId, parseWei('10').raw)
      })

      it('updates the position of the sender', async function () {
        const initialPos = await this.house.positions(this.engine.address, userPosId)
        await this.house.remove(this.risky.address, this.stable.address, poolId, parseWei('10').raw)
        const newPos = await this.house.positions(this.engine.address, userPosId)

        expect(newPos.liquidity).equal(initialPos.liquidity.sub(parseWei('10').raw))
      })

      it('increases the margin of the sender', async function () {
        const reserve = await this.engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const initialMargin = await this.house.margins(this.engine.address, this.deployer.address)
        await this.house.remove(this.risky.address, this.stable.address, poolId, parseWei('10').raw)
        const newMargin = await this.house.margins(this.engine.address, this.deployer.address)

        expect(newMargin.balanceRisky).to.equal(initialMargin.balanceRisky.add(deltaRisky.raw))
        expect(newMargin.balanceStable).to.equal(initialMargin.balanceStable.add(deltaStable.raw))
      })
    })

    describe('when removing to external', function () {
      it('removes 10 LP shares', async function () {
        await this.house.remove(this.risky.address, this.stable.address, poolId, parseWei('10').raw)
      })

      it('updates the position of the sender', async function () {
        const initialPos = await this.house.positions(this.engine.address, userPosId)
        await this.house.remove(this.risky.address, this.stable.address, poolId, parseWei('10').raw)
        const newPos = await this.house.positions(this.engine.address, userPosId)

        expect(newPos.liquidity).equal(initialPos.liquidity.sub(parseWei('10').raw))
      })

      it('increases the balances of the sender', async function () {
        const reserve = await this.engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const riskyBalance = await this.risky.balanceOf(this.deployer.address)
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        await this.house.remove(this.risky.address, this.stable.address, poolId, parseWei('10').raw)

        expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance.add(deltaRisky.raw))
        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance.add(deltaStable.raw))
      })
    })
  })

  describe('fail cases', function () {
    it('fails to remove more than the position', async function () {
      await expect(
        this.house.connect(this.signers[1]).remove(this.risky.address, this.stable.address, poolId, parseWei('10').raw)
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(this.house.removeCallback(0, 0, empty)).to.be.revertedWith('Not engine')
    })
  })
})
