import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

runTest('wrap', function () {
  describe('success cases', function () {
    it('wraps ETH into WETH', async function () {
      await this.house.wrap(parseWei('1').raw, {
        value: parseWei('1').raw,
      })

      expect(await this.weth.balanceOf(this.deployer.address)).to.be.equal(parseWei('1').raw)
    })
  })

  describe('fail cases', function () {
    it('fails to wrap if not enough value is sent', async function () {
      await expect(this.house.wrap(parseWei('1').raw)).to.revertWithCustomError('BalanceTooLowError', [
        '0',
        parseWei('1').raw.toString(),
      ])
    })
  })
})
