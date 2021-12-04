# RMM Manager

This repository is for the manager and routing contracts of the Primitive RMM. These are high-level contracts which are designed to interact with Primitive RMm core contracts.

# Bug Bounty

This repository has a bug bounty through Immunefi. Details are on their website [https://immunefi.com/bounty/primitive](https://immunefi.com/bounty/primitive/).

# Documentation

The contract documentation is hosted here: [Primitive Docs](https://docs.primitive.finance)

## Overview

This repository has the high level contracts to interact with the Primitive V2 core. The "Manager" contract is split into several small pieces, that are all inherited by the `PrimitiveManager` contract.

### ManagerBase

Stores "general" variables that are meant to be reused by the child contracts. This contract is inherited by several child contracts.

### CashManager

Contains several functions to unwrap WETH or sweep tokens / ETH from the manager.

### MarginManager

Manages the margins and provides functions to `deposit` and `withdraw`.

### Multicall

Utils contract allowing the batching of transactions into one call.

### PositionManager

Wraps the positions into ERC1155 tokens (and inherits the ERC1155 contract).

### Reentrancy

Small contract to prevent reentrancy.

### SelfPermit

Provides an ensemble of functions to call permit on the compliant tokens.

### SwapManager

Provides an ensemble of functions to swap tokens from different engines.

### PositionRenderer

Manages the visual rendering of the position tokens. This contract is external (not inherited by the Manager), and will be deployed as a standalone upgradeable contract.

# Testing

### Compile contracts

`yarn compile`

### Run the tests

`yarn test`

### Run coverage

`yarn coverage`

# Security

All audits are located in the audits/ folder.

# Deployed Addresses

The deployed contract addresses for all of Primitive are located here: [Contract Database](https://www.notion.so/primitivefi/dc3b883ff9d94044b6738701b2826f7a?v=9e56507d430d4f4fb1939242cfb23736)

# Access Control

There is no access control for any of the peripheral contracts. However, the PositionRenderer contract will be deployed as an upgradeable contract.
