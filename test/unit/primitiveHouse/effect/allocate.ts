import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils, BytesLike, constants } from 'ethers'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'
import { allocateFragment } from '../fragments'

const { strike, sigma, maturity } = config
let poolId: string
let userPosId: string

const empty: BytesLike = constants.HashZero

describe('allocate', function () {
  before(async function () {
    await loadContext(waffle.provider, allocateFragment)
  })

  beforeEach(async function () {
    poolId = await this.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    userPosId = utils.solidityKeccak256(['address', 'bytes32'], [this.deployer.address, poolId])
  })

  describe('success cases', function () {
    describe('when allocating from margin', function () {
      it('allocates 10 LP shares', async function () {
        await this.house.allocate(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('10').raw,
          true
        )
      })

      it('updates the position of the sender', async function () {
        const initialPosition = await this.house.positions(this.engine.address, userPosId)
        await this.house.allocate(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('10').raw,
          true
        )
        const newPosition = await this.house.positions(this.engine.address, userPosId)
        expect(newPosition.liquidity).to.equal(initialPosition.liquidity.add(parseWei('10').raw))
      })

      it('reduces the margin of the sender', async function () {
        const reserve = await this.engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const initialMargin = await this.house.margins(this.engine.address, this.deployer.address)
        await this.house.allocate(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('10').raw,
          true
        )
        const newMargin = await this.house.margins(this.engine.address, this.deployer.address)

        expect(newMargin.balanceRisky).to.equal(initialMargin.balanceRisky.sub(deltaRisky.raw))
        expect(newMargin.balanceStable).to.equal(initialMargin.balanceStable.sub(deltaStable.raw))
      })

      it('does not reduces the balances of the sender', async function () {
        const riskyBalance = await this.risky.balanceOf(this.deployer.address)
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        await this.house.allocate(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('10').raw,
          true
        )

        expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance)
        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance)
      })

      it('emits the AllocatedAndLent event', async function () {
        // TODO: Checks the args
        await expect(
          this.house.allocate(
            this.deployer.address,
            this.risky.address,
            this.stable.address,
            poolId,
            parseWei('10').raw,
            true
          )
        ).to.emit(this.house, 'AllocatedAndLent')
      })
    })

    describe('when allocating from external', async function () {
      it('allocates 10 LP shares', async function () {
        poolId = await this.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
        await this.house.allocate(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('10').raw,
          false
        )
      })

      it('updates the position of the sender', async function () {
        const initialPosition = await this.house.positions(this.engine.address, userPosId)
        await this.house.allocate(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('10').raw,
          true
        )
        const newPosition = await this.house.positions(this.engine.address, userPosId)
        expect(newPosition.liquidity).to.equal(initialPosition.liquidity.add(parseWei('10').raw))
      })

      it('reduces the balances of the sender', async function () {
        const reserve = await this.engine.reserves(poolId)
        const deltaRisky = parseWei('10').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('10').mul(reserve.reserveStable).div(reserve.liquidity)
        const riskyBalance = await this.risky.balanceOf(this.deployer.address)
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        await this.house.allocate(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('10').raw,
          false
        )

        expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance.sub(deltaRisky.raw))
        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance.sub(deltaStable.raw))
      })

      it('does not reduces the margin', async function () {
        const initialMargin = await this.house.margins(this.engine.address, this.deployer.address)
        await this.house.allocate(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('10').raw,
          false
        )
        const newMargin = await this.house.margins(this.engine.address, this.deployer.address)

        expect(initialMargin.balanceRisky).to.equal(newMargin.balanceRisky)
        expect(initialMargin.balanceStable).to.equal(newMargin.balanceStable)
      })

      it('emits the AllocatedAndLent event', async function () {
        // TODO: Checks the args
        await expect(
          this.house.allocate(
            this.deployer.address,
            this.risky.address,
            this.stable.address,
            poolId,
            parseWei('10').raw,
            false
          )
        ).to.emit(this.house, 'AllocatedAndLent')
      })
    })
  })

  describe('fail cases', function () {
    it('fails to allocate more than margin balance', async function () {
      await expect(
        this.house
          .connect(this.bob)
          .allocate(this.deployer.address, this.risky.address, this.stable.address, poolId, parseWei('1').raw, true)
      ).to.be.reverted
    })

    it('fails to allocate more than external balances', async function () {
      await expect(
        this.house
          .connect(this.bob)
          .allocate(this.deployer.address, this.risky.address, this.stable.address, poolId, parseWei('1').raw, false)
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(this.house.allocateCallback(0, 0, empty)).to.be.revertedWith('Not engine')
    })
  })
})
