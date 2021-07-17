import { waffle } from 'hardhat'
import { expect } from 'chai'

import { BytesLike, constants, parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { borrowFragment } from '../fragments'

const { strike, sigma, maturity } = config

const empty: BytesLike = constants.HashZero

describe('borrow', function () {
  before(async function () {
    await loadContext(waffle.provider, borrowFragment)
  })

  describe('when the parameters are valid', function () {
    it('originates one long option', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('1').raw, constants.MaxUint256)
    })

    it('emits the Borrowed event', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)

      await expect(
        this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('1').raw, constants.MaxUint256)
      ).to.emit(this.contracts.house, 'Borrowed')
    })
  })

  describe('when the parameters are not valid', function () {
    it('fails to borrow more than there is liquidity on the curve', async function () {
      const poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
      await expect(
        this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('100000').raw, constants.MaxUint256)
      ).to.be.reverted
    })
  })
})
