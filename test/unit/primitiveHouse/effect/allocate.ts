import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { allocateFragment } from '../fragments'

const { strike, sigma, maturity } = config
let poolId: string

describe('allocate', function () {
  before(async function () {
    await loadContext(waffle.provider, allocateFragment)
  })

  describe('when the parameters are valid', function () {
    beforeEach(async function () {
      poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    })

    describe('when allocating from margin', function () {
      it('allocates 10 LP shares', async function () {
        await this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('10').raw, true)
      })

      it('updates the position of the sender', async function () {
        const initialPosition = await this.contracts.house.positionOf(this.signers[0].address, this.contracts.engine.address, poolId)
        await this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('10').raw, true)
        const newPosition = await this.contracts.house.positionOf(this.signers[0].address, this.contracts.engine.address, poolId)
        expect(newPosition.liquidity).to.equal(initialPosition.liquidity.add(parseWei('10').raw))
      })

      it('reduces the margin of the sender', async function () {
        const reserve = await this.contracts.engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const initialMargin = await this.contracts.house.marginOf(this.signers[0].address, this.contracts.engine.address)
        await this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('10').raw, true)
        const newMargin = await this.contracts.house.marginOf(this.signers[0].address, this.contracts.engine.address)

        expect(newMargin.balanceRisky).to.equal(initialMargin.balanceRisky.sub(deltaRisky.raw))
        expect(newMargin.balanceStable).to.equal(initialMargin.balanceStable.sub(deltaStable.raw))
      })

      it('does not reduces the balances of the sender', async function () {
        const riskyBalance = await this.contracts.risky.balanceOf(this.signers[0].address)
        const stableBalance = await this.contracts.stable.balanceOf(this.signers[0].address)
        await this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('10').raw, true)

        expect(
          await this.contracts.risky.balanceOf(this.signers[0].address)
        ).to.equal(riskyBalance)
        expect(
          await this.contracts.stable.balanceOf(this.signers[0].address)
        ).to.equal(stableBalance)
      })

      it('emits the AllocatedAndLent event', async function () {
        // TODO: Checks the args
        await expect(
          this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId,parseWei('10').raw, true)
        ).to.emit(this.contracts.house, 'AllocatedAndLent')
      })
    })

    describe('when allocating from external', async function () {
      it('allocates 10 LP shares', async function () {
        poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
        await this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId,parseWei('10').raw, false)
      })

      it('updates the position of the sender', async function () {
        const initialPosition = await this.contracts.house.positionOf(this.signers[0].address, this.contracts.engine.address, poolId)
        await this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('10').raw, true)
        const newPosition = await this.contracts.house.positionOf(this.signers[0].address, this.contracts.engine.address, poolId)
        expect(newPosition.liquidity).to.equal(initialPosition.liquidity.add(parseWei('10').raw))
      })

      it('reduces the balances of the sender', async function () {
        const reserve = await this.contracts.engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const riskyBalance = await this.contracts.risky.balanceOf(this.signers[0].address)
        const stableBalance = await this.contracts.stable.balanceOf(this.signers[0].address)
        await this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('10').raw, false)

        expect(
          await this.contracts.risky.balanceOf(this.signers[0].address)
        ).to.equal(riskyBalance.sub(deltaRisky.raw))
        expect(
          await this.contracts.stable.balanceOf(this.signers[0].address)
        ).to.equal(stableBalance.sub(deltaStable.raw))
      })

      it('does not reduces the margin', async function () {
        const initialMargin = await this.contracts.house.marginOf(this.signers[0].address, this.contracts.engine.address)
        await this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('10').raw, false)
        const newMargin = await this.contracts.house.marginOf(this.signers[0].address, this.contracts.engine.address)

        expect(initialMargin.balanceRisky).to.equal(newMargin.balanceRisky)
        expect(initialMargin.balanceStable).to.equal(newMargin.balanceStable)
      })

      it('emits the AllocatedAndLent event', async function () {
        // TODO: Checks the args
        await expect(
          this.contracts.house.allocate(this.signers[0].address, this.contracts.engine.address, poolId,parseWei('10').raw, false)
        ).to.emit(this.contracts.house, 'AllocatedAndLent')
      })
    })
  })

  describe('when the parameters are not valid', function () {
    it('fails to allocate more than margin balance', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await expect(
        this.contracts.house.connect(this.signers[1]).allocate(this.signers[0].address, this.contracts.engine.address, poolId,parseWei('1').raw, true)
      ).to.be.reverted
    })

    it('fails to allocate more than external balances', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await expect(
        this.contracts.house.connect(this.signers[1]).allocate(this.signers[0].address, this.contracts.engine.address, poolId,parseWei('1').raw, false)
      ).to.be.reverted
    })
  })
})
