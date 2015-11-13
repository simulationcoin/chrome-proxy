#!/usr/bin/env node
var package = require('../../package.json');
var program = require('commander');
var lib = require('./lib.js');

program
  .version(package.version)
  .command('wipe', 'Delete keys and configurations')
  .command('setup <label>', 'Initialize your device')
  .command('update', 'Update firmware')
  .command('address <address_n...>', 'Get the address for a node')
  .command('public-key <address_n>', 'Get the public key for a node')
  .command('sign-message <address_n> <message>', 'sign a message with the private key for a node')
  .command('encrypt-message <address_n> <message>', 'encrypt a message with the private key for a node')
  .command('encrypt-key-value <address_n> <key> <value>', 'encrypt a value from a config file')
  .command('decrypt-key-value <address_n> <key> <value>', 'decrypt a value from a config file')
  .command('api-key', 'Get the api key used to access blockchain data')
  .command('encode-wallet-id', 'Get an encoded wallet id based on the root node for the wallet')
  .command('encrypt-node-path', 'Encrypt a node path using the key of the root node')
  .command('decrypt-node-path', 'Decrypt a node path using the key of the root node')
  .parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  process.exit();
}
