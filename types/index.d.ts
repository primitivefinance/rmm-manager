import { Wallet, BigNumber } from 'ethers'
import * as ContractTypes from '../typechain'
import { Fixture } from '@ethereum-waffle/provider'
import { PrimitiveEngine, PrimitiveFactory } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

export interface Contracts {
  factory: PrimitiveFactory
  manager: ContractTypes.PrimitiveManager
  risky: ContractTypes.TestToken
  stable: ContractTypes.TestToken
  engine: PrimitiveEngine
  positionRenderer: ContractTypes.PositionRenderer
  positionDescriptor: ContractTypes.PositionDescriptor
  weth: ContractTypes.WETH9
}

declare module 'mocha' {
  export interface Context extends Contracts {
    deployer: Wallet | SignerWithAddress
    alice: Wallet | SignerWithAddress
    bob: Wallet | SignerWithAddress
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>
  }
}

declare global {
  export namespace Chai {
    interface Assertion {
      revertWithCustomError(errorName: string, params?: any[]): AsyncAssertion
      updateMargin(
        manager: ContractTypes.PrimitiveManager,
        account: string,
        engine: string,
        delRisky: BigNumber,
        riskyIncrease: boolean,
        delStable: BigNumber,
        stableIncrease: boolean
      ): AsyncAssertion
      increaseMargin(
        manager: ContractTypes.PrimitiveManager,
        account: string,
        engine: string,
        delRisky: BigNumber,
        delStable: BigNumber
      ): AsyncAssertion
      decreaseMargin(
        manager: ContractTypes.PrimitiveManager,
        account: string,
        engine: string,
        delRisky: BigNumber,
        delStable: BigNumber
      ): AsyncAssertion
      increasePositionLiquidity(
        manager: ContractTypes.PrimitiveManager,
        account: string,
        poolId: string,
        liquidity: BigNumber
      ): AsyncAssertion
      decreasePositionLiquidity(
        manager: ContractTypes.PrimitiveManager,
        account: string,
        poolId: string,
        liquidity: BigNumber
      ): AsyncAssertion
    }
  }
}
