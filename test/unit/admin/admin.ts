import { waffle } from 'hardhat'
import { expect } from 'chai'

import loadContext from '../context'

describe('admin', function () {
  before(async function () {
    await loadContext(waffle.provider)
  })

  describe('admin', function () {
    it('returns the address of the current admin', async function () {
      expect(await this.contracts.testAdmin.admin()).to.equal(this.signers[0].address)
    })
  })

  describe('setAdmin', function () {
    it('sets a new admin if the sender is the current admin', async function () {
      await this.contracts.testAdmin.setAdmin(this.signers[1].address)
      expect(await this.contracts.testAdmin.admin()).to.equal(this.signers[1].address)
    })

    it('emits the SetAdmin event', async function () {
      await expect(this.contracts.testAdmin.setAdmin(this.signers[1].address))
        .to.emit(this.contracts.testAdmin, 'AdminSet')
        .withArgs(this.signers[0].address, this.signers[1].address)
    })

    it('reverts if the sender is not the current admin', async function () {
      await expect(this.contracts.testAdmin.connect(this.signers[1]).setAdmin(this.signers[1].address)).to.be.revertedWith(
        'Only admin'
      )
    })
  })
})
