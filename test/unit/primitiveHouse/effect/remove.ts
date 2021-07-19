import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils, Wallet, BytesLike, constants } from 'ethers'
import { PrimitiveEngine } from '@primitivefinance/primitive-v2-core/typechain'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { removeFragment } from '../fragments'
import { PrimitiveHouse, Token } from '../../../../typechain'

const { strike, sigma, maturity } = config
let poolId: string
let userPosId: string
let risky: Token
let stable: Token
let house: PrimitiveHouse
let user: Wallet
let engine: PrimitiveEngine

const empty: BytesLike = constants.HashZero

describe('remove', function () {
  before(async function () {
    await loadContext(waffle.provider, removeFragment)
  })

  beforeEach(async function () {
    ;({ risky, stable, house, engine } = this.contracts)
    ;[user] = this.signers
    poolId = await engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    userPosId = utils.solidityKeccak256(['address', 'bytes32'], [user.address, poolId])
  })

  describe('success cases', function () {
    describe('when removing to margin', function () {
      it('removes 10 LP shares', async function () {
        await house.remove(risky.address, stable.address, poolId, parseWei('10').raw, true)
      })

      it('updates the position of the sender', async function () {
        const initialPos = await house.positions(engine.address, userPosId)
        await house.remove(risky.address, stable.address, poolId, parseWei('10').raw, true)
        const newPos = await house.positions(engine.address, userPosId)

        expect(newPos.liquidity).equal(initialPos.liquidity.sub(parseWei('10').raw))
      })

      it('increases the margin of the sender', async function () {
        const reserve = await engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const initialMargin = await house.margins(engine.address, user.address)
        await house.remove(risky.address, stable.address, poolId, parseWei('10').raw, true)
        const newMargin = await house.margins(engine.address, user.address)

        expect(newMargin.balanceRisky).to.equal(initialMargin.balanceRisky.add(deltaRisky.raw))
        expect(newMargin.balanceStable).to.equal(initialMargin.balanceStable.add(deltaStable.raw))
      })
    })

    describe('when removing to external', function () {
      it('removes 10 LP shares', async function () {
        await house.remove(risky.address, stable.address, poolId, parseWei('10').raw, false)
      })

      it('updates the position of the sender', async function () {
        const initialPos = await house.positions(engine.address, userPosId)
        await house.remove(risky.address, stable.address, poolId, parseWei('10').raw, false)
        const newPos = await house.positions(engine.address, userPosId)

        expect(newPos.liquidity).equal(initialPos.liquidity.sub(parseWei('10').raw))
      })

      it('increases the balances of the sender', async function () {
        const reserve = await engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const riskyBalance = await risky.balanceOf(user.address)
        const stableBalance = await stable.balanceOf(user.address)
        await house.remove(risky.address, stable.address, poolId, parseWei('10').raw, false)

        expect(await risky.balanceOf(user.address)).to.equal(riskyBalance.add(deltaRisky.raw))
        expect(await stable.balanceOf(user.address)).to.equal(stableBalance.add(deltaStable.raw))
      })
    })
  })

  describe('fail cases', function () {
    it('fails to remove more than the position', async function () {
      await expect(house.connect(this.signers[1]).remove(risky.address, stable.address, poolId, parseWei('10').raw, true)).to
        .be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(this.contracts.house.removeCallback(0, 0, empty)).to.be.revertedWith('Not engine')
    })
  })
})
