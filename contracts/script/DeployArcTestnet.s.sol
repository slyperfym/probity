// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketFactory } from "../src/MarketFactory.sol";
import { MockUSDC } from "../src/mocks/MockUSDC.sol";
import { LocalScriptBase } from "./LocalScriptBase.sol";

contract DeployArcTestnet is LocalScriptBase {
    uint256 internal constant ARC_TESTNET_CHAIN_ID = 5_042_002;
    uint256 internal constant TEST_TOKEN_BOOTSTRAP_AMOUNT = 1_000_000e6;

    error WrongChain(uint256 actualChainId);
    error SettlementTokenNotContract();

    function run() external returns (address settlementToken, MarketFactory factory) {
        if (block.chainid != ARC_TESTNET_CHAIN_ID) {
            revert WrongChain(block.chainid);
        }

        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = _account(privateKey);
        address resolver = vm.envOr("RESOLVER_ADDRESS", deployer);
        address configuredSettlementToken = vm.envOr("SETTLEMENT_TOKEN_ADDRESS", address(0));
        string memory settlementTokenStrategy;

        vm.startBroadcast(privateKey);

        if (configuredSettlementToken == address(0)) {
            MockUSDC usdc = new MockUSDC();
            usdc.mint(deployer, TEST_TOKEN_BOOTSTRAP_AMOUNT);
            settlementToken = address(usdc);
            settlementTokenStrategy = "deployed-test-MockUSDC";
        } else {
            if (configuredSettlementToken.code.length == 0) {
                revert SettlementTokenNotContract();
            }

            settlementToken = configuredSettlementToken;
            settlementTokenStrategy = "configured-USDC-style-test-token";
        }

        factory = new MarketFactory();
        factory.setResolverApproval(resolver, true);

        vm.stopBroadcast();

        address[] memory markets = new address[](0);
        vm.writeFile(
            ARC_TESTNET_ADDRESSES_PATH,
            _deploymentJson(
                address(factory),
                settlementToken,
                markets,
                deployer,
                resolver,
                "arc-testnet",
                settlementTokenStrategy
            )
        );
    }
}
