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
        bool shouldSeedMarkets = vm.envOr("SEED_DEMO_MARKETS", uint256(0)) == 1;
        string memory settlementTokenStrategy;
        address[] memory markets = new address[](0);

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

        if (shouldSeedMarkets) {
            markets = _createDemoMarkets(factory, settlementToken, resolver);
        }

        vm.stopBroadcast();

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

    function _createDemoMarkets(
        MarketFactory factory,
        address settlementToken,
        address resolver
    ) internal returns (address[] memory markets) {
        markets = new address[](3);

        markets[0] = factory.createMarket(
            settlementToken,
            resolver,
            block.timestamp + 14 days,
            "Will BTC close above $120K at month end?",
            "arc-testnet://probity/btc-above-120k"
        );
        markets[1] = factory.createMarket(
            settlementToken,
            resolver,
            block.timestamp + 21 days,
            "Will Arc announce a stablecoin gas pilot before quarter end?",
            "arc-testnet://probity/arc-stablecoin-gas-pilot"
        );
        markets[2] = factory.createMarket(
            settlementToken,
            resolver,
            block.timestamp + 30 days,
            "Will ETH ETF weekly inflows exceed $1B this month?",
            "arc-testnet://probity/eth-etf-weekly-inflows"
        );
    }
}
