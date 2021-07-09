import { waffle } from 'hardhat'
import { expect } from 'chai'

import loadContext from '../../context'

import { initializeFragment } from '../fragments'

describe('initialize', function () {
  before(async function () {
    await loadContext(waffle.provider, initializeFragment)
  })

  describe('when the parameters are valid', function () {
    it('initializes the house contract', async function () {
      await this.contracts.house.initialize(this.contracts.engine.address)
    })
  })

  describe('when the parameters are not valid', function () {
    it('reverts if the engine is already initialized', async function () {
      await this.contracts.house.initialize(this.contracts.engine.address)
      await expect(this.contracts.house.initialize(this.contracts.engine.address)).to.revertedWith('Already initialized')
    })
  })
})
