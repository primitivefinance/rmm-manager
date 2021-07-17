import { Wallet } from 'ethers'
import {
  PrimitiveEngine,
  PrimitiveFactory
} from '@primitivefinance/primitive-v2-core/typechain'
import * as ContractTypes from '../typechain'

export interface Functions {}

export interface Contracts {
  engine: PrimitiveEngine
  factory: PrimitiveFactory
  house: ContractTypes.PrimitiveHouse
  risky: ContractTypes.Token
  stable: ContractTypes.Token
  testAdmin: ContractTypes.TestAdmin
  whitelist: ContractTypes.Whitelist
  // paleoHouseFactory: ContractTypes.PrimitivePaleoHouseFactory
  // paleoHouse: ContractTypes.PrimitivePaleoHouse
}

export interface Mocks {}

declare module 'mocha' {
  export interface Context {
    signers: Wallet[]
    contracts: Contracts
    functions: Functions
    mocks: Mocks
  }
}
