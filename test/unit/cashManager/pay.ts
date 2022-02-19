import { parseWei } from 'web3-units'
import { TestPay } from '../../../typechain/TestPay'

import expect from '../../shared/expect'
import { runTest, deploy } from '../context'

runTest('pay', function () {
  let pay: TestPay

  beforeEach(async function () {
    pay = (await deploy('TestPay', this.deployer, [
      this.factory.address,
      this.weth.address,
      this.positionRenderer.address,
    ])) as TestPay
  })
  describe('success cases', function () {
    it('receives WETH with payment of ETH', async function () {
      const one = parseWei(1)
      const recipient = this.factory.address
      await pay.testPay(this.weth.address, this.deployer.address, recipient, one.raw, { value: one.raw })
      expect(await this.weth.balanceOf(recipient)).to.be.equal(one.raw)
    })

    it('receives WETH with payment of WETH', async function () {
      const one = parseWei(1)
      await this.weth.deposit({ value: one.raw })
      await this.weth.approve(pay.address, one.raw)
      const recipient = this.factory.address
      await pay.testPay(this.weth.address, this.deployer.address, recipient, one.raw)
      expect(await this.weth.balanceOf(recipient)).to.be.equal(one.raw)
    })
  })

  describe('fail cases', function () {
    it('fails to pay WETH if the sender does not send enough ETH', async function () {
      const one = parseWei(1)
      const recipient = this.factory.address

      await expect(
        pay.testPay(this.weth.address, this.deployer.address, recipient, one.raw, { value: one.sub(1).raw })
      ).to.revertWithCustomError('TransferError')
    })
  })
})
