import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import expect from '../../../shared/expect'
import { runTest, DEFAULT_CONFIG } from '../../context'

const { strike, sigma, maturity, delta } = DEFAULT_CONFIG

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

    it('increases the margin', async function () {
      await this.house.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      const margin = await this.house.margins(this.engine.address, this.deployer.address)
      expect(margin.balanceRisky).to.equal(parseWei('1000').raw)
      expect(margin.balanceStable).to.equal(parseWei('1000').raw)
    })

    it('reduces the balance of the sender', async function () {
      const stableBalance = await this.stable.balanceOf(this.deployer.address)
      const riskyBalance = await this.risky.balanceOf(this.deployer.address)

      await this.house.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      expect(
        await this.stable.balanceOf(this.deployer.address)
      ).to.equal(stableBalance.sub(parseWei('1000').raw))

      expect(
        await this.risky.balanceOf(this.deployer.address)
      ).to.equal(riskyBalance.sub(parseWei('1000').raw))
    })

    it('increases the balance of the engine', async function () {
      const stableBalance = await this.stable.balanceOf(this.engine.address)
      const riskyBalance = await this.risky.balanceOf(this.engine.address)

      await this.house.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )

      expect(
        await this.stable.balanceOf(this.engine.address)
      ).to.equal(stableBalance.add(parseWei('1000').raw))

      expect(
        await this.risky.balanceOf(this.engine.address)
      ).to.equal(riskyBalance.add(parseWei('1000').raw))
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
      // TODO: Update to custom error
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

    it('reverts if the callback function is called directly', async function () {
      const data = utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'uint256'],
        [this.house.address, this.risky.address, this.stable.address, '0', '0']
      );

      await expect(this.house.depositCallback(0, 0, data)).to.be.revertedWith('NotEngineError()')
    })
  })
})
