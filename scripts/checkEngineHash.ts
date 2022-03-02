import hre from 'hardhat'
import { utils } from 'ethers'
import { bytecode } from '@primitivefi/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json';

async function main() {
  const hash = utils.keccak256(bytecode)

  const TestHash = await hre.ethers.getContractFactory('TestHash');
  const testHash = await TestHash.deploy();

  const savedHash = await testHash.getEngineCodeHash();

  if (savedHash === hash) {
    console.log('✅ Engine bytecode hash is correct!');
  } else {
    console.log('❌ Engine bytecode hash is incorrect!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
