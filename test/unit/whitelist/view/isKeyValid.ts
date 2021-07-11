import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils } from 'ethers'

import loadContext from '../../context'

describe('isKeyValid', function () {
  before(async function () {
    await loadContext(waffle.provider)
  })

  describe('when the key is valid', function () {
    beforeEach(async function () {
      await this.contracts.whitelist.addKeys([
        utils.solidityKeccak256(['string'], ['foo']),
      ])
    })

    it('returns true', async function () {
      expect(
        await this.contracts.whitelist.isKeyValid('foo')
      ).to.equal(true)
    })
  })

  describe('when the key is not valid', function () {
    it('returns false if the key is not valid', async function () {
      expect(
        await this.contracts.whitelist.isKeyValid('foo')
      ).to.equal(false)
    })

    it('returns false if the key was already used', async function () {
      await this.contracts.whitelist.addKeys([
        utils.solidityKeccak256(['string'], ['foo']),
      ])
      await this.contracts.whitelist.useKey('foo', this.signers[0].address)
      expect(
        await this.contracts.whitelist.isKeyValid('foo')
      ).to.equal(false)
    })
  })
})
