import { Wallet } from 'ethers'
import * as ContractTypes from '../typechain'

export interface Functions {}

export interface Contracts {
  house: ContractTypes.PrimitiveHouse
  engine: ContractTypes.PrimitiveEngine
  factory: ContractTypes.PrimitiveFactory
  risky: ContractTypes.Token
  stable: ContractTypes.Token
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

type ContractName = 'house'
