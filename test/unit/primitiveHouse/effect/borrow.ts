import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils, Wallet, BytesLike, constants } from 'ethers'
import { PrimitiveEngine } from '@primitivefinance/primitive-v2-core/typechain'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { borrowFragment } from '../fragments'
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

describe('borrow', function () {
  before(async function () {
    await loadContext(waffle.provider, borrowFragment)
  })

  beforeEach(async function () {
    ;({ risky, stable, house, engine } = this.contracts)
    ;[user] = this.signers
    poolId = await engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    userPosId = utils.solidityKeccak256(['address', 'bytes32'], [user.address, poolId])
  })

  describe('success cases', function () {
    it('originates one long option', async function () {
      await house.borrow(user.address, risky.address, stable.address, poolId, parseWei('1').raw, constants.MaxUint256)
    })

    it('increases the position of the sender', async function () {
      await house.borrow(user.address, risky.address, stable.address, poolId, parseWei('1').raw, constants.MaxUint256)
      const newPosition = await house.positions(engine.address, userPosId)
      expect(newPosition.debt).to.equal(parseWei('1').raw)
    })

    it('transfers the premium, risky and stable', async function () {
      const reserve = await engine.reserves(poolId)
      const delRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const delStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)
      const premium = parseWei('1').sub(delRisky.raw)

      const engineRiskyBalance = await risky.balanceOf(engine.address)
      const engineStableBalance = await stable.balanceOf(engine.address)

      const payerRiskyBalance = await risky.balanceOf(user.address)
      const payerStableBalance = await stable.balanceOf(user.address)

      await house.borrow(user.address, risky.address, stable.address, poolId, parseWei('1').raw, constants.MaxUint256)

      expect(await risky.balanceOf(engine.address)).to.equal(engineRiskyBalance.add(premium.raw))

      expect(await stable.balanceOf(engine.address)).to.equal(engineStableBalance.sub(delStable.raw))

      expect(await risky.balanceOf(user.address)).to.equal(payerRiskyBalance.sub(premium.raw))

      expect(await stable.balanceOf(user.address)).to.equal(payerStableBalance.add(delStable.raw))
    })

    it('emits the Borrowed event', async function () {
      await expect(
        await house.borrow(user.address, risky.address, stable.address, poolId, parseWei('1').raw, constants.MaxUint256)
      ).to.emit(house, 'Borrowed')
    })
  })

  describe('fail cases', function () {
    it('fails to borrow more than there is liquidity on the curve', async function () {
      await expect(
        house.borrow(user.address, risky.address, stable.address, poolId, parseWei('100000').raw, constants.MaxUint256)
      ).to.be.reverted
    })
  })
})
