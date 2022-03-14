import hre from 'hardhat'
import { utils, constants } from 'ethers'
import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../context'
import { computePoolId } from '../../shared/utilities'
import expect from '../../shared/expect'
import { runTest } from '../context'
import { PrimitiveEngine } from '../../../typechain'
import { abi as PrimitiveEngineAbi } from '@primitivefi/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

const { strike, sigma, maturity, delta, gamma } = DEFAULT_CONFIG
let poolId: string
let delRisky: Wei, delStable: Wei, recipient: string
const delLiquidity = parseWei('10')

runTest('allocate', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.manager.address, constants.MaxUint256)
    await this.stable.approve(this.manager.address, constants.MaxUint256)

    await this.manager.create(
      this.risky.address,
      this.stable.address,
      strike.raw,
      sigma.raw,
      maturity.raw,
      gamma.raw,
      parseWei(1).sub(parseWei(delta)).raw,
      delLiquidity.raw
    )

    await this.manager.deposit(
      this.deployer.address,
      this.risky.address,
      this.stable.address,
      parseWei('1000').raw,
      parseWei('1000').raw
    )

    poolId = computePoolId(this.engine.address, maturity.raw, sigma.raw, strike.raw, gamma.raw)

    const res = await this.engine.reserves(poolId)
    delRisky = delLiquidity.mul(res.reserveRisky).div(res.liquidity)
    delStable = delLiquidity.mul(res.reserveStable).div(res.liquidity)
    recipient = this.deployer.address
  })

  describe('success cases', function () {
    describe('when adding liquidity from margin', function () {
      it('allocates 1 LP share', async function () {
        await this.manager.allocate(
          recipient,
          poolId,
          this.risky.address,
          this.stable.address,
          delRisky.raw,
          delStable.raw,
          true,
          delLiquidity.raw
        )
      })

      it('increases the position of the sender', async function () {
        await expect(
          this.manager.allocate(
            recipient,
            poolId,
            this.risky.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            true,
            delLiquidity.raw
          )
        ).to.increasePositionLiquidity(this.manager, this.deployer.address, poolId, delLiquidity.raw)
      })

      it('reduces the margin of the sender', async function () {
        await expect(
          this.manager.allocate(
            recipient,
            poolId,
            this.risky.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            true,
            delLiquidity.raw
          )
        ).to.updateMargin(
          this.manager,
          this.deployer.address,
          this.engine.address,
          delRisky.raw,
          false,
          delStable.raw,
          false
        )
      })

      it('emits the Allocate event', async function () {
        await expect(
          this.manager.allocate(
            recipient,
            poolId,
            this.risky.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            true,
            delLiquidity.raw
          )
        )
          .to.emit(this.manager, 'Allocate')
          .withArgs(this.deployer.address, recipient, this.engine.address, poolId, delLiquidity.raw, delRisky.raw, delStable.raw, true)
      })

      it('does not reduces the balances of the sender', async function () {
        const riskyBalance = await this.risky.balanceOf(this.deployer.address)
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        await this.manager.allocate(
          recipient,
          poolId,
          this.risky.address,
          this.stable.address,
          delRisky.raw,
          delStable.raw,
          true,
          delLiquidity.raw
        )

        expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance)
        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance)
      })
    })

    describe('when allocating from external', async function () {
      it('allocates 1 LP shares', async function () {
        await this.manager.allocate(
          recipient,
          poolId,
          this.risky.address,
          this.stable.address,
          delRisky.raw,
          delStable.raw,
          false,
          delLiquidity.raw
        )
      })

      it('increases the position of the sender', async function () {
        await expect(
          this.manager.allocate(
            recipient,
            poolId,
            this.risky.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            false,
            delLiquidity.raw
          )
        ).to.increasePositionLiquidity(this.manager, this.deployer.address, poolId, delLiquidity.raw)
      })

      it('reduces the balances of the sender', async function () {
        const riskyBalance = await this.risky.balanceOf(this.deployer.address)
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        await this.manager.allocate(
          recipient,
          poolId,
          this.risky.address,
          this.stable.address,
          delRisky.raw,
          delStable.raw,
          false,
          delLiquidity.raw
        )

        expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance.sub(delRisky.raw))
        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance.sub(delStable.raw))
      })

      it('does not reduces the margin', async function () {
        await expect(
          this.manager.allocate(
            recipient,
            poolId,
            this.risky.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            false,
            delLiquidity.raw
          )
        ).to.updateMargin(
          this.manager,
          this.deployer.address,
          this.engine.address,
          parseWei('0').raw,
          false,
          parseWei('0').raw,
          false
        )
      })

      it('emits the Allocate event', async function () {
        await expect(
          this.manager.allocate(
            recipient,
            poolId,
            this.risky.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            false,
            delLiquidity.raw
          )
        )
          .to.emit(this.manager, 'Allocate')
          .withArgs(this.deployer.address, recipient, this.engine.address, poolId, delLiquidity.raw, delRisky.raw, delStable.raw, false)
      })
    })

    describe('using weth as risky', function () {
      let engine: PrimitiveEngine
      beforeEach(async function () {
        await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
        await this.stable.approve(this.manager.address, constants.MaxUint256)

        await this.factory.deploy(this.weth.address, this.stable.address)
        const decimals = await this.weth.decimals()

        const riskyPerLp = parseWei(1, decimals).sub(parseWei(delta, decimals))
        const totalRisky = riskyPerLp.mul(delLiquidity).div(parseWei(1, 18))

        await this.manager.create(
          this.weth.address,
          this.stable.address,
          strike.raw,
          sigma.raw,
          maturity.raw,
          gamma.raw,
          riskyPerLp.raw,
          delLiquidity.raw,
          { value: totalRisky.raw }
        )

        await this.manager.deposit(
          this.deployer.address,
          this.weth.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw,
          { value: parseWei('1000').raw }
        )

        const addr = await this.factory.getEngine(this.weth.address, this.stable.address)
        engine = (await hre.ethers.getContractAt(PrimitiveEngineAbi, addr)) as PrimitiveEngine

        poolId = computePoolId(addr, maturity.raw, sigma.raw, strike.raw, gamma.raw)

        const res = await engine.reserves(poolId)
        delRisky = delLiquidity.mul(res.reserveRisky).div(res.liquidity)
        delStable = delLiquidity.mul(res.reserveStable).div(res.liquidity)
      })

      it('allocates 1 LP shares', async function () {
        await this.manager.allocate(
          recipient,
          poolId,
          this.weth.address,
          this.stable.address,
          delRisky.raw,
          delStable.raw,
          false,
          delLiquidity.raw,
          {
            value: delRisky.raw,
          }
        )
      })

      it('increases the position of the sender', async function () {
        await expect(
          this.manager.allocate(
            recipient,
            poolId,
            this.weth.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            false,
            delLiquidity.raw,
            {
              value: delRisky.raw,
            }
          )
        ).to.increasePositionLiquidity(this.manager, this.deployer.address, poolId, delLiquidity.raw)
      })

      it('reduces the balances of the sender', async function () {
        const riskyBalance = await this.deployer.getBalance()
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        await this.manager.allocate(
          recipient,
          poolId,
          this.weth.address,
          this.stable.address,
          delRisky.raw,
          delStable.raw,
          false,
          delLiquidity.raw,
          {
            value: delRisky.raw,
          }
        )

        /// 0.001 ether subtracted for rough gas cost
        expect((await this.deployer.getBalance()).gte(riskyBalance.sub(delRisky.raw).sub(parseWei('0.001').raw))).to.be.eq(
          true
        )
        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance.sub(delStable.raw))
      })

      it('emits the Allocate event', async function () {
        await expect(
          this.manager.allocate(
            recipient,
            poolId,
            this.weth.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            false,
            delLiquidity.raw,
            {
              value: delRisky.raw,
            }
          )
        )
          .to.emit(this.manager, 'Allocate')
          .withArgs(this.deployer.address, recipient, engine.address, poolId, delLiquidity.raw, delRisky.raw, delStable.raw, false)
      })
    })
  })

  describe('fail cases', function () {
    it('fails to allocate 0 risky and 0 stable', async function () {
      await expect(
        this.manager.allocate(recipient, poolId, this.risky.address, this.stable.address, '0', '0', true, delLiquidity.raw)
      ).to.revertWithCustomError('ZeroLiquidityError')
    })

    it('reverts if the engine is not deployed', async function () {
      await expect(
        this.manager.allocate(recipient, poolId, this.stable.address, this.risky.address, '0', '0', true, delLiquidity.raw)
      ).to.revertWithCustomError('EngineNotDeployedError')
    })

    it('reverts if the liquidity out is lower than the expected amount', async function () {
      await expect(
        this.manager.allocate(
          recipient,
          poolId,
          this.risky.address,
          this.stable.address,
          delRisky.raw,
          delStable.raw,
          true,
          delLiquidity.add(1).raw
        )
      ).to.revertWithCustomError('MinLiquidityOutError')
    })

    it('fails to allocate more than margin balance', async function () {
      await expect(
        this.manager
          .connect(this.bob)
          .allocate(
            recipient,
            poolId,
            this.risky.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            true,
            delLiquidity.raw
          )
      ).to.be.reverted
    })

    it('fails to allocate more than external balances', async function () {
      await expect(
        this.manager
          .connect(this.bob)
          .allocate(
            recipient,
            poolId,
            this.risky.address,
            this.stable.address,
            delRisky.raw,
            delStable.raw,
            false,
            delLiquidity.raw
          )
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      const data = utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'uint256'],
        [this.manager.address, this.risky.address, this.stable.address, '0', '0']
      )

      await expect(this.manager.allocateCallback(0, 0, data)).to.be.revertedWith('NotEngineError()')
    })
  })
})
