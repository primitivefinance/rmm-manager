import { waffle } from 'hardhat'
import { expect } from 'chai'

import loadContext, { config } from '../../context'

import { createFragment } from '../fragments'

const { strike, sigma, maturity, spot } = config

describe('create', function () {
  before(async function () {
    await loadContext(waffle.provider, createFragment)
  })

  describe('when the parameters are valid', function () {
    it('creates a curve using the house contract', async function () {
      await this.contracts.house.create(strike.raw, sigma.raw, maturity.raw, spot.raw)
    })
  })

  describe('when the parameters are not valid', function () {
    it('reverts if the curve is already created', async function () {
      await this.contracts.house.create(strike.raw, sigma.raw, maturity.raw, spot.raw)
      await expect(this.contracts.house.create(strike.raw, sigma.raw, maturity.raw, spot.raw)).to.revertedWith('Initialized')
    })
  })
})
