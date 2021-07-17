import { waffle } from 'hardhat'
import { expect } from 'chai'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { depositFragment } from '../fragments'

describe('deposit', function () {
  before(async function () {
    await loadContext(waffle.provider, depositFragment)
  })

  describe('when the parameters are valid', function () {
    it('deposits risky and stable to margin', async function () {
      await this.contracts.house.deposit(
        this.signers[0].address,
        this.contracts.engine.address,
        parseWei('1000').raw,
        parseWei('1000').raw)
    })

    it('increases the margin', async function () {
      await this.contracts.house.deposit(
        this.signers[0].address,
        this.contracts.engine.address,
        parseWei('1000').raw,
        parseWei('1000').raw)

      const margin = await this.contracts.house.marginOf(
        this.signers[0].address,
        this.contracts.engine.address
      )

      expect(margin.balanceRisky).to.equal(parseWei('1000').raw)
      expect(margin.balanceStable).to.equal(parseWei('1000').raw)
    })

    it('emits the Deposited event', async function () {
      await expect(
        this.contracts.house.deposit(
          this.signers[0].address,
          this.contracts.engine.address,
          parseWei('1000').raw,
          parseWei('1000').raw)
      ).to.emit(this.contracts.house, 'Deposited').withArgs(
        this.signers[0].address,
        this.contracts.engine.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )
    })
  })

  describe('when the parameters are not valid', function () {
    it('reverts if the owner does not have enough tokens', async function () {
      await expect(
        this.contracts.house.connect(this.signers[1]).deposit(
          this.signers[0].address,
          this.contracts.engine.address,
          parseWei('1000').raw,
          parseWei('1000').raw)
      ).to.be.reverted
    })
  })
})
