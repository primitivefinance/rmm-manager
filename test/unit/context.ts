import { Wallet, Contract } from 'ethers'
import { parsePercentage } from 'web3-units'
import hre, { ethers, waffle } from 'hardhat'
import { deployContract, createFixtureLoader } from 'ethereum-waffle'
import * as ContractTypes from '../../typechain'
import { abi as PrimitiveEngineAbi } from '@primitivefinance/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'
import FactoryArtifact from '@primitivefinance/rmm-core/artifacts/contracts/PrimitiveFactory.sol/PrimitiveFactory.json'

import { Calibration } from '../shared/calibration'
import { PrimitiveEngine, PrimitiveFactory } from '@primitivefinance/rmm-core/typechain'

export async function deploy(contractName: string, deployer: Wallet, args: any[] = []): Promise<Contract> {
  const artifact = await hre.artifacts.readArtifact(contractName)
  const contract = await deployContract(deployer, artifact, args, { gasLimit: 9500000 })
  return contract
}

export const DEFAULT_CONFIG: Calibration = new Calibration(10, 1, 1666969423, 1, 10, parsePercentage(1 - 0.0015))

export function runTest(description: string, runTests: Function): void {
  const loadFixture = createFixtureLoader()

  describe(description, function () {
    beforeEach(async function () {
      const signers = waffle.provider.getWallets()
      const [deployer] = signers

      const loadedFixture = await loadFixture(async function () {
        // Core
        const risky = (await deploy('TestToken', deployer)) as ContractTypes.TestToken
        const stable = (await deploy('TestToken', deployer)) as ContractTypes.TestToken

        const factory = (await deployContract(deployer, FactoryArtifact, [], {
          gasLimit: 9500000,
        })) as PrimitiveFactory

        // const factory = (await deployContract(deployer, PrimitiveFactoryArtifact)) as PrimitiveFactory
        await factory.deploy(risky.address, stable.address)
        const addr = await factory.getEngine(risky.address, stable.address)
        const engine = (await ethers.getContractAt(PrimitiveEngineAbi, addr)) as PrimitiveEngine

        // PositionRenderer
        const positionRenderer = (await deploy('PositionRenderer', deployer)) as ContractTypes.PositionRenderer

        // WETH
        const weth = (await deploy('WETH9', deployer)) as ContractTypes.WETH9

        // Manager
        const manager = (await deploy('PrimitiveManager', deployer, [
          factory.address,
          weth.address,
          positionRenderer.address,
        ])) as ContractTypes.PrimitiveManager

        return {
          risky,
          stable,
          factory,
          engine,
          manager,
          positionRenderer,
          weth,
        }
      })

      this.risky = loadedFixture.risky
      this.stable = loadedFixture.stable
      this.factory = loadedFixture.factory
      this.engine = loadedFixture.engine
      this.manager = loadedFixture.manager
      this.positionRenderer = loadedFixture.positionRenderer
      this.weth = loadedFixture.weth

      this.deployer = deployer
      this.alice = signers[1]
      this.bob = signers[2]
    })

    runTests()
  })
}
