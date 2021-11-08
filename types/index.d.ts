import { Wallet, BigNumber } from 'ethers'
import * as ContractTypes from '../typechain'
import { Fixture } from '@ethereum-waffle/provider'
import { PrimitiveEngine, PrimitiveFactory } from '@primitivefinance/rmm-core/typechain'

export interface Contracts {
  factory: PrimitiveFactory
  house: ContractTypes.PrimitiveHouse
  risky: ContractTypes.TestToken
  stable: ContractTypes.TestToken
  engine: PrimitiveEngine
  positionRenderer: ContractTypes.PositionRenderer
  weth: ContractTypes.WETH9
}

declare module 'mocha' {
  export interface Context extends Contracts {
    deployer: Wallet
    alice: Wallet
    bob: Wallet
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>
  }
}

declare global {
  export namespace Chai {
    interface Assertion {
      revertWithCustomError(errorName: string, params?: any[]): AsyncAssertion
      updateMargin(
        house: ContractTypes.PrimitiveHouse,
        account: string,
        engine: string,
        delRisky: BigNumber,
        riskyIncrease: boolean,
        delStable: BigNumber,
        stableIncrease: boolean
      ): AsyncAssertion
      increaseMargin(
        house: ContractTypes.PrimitiveHouse,
        account: string,
        engine: string,
        delRisky: BigNumber,
        delStable: BigNumber
      ): AsyncAssertion
      decreaseMargin(
        house: ContractTypes.PrimitiveHouse,
        account: string,
        engine: string,
        delRisky: BigNumber,
        delStable: BigNumber
      ): AsyncAssertion
      increasePositionLiquidity(
        house: ContractTypes.PrimitiveHouse,
        account: string,
        poolId: string,
        liquidity: BigNumber
      ): AsyncAssertion
      decreasePositionLiquidity(
        house: ContractTypes.PrimitiveHouse,
        account: string,
        poolId: string,
        liquidity: BigNumber
      ): AsyncAssertion
    }
  }
}
