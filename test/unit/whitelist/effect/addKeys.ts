import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils } from 'ethers'

import loadContext from '../../context'

describe('addKeys', function () {
  before(async function () {
    await loadContext(waffle.provider)
  })

  describe('when the sender is the admin', async function () {
    it('adds a new key', async function () {
      await this.contracts.whitelist.addKeys(
        [utils.solidityKeccak256(['string'], ['foo'])],
      )

      expect(await this.contracts.whitelist.isKeyValid('foo')).to.be.equal(true)
    })

    it('adds a new key', async function () {
      await this.contracts.whitelist.addKeys(
        [
          utils.solidityKeccak256(['string'], ['foo']),
          utils.solidityKeccak256(['string'], ['bar'])
        ],
      )

      expect(await this.contracts.whitelist.isKeyValid('foo')).to.be.equal(true)
      expect(await this.contracts.whitelist.isKeyValid('bar')).to.be.equal(true)
    })
  })

  describe('when the sender is not the admin', async function () {
    it('reverts the transaction', async function () {
      await expect(
        this.contracts.whitelist.connect(this.signers[1]).addKeys(
          [utils.solidityKeccak256(['string'], ['foo'])],
        )
      ).to.be.revertedWith('Only admin')
    })
  })
})
