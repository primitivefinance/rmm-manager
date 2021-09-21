import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import { DEFAULT_CONFIG } from '../../context'
import { computePoolId } from '../../../shared/utilities'
import expect from '../../../shared/expect'
import { runTest } from '../../context'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG
let poolId: string

runTest('allocate', function () {
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
  })

  describe('success cases', function () {
    describe('when adding liquidity from margin', function () {
      it('allocates 1 LP share', async function () {
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

      it('increases the position of the sender', async function () {
        const liquidity = await this.house.balanceOf(this.deployer.address, poolId)

        await this.house.allocate(
          this.engine.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          true,
          true,
        )

        expect(
          await this.house.balanceOf(this.deployer.address, poolId)
        ).to.equal(liquidity.add(parseWei('1').raw))
      })

      it('reduces the margin of the sender', async function () {
        const reserve = await this.engine.reserves(poolId)
        const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)
        const initialMargin = await this.house.margins(this.engine.address, this.deployer.address)
        await this.house.allocate(
          this.engine.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          true,
          false,
        )
        const newMargin = await this.house.margins(this.engine.address, this.deployer.address)

        expect(newMargin.balanceRisky).to.equal(initialMargin.balanceRisky.sub(deltaRisky.raw))
        expect(newMargin.balanceStable).to.equal(initialMargin.balanceStable.sub(deltaStable.raw))
      })

      it('emits the LiquidityAdded event', async function () {
        // TODO: Checks the args
        await expect(
          this.house.allocate(
            this.engine.address,
            this.risky.address,
            this.stable.address,
            poolId,
            parseWei('1').raw,
            true,
            false,
          )
        ).to.emit(this.house, 'Allocate')
      })

      it('does not reduces the balances of the sender', async function () {
        const riskyBalance = await this.risky.balanceOf(this.deployer.address)
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        await this.house.allocate(
          this.engine.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          true,
          false,
        )

        expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance)
        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance)
      })
    })

    describe('when allocating from external', async function () {
      it('allocates 1 LP shares', async function () {
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

      it('increases the position of the sender', async function () {
        const liquidity = await this.house.balanceOf(this.deployer.address, poolId)

        await this.house.allocate(
          this.engine.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          true,
          true,
        )

        expect(
          await this.house.balanceOf(this.deployer.address, poolId)
        ).to.equal(liquidity.add(parseWei('1').raw))
      })

      it('reduces the balances of the sender', async function () {
        const reserve = await this.engine.reserves(poolId)
        const deltaRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
        const deltaStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)
        const riskyBalance = await this.risky.balanceOf(this.deployer.address)
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        await this.house.allocate(
          this.engine.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          false,
          false,
        )

        expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance.sub(deltaRisky.raw))
        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance.sub(deltaStable.raw))
      })

      it('does not reduces the margin', async function () {
        const initialMargin = await this.house.margins(this.engine.address, this.deployer.address)
        await this.house.allocate(
          this.engine.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          false,
          false,
        )
        const newMargin = await this.house.margins(this.engine.address, this.deployer.address)

        expect(initialMargin.balanceRisky).to.equal(newMargin.balanceRisky)
        expect(initialMargin.balanceStable).to.equal(newMargin.balanceStable)
      })

      it('emits the LiquidityAdded event', async function () {
        // TODO: Checks the args
        await expect(
          this.house.allocate(
            this.engine.address,
            this.risky.address,
            this.stable.address,
            poolId,
            parseWei('1').raw,
            true,
            false,
          )
        ).to.emit(this.house, 'Allocate')
      })
    })
  })

  describe('fail cases', function () {
    it('fails to allocate more than margin balance', async function () {
      await expect(this.house.connect(this.bob).allocate(
        this.engine.address,
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('100').raw,
        true,
        false,
      )).to.be.reverted
    })

    it('fails to allocate more than external balances', async function () {
      await expect(this.house.connect(this.bob).allocate(
        this.engine.address,
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
        false,
        false,
      )).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      const data = utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'uint256'],
        [this.house.address, this.risky.address, this.stable.address, '0', '0']
      );

      await expect(this.house.allocateCallback(0, 0, data)).to.be.revertedWith('NotEngineError()')
    })
  })
})
