import { constants } from 'ethers'
import expect from '../../shared/expect'
import { runTest, deploy } from '../context'

runTest('constructor', function () {
  describe('success cases', function () {
    it('fetches the variables set by the constructor', async function () {
      expect(await this.manager.factory()).to.be.equal(this.factory.address)
      expect(await this.manager.WETH9()).to.be.equal(this.weth.address)
      expect(await this.manager.positionDescriptor()).to.be.equal(this.positionDescriptor.address)
    })
  })

  describe('fail cases', function () {
    it('fails to deploy if constructor arguments are null', async function () {
      await expect(
        deploy('PrimitiveManager', this.deployer, [constants.AddressZero, constants.AddressZero, constants.AddressZero])
      ).to.revertWithCustomError('WrongConstructorParametersError')
    })
  })
})
