import { waffle } from 'hardhat'
import { expect } from 'chai'

import { constants, parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { borrowFragment } from '../fragments'

const { strike, sigma, maturity } = config

let poolId: string

describe('borrow', function () {
  before(async function () {
    await loadContext(waffle.provider, borrowFragment)
  })

  beforeEach(async function () {
    poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
  })

  describe('when the parameters are valid', function () {
    it('originates one long option', async function () {
      await this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('1').raw, constants.MaxUint256)
    })

    it('increases the position of the sender', async function () {
      await this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('1').raw, constants.MaxUint256)
      const newPosition = await this.contracts.house.positionOf(this.signers[0].address, this.contracts.engine.address, poolId)

      expect(newPosition.debt).to.equal(parseWei('1').raw)
    })

    it('transfers the premium, risky and stable', async function () {
      const reserve = await this.contracts.engine.reserves(poolId)
      const delRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const delStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)
      const premium = parseWei('1').sub(delRisky.raw)

      const engineRiskyBalance = await this.contracts.risky.balanceOf(this.contracts.engine.address)
      const engineStableBalance = await this.contracts.stable.balanceOf(this.contracts.engine.address)

      const payerRiskyBalance = await this.contracts.risky.balanceOf(this.signers[0].address)
      const payerStableBalance = await this.contracts.stable.balanceOf(this.signers[0].address)

      await this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('1').raw, constants.MaxUint256)

      expect(
        await this.contracts.risky.balanceOf(this.contracts.engine.address)
      ).to.equal(engineRiskyBalance.add(premium.raw))

      expect(
        await this.contracts.stable.balanceOf(this.contracts.engine.address)
      ).to.equal(engineStableBalance.sub(delStable.raw))

      expect(
        await this.contracts.risky.balanceOf(this.signers[0].address)
      ).to.equal(payerRiskyBalance.sub(premium.raw))

      expect(
        await this.contracts.stable.balanceOf(this.signers[0].address)
      ).to.equal(payerStableBalance.add(delStable.raw))
    })

    it('emits the Borrowed event', async function () {
      await expect(
        this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('1').raw, constants.MaxUint256)
      ).to.emit(this.contracts.house, 'Borrowed')
    })
  })

  describe('when the parameters are not valid', function () {
    it('fails to borrow more than there is liquidity on the curve', async function () {
      await expect(
        this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('100000').raw, constants.MaxUint256)
      ).to.be.reverted
    })
  })
})
