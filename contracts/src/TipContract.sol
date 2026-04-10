// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TipContract
 * @notice Accepts ETH and USDC tips for creators. Takes a 5% platform fee.
 *         Tips go directly to creator address (minus fee) in the same tx.
 *         Works on both Ethereum mainnet and Base (deploy separately).
 */
contract TipContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdcToken;
    address public platformTreasury;
    uint256 public platformFeePercent; // 500 = 5%
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE = 1_000; // 10% max

    event TipSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        address token, // address(0) for ETH
        string videoCid
    );

    event PlatformFeeUpdated(uint256 newFee);
    event TreasuryUpdated(address newTreasury);

    error InvalidCreator();
    error InvalidAmount();
    error FeeTooHigh();
    error TransferFailed();

    constructor(
        address _usdcToken,
        address _treasury,
        address _initialOwner
    ) Ownable(_initialOwner) {
        usdcToken = IERC20(_usdcToken);
        platformTreasury = _treasury;
        platformFeePercent = 500; // 5%
    }

    // ─── ETH Tips ──────────────────────────────────────────────────────────────

    /**
     * @notice Tip a creator in ETH. 5% goes to platform, rest to creator.
     * @param creator  Creator's wallet address
     * @param videoCid IPFS CID of the video being tipped
     */
    function tipETH(address creator, string calldata videoCid)
        external
        payable
        nonReentrant
    {
        if (creator == address(0)) revert InvalidCreator();
        if (msg.value == 0) revert InvalidAmount();

        uint256 fee = (msg.value * platformFeePercent) / FEE_DENOMINATOR;
        uint256 creatorAmount = msg.value - fee;

        // Send to creator
        (bool ok1, ) = payable(creator).call{value: creatorAmount}("");
        if (!ok1) revert TransferFailed();

        // Send fee to treasury
        if (fee > 0) {
            (bool ok2, ) = payable(platformTreasury).call{value: fee}("");
            if (!ok2) revert TransferFailed();
        }

        emit TipSent(msg.sender, creator, msg.value, address(0), videoCid);
    }

    // ─── USDC Tips ─────────────────────────────────────────────────────────────

    /**
     * @notice Tip a creator in USDC. Caller must approve this contract first.
     * @param creator  Creator's wallet address
     * @param amount   Amount in USDC (6 decimals)
     * @param videoCid IPFS CID of the video being tipped
     */
    function tipUSDC(
        address creator,
        uint256 amount,
        string calldata videoCid
    ) external nonReentrant {
        if (creator == address(0)) revert InvalidCreator();
        if (amount == 0) revert InvalidAmount();

        uint256 fee = (amount * platformFeePercent) / FEE_DENOMINATOR;
        uint256 creatorAmount = amount - fee;

        // Pull from sender
        usdcToken.safeTransferFrom(msg.sender, creator, creatorAmount);
        if (fee > 0) {
            usdcToken.safeTransferFrom(msg.sender, platformTreasury, fee);
        }

        emit TipSent(msg.sender, creator, amount, address(usdcToken), videoCid);
    }

    // ─── Owner functions ───────────────────────────────────────────────────────

    function setPlatformFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_FEE) revert FeeTooHigh();
        platformFeePercent = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidCreator();
        platformTreasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    // Emergency ETH recovery
    function rescueETH() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok);
    }

    receive() external payable {}
}
