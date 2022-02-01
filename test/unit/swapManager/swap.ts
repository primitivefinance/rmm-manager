import { ethers } from 'hardhat'
import { constants, BigNumber } from 'ethers'
import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../context'
import { computePoolId } from '../../shared/utilities'
import expect from '../../shared/expect'
import { runTest } from '../context'
import { PrimitiveEngine } from '../../../typechain'
import { abi as PrimitiveEngineAbi } from '@primitivefi/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

const { strike, sigma, maturity, delta, gamma } = DEFAULT_CONFIG
let poolId: string
let delRisky: Wei, delStable: Wei
const delLiquidity = parseWei('100')

export const PRECISION: BigNumber = parseWei('1', 18).raw

function getMaxDeltaIn(reserve: BigNumber, liquidity: BigNumber, riskyForStable: boolean, strike: BigNumber): BigNumber {
  if (riskyForStable) {
    const riskyPerLiquidity = reserve.mul(PRECISION).div(liquidity)
    return parseWei(1, 18).raw.sub(riskyPerLiquidity).mul(liquidity).div(PRECISION)
  } else {
    const stablePerLiquidity = reserve.mul(PRECISION).div(liquidity)
    return strike.sub(stablePerLiquidity).mul(liquidity).div(PRECISION)
  }
}

async function getDeltas(engine: PrimitiveEngine, riskyForStable: boolean) {
  const reserves = await engine.reserves(poolId)
  const deltaIn = getMaxDeltaIn(
    riskyForStable ? reserves.reserveRisky : reserves.reserveStable,
    reserves.liquidity,
    riskyForStable,
    strike.raw
  ).div(2)
  const deltaOut = (riskyForStable ? reserves.reserveStable : reserves.reserveRisky).div(2)

  return {
    deltaIn,
    deltaOut,
  }
}

