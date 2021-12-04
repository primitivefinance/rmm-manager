import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

runTest('withdraw', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.manager.address, constants.MaxUint256)
    await this.stable.approve(this.manager.address, constants.MaxUint256)

    await this.manager.deposit(
      this.deployer.address,
      this.risky.address,
      this.stable.address,
      parseWei('1000').raw,
      parseWei('1000').raw
    )
  })

  describe('success cases', function () {
    it('withdraws 1000 risky and 1000 stable from margin', async function () {
      await this.manager.withdraw(this.deployer.address, this.engine.address, parseWei('1000').raw, parseWei('1000').raw)
    })

    it('reduces the margin of the sender', async function () {
      await expect(
        this.manager.withdraw(this.deployer.address, this.engine.address, parseWei('1000').raw, parseWei('1000').raw)
      ).to.updateMargin(
        this.manager,
        this.deployer.address,
        this.engine.address,
        parseWei('1000').raw,
        false,
        parseWei('1000').raw,
        false
      )
    })

    it('reduces the balances of the engine', async function () {
      const stableBalance = await this.stable.balanceOf(this.engine.address)
      const riskyBalance = await this.risky.balanceOf(this.engine.address)

      await this.manager.withdraw(this.deployer.address, this.engine.address, parseWei('1000').raw, parseWei('1000').raw)

      expect(await this.stable.balanceOf(this.engine.address)).to.equal(stableBalance.sub(parseWei('1000').raw))

      expect(await this.risky.balanceOf(this.engine.address)).to.equal(riskyBalance.sub(parseWei('1000').raw))
    })

    it('increases the balances of the sender', async function () {
      const stableBalance = await this.stable.balanceOf(this.deployer.address)
      const riskyBalance = await this.risky.balanceOf(this.deployer.address)

      await this.manager.withdraw(this.deployer.address, this.engine.address, parseWei('1000').raw, parseWei('1000').raw)

      expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance.add(parseWei('1000').raw))

      expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance.add(parseWei('1000').raw))
    })

    it('emits the Withdrawn event', async function () {
      await expect(
        this.manager.withdraw(this.deployer.address, this.engine.address, parseWei('1000').raw, parseWei('1000').raw)
      )
        .to.emit(this.manager, 'Withdraw')
        .withArgs(
          this.deployer.address,
          this.deployer.address,
          this.engine.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
    })

    it('keeps the tokens inside of the contract using address(0) as a recipient', async function () {
      const delRisky = parseWei('1000').raw

      await this.manager.withdraw(constants.AddressZero, this.engine.address, parseWei('1000').raw, '0')

      expect(await this.risky.balanceOf(this.manager.address)).to.equal(delRisky)
    })

    it('emits the Withdraw event (with the right recipient) when using address(0)', async function () {
      await expect(
        this.manager.withdraw(constants.AddressZero, this.engine.address, parseWei('1000').raw, parseWei('1000').raw)
      )
        .to.emit(this.manager, 'Withdraw')
        .withArgs(
          this.deployer.address,
          this.deployer.address,
          this.engine.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
    })
  })

  describe('fail cases', function () {
    it('fails on attempt to withdraw more than margin balance', async function () {
      await expect(
        this.manager.withdraw(this.deployer.address, this.engine.address, parseWei('1001').raw, parseWei('1001').raw)
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      const data = utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'uint256'],
        [this.manager.address, this.risky.address, this.stable.address, '0', '0']
      )

      await expect(this.manager.depositCallback(0, 0, data)).to.revertWithCustomError('NotEngineError')
    })
  })
})
