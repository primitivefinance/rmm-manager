import { utils, constants } from 'ethers'
import { parseWei } from 'web3-units'

import expect from '../../shared/expect'
import { runTest } from '../context'

runTest('deposit', function () {
  let wethEngine: string
  beforeEach(async function () {
    await this.risky.mint(this.deployer.address, parseWei('1000000').raw)
    await this.stable.mint(this.deployer.address, parseWei('1000000').raw)
    await this.risky.approve(this.manager.address, constants.MaxUint256)
    await this.stable.approve(this.manager.address, constants.MaxUint256)
    /* await this.factory.deploy(this.weth.address, this.stable.address)
    wethEngine = await this.factory.getEngine(this.weth.address, this.stable.address) */
  })

  describe('success cases', function () {
    it('deposits risky and stable to margin', async function () {
      await this.manager.deposit(
        this.deployer.address,
        this.risky.address,
        this.stable.address,
        parseWei('1000').raw,
        parseWei('1000').raw
      )
    })

    it('increases the margin of the recipient', async function () {
      await expect(
        this.manager.deposit(
          this.alice.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      ).to.updateMargin(
        this.manager,
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

      await this.manager.deposit(
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

      await this.manager.deposit(
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
        this.manager.deposit(
          this.deployer.address,
          this.risky.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      )
        .to.emit(this.manager, 'Deposit')
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

    describe('use on engine with weth, and pay with ether', function () {
      let wethEngine: string
      beforeEach(async function () {
        await this.factory.deploy(this.weth.address, this.stable.address)
        wethEngine = await this.factory.getEngine(this.weth.address, this.stable.address)
      })

      it('deposits weth and stable to margin', async function () {
        await this.manager.deposit(
          this.deployer.address,
          this.weth.address,
          this.stable.address,
          parseWei('1000').raw,
          parseWei('1000').raw,
          { value: parseWei('1000').raw }
        )
      })

      it('increases the margin of the recipient', async function () {
        await expect(
          this.manager.deposit(
            this.alice.address,
            this.weth.address,
            this.stable.address,
            parseWei('100').raw,
            parseWei('100').raw,
            { value: parseWei('100').raw }
          )
        ).to.updateMargin(this.manager, this.alice.address, wethEngine, parseWei('100').raw, true, parseWei('100').raw, true)
      })

      it('reduces the balances of the sender', async function () {
        const stableBalance = await this.stable.balanceOf(this.deployer.address)
        const riskyBalance = await this.deployer.getBalance()

        await this.manager.deposit(
          this.deployer.address,
          this.weth.address,
          this.stable.address,
          parseWei('100').raw,
          parseWei('100').raw,
          { value: parseWei('100').raw }
        )

        expect(await this.stable.balanceOf(this.deployer.address)).to.equal(stableBalance.sub(parseWei('100').raw))

        expect(
          (await this.deployer.getBalance()).gte(riskyBalance.sub(parseWei('100').raw).sub(parseWei('0.001').raw))
        ).to.equal(true)
      })

      it('increases the balances of the engine', async function () {
        const stableBalance = await this.stable.balanceOf(wethEngine)
        const riskyBalance = await this.weth.balanceOf(wethEngine)

        await this.manager.deposit(
          this.deployer.address,
          this.weth.address,
          this.stable.address,
          parseWei('100').raw,
          parseWei('100').raw,
          { value: parseWei('100').raw }
        )

        expect(await this.stable.balanceOf(wethEngine)).to.equal(stableBalance.add(parseWei('100').raw))

        expect(await this.weth.balanceOf(wethEngine)).to.equal(riskyBalance.add(parseWei('100').raw))
      })

      it('emits the Deposited event', async function () {
        await expect(
          this.manager.deposit(
            this.deployer.address,
            this.weth.address,
            this.stable.address,
            parseWei('100').raw,
            parseWei('100').raw,
            { value: parseWei('100').raw }
          )
        )
          .to.emit(this.manager, 'Deposit')
          .withArgs(
            this.deployer.address,
            this.deployer.address,
            wethEngine,
            this.weth.address,
            this.stable.address,
            parseWei('100').raw,
            parseWei('100').raw
          )
      })
    })
  })

  describe('fail cases', function () {
    it('reverts if the owner does not have enough tokens', async function () {
      await expect(
        this.manager
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

    it('reverts if the enigne is not deployed', async function () {
      await expect(
        this.manager.deposit(
          this.deployer.address,
          this.stable.address,
          this.risky.address,
          parseWei('1000').raw,
          parseWei('1000').raw
        )
      ).to.revertWithCustomError('EngineNotDeployedError')
    })

    it('reverts if trying to deposit 0 risky and stable', async function () {
      await expect(
        this.manager.deposit(this.deployer.address, this.risky.address, this.stable.address, '0', '0')
      ).to.revertWithCustomError('ZeroDelError')
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
