import { ethers } from 'hardhat'
import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

runTest('refundETH', function () {
  describe('success cases', function () {
    it('refunds ETH to the sender', async function () {
      const value = parseWei('1').raw

      await this.weth.sendETH(this.house.address, { value })

      await expect(await this.house.refundETH()).to.changeEtherBalance(this.deployer, value)

      expect(await ethers.provider.getBalance(this.house.address)).to.be.equal('0')
    })
  })
})
