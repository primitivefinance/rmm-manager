import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import { DEFAULT_CONFIG } from '../../context'
import { computePoolId } from '../../../shared/utilities'
import expect from '../../../shared/expect'
import { runTest } from '../../context'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG
const delLiquidity = parseWei('1')
let poolId: string

runTest('create', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)
  })

  describe('success cases', function () {
    it('creates a new pool using the house contract', async function () {
      await this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(1).sub(parseWei(delta)).raw,
        delLiquidity.raw,
      )
    })

    it('updates the sender position', async function () {
      await this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(1).sub(parseWei(delta)).raw,
        delLiquidity.raw,
      )

      const liquidity = await this.house.balanceOf(this.deployer.address, poolId)
      expect(liquidity).to.equal(parseWei('1').raw.sub('1000'))
    })

    it('emits the Created event', async function () {
      await expect(this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(1).sub(parseWei(delta)).raw,
        delLiquidity.raw,
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
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(1).sub(parseWei(delta)).raw,
        delLiquidity.raw,
      )
      await expect(this.house.create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(1).sub(parseWei(delta)).raw,
        delLiquidity.raw,
      )).to.be.reverted
    })

    it('reverts if the sender has insufficient funds', async function () {
      await expect(this.house.connect(this.alice).create(
        this.risky.address,
        this.stable.address,
        strike.raw,
        sigma.raw,
        maturity.raw,
        parseWei(1).sub(parseWei(delta)).raw,
        delLiquidity.raw,
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
