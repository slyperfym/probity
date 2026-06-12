// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketFactory } from "../src/MarketFactory.sol";
import { LocalScriptBase } from "./LocalScriptBase.sol";

contract SeedArcTestnetMarkets is LocalScriptBase {
    uint256 internal constant ARC_TESTNET_CHAIN_ID = 5_042_002;

    error WrongChain(uint256 actualChainId);

    function run() external returns (address[] memory markets) {
        if (block.chainid != ARC_TESTNET_CHAIN_ID) {
            revert WrongChain(block.chainid);
        }

        string memory deploymentJson = vm.readFile(ARC_TESTNET_ADDRESSES_PATH);
        address factoryAddress = vm.parseJsonAddress(deploymentJson, ".contracts.MarketFactory");
        address settlementToken = vm.envAddress("SETTLEMENT_TOKEN_ADDRESS");

        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = _account(privateKey);
        address resolver = vm.envOr("RESOLVER_ADDRESS", deployer);
        bool forceSeedMarkets = vm.envOr("FORCE_SEED_MARKETS", uint256(0)) == 1;

        MarketFactory factory = MarketFactory(factoryAddress);

        vm.startBroadcast(privateKey);

        factory.setResolverApproval(resolver, true);
        factory.setSettlementTokenApproval(settlementToken, true);

        if (factory.marketCount() == 0 || forceSeedMarkets) {
            _createDemoMarkets(factory, settlementToken, resolver);
        }

        markets = factory.allMarkets();

        vm.stopBroadcast();

        vm.writeFile(
            ARC_TESTNET_ADDRESSES_PATH,
            _deploymentJson(
                factoryAddress,
                settlementToken,
                markets,
                deployer,
                resolver,
                "arc-testnet",
                "seeded-arc-testnet-USDC"
            )
        );
    }

    function _createDemoMarkets(
        MarketFactory factory,
        address settlementToken,
        address resolver
    ) internal {
        factory.createMarket(
            settlementToken,
            resolver,
            block.timestamp + 14 days,
            "Will BTC close above $120K at month end?",
            "arc-testnet://probity/btc-above-120k"
        );
        factory.createMarket(
            settlementToken,
            resolver,
            block.timestamp + 21 days,
            "Will Arc announce a stablecoin gas pilot before quarter end?",
            "arc-testnet://probity/arc-stablecoin-gas-pilot"
        );
        factory.createMarket(
            settlementToken,
            resolver,
            block.timestamp + 30 days,
            "Will ETH ETF weekly inflows exceed $1B this month?",
            "arc-testnet://probity/eth-etf-weekly-inflows"
        );
    }
}
