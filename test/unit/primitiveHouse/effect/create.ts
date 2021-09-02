import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils, BytesLike, constants, BigNumber } from 'ethers'
import { parseWei } from 'web3-units'

import loadContext, { DEFAULT_CONFIG } from '../../context'
import { computePoolId, getTokenId } from '../../../shared/utilities'
import { createFragment } from '../fragments'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG

const empty: BytesLike = constants.HashZero

let poolId, housePosId : string



describe('create', function () {
  before(async function () {
    loadContext(waffle.provider, createFragment)
  })

  beforeEach(async function () {
    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)
    housePosId = utils.solidityKeccak256(['address', 'bytes32'], [this.house.address, poolId])
  })

  describe('success cases', function () {
    it('creates a curve using the house contract', async function () {
      await this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw
      )
    })

    it('updates the sender position', async function () {
      await this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw
      )

      const tokenId = getTokenId(this.engine.address, poolId, 0)
      const liquidity = await this.house.balanceOf(this.deployer.address, tokenId)
      expect(liquidity).to.equal(parseWei('1').raw.sub('1000'))
    })

    it('emits the Created event', async function () {
      await expect(this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw
      )).to.emit(this.house, 'Created').withArgs(
        this.deployer.address,
        this.engine.address,
        poolId,
        strike.raw,
        sigma.raw,
        maturity.raw
      )
    })
  })

  describe('fail cases', function () {
    it('reverts if the curve is already created', async function () {
      await this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw
      )
      await expect(this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw
      )).to.be.reverted
    })

    it('reverts if the sender has insufficient funds', async function () {
      await expect(this.house.connect(this.signers[1]).create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw
      )).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(this.house.createCallback(0, 0, empty)).to.be.revertedWith('NotEngineError()')
    })
  })
})
