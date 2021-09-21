import { utils } from 'ethers'
import { MockEngine__factory, PrimitiveEngine__factory } from './typechain'

const hash = utils.keccak256(MockEngine__factory.bytecode)
console.log(hash)

const hash2 = utils.keccak256(PrimitiveEngine__factory.bytecode)
console.log(hash2)
