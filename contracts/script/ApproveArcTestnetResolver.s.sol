// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketFactory } from "../src/MarketFactory.sol";
import { LocalScriptBase } from "./LocalScriptBase.sol";

contract ApproveArcTestnetResolver is LocalScriptBase {
    uint256 internal constant ARC_TESTNET_CHAIN_ID = 5_042_002;

    error WrongChain(uint256 actualChainId);
    error MarketFactoryRequired();
    error ResolverRequired();

    function run() external {
        if (block.chainid != ARC_TESTNET_CHAIN_ID) {
            revert WrongChain(block.chainid);
        }

        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address marketFactory = vm.envAddress("MARKET_FACTORY_ADDRESS");
        address resolver = vm.envAddress("RESOLVER_ADDRESS");

        if (marketFactory == address(0)) {
            revert MarketFactoryRequired();
        }

        if (resolver == address(0)) {
            revert ResolverRequired();
        }

        vm.startBroadcast(privateKey);
        MarketFactory(marketFactory).setResolverApproval(resolver, true);
        vm.stopBroadcast();
    }
}
