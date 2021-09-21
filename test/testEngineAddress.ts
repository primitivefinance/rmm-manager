import { expect } from 'chai'
import { utils } from 'ethers';

import { runTest, deploy } from './unit/context'
import { computeEngineAddress } from './shared/utilities'
import { MockEngine__factory, TestEngineAddress } from '../typechain'

let testEngineAddress: TestEngineAddress

runTest('testEngineAddress', function () {
  before(async function () {
    testEngineAddress = await deploy('TestEngineAddress', this.deployer) as TestEngineAddress
  })

  it('computes the engine addresse', async function () {
    const hash = utils.keccak256(MockEngine__factory.bytecode)
    console.log(hash)

    expect(
      await testEngineAddress.computeAddress(
        this.factory.address,
        this.risky.address,
        this.stable.address
      )
    ).to.equal(
      computeEngineAddress(
        this.factory.address,
        this.risky.address,
        this.stable.address,
        MockEngine__factory.bytecode
      )
    )
  })
})
