import { task, types } from 'hardhat/config';
import { utils } from 'ethers'
import { bytecode } from '@primitivefi/rmm-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json';
import fs from 'fs';

task('checkEngineBytecodeHash', 'Checks if the engine bytecode hashes are matching')
  .addOptionalPositionalParam('update', 'Updates the bytecode hash of the Manager', false, types.boolean)
  .setAction(async (args, hre) => {
    await hre.run('compile')

    const hash = utils.keccak256(bytecode)

    const TestHash = await hre.ethers.getContractFactory('TestHash');
    const testHash = await TestHash.deploy();

    const savedHash = await testHash.getEngineCodeHash();

    if (savedHash === hash) {
      console.log('✅ Engine bytecode hash is correct!');
    } else {
      console.log('❌ Engine bytecode hash is incorrect!');

      if (args.update) {
        let source = await fs.promises.readFile('./contracts/libraries/EngineAddress.sol', {
          encoding: 'utf-8',
        });

        source = source.replace(savedHash, hash);
        await fs.promises.writeFile(
          './contracts/libraries/EngineAddress.sol',
          source, {
          encoding: 'utf-8',
        });

        console.log('✅ Engine bytecode hash updated!');
      }
    }
  });
