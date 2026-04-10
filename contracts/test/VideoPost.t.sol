// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VideoPost.sol";
import "../src/TipContract.sol";
import "../src/Reactions.sol";

contract VideoPostTest is Test {
    VideoPost public videoPost;
    Reactions public reactions;
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);

    function setUp() public {
        videoPost = new VideoPost(address(this));
        reactions = new Reactions();
    }

    function test_PostVideo() public {
        vm.prank(alice);
        uint256 tokenId = videoPost.postVideo(
            "bafybeig123",
            "f5eese2o5la7bgpn",
            "gm frens #ethereum"
        );

        assertEq(tokenId, 1);

        (address poster, string memory cid, , , uint256 ts) = videoPost.getVideo(1);
        assertEq(poster, alice);
        assertEq(cid, "bafybeig123");
        assertGt(ts, 0);
    }

    function test_PostVideo_EmitEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit VideoPost.VideoPosted(1, alice, "bafybeig123", "playback1", block.timestamp);
        videoPost.postVideo("bafybeig123", "playback1", "caption");
    }

    function test_PostVideo_TooLongCaption() public {
        string memory longCaption = new string(301);
        vm.prank(alice);
        vm.expectRevert(VideoPost.CaptionTooLong.selector);
        videoPost.postVideo("bafybeig123", "playback1", longCaption);
    }

    function test_PostVideo_EmptyCID() public {
        vm.prank(alice);
        vm.expectRevert(VideoPost.InvalidCID.selector);
        videoPost.postVideo("", "playback1", "caption");
    }

    function test_TotalVideos() public {
        vm.startPrank(alice);
        videoPost.postVideo("cid1", "pid1", "caption 1");
        videoPost.postVideo("cid2", "pid2", "caption 2");
        vm.stopPrank();

        assertEq(videoPost.totalVideos(), 2);
    }

    function test_GetUserVideos() public {
        vm.startPrank(alice);
        videoPost.postVideo("cid1", "pid1", "c1");
        videoPost.postVideo("cid2", "pid2", "c2");
        vm.stopPrank();

        vm.prank(bob);
        videoPost.postVideo("cid3", "pid3", "c3");

        uint256[] memory aliceVideos = videoPost.getUserVideos(alice);
        assertEq(aliceVideos.length, 2);
        assertEq(aliceVideos[0], 1);
        assertEq(aliceVideos[1], 2);
    }

    function test_Reactions_Like() public {
        vm.prank(alice);
        reactions.like("bafybeig123");
        assertEq(reactions.getLikeCount("bafybeig123"), 1);
        assertTrue(reactions.hasLiked(alice, "bafybeig123"));
    }

    function test_Reactions_DoubleLike_Reverts() public {
        vm.startPrank(alice);
        reactions.like("bafybeig123");
        vm.expectRevert(Reactions.AlreadyLiked.selector);
        reactions.like("bafybeig123");
        vm.stopPrank();
    }

    function test_Reactions_Unlike() public {
        vm.startPrank(alice);
        reactions.like("bafybeig123");
        reactions.unlike("bafybeig123");
        vm.stopPrank();

        assertEq(reactions.getLikeCount("bafybeig123"), 0);
        assertFalse(reactions.hasLiked(alice, "bafybeig123"));
    }

    function test_MultipleLikers() public {
        vm.prank(alice);
        reactions.like("cid1");
        vm.prank(bob);
        reactions.like("cid1");

        assertEq(reactions.getLikeCount("cid1"), 2);
    }
}

contract TipContractTest is Test {
    TipContract public tipContract;
    address public creator = address(0xC8EAT0R);
    address public treasury = address(0x7825);
    address public tipper = address(0x71PP3R);

    function setUp() public {
        // Deploy with mock USDC
        tipContract = new TipContract(
            address(0x1), // mock USDC (not used in ETH tests)
            treasury,
            address(this)
        );
        vm.deal(tipper, 10 ether);
    }

    function test_TipETH() public {
        uint256 tipAmount = 0.01 ether;
        uint256 creatorBefore = creator.balance;
        uint256 treasuryBefore = treasury.balance;

        vm.prank(tipper);
        tipContract.tipETH{value: tipAmount}(creator, "bafybeig123");

        uint256 fee = (tipAmount * 500) / 10_000;
        assertEq(creator.balance - creatorBefore, tipAmount - fee);
        assertEq(treasury.balance - treasuryBefore, fee);
    }

    function test_TipETH_ZeroAmount_Reverts() public {
        vm.prank(tipper);
        vm.expectRevert(TipContract.InvalidAmount.selector);
        tipContract.tipETH{value: 0}(creator, "cid");
    }

    function test_TipETH_ZeroCreator_Reverts() public {
        vm.prank(tipper);
        vm.expectRevert(TipContract.InvalidCreator.selector);
        tipContract.tipETH{value: 0.01 ether}(address(0), "cid");
    }

    function test_SetPlatformFee() public {
        tipContract.setPlatformFee(250); // 2.5%
        assertEq(tipContract.platformFeePercent(), 250);
    }

    function test_SetPlatformFee_TooHigh_Reverts() public {
        vm.expectRevert(TipContract.FeeTooHigh.selector);
        tipContract.setPlatformFee(1001);
    }
}
