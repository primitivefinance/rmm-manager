import { waffle } from 'hardhat'
import { expect } from 'chai'
import { BytesLike, constants } from 'ethers'
import { parseWei } from 'web3-units'

import { computePoolId, getTokenId } from '../../../shared/utilities'
import loadContext, { DEFAULT_CONFIG } from '../../context'

import { borrowFragment } from '../fragments'

const { strike, sigma, maturity } = DEFAULT_CONFIG
let poolId: string

const empty: BytesLike = constants.HashZero

describe('borrow', function () {
  before(async function () {
    loadContext(waffle.provider, borrowFragment)
  })

  beforeEach(async function () {
    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)
  })

  describe('success cases', function () {
    describe('from external', async function () {
      it('borrows risky', async function () {
        await this.house.borrow(
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          '0',
          constants.MaxUint256,
          constants.MaxUint256,
          false,
        )
      })
    })
  })
})
/*
    describe('from margin', function () {
      describe('success cases', function () {
        it('borrows risky', async function () {
          await this.house.borrow(
            this.risky.address,
            this.stable.address,
            poolId,
            parseWei('1').raw,
            '0',
            constants.MaxUint256,
            constants.MaxUint256,
            true,
          )
        })

        it('borrows stable', async function () {
          await this.house.borrow(
            this.risky.address,
            this.stable.address,
            poolId,
            '0',
            parseWei('1').raw,
            constants.MaxUint256,
            constants.MaxUint256,
            true,
          )
        })

        it('borrows risky and stable', async function () {
          await this.house.borrow(
            this.risky.address,
            this.stable.address,
            poolId,
            parseWei('1').raw,
            parseWei('1').raw,
            constants.MaxUint256,
            constants.MaxUint256,
            true,
          )
        })

        it('increases the risky balance of the sender', async function () {
          const tokenId = getTokenId(this.engine.address, poolId, 2)
          const oldRiskyBalance = await this.house.balanceOf(this.deployer.address, tokenId)

          await this.house.borrow(
            this.risky.address,
            this.stable.address,
            poolId,
            parseWei('1').raw,
            '0',
            constants.MaxUint256,
            constants.MaxUint256,
            true,
          )

          const newRiskyBalance = await this.house.balanceOf(this.deployer.address, tokenId)
          expect(newRiskyBalance).to.equal(oldRiskyBalance.add(parseWei('1').raw))
        })

        it('increases the stable balance of the sender', async function () {
          const tokenId = getTokenId(this.engine.address, poolId, 3)
          const oldStableBalance = await this.house.balanceOf(this.deployer.address, tokenId)

          await this.house.borrow(
            this.risky.address,
            this.stable.address,
            poolId,
            '0',
            parseWei('1').raw,
            constants.MaxUint256,
            constants.MaxUint256,
            true,
          )

          const newStableBalance = await this.house.balanceOf(this.deployer.address, tokenId)
          expect(newStableBalance).to.equal(oldStableBalance.add(parseWei('1').raw))
        })
      })
    })

    describe('fail cases', function () {
      it('fails if the risky premium is above the max', async function () {
        await expect(this.house.borrow(
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          '0',
          0,
          0,
          true,
        )).to.be.revertedWith('AbovePremiumError()')
      })
    })
  })
})

    /*

    it('transfers the premium, risky and stable', async function () {
      const reserve = await this.engine.reserves(poolId)
      const delRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const delStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)
      const premium = parseWei('1').sub(delRisky.raw)

      const engineRiskyBalance = await this.risky.balanceOf(this.engine.address)
      const engineStableBalance = await this.stable.balanceOf(this.engine.address)

      const payerRiskyBalance = await this.risky.balanceOf(this.deployer.address)
      const payerStableBalance = await this.stable.balanceOf(this.deployer.address)

      await this.house.borrow(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
        true,
        constants.MaxUint256
      )

      expect(await this.risky.balanceOf(this.engine.address)).to.equal(engineRiskyBalance.add(premium.raw))

      expect(await this.stable.balanceOf(this.engine.address)).to.equal(engineStableBalance.sub(delStable.raw))

      expect(await this.risky.balanceOf(this.deployer.address)).to.equal(payerRiskyBalance.sub(premium.raw))

      expect(await this.stable.balanceOf(this.deployer.address)).to.equal(payerStableBalance.add(delStable.raw))
    })
  })

  describe('fail cases', function () {
    it('fails to borrow more than there is liquidity on the curve', async function () {
      await expect(
        this.house.borrow(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('100000').raw,
          true,
          constants.MaxUint256
        )
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(this.house.borrowCallback(parseWei('10').raw, 0, 0, empty)).to.be.revertedWith('Not engine')
    })
  })
})
*/
