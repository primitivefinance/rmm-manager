import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils, Wallet, BytesLike, constants } from 'ethers'
import { PrimitiveEngine } from '@primitivefinance/primitive-v2-core/typechain'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { allocateFragment } from '../fragments'
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

describe('allocate', function () {
  before(async function () {
    await loadContext(waffle.provider, allocateFragment)
  })

  beforeEach(async function () {
    ;({ risky, stable, house, engine } = this.contracts)
    ;[user] = this.signers
    poolId = await engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    userPosId = utils.solidityKeccak256(['address', 'bytes32'], [user.address, poolId])
  })

  describe('success cases', function () {
    describe('when allocating from margin', function () {
      it('allocates 10 LP shares', async function () {
        await house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, true)
      })

      it('updates the position of the sender', async function () {
        const initialPosition = await house.positions(engine.address, userPosId)
        await house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, true)
        const newPosition = await house.positions(engine.address, userPosId)
        expect(newPosition.liquidity).to.equal(initialPosition.liquidity.add(parseWei('10').raw))
      })

      it('reduces the margin of the sender', async function () {
        const reserve = await engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const initialMargin = await house.margins(engine.address, user.address)
        await house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, true)
        const newMargin = await house.margins(engine.address, user.address)

        expect(newMargin.balanceRisky).to.equal(initialMargin.balanceRisky.sub(deltaRisky.raw))
        expect(newMargin.balanceStable).to.equal(initialMargin.balanceStable.sub(deltaStable.raw))
      })

      it('does not reduces the balances of the sender', async function () {
        const riskyBalance = await risky.balanceOf(user.address)
        const stableBalance = await stable.balanceOf(user.address)
        await house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, true)

        expect(await risky.balanceOf(user.address)).to.equal(riskyBalance)
        expect(await stable.balanceOf(user.address)).to.equal(stableBalance)
      })

      it('emits the AllocatedAndLent event', async function () {
        // TODO: Checks the args
        await expect(house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, true)).to.emit(
          house,
          'AllocatedAndLent'
        )
      })
    })

    describe('when allocating from external', async function () {
      it('allocates 10 LP shares', async function () {
        poolId = await engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
        await house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, false)
      })

      it('updates the position of the sender', async function () {
        const initialPosition = await house.positions(engine.address, userPosId)
        await house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, true)
        const newPosition = await house.positions(engine.address, userPosId)
        expect(newPosition.liquidity).to.equal(initialPosition.liquidity.add(parseWei('10').raw))
      })

      it('reduces the balances of the sender', async function () {
        const reserve = await engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const riskyBalance = await risky.balanceOf(user.address)
        const stableBalance = await stable.balanceOf(user.address)
        await house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, false)

        expect(await risky.balanceOf(user.address)).to.equal(riskyBalance.sub(deltaRisky.raw))
        expect(await stable.balanceOf(user.address)).to.equal(stableBalance.sub(deltaStable.raw))
      })

      it('does not reduces the margin', async function () {
        const initialMargin = await house.margins(engine.address, user.address)
        await house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, false)
        const newMargin = await house.margins(engine.address, user.address)

        expect(initialMargin.balanceRisky).to.equal(newMargin.balanceRisky)
        expect(initialMargin.balanceStable).to.equal(newMargin.balanceStable)
      })

      it('emits the AllocatedAndLent event', async function () {
        // TODO: Checks the args
        await expect(house.allocate(user.address, risky.address, stable.address, poolId, parseWei('10').raw, false)).to.emit(
          house,
          'AllocatedAndLent'
        )
      })
    })
  })

  describe('fail cases', function () {
    it('fails to allocate more than margin balance', async function () {
      await expect(
        house.connect(this.signers[1]).allocate(user.address, risky.address, stable.address, poolId, parseWei('1').raw, true)
      ).to.be.reverted
    })

    it('fails to allocate more than external balances', async function () {
      await expect(
        house
          .connect(this.signers[1])
          .allocate(user.address, risky.address, stable.address, poolId, parseWei('1').raw, false)
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(this.contracts.house.allocateCallback(0, 0, empty)).to.be.revertedWith('Not engine')
    })
  })
})
