import { Wallet, Contract } from 'ethers'
import { Time, parsePercentage } from 'web3-units'
import hre, { ethers, waffle } from 'hardhat'
import { deployContract, createFixtureLoader } from 'ethereum-waffle'
import * as ContractTypes from '../../typechain'
import { abi as PrimitiveEngineAbi } from '@primitivefinance/v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'
import FactoryArtifact from '@primitivefinance/v2-core/artifacts/contracts/PrimitiveFactory.sol/PrimitiveFactory.json'
import { Calibration } from '../shared/calibration'
import { PrimitiveEngine, PrimitiveFactory } from '@primitivefinance/v2-core/typechain'

export async function deploy(contractName: string, deployer: Wallet, args: any[] = []): Promise<Contract> {
  const artifact = await hre.artifacts.readArtifact(contractName)
  const contract = await deployContract(deployer, artifact, args, { gasLimit: 9500000 })
  return contract
}

export const DEFAULT_CONFIG: Calibration = new Calibration(10, 1, 1697095396, 1, 10, parsePercentage(0.0015))

export function runTest(description: string, runTests: Function): void {
  const loadFixture = createFixtureLoader()

  describe(description, function () {
    beforeEach(async function () {
      const signers = waffle.provider.getWallets()
      const [deployer] = signers

      const loadedFixture = await loadFixture(async function () {
        // Core
        const risky = (await deploy('Token', deployer)) as ContractTypes.Token
        const stable = (await deploy('Token', deployer)) as ContractTypes.Token

        const factory = (await deployContract(deployer, FactoryArtifact, [], {
          gasLimit: 9500000,
        })) as PrimitiveFactory

        // const factory = (await deployContract(deployer, PrimitiveFactoryArtifact)) as PrimitiveFactory
        await factory.deploy(risky.address, stable.address)
        const addr = await factory.getEngine(risky.address, stable.address)
        const engine = (await ethers.getContractAt(PrimitiveEngineAbi, addr)) as PrimitiveEngine

        // Periphery
        const house = (await deploy('PrimitiveHouse', deployer, [
          factory.address,
          '0x4f5704D9D2cbCcAf11e70B34048d41A0d572993F',
          '0x4f5704D9D2cbCcAf11e70B34048d41A0d572993F', // Random address for testing purposes
        ])) as ContractTypes.PrimitiveHouse

        return {
          risky,
          stable,
          factory,
          engine,
          house,
        }
      })

      this.risky = loadedFixture.risky
      this.stable = loadedFixture.stable
      this.factory = loadedFixture.factory
      this.engine = loadedFixture.engine
      this.house = loadedFixture.house

      this.deployer = deployer
      this.alice = signers[1]
      this.bob = signers[2]
    })

    runTests()
  })
}
