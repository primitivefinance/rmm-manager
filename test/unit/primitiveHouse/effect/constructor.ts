import expect from '../../../shared/expect'
import { runTest } from '../../context'

runTest('constructor', function () {
  describe('success cases', function () {
    it('sets the address of the factory', async function () {
      expect(await this.house.factory()).to.equal(this.factory.address)
    })

    it('sets the address of WETH10', async function () {
      expect(await this.house.WETH10()).to.equal('0x4f5704D9D2cbCcAf11e70B34048d41A0d572993F')
    })
  })
})
