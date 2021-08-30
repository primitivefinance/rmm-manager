import { Wallet } from 'ethers'
import { PrimitiveEngine, PrimitiveFactory } from '@primitivefinance/v2-core/typechain'
import * as ContractTypes from '../typechain'

export interface Contracts {
  engine: PrimitiveEngine
  factory: PrimitiveFactory
  house: ContractTypes.PrimitiveHouse
  risky: ContractTypes.Token
  stable: ContractTypes.Token
  // testAdmin: ContractTypes.TestAdmin
  // whitelist: ContractTypes.Whitelist
  // paleoHouse: ContractTypes.PrimitivePaleoHouse
}

declare module 'mocha' {
  export interface Context extends Contracts {
    deployer: Wallet
    bob: Wallet
    signers: Wallet[]
  }
}
