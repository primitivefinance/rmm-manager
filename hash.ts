import { utils } from 'ethers'
import { bytecode} from '@primitivefinance/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

const hash = utils.keccak256(bytecode)
console.log(hash)
