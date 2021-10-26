import { utils, constants } from 'ethers'
import { parseWei, Wei } from 'web3-units'

import { DEFAULT_CONFIG } from '../context'
import { computePoolId } from '../../shared/utilities'
import expect from '../../shared/expect'
import { runTest } from '../context'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG
let poolId: string
let delRisky: Wei, delStable: Wei
const delLiquidity = parseWei('10')

type Metadata = {
  name: string;
  image: string;
  license: string;
  creator: string;
  description: string;
  properties: {
    risky: string;
    stable: string;
    invariant: string;
    strike: string;
    sigma: string;
    maturity: string;
    lastTimestamp: string;
    creationTimestamp: string;
    reserveRisky: string;
    reserveStable: string;
    liquidity: string;
    blockTimestamp: string;
    cumulativeRisky: string;
    cumulativeStable: string;
    cumulativeLiquidity: string;
  }
}

runTest('uri', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)

    await this.house.create(
      this.risky.address,
      this.stable.address,
      strike.raw,
      sigma.raw,
      maturity.raw,
      parseWei(1).sub(parseWei(delta)).raw,
      delLiquidity.raw
    )

    poolId = computePoolId(this.engine.address, strike.raw, sigma.raw, maturity.raw)

    const res = await this.engine.reserves(poolId)
    delRisky = delLiquidity.mul(res.reserveRisky).div(res.liquidity)
    delStable = delLiquidity.mul(res.reserveStable).div(res.liquidity)
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
      expect(utils.getAddress(metadata.properties.risky))
        .to.be.equal(this.risky.address)
      expect(utils.getAddress(metadata.properties.stable))
        .to.be.equal(this.stable.address)
    })
  })
})
