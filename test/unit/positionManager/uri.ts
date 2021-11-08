import { ethers } from 'hardhat'
import { utils, constants, BigNumber } from 'ethers'
import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../context'
import { computePoolId } from '../../shared/utilities'
import expect from '../../shared/expect'
import { runTest } from '../context'

const { strike, sigma, maturity, delta, gamma } = DEFAULT_CONFIG
let poolId: string
let reserveRisky: BigNumber, reserveStable: BigNumber, liquidity: BigNumber
const delLiquidity = parseWei('10')
let lastTimestamp: string

type Metadata = {
  name: string
  image: string
  license: string
  creator: string
  description: string
  properties: {
    risky: string
    stable: string
    invariant: string
    calibration: {
      strike: string
      sigma: string
      maturity: string
      lastTimestamp: string
      gamma: string
    }
    reserve: {
      reserveRisky: string
      reserveStable: string
      liquidity: string
      blockTimestamp: string
      cumulativeRisky: string
      cumulativeStable: string
      cumulativeLiquidity: string
    }
  }
}

runTest('uri', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)

    const tx = await this.house.create(
      this.risky.address,
      this.stable.address,
      strike.raw,
      sigma.raw,
      maturity.raw,
      gamma.raw,
      parseWei(1).sub(parseWei(delta)).raw,
      delLiquidity.raw
    )

    const receipt = await tx.wait()
    const block = await ethers.provider.getBlock(receipt.blockNumber)
    lastTimestamp = block.timestamp.toString()

    poolId = computePoolId(this.engine.address, maturity.raw, sigma.raw, strike.raw, gamma.raw)

    const res = await this.engine.reserves(poolId)
    reserveRisky = res.reserveRisky
    reserveStable = res.reserveStable
    liquidity = res.liquidity
  })

  describe('success cases', function () {
    it('returns the URI', async function () {
      const uri = await this.house.uri(poolId)
      const metadata: Metadata = JSON.parse(uri.substr(27, uri.length))
      console.log(metadata)

      expect(metadata.name).to.be.equal('Name goes here')
      expect(metadata.image).to.be.equal('data:image/svg+xml;utf8,')
      expect(metadata.license).to.be.equal('License goes here')
      expect(metadata.creator).to.be.equal('creator goes here')
      expect(metadata.description).to.be.equal('Description goes here')
      expect(utils.getAddress(metadata.properties.risky)).to.be.equal(this.risky.address)
      expect(utils.getAddress(metadata.properties.stable)).to.be.equal(this.stable.address)
      expect(metadata.properties.invariant).to.be.equal('0')
      expect(metadata.properties.calibration.strike).to.be.equal(strike.raw.toString())
      expect(metadata.properties.calibration.sigma).to.be.equal(sigma.raw.toString())
      expect(metadata.properties.calibration.maturity).to.be.equal(maturity.raw.toString())
      expect(metadata.properties.calibration.lastTimestamp).to.be.equal(lastTimestamp)
      expect(metadata.properties.calibration.gamma).to.be.equal(gamma.raw.toString())
      expect(metadata.properties.reserve.reserveRisky).to.be.equal(reserveRisky.toString())
      expect(metadata.properties.reserve.reserveStable).to.be.equal(reserveStable.toString())
      expect(metadata.properties.reserve.liquidity).to.be.equal(liquidity.toString())
      expect(metadata.properties.reserve.blockTimestamp).to.be.equal(lastTimestamp)
      expect(metadata.properties.reserve.cumulativeRisky).to.be.equal('0')
      expect(metadata.properties.reserve.cumulativeStable).to.be.equal('0')
      expect(metadata.properties.reserve.cumulativeLiquidity).to.be.equal('0')
    })
  })
})
