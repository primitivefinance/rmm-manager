import { Wallet } from 'ethers'
import * as ContractTypes from '../typechain'
import { Fixture } from '@ethereum-waffle/provider'

export interface Contracts {
  factory: ContractTypes.MockFactory
  house: ContractTypes.PrimitiveHouse
  risky: ContractTypes.Token
  stable: ContractTypes.Token
  engine: ContractTypes.MockEngine
}

declare module 'mocha' {
  export interface Context extends Contracts {
    deployer: Wallet
    alice: Wallet
    bob: Wallet
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>
  }
}
