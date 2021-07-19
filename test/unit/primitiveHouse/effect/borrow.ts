import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils, BytesLike, constants } from 'ethers'

import { parseWei } from '../../../shared/Units'
import loadContext, { config } from '../../context'

import { borrowFragment } from '../fragments'

const { strike, sigma, maturity } = config
let poolId, userPosId: string

const empty: BytesLike = constants.HashZero

describe('borrow', function () {
  before(async function () {
    await loadContext(waffle.provider, borrowFragment)
  })

  beforeEach(async function () {
    poolId = await this.engine.getPoolId(strike.raw, sigma.raw, maturity.raw)
    userPosId = utils.solidityKeccak256(['address', 'bytes32'], [this.deployer.address, poolId])
  })

  describe('success cases', function () {
    it('originates one long option', async function () {
      await this.house.borrow(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
        constants.MaxUint256
      )
    })

    it('increases the position of the sender', async function () {
      await this.house.borrow(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
        constants.MaxUint256
      )
      const newPosition = await this.house.positions(this.engine.address, userPosId)
      expect(newPosition.debt).to.equal(parseWei('1').raw)
    })

    it('transfers the premium, risky and stable', async function () {
      const reserve = await this.engine.reserves(poolId)
      const delRisky = parseWei('1').mul(reserve.reserveRisky).div(reserve.liquidity)
      const delStable = parseWei('1').mul(reserve.reserveStable).div(reserve.liquidity)
      const premium = parseWei('1').sub(delRisky.raw)

      const engineRiskyBalance = await this.risky.balanceOf(this.engine.address)
      const engineStableBalance = await this.stable.balanceOf(this.engine.address)

      const payerRiskyBalance = await this.risky.balanceOf(this.deployer.address)
      const payerStableBalance = await this.stable.balanceOf(this.deployer.address)

      await this.house.borrow(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        poolId,
        parseWei('1').raw,
        constants.MaxUint256
      )

      expect(await this.risky.balanceOf(this.engine.address)).to.equal(engineRiskyBalance.add(premium.raw))

      expect(await this.stable.balanceOf(this.engine.address)).to.equal(engineStableBalance.sub(delStable.raw))

      expect(await this.risky.balanceOf(this.deployer.address)).to.equal(payerRiskyBalance.sub(premium.raw))

      expect(await this.stable.balanceOf(this.deployer.address)).to.equal(payerStableBalance.add(delStable.raw))
    })

    it('emits the Borrowed event', async function () {
      await expect(
        await this.house.borrow(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('1').raw,
          constants.MaxUint256
        )
      ).to.emit(this.house, 'Borrowed')
    })
  })

  describe('fail cases', function () {
    it('fails to borrow more than there is liquidity on the curve', async function () {
      await expect(
        this.house.borrow(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          poolId,
          parseWei('100000').raw,
          constants.MaxUint256
        )
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      await expect(this.house.borrowCallback(parseWei('10').raw, 0, 0, empty)).to.be.revertedWith('Not engine')
    })
  })
})
