import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import { DEFAULT_CONFIG } from '../../context'
import { computePoolId } from '../../../shared/utilities'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG

let poolId: string

import expect from '../../../shared/expect'
import { runTest } from '../../context'

runTest('create', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)
  })

  describe('success cases', function () {
    it('creates a curve using the house contract', async function () {
      await this.house.create(
        this.engine.address,
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw,
        false,
      )
    })

    it('updates the sender position', async function () {
      await this.house.create(
        this.engine.address,
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw,
        false,
      )

      const liquidity = await this.house.liquidityOf(this.deployer.address, poolId)
      expect(liquidity).to.equal(parseWei('1').raw.sub('1000'))
    })

    it('emits the Created event', async function () {
      await expect(this.house.create(
        this.engine.address,
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw,
        false,
      )).to.emit(this.house, 'Create').withArgs(
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
        this.engine.address,
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw,
        false,
      )
      await expect(this.house.create(
        this.engine.address,
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw,
        false,
      )).to.be.reverted
    })

    it('reverts if the sender has insufficient funds', async function () {
      await expect(this.house.connect(this.alice).create(
        this.engine.address,
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(delta).raw,
        parseWei(1).raw,
        false,
      )).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      const data = utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'uint256'],
        [this.house.address, this.risky.address, this.stable.address, '0', '0']
      );

      await expect(this.house.createCallback(0, 0, data)).to.be.revertedWith('NotEngineError()')
    })
  })
})
