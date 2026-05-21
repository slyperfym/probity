// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketFactory } from "../src/MarketFactory.sol";
import { MockUSDC } from "../src/mocks/MockUSDC.sol";
import { LocalScriptBase } from "./LocalScriptBase.sol";

contract DeployLocal is LocalScriptBase {
    uint256 internal constant USDC = 1e6;

    function run() external returns (MockUSDC usdc, MarketFactory factory) {
        uint256 privateKey = _privateKey();
        address deployer = _account(privateKey);

        vm.startBroadcast(privateKey);

        usdc = new MockUSDC();
        factory = new MarketFactory();

        factory.setResolverApproval(deployer, true);

        usdc.mint(deployer, 1_000_000 * USDC);
        usdc.mint(ANVIL_ACCOUNT_2, 250_000 * USDC);
        usdc.mint(ANVIL_ACCOUNT_3, 250_000 * USDC);
        usdc.mint(ANVIL_ACCOUNT_4, 250_000 * USDC);

        vm.stopBroadcast();

        address[] memory markets = new address[](0);
        vm.writeFile(
            LOCAL_ADDRESSES_PATH,
            _deploymentJson(
                address(factory),
                address(usdc),
                markets,
                deployer,
                deployer,
                "local-anvil",
                "MockUSDC"
            )
        );
    }
}
