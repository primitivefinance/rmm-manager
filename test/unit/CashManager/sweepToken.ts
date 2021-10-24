import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

const amount = parseWei('1').raw

runTest('sweepToken', function () {
  describe('success cases', function () {
    it('sweep tokens from the House contract', async function () {
      await this.risky.mint(this.house.address, amount);
      await this.house.sweepToken(
        this.risky.address,
        amount,
        this.alice.address
      )

      expect(
        await this.risky.balanceOf(this.alice.address),
      ).to.be.equal(amount);
    })
  })

  describe('fail cases', function () {
    it('fails to sweep tokens if not enough balance in the House contract', async function () {
      await expect(
        this.house.sweepToken(
          this.risky.address,
          amount,
          this.alice.address
        )
      ).to.be.reverted
    })
  })
})
