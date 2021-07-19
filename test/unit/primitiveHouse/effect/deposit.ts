import { waffle } from 'hardhat'
import { expect } from 'chai'
import { BytesLike, constants } from 'ethers'

import { parseWei } from '../../../shared/Units'
import loadContext from '../../context'

import { depositFragment } from '../fragments'

const empty: BytesLike = constants.HashZero

describe('deposit', function () {
  before(async function () {
    await loadContext(waffle.provider, depositFragment)
  })

  describe('success cases', function () {
    it('deposits risky and stable to margin', async function () {
      await this.contracts.house.deposit(
        this.signers[0].address,
        this.contracts.risky.address,
        this.contracts.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )
    })

    it('increases the margin', async function () {
      await this.contracts.house.deposit(
        this.signers[0].address,
        this.contracts.risky.address,
        this.contracts.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      const margin = await this.contracts.house.margins(this.contracts.engine.address, this.signers[0].address)

      expect(margin.balanceRisky).to.equal(parseWei('1000').raw)
      expect(margin.balanceStable).to.equal(parseWei('1000').raw)
    })

    it('emits the Deposited event', async function () {
      await expect(
        this.contracts.house.deposit(
          this.signers[0].address,
          this.contracts.risky.address,
          this.contracts.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      )
        .to.emit(this.contracts.house, 'Deposited')
        .withArgs(this.signers[0].address, this.contracts.engine.address, parseWei('1000').raw, parseWei('1000').raw)
    })
  })

  describe('fail cases', function () {
    it('reverts if the owner does not have enough tokens', async function () {
      await expect(
        this.contracts.house
          .connect(this.signers[1])
          .deposit(
            this.signers[0].address,
            this.contracts.risky.address,
            this.contracts.stable.address,
            parseWei('1000').raw,
            parseWei('1000').raw
          )
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(this.contracts.house.depositCallback(0, 0, empty)).to.be.revertedWith('Not engine')
    })
  })
})
