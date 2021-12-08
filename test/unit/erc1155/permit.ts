import expect from '../../shared/expect'
import { runTest, deploy } from '../context'

import { TestPermit } from '../../../typechain'
import { getERC1155PermitSignature } from '../../shared/permit'

let testPermit: TestPermit

runTest('permit', function () {
  beforeEach(async function () {
    testPermit = (await deploy('TestPermit', this.deployer, [])) as TestPermit
  })

  describe('success cases', function () {
    it('permits using a correct signature', async function () {
      const signature = await getERC1155PermitSignature(
        this.deployer,
        this.manager.address,
        testPermit.address,
        true,
        9999999999999,
        {
          nonce: 0,
          name: 'PrimitiveManager',
          version: '1',
          chainId: await this.deployer.getChainId(),
        }
      )

      await testPermit.testPermit(
        this.manager.address,
        this.deployer.address,
        testPermit.address,
        true,
        9999999999999,
        signature.v,
        signature.r,
        signature.s
      )

      expect(await this.manager.isApprovedForAll(this.deployer.address, testPermit.address)).to.be.equal(true)
    })

    it('increases the nonce when the permit was successful', async function () {
      const signature = await getERC1155PermitSignature(
        this.deployer,
        this.manager.address,
        testPermit.address,
        true,
        9999999999999,
        {
          nonce: 0,
          name: 'PrimitiveManager',
          version: '1',
          chainId: await this.deployer.getChainId(),
        }
      )

      await testPermit.testPermit(
        this.manager.address,
        this.deployer.address,
        testPermit.address,
        true,
        9999999999999,
        signature.v,
        signature.r,
        signature.s
      )

      expect(await this.manager.nonces(this.deployer.address)).to.be.equal(1)
    })
  })

  describe('fail cases', function () {
    it('does not permit if the signature is invalid', async function () {
      const signature = await getERC1155PermitSignature(
        this.deployer,
        this.manager.address,
        testPermit.address,
        true,
        9999999999999,
        {
          nonce: 0,
          name: 'PrimitiveManager',
          version: '1',
          chainId: await this.deployer.getChainId(),
        }
      )

      await expect(
        testPermit.testPermit(
          this.manager.address,
          this.alice.address,
          testPermit.address,
          true,
          9999999999999,
          signature.v,
          signature.r,
          signature.s
        )
      ).to.revertWithCustomError('InvalidSigError')
    })

    it('does not permit if the signature has expired', async function () {
      const signature = await getERC1155PermitSignature(this.deployer, this.manager.address, testPermit.address, true, 0, {
        nonce: 0,
        name: 'PrimitiveManager',
        version: '1',
        chainId: await this.deployer.getChainId(),
      })

      await expect(
        testPermit.testPermit(
          this.manager.address,
          this.deployer.address,
          testPermit.address,
          true,
          0,
          signature.v,
          signature.r,
          signature.s
        )
      ).to.revertWithCustomError('SigExpiredError')
    })
  })
})
