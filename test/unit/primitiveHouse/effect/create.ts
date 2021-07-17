import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils } from 'ethers'

import loadContext, { config } from '../../context'

import { createFragment } from '../fragments'

const { strike, sigma, maturity, spot } = config

let poolId: string
let posId: string

describe('create', function () {
  before(async function () {
    await loadContext(waffle.provider, createFragment)
  })

  beforeEach(async function () {
    poolId = await this.contracts.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    posId = utils.solidityKeccak256(['address', 'bytes32'], [this.contracts.house.address, poolId])
  })

  describe('when the parameters are valid', function () {
    it('creates a curve using the house contract', async function () {
      await this.contracts.house.create(this.contracts.engine.address, strike.raw, sigma.raw, maturity.raw, spot.raw)
    })

    it('updates the sender position', async function () {
      await this.contracts.house.create(this.contracts.engine.address, strike.raw, sigma.raw, maturity.raw, spot.raw)
      const enginePosition = await this.contracts.engine.positions(posId)
      const ownerPosition = await this.contracts.house.positionOf(this.signers[0].address, this.contracts.engine.address, poolId)

      expect(enginePosition.liquidity).to.equal(ownerPosition.liquidity)
    })

    it('emits the Created event', async function () {
      // TODO: Checks the arguments
      await expect(
        this.contracts.house.create(this.contracts.engine.address, strike.raw, sigma.raw, maturity.raw, spot.raw)
      ).to.emit(
        this.contracts.house,
        'Created'
      )
    })
  })

  describe('when the parameters are not valid', function () {
    it('reverts if the curve is already created', async function () {
      await this.contracts.house.create(this.contracts.engine.address, strike.raw, sigma.raw, maturity.raw, spot.raw)
      await expect(
        this.contracts.house.create(this.contracts.engine.address, strike.raw, sigma.raw, maturity.raw, spot.raw)
      ).to.be.revertedWith('Initialized')
    })

    it('reverts if the sender has insufficient funds', async function () {
      await expect(
        this.contracts.house.connect(this.signers[1]).create(this.contracts.engine.address, strike.raw, sigma.raw, maturity.raw, spot.raw)
      ).to.be.reverted
    })
  })
})
