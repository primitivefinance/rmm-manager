import { waffle } from 'hardhat'
import { expect } from 'chai'

import { BytesLike, constants } from '../../../shared/Units'
import loadContext from '../../context'

import { initializeFragment } from '../fragments'

const empty: BytesLike = constants.HashZero

describe('initialize', function () {
  before(async function () {
    await loadContext(waffle.provider, ['houseInitialize'], initializeFragment)
  })

  describe('when the parameters are valid', function () {
    it('initializes the house contract', async function () {
      await this.contracts.houseInitialize.init(this.contracts.engine.address)
    })
  })

  describe('when the parameters are not valid', function () {
    it('reverts if the engine is already initialized', async function () {
      await this.contracts.houseInitialize.init(this.contracts.engine.address)
      console.log(await this.contracts.house.engine())
      await expect(this.contracts.houseInitialize.init(this.contracts.engine.address)).to.revertedWith('Already initialized')
    })
  })
})
