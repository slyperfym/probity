// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketFactory } from "../src/MarketFactory.sol";
import { LocalScriptBase } from "./LocalScriptBase.sol";

contract ApproveArcTestnetCreator is LocalScriptBase {
    uint256 internal constant ARC_TESTNET_CHAIN_ID = 5_042_002;

    error WrongChain(uint256 actualChainId);
    error MarketFactoryRequired();
    error CreatorRequired();

    function run() external {
        if (block.chainid != ARC_TESTNET_CHAIN_ID) {
            revert WrongChain(block.chainid);
        }

        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address marketFactory = vm.envAddress("MARKET_FACTORY_ADDRESS");
        address creator = vm.envAddress("CREATOR_ADDRESS");

        if (marketFactory == address(0)) {
            revert MarketFactoryRequired();
        }

        if (creator == address(0)) {
            revert CreatorRequired();
        }

        vm.startBroadcast(privateKey);
        MarketFactory(marketFactory).setCreatorApproval(creator, true);
        vm.stopBroadcast();
    }
}
