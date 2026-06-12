// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface Vm {
    function warp(uint256 newTimestamp) external;
    function prank(address msgSender) external;
    function startPrank(address msgSender) external;
    function stopPrank() external;
    function expectRevert(bytes4 revertData) external;
}

contract TestBase {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertEq(uint256 actual, uint256 expected, string memory message) internal pure {
        if (actual != expected) {
            revert(message);
        }
    }

    function assertEq(address actual, address expected, string memory message) internal pure {
        if (actual != expected) {
            revert(message);
        }
    }

    function assertEq(string memory actual, string memory expected, string memory message) internal pure {
        if (keccak256(bytes(actual)) != keccak256(bytes(expected))) {
            revert(message);
        }
    }

    function assertTrue(bool value, string memory message) internal pure {
        if (!value) {
            revert(message);
        }
    }
}
