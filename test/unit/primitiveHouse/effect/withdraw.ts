import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import expect from '../../../shared/expect'
import { runTest } from '../../context'

runTest('withdraw', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)

    await this.house.deposit(
      this.deployer.address,
      this.risky.address,
      this.stable.address,
      parseWei('1000').raw,
      parseWei('1000').raw
    )
  })

  describe('success cases', function () {
    it('withdraws 1000 risky and 1000 stable from margin', async function () {
      await this.house.withdraw(
        this.deployer.address,
        this.engine.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )
    })

    it('reduces the margin of the sender', async function () {
      await this.house.withdraw(
        this.deployer.address,
        this.engine.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      const margin = await this.house.margins(this.engine.address, this.deployer.address)

      expect(margin.balanceRisky).to.equal(parseWei('0').raw)
      expect(margin.balanceStable).to.equal(parseWei('0').raw)
    })

    it('reduces the balance of the engine', async function () {
      const stableBalance = await this.stable.balanceOf(this.engine.address)
      const riskyBalance = await this.risky.balanceOf(this.engine.address)

      await this.house.withdraw(
        this.deployer.address,
        this.engine.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      expect(
        await this.stable.balanceOf(this.engine.address)
      ).to.equal(stableBalance.sub(parseWei('1000').raw))

      expect(
        await this.risky.balanceOf(this.engine.address)
      ).to.equal(riskyBalance.sub(parseWei('1000').raw))
    })

    it('increases the balance of the sender', async function () {
      const stableBalance = await this.stable.balanceOf(this.deployer.address)
      const riskyBalance = await this.risky.balanceOf(this.deployer.address)

      await this.house.withdraw(
        this.deployer.address,
        this.engine.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      expect(
        await this.stable.balanceOf(this.deployer.address)
      ).to.equal(stableBalance.add(parseWei('1000').raw))

      expect(
        await this.risky.balanceOf(this.deployer.address)
      ).to.equal(riskyBalance.add(parseWei('1000').raw))
    })

    it('emits the Withdrawn event', async function () {
      await expect(
        this.house.withdraw(
          this.deployer.address,
          this.engine.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      )
        .to.emit(this.house, 'Withdraw')
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
        this.house.withdraw(
          this.deployer.address,
          this.engine.address,
          parseWei('1001').raw,
          parseWei('1001').raw
        )
      ).to.be.reverted
    })

    it('reverts if the callback function is called directly', async function () {
      const data = utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'uint256'],
        [this.house.address, this.risky.address, this.stable.address, '0', '0']
      );

      await expect(this.house.depositCallback(0, 0, data)).to.be.reverted
    })
  })
})
