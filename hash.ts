import { utils } from 'ethers'
import { PrimitiveEngine__factory } from './typechain'
import { bytecode as EngineBytecode } from '@primitivefinance/v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

const hash2 = utils.keccak256(PrimitiveEngine__factory.bytecode)
console.log(hash2)

const hash3 = utils.keccak256(EngineBytecode)
console.log(hash3)
