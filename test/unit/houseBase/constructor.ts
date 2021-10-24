import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

runTest('constructor', function () {
  describe('success cases', function () {
    it('fetches the variables set by the constructor', async function () {
      expect(await this.house.factory()).to.be.equal(this.factory.address)
      expect(await this.house.WETH9()).to.be.equal(this.weth.address)
      expect(await this.house.positionRenderer()).to.be.equal(this.positionRenderer.address)
    })
  })
})
