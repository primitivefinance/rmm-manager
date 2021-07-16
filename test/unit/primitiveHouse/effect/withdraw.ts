import { waffle } from 'hardhat'
import { expect } from 'chai'

import { BytesLike, constants, parseWei } from '../../../shared/Units'
import loadContext from '../../context'

import { withdrawFragment } from '../fragments'

const empty: BytesLike = constants.HashZero

describe('withdraw', function () {
  before(async function () {
    await loadContext(waffle.provider, withdrawFragment)
  })

  describe('when the parameters are valid', function () {
    it('withdraws 1000 risky and 1000 stable from margin', async function () {
      await this.contracts.house.withdraw(parseWei('1000').raw, parseWei('1000').raw)
    })

    it('emits the Withdrawn event', async function () {
      await expect(
        this.contracts.house.withdraw(parseWei('1000').raw, parseWei('1000').raw)
      ).to.emit(this.contracts.house, 'Withdrawn').withArgs(
        this.signers[0].address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )
    })
  })

  describe('when the parameters are not valid', function () {
    it('fails on attempt to withdraw more than margin balance', async function () {
      await expect(this.contracts.house.withdraw(parseWei('100001').raw, parseWei('100001').raw)).to.be.reverted
    })
  })
})
