import { utils } from 'ethers'
import { bytecode as EngineBytecode } from '@primitivefinance/v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

const hash = utils.keccak256(EngineBytecode)
console.log(hash)
