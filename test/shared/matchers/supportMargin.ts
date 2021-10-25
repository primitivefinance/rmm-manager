import { BigNumber } from 'ethers'
import { PrimitiveHouse } from '../../../typechain'

// Chai matchers for the margins of the PrimitiveEngine

export default function supportMargin(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod(
    'updateMargin',
    async function (
      this: any,
      house: PrimitiveHouse,
      account: string,
      engine: string,
      delRisky: BigNumber,
      delStable: BigNumber
    ) {
      const oldMargin = await house.margins(account, engine)
      await this._obj
      const newMargin = await house.margins(account, engine)

      const expectedRisky = oldMargin.balanceRisky.add(delRisky)
      const expectedStable = oldMargin.balanceStable.add(delStable)

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
