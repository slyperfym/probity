// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface Vm {
    function addr(uint256 privateKey) external returns (address keyAddr);
    function envAddress(string calldata name) external returns (address value);
    function envOr(string calldata name, address defaultValue) external returns (address value);
    function envOr(string calldata name, uint256 defaultValue) external returns (uint256 value);
    function envUint(string calldata name) external returns (uint256 value);
    function parseJsonAddress(string calldata json, string calldata key) external pure returns (address);
    function readFile(string calldata path) external view returns (string memory data);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
    function writeFile(string calldata path, string calldata data) external;
}

abstract contract LocalScriptBase {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 internal constant DEFAULT_ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    address internal constant ANVIL_ACCOUNT_2 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address internal constant ANVIL_ACCOUNT_3 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address internal constant ANVIL_ACCOUNT_4 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

    string internal constant LOCAL_ADDRESSES_PATH = "../deployments/local/addresses.json";
    string internal constant ARC_TESTNET_ADDRESSES_PATH = "../deployments/arc-testnet/addresses.json";

    function _privateKey() internal returns (uint256) {
        return vm.envOr("LOCAL_PRIVATE_KEY", DEFAULT_ANVIL_PRIVATE_KEY);
    }

    function _account(uint256 privateKey) internal returns (address) {
        return vm.addr(privateKey);
    }

    function _addressToString(address value) internal pure returns (string memory) {
        bytes20 data = bytes20(value);
        bytes16 alphabet = "0123456789abcdef";
        bytes memory output = new bytes(42);

        output[0] = 0x30;
        output[1] = 0x78;

        for (uint256 i = 0; i < 20; i++) {
            output[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            output[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }

        return string(output);
    }

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);

        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    function _deploymentJson(
        address marketFactory,
        address mockUsdc,
        address[] memory seededMarkets,
        address deployer,
        address resolver,
        string memory mode,
        string memory settlementTokenStrategy
    ) internal view returns (string memory) {
        return string.concat(
            "{\n",
            "  \"chainId\": ",
            _uintToString(block.chainid),
            ",\n",
            "  \"deploymentBlock\": ",
            _uintToString(block.number),
            ",\n",
            "  \"contracts\": {\n",
            "    \"MarketFactory\": \"",
            _addressToString(marketFactory),
            "\",\n",
            "    \"MockUSDC\": \"",
            _addressToString(mockUsdc),
            "\"\n",
            "  },\n",
            "  \"markets\": ",
            _addressArrayJson(seededMarkets),
            ",\n",
            "  \"metadata\": {\n",
            "    \"deployer\": \"",
            _addressToString(deployer),
            "\",\n",
            "    \"resolver\": \"",
            _addressToString(resolver),
            "\",\n",
            "    \"settlementTokenStrategy\": \"",
            settlementTokenStrategy,
            "\",\n",
            "    \"mode\": \"",
            mode,
            "\"\n",
            "  }\n",
            "}\n"
        );
    }

    function _addressArrayJson(address[] memory values) internal pure returns (string memory json) {
        json = "[";

        for (uint256 i = 0; i < values.length; i++) {
            json = string.concat(json, i == 0 ? "" : ", ", "\"", _addressToString(values[i]), "\"");
        }

        return string.concat(json, "]");
    }
}
