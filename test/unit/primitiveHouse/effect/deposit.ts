import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { depositFragment } from '../fragments'

const { strike, sigma, maturity, spot } = config

describe('deposit', function () {
  before(async function () {
    await loadContext(waffle.provider, depositFragment)
  })

  describe('when the parameters are valid', function () {
    it('deposits 1 risky and 1 stable to margin', async function () {
      await this.contracts.house.deposit(this.signers[0].address, parseWei('1000').raw, parseWei('1000').raw)
    })
  })

  describe('when the parameters are not valid', function () {
    it('reverts if the curve is already created', async function () {})
  })
})
