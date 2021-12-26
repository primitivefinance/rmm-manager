import { ethers } from 'hardhat'
import { utils, constants, BigNumber } from 'ethers'
import { parseWei } from 'web3-units'
import { Base64 } from 'js-base64'

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
    factory: string
    riskyName: string
    riskyAddress: string
    riskName: string
    riskySymbol: string
    riskyDecimals: number
    stableAddress: string
    stableName: string
    stableSymbol: string
    stableDecimals: number
    invariant: string
    strike: string
    sigma: string
    maturity: string
    lastTimestamp: string
    gamma: string
    reserveRisky: string
    reserveStable: string
    liquidity: string
    blockTimestamp: string
    cumulativeRisky: string
    cumulativeStable: string
    cumulativeLiquidity: string
  }
}

runTest('uri', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.manager.address, constants.MaxUint256)
    await this.stable.approve(this.manager.address, constants.MaxUint256)

    const tx = await this.manager.create(
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
      const uri = await this.manager.uri(poolId)
      const [metadataFormat, encodedMetadata] = uri.split(',')
      expect(metadataFormat).to.be.equal('data:application/json;base64')
      const metadata: Metadata = JSON.parse(Base64.decode(encodedMetadata))
      console.log(Base64.decode(encodedMetadata));

      const riskyName = await this.risky.name()
      const stableName = await this.stable.name()
      expect(metadata.name).to.be.equal(`Primitive RMM-01 LP ${riskyName}-${stableName}`)

      const [imageFormat, encodedImage] = metadata.image.split(',')
      expect(imageFormat).to.be.equal('data:image/svg+xml;base64')
      expect(Base64.decode(encodedImage)).to.be.equal(
        '<svg width="512" height="512" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M0 0h512v512H0z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M339.976 134.664h41.048L256 340.586 130.976 134.664h41.047V98H64.143L256 414 447.857 98H339.976v36.664Zm-38.759 0V98h-90.436v36.664h90.436Z" fill="#fff"/></svg>'
      )

      expect(metadata.license).to.be.equal('MIT')
      expect(metadata.creator).to.be.equal('primitive.eth')
      expect(metadata.description).to.be.equal('Concentrated liquidity tokens of a two-token AMM')

      expect(utils.getAddress(metadata.properties.factory)).to.be.equal(this.factory.address)

      expect(utils.getAddress(metadata.properties.riskyAddress)).to.be.equal(this.risky.address)
      expect(metadata.properties.riskyName).to.be.equal(await this.risky.name())
      expect(metadata.properties.riskySymbol).to.be.equal(await this.risky.symbol())
      expect(metadata.properties.riskyDecimals).to.be.equal((await this.risky.decimals()).toString())

      expect(utils.getAddress(metadata.properties.stableAddress)).to.be.equal(this.stable.address)
      expect(metadata.properties.stableName).to.be.equal(await this.stable.name())
      expect(metadata.properties.stableSymbol).to.be.equal(await this.stable.symbol())
      expect(metadata.properties.stableDecimals).to.be.equal((await this.stable.decimals()).toString())

      expect(metadata.properties.invariant).to.be.equal('0')
      expect(metadata.properties.strike).to.be.equal(strike.raw.toString())
      expect(metadata.properties.sigma).to.be.equal(sigma.raw.toString())
      expect(metadata.properties.maturity).to.be.equal(maturity.raw.toString())
      expect(metadata.properties.lastTimestamp).to.be.equal(lastTimestamp)
      expect(metadata.properties.gamma).to.be.equal(gamma.raw.toString())
      expect(metadata.properties.reserveRisky).to.be.equal(reserveRisky.toString())
      expect(metadata.properties.reserveStable).to.be.equal(reserveStable.toString())
      expect(metadata.properties.liquidity).to.be.equal(liquidity.toString())
      expect(metadata.properties.blockTimestamp).to.be.equal(lastTimestamp)
      expect(metadata.properties.cumulativeRisky).to.be.equal('0')
      expect(metadata.properties.cumulativeStable).to.be.equal('0')
      expect(metadata.properties.cumulativeLiquidity).to.be.equal('0')
    })
  })
})
