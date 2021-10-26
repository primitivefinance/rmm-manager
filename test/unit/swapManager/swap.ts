import { constants, BigNumber } from 'ethers'
import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../context'
import { computePoolId } from '../../shared/utilities'
import expect from '../../shared/expect'
import { runTest } from '../context'
import { PrimitiveEngine } from '@primitivefinance/v2-core/typechain'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG
let poolId: string
let delRisky: Wei, delStable: Wei
const delLiquidity = parseWei('100')

export const PRECISION: BigNumber = parseWei('1', 18).raw

function getMaxDeltaIn(
  reserve: BigNumber,
  liquidity: BigNumber,
  riskyForStable: boolean,
  strike: BigNumber,
): BigNumber {
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
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)

    await this.house.create(
      this.risky.address,
      this.stable.address,
      strike.raw,
      sigma.raw,
      maturity.raw,
      parseWei(1).sub(parseWei(delta)).raw,
      delLiquidity.raw
    )

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)

    const amount = parseWei('100')
    const res = await this.engine.reserves(poolId)
    delRisky = amount.mul(res.reserveRisky).div(res.liquidity)
    delStable = amount.mul(res.reserveStable).div(res.liquidity)

    await this.house.allocate(poolId, this.risky.address, this.stable.address, delRisky.raw, delStable.raw, false)
  })

  describe('success cases', function () {
    describe('from margin / to margin', function () {
      beforeEach(async function () {
        await this.house.deposit(
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

          await expect(this.house.swap({
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
          })).to.updateMargin(
            this.house,
            this.deployer.address,
            this.engine.address,
            deltaIn,
            false,
            deltaOut,
            true,
          )
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(this.house.swap({
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
          })).to.emit(this.house, 'Swap').withArgs(
            this.deployer.address,
            this.deployer.address,
            this.engine.address,
            poolId,
            true,
            deltaIn,
            deltaOut,
            true,
            true,
          )
        })
      })

      describe('swaps stable for risky', function () {
        it('reduces the stable margin and increases the risky margin', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(this.house.swap({
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
          })).to.updateMargin(
            this.house,
            this.deployer.address,
            this.engine.address,
            deltaOut,
            true,
            deltaIn,
            false,
          )
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(this.house.swap({
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
          })).to.emit(this.house, 'Swap').withArgs(
            this.deployer.address,
            this.deployer.address,
            this.engine.address,
            poolId,
            false,
            deltaIn,
            deltaOut,
            true,
            true,
          )
        })
      })
    })

    describe('from margin / to wallet', function () {
      beforeEach(async function () {
        await this.house.deposit(
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

          await expect(this.house.swap({
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
          })).to.updateMargin(
            this.house,
            this.deployer.address,
            this.engine.address,
            deltaIn,
            false,
            parseWei('0').raw,
            true,
          )

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(
            preStableBalance.add(deltaOut)
          )
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(this.house.swap({
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
          })).to.emit(this.house, 'Swap').withArgs(
            this.deployer.address,
            this.deployer.address,
            this.engine.address,
            poolId,
            true,
            deltaIn,
            deltaOut,
            true,
            false,
          )
        })
      })

      describe('swaps stable for risky', function () {
        it('reduces the stable margin and sends risky to wallet', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(this.house.swap({
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
          })).to.updateMargin(
            this.house,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            true,
            deltaIn,
            false,
          )
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(this.house.swap({
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
          })).to.emit(this.house, 'Swap').withArgs(
            this.deployer.address,
            this.deployer.address,
            this.engine.address,
            poolId,
            false,
            deltaIn,
            deltaOut,
            true,
            false,
          )
        })
      })
    })

    describe('from wallet / to margin', function () {
      beforeEach(async function () {
        await this.house.deposit(
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

          await expect(this.house.swap({
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
          })).to.updateMargin(
            this.house,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            false,
            deltaOut,
            true,
          )

          const postRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          expect(postRiskyBalance).to.be.equal(
            preRiskyBalance.sub(deltaIn)
          )
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(this.house.swap({
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
          })).to.emit(this.house, 'Swap').withArgs(
            this.deployer.address,
            this.deployer.address,
            this.engine.address,
            poolId,
            true,
            deltaIn,
            deltaOut,
            false,
            true,
          )
        })
      })

      describe('swaps stable for risky', function () {
        it('withdraw stable from wallet and increases risky margin', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          const preStableBalance = await this.stable.balanceOf(this.deployer.address)

          await expect(this.house.swap({
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
          })).to.updateMargin(
            this.house,
            this.deployer.address,
            this.engine.address,
            deltaOut,
            true,
            parseWei('0').raw,
            false,
          )

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(preStableBalance.sub(deltaIn))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(this.house.swap({
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
          })).to.emit(this.house, 'Swap').withArgs(
            this.deployer.address,
            this.deployer.address,
            this.engine.address,
            poolId,
            false,
            deltaIn,
            deltaOut,
            false,
            true,
          )
        })
      })
    })

    describe('from wallet / to wallet', function () {
      beforeEach(async function () {
        await this.house.deposit(
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

          await expect(this.house.swap({
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
          })).to.updateMargin(
            this.house,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            true,
            parseWei('0').raw,
            true,
          )

          const postRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          expect(postRiskyBalance).to.be.equal(preRiskyBalance.sub(deltaIn))

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(preStableBalance.add(deltaOut))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

          await expect(this.house.swap({
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
          })).to.emit(this.house, 'Swap').withArgs(
            this.deployer.address,
            this.deployer.address,
            this.engine.address,
            poolId,
            true,
            deltaIn,
            deltaOut,
            false,
            false,
          )
        })
      })

      describe('swaps stable for risky', function () {
        it('withdraw stable from wallet and sends risky to wallet', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          const preRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          const preStableBalance = await this.stable.balanceOf(this.deployer.address)

          await expect(this.house.swap({
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
          })).to.updateMargin(
            this.house,
            this.deployer.address,
            this.engine.address,
            parseWei('0').raw,
            true,
            parseWei('0').raw,
            true,
          )

          const postRiskyBalance = await this.risky.balanceOf(this.deployer.address)
          expect(postRiskyBalance).to.be.equal(preRiskyBalance.add(deltaOut))

          const postStableBalance = await this.stable.balanceOf(this.deployer.address)
          expect(postStableBalance).to.be.equal(preStableBalance.sub(deltaIn))
        })

        it('emits the Swap event', async function () {
          const { deltaIn, deltaOut } = await getDeltas(this.engine, false)

          await expect(this.house.swap({
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
          })).to.emit(this.house, 'Swap').withArgs(
            this.deployer.address,
            this.deployer.address,
            this.engine.address,
            poolId,
            false,
            deltaIn,
            deltaOut,
            false,
            false,
          )
        })
      })
    })
  })

  describe('fail cases', function () {
    it('reverts if the deadline is reached', async function () {
      const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

      await expect(this.house.swap({
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
      })).to.revertWithCustomError('DeadlineReachedError')
    })

    it('reverts if the payer does not have enough funds in margin', async function () {
      const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

      await expect(this.house.connect(this.alice).swap({
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
      })).to.be.reverted
    })

    it('reverts if the payer does not have enough funds in wallet', async function () {
      const { deltaIn, deltaOut } = await getDeltas(this.engine, true)

      await expect(this.house.connect(this.alice).swap({
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
      })).to.be.reverted
    })
  })
})
