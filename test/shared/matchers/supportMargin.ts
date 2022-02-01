import { BigNumber } from 'ethers'
import { PrimitiveManager } from '../../../typechain/PrimitiveManager'

// Chai matchers for the margins of the PrimitiveEngine

export default function supportMargin(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod(
    'updateMargin',
    async function (
      this: any,
      manager: PrimitiveManager,
      account: string,
      engine: string,
      delRisky: BigNumber,
      riskyIncrease: boolean,
      delStable: BigNumber,
      stableIncrease: boolean
    ) {
      const oldMargin = await manager.margins(account, engine)
      await this._obj
      const newMargin = await manager.margins(account, engine)

      const expectedRisky = riskyIncrease ? oldMargin.balanceRisky.add(delRisky) : oldMargin.balanceRisky.sub(delRisky)
      const expectedStable = stableIncrease ? oldMargin.balanceStable.add(delStable) : oldMargin.balanceStable.sub(delStable)

      this.assert(
        newMargin.balanceRisky.eq(expectedRisky),
        `Expected ${newMargin.balanceRisky} to be ${expectedRisky} risky`,
        `Expected ${newMargin.balanceRisky} NOT to be ${expectedRisky} risky`,
        expectedRisky,
        newMargin.balanceRisky
      )

      this.assert(
        newMargin.balanceStable.eq(expectedStable),
        `Expected ${newMargin.balanceStable} to be ${expectedStable} stable`,
        `Expected ${newMargin.balanceStable} NOT to be ${expectedStable} stable`,
        expectedStable,
        newMargin.balanceStable
      )
    }
  )
}
