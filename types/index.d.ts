import { Wallet } from 'ethers'
import * as ContractTypes from '../typechain'
import { Fixture } from '@ethereum-waffle/provider'
import { PrimitiveEngine, PrimitiveFactory } from '@primitivefinance/v2-core/typechain'

export interface Contracts {
  factory: PrimitiveFactory
  house: ContractTypes.PrimitiveHouse
  risky: ContractTypes.Token
  stable: ContractTypes.Token
  engine: PrimitiveEngine
}

declare module 'mocha' {
  export interface Context extends Contracts {
    deployer: Wallet
    alice: Wallet
    bob: Wallet
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>
  }
}
