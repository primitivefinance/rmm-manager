import { Wallet } from 'ethers'

export interface Functions {}

export interface Contracts {}

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
