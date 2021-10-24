import hre, { ethers } from 'hardhat'
import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

const value = parseWei('1').raw

runTest('multicall', function () {
  describe('success cases', function () {
    it('batches multiple calls into one', async function () {
      const wrapData = this.house.interface.encodeFunctionData('wrap', [value.div(2)]);
      const wrapData2 = this.house.interface.encodeFunctionData('wrap', [value.div(2)]);

      await this.house.multicall(
        [wrapData, wrapData2], {
          value,
        }
      )
    })
  })
})
