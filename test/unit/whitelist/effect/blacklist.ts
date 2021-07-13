import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils } from 'ethers'

import loadContext from '../../context'

describe('blacklist', function () {
  before(async function () {
    await loadContext(waffle.provider)
  })

  describe('when the sender is the admin', function () {
    beforeEach(async function () {
      await this.contracts.whitelist.addKeys([utils.solidityKeccak256(['string'], ['foo'])])

      await this.contracts.whitelist.useKey('foo', this.signers[0].address)
    })

    it('blacklists the user', async function () {
      await this.contracts.whitelist.blacklist(this.signers[0].address)
      expect(await this.contracts.whitelist.isWhitelisted(this.signers[0].address)).to.equal(false)
    })

    it('emits the Blacklisted event', async function () {
      await expect(this.contracts.whitelist.blacklist(this.signers[0].address))
        .to.emit(this.contracts.whitelist, 'Blacklisted')
        .withArgs(this.signers[0].address)
    })
  })

  describe('when the sender is not the admin', function () {
    beforeEach(async function () {
      await this.contracts.whitelist.addKeys([utils.solidityKeccak256(['string'], ['foo'])])

      await this.contracts.whitelist.useKey('foo', this.signers[0].address)
    })

    it('reverts the transaction', async function () {
      await expect(this.contracts.whitelist.connect(this.signers[1]).blacklist(this.signers[0].address)).to.be.revertedWith(
        'Only admin'
      )
    })
  })
})
