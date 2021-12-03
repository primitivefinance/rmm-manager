import { constants } from 'ethers'
import expect from '../../shared/expect'
import { getERC20PermitSignature } from '../../shared/permit'
import { runTest } from '../context'

const value = constants.MaxUint256
const deadline = 999999999999

runTest('selfPermitAllowed', function () {
  describe('success cases', function () {
    it('self approves using the signature', async function () {
      const signature = await getERC20PermitSignature(
        this.deployer,
        this.risky.address,
        this.manager.address,
        value,
        deadline, {
          name: 'TestToken',
          nonce: '0',
          version: '1',
          chainId: await this.deployer.getChainId(),
        }
      )

      await this.manager.selfPermitAllowed(
        this.risky.address,
        '0',
        deadline,
        signature.v,
        signature.r,
        signature.s,
      )

      expect(
        await this.risky.allowance(this.deployer.address, this.manager.address)
      ).to.be.equal(value)
    })
  })

  describe('fail cases', function () {
    it('reverts if the deadline is reached', async function () {
      const signature = await getERC20PermitSignature(
        this.deployer,
        this.risky.address,
        this.manager.address,
        value,
        0, {
          name: 'TestToken',
          nonce: '0',
          version: '1',
          chainId: await this.deployer.getChainId(),
        }
      )

      await expect(this.manager.selfPermitAllowed(
        this.risky.address,
        '0',
        0,
        signature.v,
        signature.r,
        signature.s,
      )).to.be.revertedWith('ERC20Permit: expired deadline')
    })

    it('reverts if the signature is invalid', async function () {
      const signature = await getERC20PermitSignature(
        this.deployer,
        this.risky.address,
        this.manager.address,
        value,
        deadline, {
          name: 'TestToken',
          nonce: '0',
          version: '1',
          chainId: await this.deployer.getChainId(),
        }
      )

      await expect(this.manager.selfPermitAllowed(
        this.stable.address,
        '0',
        deadline,
        signature.v,
        signature.r,
        signature.s,
      )).to.be.revertedWith('ERC20Permit: invalid signature')
    })
  })
})
