import hre from 'hardhat'
import { Contract } from 'ethers'
import { getAddress } from 'ethers/lib/utils'

async function main() {
  const [signer] = await hre.ethers.getSigners()

  const abi = ['function WETH9() public view returns (address)']
  const addresses = {
    primitiveFactory: '0xFFaBD5dfDFfb53d1620044e19F74d35472cd0D60',
    positionRenderer: '0xFFA7d2351a663dF587317fE598D20E7b343D9F9e',
    positionDescriptor: '0x8b212B61653B96954dCcd1fdDD11AED540AF5907',
    primitiveManager: '0xcEF244cd3A02B4e4171E95647209Edc6Bb943ee0',
  }
  const manager = new Contract(addresses.primitiveManager, abi, signer)
  const weth = await manager.WETH9()
  await hre.run('verify:verify', {
    address: addresses.primitiveFactory,
    constructorArguments: [],
  })

  await hre.run('verify:verify', {
    address: addresses.positionRenderer,
    constructorArguments: [],
  })
  await hre.run('verify:verify', {
    address: addresses.positionDescriptor,
    constructorArguments: [addresses.positionRenderer],
  })
  await hre.run('verify:verify', {
    address: addresses.primitiveManager,
    constructorArguments: [addresses.primitiveFactory, getAddress(weth), addresses.positionDescriptor],
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
