// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketFactory } from "../src/MarketFactory.sol";
import { PredictionMarket } from "../src/PredictionMarket.sol";
import { MockUSDC } from "../src/mocks/MockUSDC.sol";
import { LocalScriptBase } from "./LocalScriptBase.sol";

contract SeedLocalMarkets is LocalScriptBase {
    uint256 internal constant USDC = 1e6;

    function run() external returns (address[] memory markets) {
        string memory deploymentJson = vm.readFile(LOCAL_ADDRESSES_PATH);
        address factoryAddress = vm.parseJsonAddress(deploymentJson, ".contracts.MarketFactory");
        address usdcAddress = vm.parseJsonAddress(deploymentJson, ".contracts.MockUSDC");

        MarketFactory factory = MarketFactory(factoryAddress);
        MockUSDC usdc = MockUSDC(usdcAddress);
        uint256 privateKey = _privateKey();
        address resolver = _account(privateKey);

        vm.startBroadcast(privateKey);

        markets = new address[](3);
        markets[0] = factory.createMarket(
            usdcAddress,
            resolver,
            block.timestamp + 14 days,
            "Will BTC close above $120K at month end?",
            "local://probity/btc-above-120k"
        );
        markets[1] = factory.createMarket(
            usdcAddress,
            resolver,
            block.timestamp + 21 days,
            "Will Arc announce a stablecoin gas pilot before quarter end?",
            "local://probity/arc-stablecoin-gas-pilot"
        );
        markets[2] = factory.createMarket(
            usdcAddress,
            resolver,
            block.timestamp + 30 days,
            "Will ETH ETF weekly inflows exceed $1B this month?",
            "local://probity/eth-etf-weekly-inflows"
        );

        _seedPosition(usdc, markets[0], true, 120_000 * USDC);
        _seedPosition(usdc, markets[0], false, 80_000 * USDC);
        _seedPosition(usdc, markets[1], true, 95_000 * USDC);
        _seedPosition(usdc, markets[1], false, 55_000 * USDC);
        _seedPosition(usdc, markets[2], true, 70_000 * USDC);
        _seedPosition(usdc, markets[2], false, 110_000 * USDC);

        vm.stopBroadcast();

        vm.writeFile(
            LOCAL_ADDRESSES_PATH,
            _deploymentJson(
                factoryAddress,
                usdcAddress,
                markets,
                resolver,
                resolver,
                "local-anvil",
                "MockUSDC"
            )
        );
    }

    function _seedPosition(MockUSDC usdc, address market, bool buyYes, uint256 amount) internal {
        usdc.approve(market, amount);

        if (buyYes) {
            PredictionMarket(market).buyYes(amount);
        } else {
            PredictionMarket(market).buyNo(amount);
        }
    }
}
