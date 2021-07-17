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

  describe('when the parameters are valid', function () {
    beforeEach(async function () {
      poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    })

    it('originates one long option', async function () {
      await this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('1').raw, constants.MaxUint256)
    })

    it('increases the position of the sender', async function () {
      await this.contracts.house.borrow(this.signers[0].address, this.contracts.engine.address, poolId, parseWei('1').raw, constants.MaxUint256)
      const newPosition = await this.contracts.house.positionOf(this.signers[0].address, this.contracts.engine.address, poolId)

      expect(newPosition.debt).to.equal(parseWei('1').raw)
    })

    it('emits the Borrowed event', async function () {
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
