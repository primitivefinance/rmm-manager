import { Wallet, Contract, Signer } from 'ethers'
import { parsePercentage } from 'web3-units'
import hre, { ethers, waffle } from 'hardhat'
import { deployContract } from 'ethereum-waffle'
import * as ContractTypes from '../../typechain'

import { MockEngine__factory } from '../../typechain'

import { Contracts } from '../../types'
import { Calibration } from '../shared/calibration'

export async function deploy(contractName: string, deployer: Wallet, args: any[] = []): Promise<Contract> {
  const artifact = await hre.artifacts.readArtifact(contractName)
  const contract = await deployContract(deployer, artifact, args, { gasLimit: 9500000 })
  return contract
}

export const DEFAULT_CONFIG: Calibration = new Calibration(10, 1, 1633113818, 1, 10, parsePercentage(0.0015))

export function runTest(
  desc: string,
  runTests: Function,
): void {
  describe(desc, function () {
    beforeEach(async function () {
      const signers = waffle.provider.getWallets();
      const [deployer] = signers;

      this.loadFixture = waffle.createFixtureLoader(signers)

      // TODO: Put that into a fixture

      // Core
      const risky = (await deploy('Token', deployer)) as ContractTypes.Token
      const stable = (await deploy('Token', deployer)) as ContractTypes.Token

      const factory = (await deploy('MockFactory', deployer)) as ContractTypes.MockFactory

      // const factory = (await deployContract(deployer, PrimitiveFactoryArtifact)) as PrimitiveFactory
      await factory.deploy(risky.address, stable.address)
      const addr = await factory.getEngine(risky.address, stable.address)
      const engine = (await ethers.getContractAt(MockEngine__factory.abi, addr)) as ContractTypes.MockEngine

      // Periphery
      const house = (await deploy('PrimitiveHouse', deployer, [
        factory.address,
        '0x4f5704D9D2cbCcAf11e70B34048d41A0d572993F',
        '',
      ])) as ContractTypes.PrimitiveHouse

      this.risky = risky;
      this.stable = stable;
      this.factory = factory;
      this.engine = engine;
      this.house = house;

      this.deployer = deployer
      this.alice = signers[1]
      this.bob = signers[2]
    })

    runTests()
  })
}
