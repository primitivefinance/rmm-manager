import { waffle } from 'hardhat'
import { expect } from 'chai'
import loadContext from '../../context'

describe('allocate', function () {
  before(async function () {
    await loadContext(waffle.provider)
  })

  describe('when the parameters are valid', function () {
    it('sets the address of the factory', async function () {
      expect(
        await this.contracts.house.factory()
      ).to.equal(this.contracts.factory.address)
    })
  })
})
