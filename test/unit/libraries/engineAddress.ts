import { expect } from 'chai'

import { runTest, deploy } from '../context'
import { computeEngineAddress } from '../../shared/utilities'
import { TestEngineAddress } from '../../../typechain'
import { bytecode as EngineBytecode } from '@primitivefi/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

runTest('EngineAddress', function () {
  it('computes the engine addresse', async function () {
    const testEngineAddress = (await deploy('TestEngineAddress', this.deployer)) as TestEngineAddress

    expect(await testEngineAddress.computeAddress(this.factory.address, this.risky.address, this.stable.address)).to.equal(
      computeEngineAddress(this.factory.address, this.risky.address, this.stable.address, EngineBytecode)
    )
  })
})
