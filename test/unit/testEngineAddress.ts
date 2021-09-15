import { waffle } from 'hardhat'
import { expect } from 'chai'
import { utils } from 'ethers';

import loadContext from './context'
import { computeEngineAddress } from '../shared/utilities'

import PrimitiveEngine from '@primitivefinance/v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json';

describe('testEngineAddress', function () {
  before(async function () {
    loadContext(waffle.provider)
  })

  describe('success cases', function () {
    it('computes the engine addresse', async function () {
      const hash = utils.keccak256(PrimitiveEngine.bytecode)
      console.log(hash)

      expect(
        await this.testEngineAddress.computeAddress(
          this.factory.address,
          this.risky.address,
          this.stable.address
        )
      ).to.equal(
        computeEngineAddress(
          this.factory.address,
          this.risky.address,
          this.stable.address,
          PrimitiveEngine.bytecode,
        )
      )
    })
  })
})
