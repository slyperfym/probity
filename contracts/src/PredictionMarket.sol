// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./interfaces/IERC20.sol";

interface IMarketFactoryOwner {
    function owner() external view returns (address);
}

contract PredictionMarket {
    enum Side {
        Yes,
        No
    }

    enum Status {
        Active,
        Resolved,
        Cancelled
    }

    enum Outcome {
        Unresolved,
        Yes,
        No
    }

    address public immutable factory;
    address public immutable creator;
    IERC20 public immutable settlementToken;
    address public immutable resolver;
    uint256 public immutable expirationTime;
    uint256 public constant OWNER_CANCELLATION_GRACE_PERIOD = 7 days;

    string public title;
    string public metadataURI;
    string private _resolutionEvidence;

    Status public status;
    Outcome public resolvedOutcome;

    uint256 public totalYesShares;
    uint256 public totalNoShares;
    uint256 public totalDeposited;

    mapping(address user => uint256 shares) public yesShares;
    mapping(address user => uint256 shares) public noShares;
    mapping(address user => bool claimed) public claimed;

    uint256 private _locked = 1;

    event SharesPurchased(
        address indexed buyer,
        Side indexed side,
        uint256 amount,
        uint256 shares,
        uint256 totalYesShares,
        uint256 totalNoShares
    );
    event MarketResolved(address indexed resolver, Outcome indexed outcome, uint256 totalDeposited);
    event MarketCancelled(address indexed canceller);
    event WinningsClaimed(address indexed user, uint256 amount);
    event RefundClaimed(address indexed user, uint256 amount);
    event YesSold(address indexed user, uint256 shares, uint256 payout);
    event NoSold(address indexed user, uint256 shares, uint256 payout);

    error ZeroAddress();
    error EmptyTitle();
    error InvalidExpiration();
    error MarketNotActive();
    error MarketNotExpired();
    error MarketNotCancelled();
    error MarketAlreadyResolved();
    error MarketCancelledStatus();
    error MarketExpired();
    error UnauthorizedResolver();
    error UnauthorizedCanceller();
    error InvalidOutcome();
    error AmountZero();
    error InsufficientPosition();
    error InsufficientContractLiquidity();
    error TokenTransferFailed();
    error AlreadyClaimed();
    error NothingToClaim();
    error NothingToRefund();
    error NoWinningShares();
    error Reentrancy();

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrancy();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(
        address factory_,
        address creator_,
        address settlementToken_,
        address resolver_,
        uint256 expirationTime_,
        string memory title_,
        string memory metadataURI_
    ) {
        if (factory_ == address(0) || creator_ == address(0) || settlementToken_ == address(0)) {
            revert ZeroAddress();
        }
        if (resolver_ == address(0)) revert ZeroAddress();
        if (bytes(title_).length == 0) revert EmptyTitle();
        if (expirationTime_ <= block.timestamp) revert InvalidExpiration();

        factory = factory_;
        creator = creator_;
        settlementToken = IERC20(settlementToken_);
        resolver = resolver_;
        expirationTime = expirationTime_;
        title = title_;
        metadataURI = metadataURI_;
        status = Status.Active;
        resolvedOutcome = Outcome.Unresolved;
    }

    function buyYes(uint256 amount) external {
        _buy(Side.Yes, amount);
    }

    function buyNo(uint256 amount) external {
        _buy(Side.No, amount);
    }

    function sellYes(uint256 amount) external returns (uint256 payout) {
        payout = _sell(Side.Yes, amount);
    }

    function sellNo(uint256 amount) external returns (uint256 payout) {
        payout = _sell(Side.No, amount);
    }

    function resolve(Outcome outcome) external {
        if (msg.sender != resolver) revert UnauthorizedResolver();
        if (status == Status.Cancelled) revert MarketCancelledStatus();
        if (status != Status.Active) revert MarketAlreadyResolved();
        if (block.timestamp < expirationTime) revert MarketNotExpired();
        if (outcome != Outcome.Yes && outcome != Outcome.No) revert InvalidOutcome();

        status = Status.Resolved;
        resolvedOutcome = outcome;

        emit MarketResolved(msg.sender, outcome, totalDeposited);
    }

    function cancel() external {
        if (status == Status.Cancelled) revert MarketCancelledStatus();
        if (status != Status.Active) revert MarketAlreadyResolved();
        if (block.timestamp < expirationTime) revert MarketNotExpired();

        bool resolverCanCancel = msg.sender == resolver;
        bool ownerCanCancel = msg.sender == IMarketFactoryOwner(factory).owner()
            && block.timestamp >= expirationTime + OWNER_CANCELLATION_GRACE_PERIOD;

        if (!resolverCanCancel && !ownerCanCancel) revert UnauthorizedCanceller();

        status = Status.Cancelled;

        emit MarketCancelled(msg.sender);
    }

    function claim() external nonReentrant returns (uint256 payout) {
        if (status == Status.Cancelled) revert MarketCancelledStatus();
        if (status != Status.Resolved) revert MarketNotExpired();
        if (claimed[msg.sender]) revert AlreadyClaimed();

        uint256 userWinningShares;
        uint256 totalWinningShares;

        if (resolvedOutcome == Outcome.Yes) {
            userWinningShares = yesShares[msg.sender];
            totalWinningShares = totalYesShares;
        } else if (resolvedOutcome == Outcome.No) {
            userWinningShares = noShares[msg.sender];
            totalWinningShares = totalNoShares;
        } else {
            revert InvalidOutcome();
        }

        if (totalWinningShares == 0) revert NoWinningShares();
        if (userWinningShares == 0) revert NothingToClaim();

        claimed[msg.sender] = true;
        payout = (userWinningShares * totalDeposited) / totalWinningShares;

        if (!settlementToken.transfer(msg.sender, payout)) revert TokenTransferFailed();

        emit WinningsClaimed(msg.sender, payout);
    }

    function claimRefund() external nonReentrant returns (uint256 refund) {
        if (status != Status.Cancelled) revert MarketNotCancelled();

        uint256 yes = yesShares[msg.sender];
        uint256 no = noShares[msg.sender];
        refund = yes + no;

        if (refund == 0) revert NothingToRefund();
        if (refund > totalDeposited || refund > settlementToken.balanceOf(address(this))) {
            revert InsufficientContractLiquidity();
        }

        yesShares[msg.sender] = 0;
        noShares[msg.sender] = 0;
        totalYesShares -= yes;
        totalNoShares -= no;
        totalDeposited -= refund;

        if (!settlementToken.transfer(msg.sender, refund)) revert TokenTransferFailed();

        emit RefundClaimed(msg.sender, refund);
    }

    function refundAmount(address user) external view returns (uint256) {
        if (status != Status.Cancelled) {
            return 0;
        }

        return yesShares[user] + noShares[user];
    }

    function getPosition(address user) external view returns (uint256 yes, uint256 no, bool hasClaimed) {
        return (yesShares[user], noShares[user], claimed[user]);
    }

    function resolutionEvidence() external view returns (string memory) {
        return _resolutionEvidence;
    }

    function isExpired() external view returns (bool) {
        return block.timestamp >= expirationTime;
    }

    function _buy(Side side, uint256 amount) internal nonReentrant {
        if (status != Status.Active) revert MarketNotActive();
        if (block.timestamp >= expirationTime) revert MarketNotActive();
        if (amount == 0) revert AmountZero();

        if (!settlementToken.transferFrom(msg.sender, address(this), amount)) {
            revert TokenTransferFailed();
        }

        if (side == Side.Yes) {
            yesShares[msg.sender] += amount;
            totalYesShares += amount;
        } else {
            noShares[msg.sender] += amount;
            totalNoShares += amount;
        }

        totalDeposited += amount;

        emit SharesPurchased(msg.sender, side, amount, amount, totalYesShares, totalNoShares);
    }

    function _sell(Side side, uint256 amount) internal nonReentrant returns (uint256 payout) {
        if (status == Status.Cancelled) revert MarketCancelledStatus();
        if (status != Status.Active) revert MarketAlreadyResolved();
        if (block.timestamp >= expirationTime) revert MarketExpired();
        if (amount == 0) revert AmountZero();

        uint256 totalShares = totalYesShares + totalNoShares;
        uint256 sideShares = side == Side.Yes ? totalYesShares : totalNoShares;

        if (side == Side.Yes) {
            if (yesShares[msg.sender] < amount) revert InsufficientPosition();
        } else {
            if (noShares[msg.sender] < amount) revert InsufficientPosition();
        }

        // MVP sell-back pricing: pay the seller at the current pool-implied
        // side probability. This is intentionally conservative and is not a
        // production orderbook or CLOB pricing model.
        payout = totalShares == 0 ? 0 : (amount * sideShares) / totalShares;

        uint256 availableLiquidity = settlementToken.balanceOf(address(this));
        if (payout > availableLiquidity) revert InsufficientContractLiquidity();

        if (side == Side.Yes) {
            yesShares[msg.sender] -= amount;
            totalYesShares -= amount;
            emit YesSold(msg.sender, amount, payout);
        } else {
            noShares[msg.sender] -= amount;
            totalNoShares -= amount;
            emit NoSold(msg.sender, amount, payout);
        }

        totalDeposited -= payout;

        if (!settlementToken.transfer(msg.sender, payout)) revert TokenTransferFailed();
    }
}
