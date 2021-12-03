import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

runTest('receive', function () {
  describe('success cases', function () {
    it('receives ETH if the sender is WETH', async function () {
      await this.weth.sendETH(this.manager.address, {
        value: parseWei('1').raw,
      })
    })
  })

  describe('fail cases', function () {
    it('fails to receive ETH if the sender is not WETH', async function () {
      await expect(
        this.deployer.sendTransaction({
          to: this.manager.address,
          value: parseWei('1').raw,
        })
      ).to.revertWithCustomError('OnlyWETHError')
    })
  })
})
