import expect from '../../../shared/expect'
import { runTest } from '../../context'

runTest('constructor', function () {
  describe('success cases', function () {
    it('sets the address of the factory', async function () {
      expect(await this.house.factory()).to.equal(this.factory.address)
    })

    it('sets the address of WETH9', async function () {
      expect(await this.house.WETH9()).to.equal('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    })
  })
})
