import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

runTest('deposit', function () {
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.house.address, constants.MaxUint256)
    await this.stable.approve(this.house.address, constants.MaxUint256)
  })

  describe('success cases', function () {
    it('deposits risky and stable to margin', async function () {
      await this.house.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )
    })

    it('increases the margin of the recipient', async function () {
      await expect(
        this.house.deposit(
          this.alice.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      ).to.updateMargin(
        this.house,
        this.alice.address,
        this.engine.address,
        parseWei('1000').raw,
        true,
        parseWei('1000').raw,
        true
      )
    })

    it('reduces the balances of the sender', async function () {
      const stableBalance = await this.stable.balanceOf(this.deployer.address)
      const riskyBalance = await this.risky.balanceOf(this.deployer.address)

      await this.house.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance.sub(parseWei('1000').raw))

      expect(await this.risky.balanceOf(this.deployer.address)).to.equal(riskyBalance.sub(parseWei('1000').raw))
    })

    it('increases the balances of the engine', async function () {
      const stableBalance = await this.stable.balanceOf(this.engine.address)
      const riskyBalance = await this.risky.balanceOf(this.engine.address)

      await this.house.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      expect(await this.stable.balanceOf(this.engine.address)).to.equal(stableBalance.add(parseWei('1000').raw))

      expect(await this.risky.balanceOf(this.engine.address)).to.equal(riskyBalance.add(parseWei('1000').raw))
    })

    it('emits the Deposited event', async function () {
      await expect(
        this.house.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      )
        .to.emit(this.house, 'Deposit')
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
    it('reverts if the owner does not have enough tokens', async function () {
      await expect(
        this.house
          .connect(this.bob)
          .deposit(
            this.deployer.address,
            this.risky.address,
            this.stable.address,
            parseWei('1000').raw,
            parseWei('1000').raw
          )
      ).to.be.reverted
    })

    it('reverts if trying to deposit 0 risky and stable', async function () {
      await expect(
        this.house.deposit(this.deployer.address, this.risky.address, this.stable.address, '0', '0')
      ).to.revertWithCustomError('ZeroDelError')
    })

    it('reverts if the callback function is called directly', async function () {
      const data = utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'uint256'],
        [this.house.address, this.risky.address, this.stable.address, '0', '0']
      )

      await expect(this.house.depositCallback(0, 0, data)).to.revertWithCustomError('NotEngineError')
    })
  })
})
