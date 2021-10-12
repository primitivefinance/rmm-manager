import { expect } from 'chai'

import { runTest, deploy } from './context'
import { computeEngineAddress } from '../shared/utilities'
import { TestEngineAddress, PrimitiveEngine__factory } from '../../typechain'

runTest('testEngineAddress', function () {
  it('computes the engine addresse', async function () {
    const testEngineAddress = (await deploy('TestEngineAddress', this.deployer)) as TestEngineAddress

    expect(await testEngineAddress.computeAddress(this.factory.address, this.risky.address, this.stable.address)).to.equal(
      computeEngineAddress(this.factory.address, this.risky.address, this.stable.address, PrimitiveEngine__factory.bytecode)
    )
  })
})
