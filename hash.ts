import { utils } from 'ethers'
import { bytecode } from '@primitivefi/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

const hash = utils.keccak256(bytecode)
console.log(hash)
