import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

const amount = parseWei('1').raw

runTest('sweepToken', function () {
  describe('success cases', function () {
    it('sweep tokens from the Manager contract', async function () {
      await this.risky.mint(this.manager.address, amount)
      await this.manager.sweepToken(this.risky.address, amount, this.alice.address)

      expect(await this.risky.balanceOf(this.alice.address)).to.be.equal(amount)
    })
  })

  describe('fail cases', function () {
    it('fails to sweep tokens if not enough balance in the Manager contract', async function () {
      await expect(this.manager.sweepToken(this.risky.address, amount, this.alice.address)).to.revertWithCustomError(
        'BalanceTooLowError',
        ['0', amount.toString()]
      )
    })
  })
})