runTest('swap', function () {
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

    poolId = computePoolId(this.engine.address, maturity.raw, sigma.raw, strike.raw, gamma.raw)

    const amount = parseWei('100')
    const res = await this.engine.reserves(poolId)
    delRisky = amount.mul(res.reserveRisky).div(res.liquidity)
    delStable = amount.mul(res.reserveStable).div(res.liquidity)

    await this.manager.allocate(
      poolId,
      this.risky.address,
      this.stable.address,
      delRisky.raw,
      delStable.raw,
      false,
      amount.raw
    )
  })

  describe('success cases', function () {
    describe('from margin / to margin', function () {
      beforeEach(async function () {
        await this.manager.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('100').raw,
          parseWei('100').raw
        )
      })

      describe('swaps risky for stable', function () {
        it('reduces the risky margin and increases the stable margin', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: true,
              deltaIn,
              deltaOut,
              fromMargin: true,
              toMargin: true,
              deadline: 1000000000000,
            })
          ).to.updateMargin(this.manager, this.deployer.address, this.engine.address, deltaIn, false, deltaOut, true)
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: true,
              deltaIn,
              deltaOut,
              fromMargin: true,
              toMargin: true,
              deadline: 1000000000000,
            })
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              this.engine.address,
              poolId,
              true,
              deltaIn,
              deltaOut,
              true,
              true
            )
        })
      })

      describe('swaps stable for risky', function () {
        it('reduces the stable margin and increases the risky margin', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: false,
              deltaIn,
              deltaOut,
              fromMargin: true,
              toMargin: true,
              deadline: 1000000000000,
            })
          ).to.updateMargin(this.manager, this.deployer.address, this.engine.address, deltaOut, true, deltaIn, false)
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: false,
              deltaIn,
              deltaOut,
              fromMargin: true,
              toMargin: true,
              deadline: 1000000000000,
            })
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              this.engine.address,
              poolId,
              false,
              deltaIn,
              deltaOut,
              true,
              true
            )
        })
      })
    })

    describe('from margin / to wallet', function () {
      beforeEach(async function () {
        await this.manager.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('100').raw,
          parseWei('100').raw
        )
      })

      describe('swaps risky for stable', function () {
        it('reduces the risky margin and sends stable to wallet', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          const preStableBalance = await this.stable.balanceOf(this.deployer.address)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: true,
              deltaIn,
              deltaOut,
              fromMargin: true,
              toMargin: false,
              deadline: 1000000000000,
            })
          ).to.updateMargin(
            this.manager,
            this.deployer.address,
            this.engine.address,
            deltaIn,
            false,
            parseWei('0').raw,
            true
          )

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(preStableBalance.add(deltaOut))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: true,
              deltaIn,
              deltaOut,
              fromMargin: true,
              toMargin: false,
              deadline: 1000000000000,
            })
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              this.engine.address,
              poolId,
              true,
              deltaIn,
              deltaOut,
              true,
              false
            )
        })
      })

      describe('swaps stable for risky', function () {
        it('reduces the stable margin and sends risky to wallet', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: false,
              deltaIn,
              deltaOut,
              fromMargin: true,
              toMargin: false,
              deadline: 1000000000000,
            })
          ).to.updateMargin(
            this.manager,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            true,
            deltaIn,
            false
          )
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: false,
              deltaIn,
              deltaOut,
              fromMargin: true,
              toMargin: false,
              deadline: 1000000000000,
            })
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              this.engine.address,
              poolId,
              false,
              deltaIn,
              deltaOut,
              true,
              false
            )
        })
      })
    })

    describe('from wallet / to margin', function () {
      beforeEach(async function () {
        await this.manager.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('100').raw,
          parseWei('100').raw
        )
      })

      describe('swaps risky for stable', function () {
        it('withdraws risky from wallet and increases stable margin', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          const preRiskyBalance = await this.risky.balanceOf(this.deployer.address)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: true,
              deltaIn,
              deltaOut,
              fromMargin: false,
              toMargin: true,
              deadline: 1000000000000,
            })
          ).to.updateMargin(
            this.manager,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            false,
            deltaOut,
            true
          )

          const postRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          expect(postRiskyBalance).to.be.equal(preRiskyBalance.sub(deltaIn))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: true,
              deltaIn,
              deltaOut,
              fromMargin: false,
              toMargin: true,
              deadline: 1000000000000,
            })
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              this.engine.address,
              poolId,
              true,
              deltaIn,
              deltaOut,
              false,
              true
            )
        })
      })

      describe('swaps stable for risky', function () {
        it('withdraw stable from wallet and increases risky margin', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          const preStableBalance = await this.stable.balanceOf(this.deployer.address)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: false,
              deltaIn,
              deltaOut,
              fromMargin: false,
              toMargin: true,
              deadline: 1000000000000,
            })
          ).to.updateMargin(
            this.manager,
            this.deployer.address,
            this.engine.address,
            deltaOut,
            true,
            parseWei('0').raw,
            false
          )

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(preStableBalance.sub(deltaIn))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: false,
              deltaIn,
              deltaOut,
              fromMargin: false,
              toMargin: true,
              deadline: 1000000000000,
            })
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              this.engine.address,
              poolId,
              false,
              deltaIn,
              deltaOut,
              false,
              true
            )
        })
      })
    })

    describe('from wallet / to wallet', function () {
      beforeEach(async function () {
        await this.manager.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('100').raw,
          parseWei('100').raw
        )
      })

      describe('swaps risky for stable', function () {
        it('withdraws risky from wallet and sends stable to wallet', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          const preRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          const preStableBalance = await this.stable.balanceOf(this.deployer.address)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: true,
              deltaIn,
              deltaOut,
              fromMargin: false,
              toMargin: false,
              deadline: 1000000000000,
            })
          ).to.updateMargin(
            this.manager,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            true,
            parseWei('0').raw,
            true
          )

          const postRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          expect(postRiskyBalance).to.be.equal(preRiskyBalance.sub(deltaIn))

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(preStableBalance.add(deltaOut))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: true,
              deltaIn,
              deltaOut,
              fromMargin: false,
              toMargin: false,
              deadline: 1000000000000,
            })
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              this.engine.address,
              poolId,
              true,
              deltaIn,
              deltaOut,
              false,
              false
            )
        })
      })

      describe('swaps stable for risky', function () {
        it('withdraw stable from wallet and sends risky to wallet', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          const preRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          const preStableBalance = await this.stable.balanceOf(this.deployer.address)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: false,
              deltaIn,
              deltaOut,
              fromMargin: false,
              toMargin: false,
              deadline: 1000000000000,
            })
          ).to.updateMargin(
            this.manager,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            true,
            parseWei('0').raw,
            true
          )

          const postRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          expect(postRiskyBalance).to.be.equal(preRiskyBalance.add(deltaOut))

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(preStableBalance.sub(deltaIn))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(
            this.manager.swap({
              recipient: this.deployer.address,
              risky: this.risky.address,
              stable: this.stable.address,
              poolId: poolId,
              riskyForStable: false,
              deltaIn,
              deltaOut,
              fromMargin: false,
              toMargin: false,
              deadline: 1000000000000,
            })
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              this.engine.address,
              poolId,
              false,
              deltaIn,
              deltaOut,
              false,
              false
            )
        })
      })
    })

    describe('from wallet / to wallet for weth pair', function () {
      let engine: PrimitiveEngine
      beforeEach(async function () {
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

        const addr = await this.factory.getEngine(this.weth.address, this.stable.address)
        engine = (await ethers.getContractAt(PrimitiveEngineAbi, addr)) as PrimitiveEngine

        poolId = computePoolId(addr, maturity.raw, sigma.raw, strike.raw, gamma.raw)
        await this.manager.deposit(
          this.deployer.address,
          this.weth.address,
          this.stable.address,
          parseWei('100').raw,
          parseWei('100').raw,
          { value: parseWei('100').raw }
        )
      })

      describe('swaps weth for stable', function () {
        it('withdraws weth from wallet and sends stable to wallet', async function () {
          const { deltaIn, deltaOut } = await getDeltas(engine, true)

          const preRiskyBalance = await this.deployer.getBalance()
          const preStableBalance = await this.stable.balanceOf(this.deployer.address)

          await expect(
            this.manager.swap(
              {
                recipient: this.deployer.address,
                risky: this.weth.address,
                stable: this.stable.address,
                poolId: poolId,
                riskyForStable: true,
                deltaIn,
                deltaOut,
                fromMargin: false,
                toMargin: false,
                deadline: 1000000000000,
              },
              { value: deltaIn }
            )
          ).to.updateMargin(
            this.manager,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            true,
            parseWei('0').raw,
            true
          )

          const postRiskyBalance = await this.deployer.getBalance()
          /// 0.001 ether is overestimated gas cost
          expect(postRiskyBalance.gte(preRiskyBalance.sub(deltaIn).sub(parseWei('0.001').raw))).to.be.equal(true)

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(preStableBalance.add(deltaOut))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(engine, true)

          await expect(
            this.manager.swap(
              {
                recipient: this.deployer.address,
                risky: this.weth.address,
                stable: this.stable.address,
                poolId: poolId,
                riskyForStable: true,
                deltaIn,
                deltaOut,
                fromMargin: false,
                toMargin: false,
                deadline: 1000000000000,
              },
              { value: deltaIn }
            )
          )
            .to.emit(this.manager, 'Swap')
            .withArgs(
              this.deployer.address,
              this.deployer.address,
              engine.address,
              poolId,
              true,
              deltaIn,
              deltaOut,
              false,
              false
            )
        })
      })
    })
  })

  describe('fail cases', function () {
    it('reverts if the engine is not deployed', async function () {
      const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

      await expect(
        this.manager.swap({
          recipient: this.deployer.address,
          risky: this.stable.address,
          stable: this.risky.address,
          poolId: poolId,
          riskyForStable: true,
          deltaIn,
          deltaOut,
          fromMargin: true,
          toMargin: true,
          deadline: 1000000000000,
        })
      ).to.revertWithCustomError('EngineNotDeployedError')
    })

    it('reverts if the deadline is reached', async function () {
      const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

      await expect(
        this.manager.swap({
          recipient: this.deployer.address,
          risky: this.risky.address,
          stable: this.stable.address,
          poolId: poolId,
          riskyForStable: true,
          deltaIn,
          deltaOut,
          fromMargin: true,
          toMargin: true,
          deadline: 0,
        })
      ).to.revertWithCustomError('DeadlineReachedError')
    })

    it('reverts if the payer does not have enough funds in margin', async function () {
      const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

      await expect(
        this.manager.connect(this.alice).swap({
          recipient: this.deployer.address,
          risky: this.risky.address,
          stable: this.stable.address,
          poolId: poolId,
          riskyForStable: true,
          deltaIn,
          deltaOut,
          fromMargin: true,
          toMargin: true,
          deadline: 0,
        })
      ).to.be.reverted
    })

    it('reverts if the payer does not have enough funds in wallet', async function () {
      const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

      await expect(
        this.manager.connect(this.alice).swap({
          recipient: this.deployer.address,
          risky: this.risky.address,
          stable: this.stable.address,
          poolId: poolId,
          riskyForStable: true,
          deltaIn,
          deltaOut,
          fromMargin: false,
          toMargin: true,
          deadline: 0,
        })
      ).to.be.reverted
    })
  })
})
