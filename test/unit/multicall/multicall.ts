import { parseWei } from 'web3-units'
import { runTest } from '../context'

const value = parseWei('1').raw

runTest('multicall', function () {
  describe('success cases', function () {
    it('batches multiple calls into one', async function () {
      const wrapData = this.manager.interface.encodeFunctionData('wrap', [value.div(2)])
      const wrapData2 = this.manager.interface.encodeFunctionData('wrap', [value.div(2)])

      await this.manager.multicall([wrapData, wrapData2], {
        value,
      })
    })
  })
})
