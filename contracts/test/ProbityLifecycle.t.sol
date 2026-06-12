// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketFactory } from "../src/MarketFactory.sol";
import { PredictionMarket } from "../src/PredictionMarket.sol";
import { MockUSDC } from "../src/mocks/MockUSDC.sol";
import { TestBase } from "./TestBase.sol";

contract ProbityLifecycleTest is TestBase {
    uint256 internal constant USDC = 1e6;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal resolver = address(0xCAFE);
    address internal creator = address(0xC0FFEE);
    address internal otherToken = address(0x0BAD);

    MockUSDC internal usdc;
    MarketFactory internal factory;
    PredictionMarket internal market;
    uint256 internal expiration;

    function setUp() public {
        usdc = new MockUSDC();
        factory = new MarketFactory();

        factory.setResolverApproval(resolver, true);
        factory.setCreatorApproval(creator, true);
        factory.setSettlementTokenApproval(address(usdc), true);

        usdc.mint(alice, 1_000 * USDC);
        usdc.mint(bob, 1_000 * USDC);

        expiration = block.timestamp + 7 days;

        vm.prank(creator);
        address marketAddress = factory.createMarket(
            address(usdc),
            resolver,
            expiration,
            "Will the Fed cut rates at the next FOMC meeting?",
            "ipfs://probity/fed-cut-next-fomc"
        );

        market = PredictionMarket(marketAddress);
    }

    function testFactoryCreatesAndRegistersMarket() public {
        assertEq(factory.marketCount(), 1, "market count");
        assertEq(factory.marketAt(0), address(market), "market address");
        assertTrue(factory.isMarket(address(market)), "market registered");
        assertEq(address(market.settlementToken()), address(usdc), "settlement token");
        assertEq(market.resolver(), resolver, "resolver");
        assertEq(market.creator(), creator, "creator");
    }

    function testUsersCanBuyYesAndNoShares() public {
        _approve(alice, 100 * USDC);
        _approve(bob, 60 * USDC);

        vm.prank(alice);
        market.buyYes(100 * USDC);

        vm.prank(bob);
        market.buyNo(60 * USDC);

        assertEq(market.yesShares(alice), 100 * USDC, "alice yes");
        assertEq(market.noShares(bob), 60 * USDC, "bob no");
        assertEq(market.totalYesShares(), 100 * USDC, "total yes");
        assertEq(market.totalNoShares(), 60 * USDC, "total no");
        assertEq(market.totalDeposited(), 160 * USDC, "total deposited");
        assertEq(usdc.balanceOf(address(market)), 160 * USDC, "market balance");
    }

    function testUserCanSellYesBeforeExpiry() public {
        _approve(alice, 100 * USDC);
        _approve(bob, 100 * USDC);

        vm.prank(alice);
        market.buyYes(100 * USDC);

        vm.prank(bob);
        market.buyNo(100 * USDC);

        uint256 aliceBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        uint256 payout = market.sellYes(40 * USDC);

        assertEq(payout, 20 * USDC, "payout");
        assertEq(market.yesShares(alice), 60 * USDC, "alice yes reduced");
        assertEq(market.totalYesShares(), 60 * USDC, "total yes reduced");
        assertEq(market.totalDeposited(), 180 * USDC, "deposits reduced");
        assertEq(usdc.balanceOf(alice), aliceBefore + payout, "alice paid");
        assertEq(usdc.balanceOf(address(market)), 180 * USDC, "market solvent");
    }

    function testUserCanSellNoBeforeExpiry() public {
        _approve(alice, 100 * USDC);
        _approve(bob, 100 * USDC);

        vm.prank(alice);
        market.buyYes(100 * USDC);

        vm.prank(bob);
        market.buyNo(100 * USDC);

        uint256 bobBefore = usdc.balanceOf(bob);

        vm.prank(bob);
        uint256 payout = market.sellNo(40 * USDC);

        assertEq(payout, 20 * USDC, "payout");
        assertEq(market.noShares(bob), 60 * USDC, "bob no reduced");
        assertEq(market.totalNoShares(), 60 * USDC, "total no reduced");
        assertEq(market.totalDeposited(), 180 * USDC, "deposits reduced");
        assertEq(usdc.balanceOf(bob), bobBefore + payout, "bob paid");
        assertEq(usdc.balanceOf(address(market)), 180 * USDC, "market solvent");
    }

    function testCannotSellMoreThanOwned() public {
        _approve(alice, 10 * USDC);

        vm.prank(alice);
        market.buyYes(10 * USDC);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.InsufficientPosition.selector);
        market.sellYes(11 * USDC);
    }

    function testCannotSellZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AmountZero.selector);
        market.sellYes(0);
    }

    function testCannotSellAfterExpiration() public {
        _approve(alice, 10 * USDC);

        vm.prank(alice);
        market.buyYes(10 * USDC);

        vm.warp(expiration);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketExpired.selector);
        market.sellYes(1 * USDC);
    }

    function testCannotSellAfterResolution() public {
        _approve(alice, 10 * USDC);

        vm.prank(alice);
        market.buyYes(10 * USDC);

        vm.warp(expiration + 1);

        vm.prank(resolver);
        market.resolve(PredictionMarket.Outcome.Yes, "ipfs://evidence/alice-yes");

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketAlreadyResolved.selector);
        market.sellYes(1 * USDC);
    }

    function testCannotBuyAfterExpiration() public {
        _approve(alice, 10 * USDC);

        vm.warp(expiration);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketNotActive.selector);
        market.buyYes(10 * USDC);
    }

    function testOnlyResolverCanResolveAfterExpiration() public {
        vm.warp(expiration + 1);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.UnauthorizedResolver.selector);
        market.resolve(PredictionMarket.Outcome.Yes, "ipfs://evidence/yes");

        vm.prank(resolver);
        market.resolve(PredictionMarket.Outcome.Yes, "ipfs://evidence/yes");

        assertEq(uint256(market.status()), uint256(PredictionMarket.Status.Resolved), "resolved");
        assertEq(uint256(market.resolvedOutcome()), uint256(PredictionMarket.Outcome.Yes), "outcome");
        assertEq(market.resolutionEvidence(), "ipfs://evidence/yes", "evidence");
    }

    function testCannotResolveBeforeExpiration() public {
        vm.prank(resolver);
        vm.expectRevert(PredictionMarket.MarketNotExpired.selector);
        market.resolve(PredictionMarket.Outcome.Yes, "ipfs://evidence/early");
    }

    function testResolutionRequiresEvidence() public {
        vm.warp(expiration + 1);

        vm.prank(resolver);
        vm.expectRevert(PredictionMarket.EmptyEvidence.selector);
        market.resolve(PredictionMarket.Outcome.Yes, "");
    }

    function testWinningUsersClaimProRataPayout() public {
        _approve(alice, 100 * USDC);
        _approve(bob, 50 * USDC);

        vm.prank(alice);
        market.buyYes(100 * USDC);

        vm.prank(bob);
        market.buyNo(50 * USDC);

        vm.warp(expiration + 1);

        vm.prank(resolver);
        market.resolve(PredictionMarket.Outcome.Yes, "ipfs://evidence/yes");

        vm.prank(alice);
        uint256 payout = market.claim();

        assertEq(payout, 150 * USDC, "payout");
        assertEq(usdc.balanceOf(alice), 1_050 * USDC, "alice final balance");
        assertTrue(market.claimed(alice), "alice claimed");
        assertEq(usdc.balanceOf(address(market)), 0, "market drained");
    }

    function testLosingUsersCannotClaim() public {
        _approve(alice, 100 * USDC);
        _approve(bob, 50 * USDC);

        vm.prank(alice);
        market.buyYes(100 * USDC);

        vm.prank(bob);
        market.buyNo(50 * USDC);

        vm.warp(expiration + 1);

        vm.prank(resolver);
        market.resolve(PredictionMarket.Outcome.Yes, "ipfs://evidence/yes");

        vm.prank(bob);
        vm.expectRevert(PredictionMarket.NothingToClaim.selector);
        market.claim();
    }

    function testCannotClaimTwice() public {
        _approve(alice, 100 * USDC);

        vm.prank(alice);
        market.buyYes(100 * USDC);

        vm.warp(expiration + 1);

        vm.prank(resolver);
        market.resolve(PredictionMarket.Outcome.Yes, "ipfs://evidence/yes");

        vm.prank(alice);
        market.claim();

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AlreadyClaimed.selector);
        market.claim();
    }

    function testFactoryRequiresApprovedResolver() public {
        vm.prank(creator);
        vm.expectRevert(MarketFactory.ResolverNotApproved.selector);
        factory.createMarket(
            address(usdc),
            address(0xBAD),
            block.timestamp + 1 days,
            "Unapproved resolver market",
            "ipfs://probity/unapproved"
        );
    }

    function testResolverCanCancelAfterExpiration() public {
        vm.warp(expiration + 1);

        vm.prank(resolver);
        market.cancel();

        assertEq(uint256(market.status()), uint256(PredictionMarket.Status.Cancelled), "cancelled");
    }

    function testCannotCancelBeforeExpiration() public {
        vm.prank(resolver);
        vm.expectRevert(PredictionMarket.MarketNotExpired.selector);
        market.cancel();
    }

    function testFactoryOwnerCanEmergencyCancelAfterGracePeriod() public {
        vm.warp(expiration + market.OWNER_CANCELLATION_GRACE_PERIOD());

        market.cancel();

        assertEq(uint256(market.status()), uint256(PredictionMarket.Status.Cancelled), "owner cancelled");
    }

    function testUnauthorizedCancelRejected() public {
        vm.warp(expiration + 1);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.UnauthorizedCanceller.selector);
        market.cancel();
    }

    function testFactoryOwnerCannotCancelBeforeGracePeriod() public {
        vm.warp(expiration + 1);

        vm.expectRevert(PredictionMarket.UnauthorizedCanceller.selector);
        market.cancel();
    }

    function testNoBuyAfterCancellation() public {
        _cancelAfterExpiration();
        _approve(alice, 10 * USDC);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketNotActive.selector);
        market.buyYes(10 * USDC);
    }

    function testNoSellAfterCancellation() public {
        _approve(alice, 10 * USDC);
        vm.prank(alice);
        market.buyYes(10 * USDC);

        _cancelAfterExpiration();

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketCancelledStatus.selector);
        market.sellYes(1 * USDC);
    }

    function testNoResolutionAfterCancellation() public {
        _cancelAfterExpiration();

        vm.prank(resolver);
        vm.expectRevert(PredictionMarket.MarketCancelledStatus.selector);
        market.resolve(PredictionMarket.Outcome.Yes, "ipfs://evidence/late");
    }

    function testRefundYesOnlyPosition() public {
        _approve(alice, 100 * USDC);
        vm.prank(alice);
        market.buyYes(100 * USDC);

        _cancelAfterExpiration();

        vm.prank(alice);
        uint256 refund = market.claimRefund();

        assertEq(refund, 100 * USDC, "refund");
        assertEq(market.yesShares(alice), 0, "yes zero");
        assertEq(usdc.balanceOf(alice), 1_000 * USDC, "alice refunded");
    }

    function testRefundNoOnlyPosition() public {
        _approve(bob, 75 * USDC);
        vm.prank(bob);
        market.buyNo(75 * USDC);

        _cancelAfterExpiration();

        vm.prank(bob);
        uint256 refund = market.claimRefund();

        assertEq(refund, 75 * USDC, "refund");
        assertEq(market.noShares(bob), 0, "no zero");
        assertEq(usdc.balanceOf(bob), 1_000 * USDC, "bob refunded");
    }

    function testRefundBothSidesPosition() public {
        _approve(alice, 150 * USDC);
        vm.startPrank(alice);
        market.buyYes(100 * USDC);
        market.buyNo(50 * USDC);
        vm.stopPrank();

        _cancelAfterExpiration();

        vm.prank(alice);
        uint256 refund = market.claimRefund();

        assertEq(refund, 150 * USDC, "refund");
        assertEq(market.totalYesShares(), 0, "total yes");
        assertEq(market.totalNoShares(), 0, "total no");
        assertEq(market.totalDeposited(), 0, "total deposited");
    }

    function testPartialSellThenCancellationRefundsRemainingPosition() public {
        _approve(alice, 100 * USDC);
        _approve(bob, 100 * USDC);

        vm.prank(alice);
        market.buyYes(100 * USDC);
        vm.prank(bob);
        market.buyNo(100 * USDC);

        vm.prank(alice);
        market.sellYes(40 * USDC);

        _cancelAfterExpiration();

        vm.prank(alice);
        uint256 refund = market.claimRefund();

        assertEq(refund, 60 * USDC, "remaining yes only");
        assertEq(usdc.balanceOf(alice), 980 * USDC, "buy 100, sell 20, refund 60");
    }

    function testDuplicateRefundRejected() public {
        _approve(alice, 10 * USDC);
        vm.prank(alice);
        market.buyYes(10 * USDC);

        _cancelAfterExpiration();

        vm.prank(alice);
        market.claimRefund();

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.NothingToRefund.selector);
        market.claimRefund();
    }

    function testRefundWithNoPositionRejected() public {
        _cancelAfterExpiration();

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.NothingToRefund.selector);
        market.claimRefund();
    }

    function testNormalResolutionAndWinningClaimStillWork() public {
        testWinningUsersClaimProRataPayout();
    }

    function testUnapprovedSettlementTokenCannotCreateMarket() public {
        vm.prank(creator);
        vm.expectRevert(MarketFactory.SettlementTokenNotApproved.selector);
        factory.createMarket(
            otherToken,
            resolver,
            block.timestamp + 1 days,
            "Unapproved token market",
            "ipfs://probity/unapproved-token"
        );
    }

    function testApprovedSettlementTokenCanCreateMarket() public {
        MockUSDC secondToken = new MockUSDC();
        factory.setSettlementTokenApproval(address(secondToken), true);

        vm.prank(creator);
        address nextMarket = factory.createMarket(
            address(secondToken),
            resolver,
            block.timestamp + 1 days,
            "Approved token market",
            "ipfs://probity/approved-token"
        );

        assertTrue(factory.isMarket(nextMarket), "market registered");
    }

    function testOnlyOwnerCanModifySettlementTokenApproval() public {
        vm.prank(alice);
        vm.expectRevert(MarketFactory.NotOwner.selector);
        factory.setSettlementTokenApproval(otherToken, true);
    }

    function testCancelledMarketCannotUseNormalWinningClaim() public {
        _approve(alice, 10 * USDC);
        vm.prank(alice);
        market.buyYes(10 * USDC);

        _cancelAfterExpiration();

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketCancelledStatus.selector);
        market.claim();
    }

    function testRefundAccountingAndSolvencyInvariant() public {
        _approve(alice, 100 * USDC);
        _approve(bob, 80 * USDC);
        vm.prank(alice);
        market.buyYes(100 * USDC);
        vm.prank(bob);
        market.buyNo(80 * USDC);

        _cancelAfterExpiration();

        vm.prank(alice);
        market.claimRefund();
        vm.prank(bob);
        market.claimRefund();

        assertEq(market.totalDeposited(), 0, "deposits drained");
        assertEq(usdc.balanceOf(address(market)), 0, "contract solvent");
    }

    function _cancelAfterExpiration() internal {
        vm.warp(expiration + 1);
        vm.prank(resolver);
        market.cancel();
    }

    function _approve(address user, uint256 amount) internal {
        vm.prank(user);
        usdc.approve(address(market), amount);
    }
}
