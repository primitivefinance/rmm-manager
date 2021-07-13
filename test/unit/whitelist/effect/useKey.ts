import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils } from 'ethers'

import loadContext from '../../context'

describe('useKey', function () {
  before(async function () {
    await loadContext(waffle.provider)
  })

  describe('when the key is valid', function () {
    beforeEach(async function () {
      await this.contracts.whitelist.addKeys([
        utils.solidityKeccak256(['string'], ['foo']),
        utils.solidityKeccak256(['string'], ['bar']),
      ])
    })

    it('whitelists the sender', async function () {
      await this.contracts.whitelist.useKey('foo', this.signers[0].address)
      expect(await this.contracts.whitelist.isWhitelisted(this.signers[0].address)).to.equal(true)
    })

    it('whitelists a specific user', async function () {
      await this.contracts.whitelist.useKey('foo', this.signers[1].address)
      expect(await this.contracts.whitelist.isWhitelisted(this.signers[1].address)).to.equal(true)
    })

    it('emits the Whitelisted event', async function () {
      await expect(this.contracts.whitelist.useKey('foo', this.signers[1].address))
        .to.emit(this.contracts.whitelist, 'Whitelisted')
        .withArgs(this.signers[1].address)
    })

    it('reverts if the user is already whitelisted', async function () {
      await this.contracts.whitelist.useKey('foo', this.signers[0].address)
      await expect(this.contracts.whitelist.useKey('bar', this.signers[0].address)).to.be.revertedWith('Already whitelisted')
    })
  })

  describe('when the key is invalid', function () {
    it('reverts if the key is used twice', async function () {
      await this.contracts.whitelist.addKeys([utils.solidityKeccak256(['string'], ['foo'])])

      await this.contracts.whitelist.useKey('foo', this.signers[0].address)
      await expect(this.contracts.whitelist.useKey('foo', this.signers[1].address)).to.be.revertedWith('Invalid key')
    })
  })
})
