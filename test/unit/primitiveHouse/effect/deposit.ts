import { waffle } from 'hardhat'
import { expect } from 'chai'
import { BytesLike, constants } from 'ethers'
import { parseWei } from 'web3-units'

import loadContext from '../../context'

import { depositFragment } from '../fragments'

const empty: BytesLike = constants.HashZero

describe('deposit', function () {
  before(async function () {
    loadContext(waffle.provider, depositFragment)
  })

  describe('success cases', function () {
    it('deposits risky and stable to margin', async function () {
      await this.house.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )
    })

    it('increases the margin', async function () {
      await this.house.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      const margin = await this.house.margins(this.engine.address, this.deployer.address)
      expect(margin.balanceRisky).to.equal(parseWei('1000').raw)
      expect(margin.balanceStable).to.equal(parseWei('1000').raw)
    })

    it('emits the Deposited event', async function () {
      await expect(
        this.house.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      )
        .to.emit(this.house, 'Deposited')
        .withArgs(
          this.deployer.address,
          this.deployer.address,
          this.engine.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
    })
  })

  describe('fail cases', function () {
    it('reverts if the owner does not have enough tokens', async function () {
      // TODO: Update to custom error
      await expect(
        this.house
          .connect(this.bob)
          .deposit(
            this.deployer.address,
            this.risky.address,
            this.stable.address,
            parseWei('1000').raw,
            parseWei('1000').raw
          )
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      // TODO: Update to custom error
      await expect(this.house.depositCallback(0, 0, empty)).to.be.revertedWith('NotEngineError()')
    })
  })
})
