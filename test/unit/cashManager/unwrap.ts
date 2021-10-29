import hre from 'hardhat'
import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

const value = parseWei('1').raw

runTest('unwrap', function () {
  describe('success cases', function () {
    it('unwraps WETH into ETH', async function () {
      await this.house.wrap(value, { value })
      await this.weth.transfer(this.house.address, value)

      const recipient = '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0'
      const previousBalance = await hre.ethers.provider.getBalance(recipient)
      await this.house.unwrap(value, recipient)

      expect(await this.weth.balanceOf(this.house.address)).to.be.equal(0)
      expect(await hre.ethers.provider.getBalance(this.house.address)).to.be.equal(0)

      const newBalance = await hre.ethers.provider.getBalance(recipient)
      expect(newBalance).to.equal(previousBalance.add(value))
    })
  })

  describe('fail cases', function () {
    it('fails to unwrap if not enough value is in the House', async function () {
      await expect(this.house.unwrap(value, this.deployer.address)).to.revertWithCustomError('BalanceTooLowError', [
        '0',
        value.toString(),
      ])
    })
  })
})
