import { task } from 'hardhat/config'
import '@nomiclabs/hardhat-waffle'
import crypto from 'crypto'
import { BytesLike } from '@ethersproject/bytes'

import { Whitelist__factory } from '../typechain'

function generateRandomKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

task('generateKeys', 'Generate keys and saves them on-chain')
  .addParam('amount', 'Amount of keys to generate')
  .addParam('house', 'Address of the PrimitiveHouse contract')
  .setAction(async (args, hre) => {
    console.log(`\nGenerating ${args.amount} keys...\n`)

    const keys: string[] = []
    const hashes: BytesLike[] = []

    for (let i = 0; i < args.amount; i += 1) {
      const key = generateRandomKey()
      console.log(key)
      keys.push(key)

      hashes.push(hre.ethers.utils.solidityKeccak256(['string'], [key]))
    }

    console.log('\nKeys generated, saving them on-chain...!\n')

    const [deployer] = await hre.ethers.getSigners()
    const house = Whitelist__factory.connect(args.house, deployer)

    await house.addKeys(hashes)

    console.log('\nDone!\n')
  })
