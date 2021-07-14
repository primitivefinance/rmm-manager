import { waffle } from 'hardhat'
import { expect } from 'chai'

import loadContext from '../../context'

describe('constructor', function () {
  before(async function () {
    await loadContext(waffle.provider)
  })

  describe('when the parameters are valid', function () {
    it('sets the right parameters', async function () {
      expect(await this.contracts.house.engine()).to.equal(this.contracts.engine.address)

      expect(await this.contracts.house.risky()).to.equal(this.contracts.risky.address)

      expect(await this.contracts.house.stable()).to.equal(this.contracts.stable.address)
    })
  })
})
