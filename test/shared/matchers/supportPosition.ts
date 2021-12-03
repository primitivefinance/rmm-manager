import { BigNumber } from 'ethers'
import { PrimitiveManager } from '../../../typechain'

// Chai matchers for the positions of the PrimitiveEngine

export default function supportPosition(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod(
    'increasePositionLiquidity',
    async function (this: any, manager: PrimitiveManager, account: string, poolId: string, liquidity: BigNumber) {
      const oldPosition = await manager.balanceOf(account, poolId)
      await this._obj
      const newPosition = await manager.balanceOf(account, poolId)

      const expectedLiquidity = oldPosition.add(liquidity)

      this.assert(
        newPosition.eq(expectedLiquidity),
        `Expected ${newPosition} to be ${expectedLiquidity}`,
        `Expected ${newPosition} NOT to be ${expectedLiquidity}`,
        expectedLiquidity,
        newPosition
      )
    }
  )

  Assertion.addMethod(
    'decreasePositionLiquidity',
    async function (this: any, manager: PrimitiveManager, account: string, poolId: string, liquidity: BigNumber) {
      const oldPosition = await manager.balanceOf(account, poolId)
      await this._obj
      const newPosition = await manager.balanceOf(account, poolId)

      const expectedLiquidity = oldPosition.sub(liquidity)

      this.assert(
        newPosition.eq(expectedLiquidity),
        `Expected ${newPosition} to be ${expectedLiquidity}`,
        `Expected ${newPosition} NOT to be ${expectedLiquidity}`,
        expectedLiquidity,
        newPosition
      )
    }
  )
}
