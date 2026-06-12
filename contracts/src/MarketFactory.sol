// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { PredictionMarket } from "./PredictionMarket.sol";

contract MarketFactory {
    address public owner;

    mapping(address resolver => bool approved) public approvedResolvers;
    mapping(address creator => bool approved) public approvedCreators;
    mapping(address token => bool approved) public allowedSettlementTokens;
    mapping(address market => bool approved) public isMarket;

    address[] private _markets;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ResolverApprovalUpdated(address indexed resolver, bool approved);
    event CreatorApprovalUpdated(address indexed creator, bool approved);
    event SettlementTokenApprovalUpdated(address indexed token, bool approved);
    event MarketCreated(
        address indexed market,
        address indexed creator,
        address indexed settlementToken,
        address resolver,
        uint256 expirationTime,
        string title,
        string metadataURI
    );

    error NotOwner();
    error NotApprovedCreator();
    error ResolverNotApproved();
    error ZeroAddress();
    error InvalidSettlementToken();
    error SettlementTokenNotApproved();
    error EmptyTitle();
    error InvalidExpiration();

    constructor() {
        owner = msg.sender;
        approvedCreators[msg.sender] = true;

        emit OwnershipTransferred(address(0), msg.sender);
        emit CreatorApprovalUpdated(msg.sender, true);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();

        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setResolverApproval(address resolver, bool approved) external onlyOwner {
        if (resolver == address(0)) revert ZeroAddress();

        approvedResolvers[resolver] = approved;
        emit ResolverApprovalUpdated(resolver, approved);
    }

    function setCreatorApproval(address creator, bool approved) external onlyOwner {
        if (creator == address(0)) revert ZeroAddress();

        approvedCreators[creator] = approved;
        emit CreatorApprovalUpdated(creator, approved);
    }

    function setSettlementTokenApproval(address token, bool approved) external onlyOwner {
        if (token == address(0)) revert InvalidSettlementToken();

        allowedSettlementTokens[token] = approved;
        emit SettlementTokenApprovalUpdated(token, approved);
    }

    function createMarket(
        address settlementToken,
        address resolver,
        uint256 expirationTime,
        string calldata title,
        string calldata metadataURI
    ) external returns (address market) {
        if (!approvedCreators[msg.sender]) revert NotApprovedCreator();
        if (resolver == address(0)) revert ZeroAddress();
        if (settlementToken == address(0)) revert InvalidSettlementToken();
        if (!allowedSettlementTokens[settlementToken]) revert SettlementTokenNotApproved();
        if (!approvedResolvers[resolver]) revert ResolverNotApproved();
        if (bytes(title).length == 0) revert EmptyTitle();
        if (expirationTime <= block.timestamp) revert InvalidExpiration();

        PredictionMarket predictionMarket = new PredictionMarket(
            address(this),
            msg.sender,
            settlementToken,
            resolver,
            expirationTime,
            title,
            metadataURI
        );

        market = address(predictionMarket);
        isMarket[market] = true;
        _markets.push(market);

        emit MarketCreated(
            market, msg.sender, settlementToken, resolver, expirationTime, title, metadataURI
        );
    }

    function allMarkets() external view returns (address[] memory) {
        return _markets;
    }

    function marketCount() external view returns (uint256) {
        return _markets.length;
    }

    function marketAt(uint256 index) external view returns (address) {
        return _markets[index];
    }
}
