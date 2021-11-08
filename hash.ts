import { utils } from 'ethers'
import { bytecode as EngineBytecode } from '@primitivefinance/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

const hash = utils.keccak256(EngineBytecode)
console.log(hash)
