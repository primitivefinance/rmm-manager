import { waffle } from 'hardhat'
import { expect } from 'chai'
import loadContext from '../../context'

describe('constructor', function () {
  before(async function () {
    await loadContext(waffle.provider)
  })

  describe('success cases', function () {
    it('sets the address of the factory', async function () {
      expect(await this.contracts.house.factory()).to.equal(this.contracts.factory.address)
    })
  })
})
