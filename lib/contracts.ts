import { parseEther, parseUnits, type Address } from "viem";

// Deployed contract addresses
export const CONTRACTS = {
  // Ethereum mainnet
  mainnet: {
    videoPost: "0x06D46d664130A2A210a056204d93B41549081776" as Address,
    tipContract: "0x5E6e4f7232D824588B354a4748aE8379BF58EE9a" as Address,
    reactions: "0xae3FF6C0FD07005a0ef16E83572bC68098be4fd3" as Address,
    usdcToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
  },
  // Base
  base: {
    tipContract: "0x0d5e8E64919a86911b7175a92b88B3D2a51Ca2C4" as Address,
    usdcToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
  },
  // Sepolia testnet
  sepolia: {
    videoPost: "0x0000000000000000000000000000000000000000" as Address,
    tipContract: "0x0000000000000000000000000000000000000000" as Address,
    reactions: "0x0000000000000000000000000000000000000000" as Address,
    usdcToken: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
  },
} as const;

// ABI: VideoPost contract
export const VIDEO_POST_ABI = [
  {
    type: "function",
    name: "postVideo",
    inputs: [
      { name: "ipfsCid", type: "string" },
      { name: "playbackId", type: "string" },
      { name: "caption", type: "string" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getVideo",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "poster", type: "address" },
      { name: "ipfsCid", type: "string" },
      { name: "playbackId", type: "string" },
      { name: "caption", type: "string" },
      { name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalVideos",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "VideoPosted",
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "poster", type: "address" },
      { indexed: false, name: "ipfsCid", type: "string" },
      { indexed: false, name: "playbackId", type: "string" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
] as const;

// ABI: Tip contract
export const TIP_CONTRACT_ABI = [
  {
    type: "function",
    name: "tipETH",
    inputs: [
      { name: "creator", type: "address" },
      { name: "videoCid", type: "string" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "tipUSDC",
    inputs: [
      { name: "creator", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "videoCid", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "platformFeePercent",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "TipSent",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "videoCid", type: "string" },
    ],
  },
] as const;

// ABI: Reactions contract
export const REACTIONS_ABI = [
  {
    type: "function",
    name: "like",
    inputs: [{ name: "videoCid", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unlike",
    inputs: [{ name: "videoCid", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getLikeCount",
    inputs: [{ name: "videoCid", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasLiked",
    inputs: [
      { name: "user", type: "address" },
      { name: "videoCid", type: "string" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Liked",
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "videoCid", type: "string" },
    ],
  },
] as const;

// ERC-20 minimal ABI for USDC approval
export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// Tip presets
export const TIP_PRESETS = [
  {
    label: "0.001 ETH",
    amount: parseEther("0.001"),
    displayAmount: "0.001 ETH",
    token: "ETH" as const,
    chain: "ethereum" as const,
  },
  {
    label: "$1 USDC",
    amount: parseUnits("1", 6),
    displayAmount: "$1",
    token: "USDC" as const,
    chain: "ethereum" as const,
  },
  {
    label: "$5 USDC",
    amount: parseUnits("5", 6),
    displayAmount: "$5",
    token: "USDC" as const,
    chain: "base" as const,
  },
  {
    label: "$10 USDC",
    amount: parseUnits("10", 6),
    displayAmount: "$10",
    token: "USDC" as const,
    chain: "base" as const,
  },
] as const;
