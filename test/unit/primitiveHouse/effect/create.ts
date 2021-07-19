import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils, Wallet, BytesLike, constants } from 'ethers'
import { PrimitiveEngine } from '@primitivefinance/primitive-v2-core/typechain'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'
import { createFragment } from '../fragments'
import { PrimitiveHouse, Token } from '../../../../typechain'

const { strike, sigma, maturity, spot } = config

let poolId: string
let housePosId: string
let userPosId: string
let risky: Token
let stable: Token
let engine: PrimitiveEngine
let house: PrimitiveHouse
let user: Wallet
let empty: BytesLike = constants.HashZero

describe('create', function () {
  before(async function () {
    await loadContext(waffle.provider, createFragment)
  })

  beforeEach(async function () {
    ;({ risky, stable, engine, house } = this.contracts)
    ;[user] = this.signers
    poolId = await engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    housePosId = utils.solidityKeccak256(['address', 'bytes32'], [house.address, poolId])
    userPosId = utils.solidityKeccak256(['address', 'bytes32'], [this.signers[0].address, poolId])
  })

  describe('success cases', function () {
    it('creates a curve using the house contract', async function () {
      await this.contracts.house.create(
        risky.address,
        stable.address,
        parseWei('1').raw,
        strike.raw,
        sigma.raw,
        maturity.raw,
        spot.raw
      )
    })

    it('updates the sender position', async function () {
      await this.contracts.house.create(
        risky.address,
        stable.address,
        parseWei('1').raw,
        strike.raw,
        sigma.raw,
        maturity.raw,
        spot.raw
      )
      const enginePosition = await this.contracts.engine.positions(housePosId)
      const ownerPosition = await this.contracts.house.positions(engine.address, userPosId)

      expect(enginePosition.liquidity).to.equal(ownerPosition.liquidity)
    })

    it('emits the Created event', async function () {
      // TODO: Checks the arguments
      await expect(
        this.contracts.house.create(
          risky.address,
          stable.address,
          parseWei('1').raw,
          strike.raw,
          sigma.raw,
          maturity.raw,
          spot.raw
        )
      ).to.emit(this.contracts.house, 'Created')
    })
  })

  describe('fail cases', function () {
    it('reverts if the curve is already created', async function () {
      await this.contracts.house.create(
        risky.address,
        stable.address,
        parseWei('1').raw,
        strike.raw,
        sigma.raw,
        maturity.raw,
        spot.raw
      )
      await expect(
        this.contracts.house.create(
          risky.address,
          stable.address,
          parseWei('1').raw,
          strike.raw,
          sigma.raw,
          maturity.raw,
          spot.raw
        )
      ).to.be.revertedWith('Initialized')
    })

    it('reverts if the sender has insufficient funds', async function () {
      await expect(
        this.contracts.house
          .connect(this.signers[1])
          .create(risky.address, stable.address, parseWei('1').raw, strike.raw, sigma.raw, maturity.raw, spot.raw)
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(house.createCallback(0, 0, empty)).to.be.revertedWith('Not engine')
    })
  })
})
