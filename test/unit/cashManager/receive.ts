import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

runTest('receive', function () {
  describe('fail cases', function () {
    it('fails to receive ETH if the sender is not WETH', async function () {
      await expect(
        this.deployer.sendTransaction({
          to: this.house.address,
          value: parseWei('1').raw,
        })
      ).to.be.reverted
    })
  })
})
