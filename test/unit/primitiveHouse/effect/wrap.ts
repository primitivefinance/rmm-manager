import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../../context'
import expect from '../../../shared/expect'
import { runTest } from '../../context'

runTest('wrap', function () {
  beforeEach(async function () {

  })

  describe('success cases', function () {
    it('wraps ETH into WETH', async function () {
      await this.house.wrap(parseWei('1').raw, {
        value: parseWei('1').raw
      })

      expect(
        await this.weth.balanceOf(this.deployer.address),
      ).to.be.equal(parseWei('1').raw)
    })
  })

  /*
  describe('fail cases', function () {
    it('fails to allocate more than margin balance', async function () {

    })
  })
  */
})
