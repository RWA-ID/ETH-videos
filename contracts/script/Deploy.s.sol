// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VideoPost.sol";
import "../src/TipContract.sol";
import "../src/Reactions.sol";

/**
 * @notice Deploy all ethvideos.eth contracts.
 *
 * Usage:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url $MAINNET_RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify \
 *     --etherscan-api-key $ETHERSCAN_API_KEY
 *
 * For Base:
 *   forge script script/Deploy.s.sol:DeployBase \
 *     --rpc-url $BASE_RPC_URL ...
 */
contract Deploy is Script {
    // Ethereum mainnet USDC
    address constant USDC_MAINNET = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        VideoPost videoPost = new VideoPost(deployer);
        TipContract tip = new TipContract(USDC_MAINNET, treasury, deployer);
        Reactions reactions = new Reactions();

        vm.stopBroadcast();

        console.log("=== ethvideos.eth Deployment (Mainnet) ===");
        console.log("VideoPost:   ", address(videoPost));
        console.log("TipContract: ", address(tip));
        console.log("Reactions:   ", address(reactions));
        console.log("Treasury:    ", treasury);
    }
}

contract DeployBase is Script {
    // Base USDC
    address constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        // Only TipContract needed on Base (videos are posted on mainnet)
        TipContract tip = new TipContract(USDC_BASE, treasury, deployer);

        vm.stopBroadcast();

        console.log("=== ethvideos.eth Deployment (Base) ===");
        console.log("TipContract (Base): ", address(tip));
    }
}

contract DeploySepolia is Script {
    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        // Deploy mock USDC for testing
        address mockUSDC = address(0); // deploy MockUSDC first if needed

        vm.startBroadcast(pk);

        VideoPost videoPost = new VideoPost(deployer);
        // TipContract requires USDC — use a mock or testnet USDC
        Reactions reactions = new Reactions();

        vm.stopBroadcast();

        console.log("=== ethvideos.eth Deployment (Sepolia) ===");
        console.log("VideoPost:   ", address(videoPost));
        console.log("Reactions:   ", address(reactions));
    }
}
