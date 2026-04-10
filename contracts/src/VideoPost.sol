// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VideoPost
 * @notice Records IPFS CIDs + Livepeer playback IDs for ethvideos.eth posts on-chain.
 *         Each post is permanently indexed via the VideoPosted event.
 */
contract VideoPost is Ownable, ReentrancyGuard {
    struct Video {
        address poster;
        string ipfsCid;      // IPFS CID of metadata JSON
        string playbackId;   // Livepeer playback ID for HLS streaming
        string caption;
        uint256 timestamp;
    }

    // tokenId => Video
    mapping(uint256 => Video) private _videos;

    // address => list of tokenIds
    mapping(address => uint256[]) private _userVideos;

    uint256 private _totalVideos;

    // Max caption length
    uint256 public constant MAX_CAPTION_LENGTH = 300;

    event VideoPosted(
        uint256 indexed tokenId,
        address indexed poster,
        string ipfsCid,
        string playbackId,
        uint256 timestamp
    );

    event VideoRemoved(uint256 indexed tokenId, address indexed poster);

    error InvalidCID();
    error CaptionTooLong();
    error NotPoster();
    error VideoNotFound();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Post a new video. Logs the IPFS CID and Livepeer playback ID.
     * @param ipfsCid  IPFS CID of the video metadata JSON
     * @param playbackId Livepeer playback ID
     * @param caption  Short caption (max 300 chars)
     * @return tokenId  The ID assigned to this post
     */
    function postVideo(
        string calldata ipfsCid,
        string calldata playbackId,
        string calldata caption
    ) external nonReentrant returns (uint256 tokenId) {
        if (bytes(ipfsCid).length == 0) revert InvalidCID();
        if (bytes(caption).length > MAX_CAPTION_LENGTH) revert CaptionTooLong();

        tokenId = ++_totalVideos;

        _videos[tokenId] = Video({
            poster: msg.sender,
            ipfsCid: ipfsCid,
            playbackId: playbackId,
            caption: caption,
            timestamp: block.timestamp
        });

        _userVideos[msg.sender].push(tokenId);

        emit VideoPosted(tokenId, msg.sender, ipfsCid, playbackId, block.timestamp);
    }

    /**
     * @notice Remove a video post (only the original poster can remove).
     *         The IPFS data remains on IPFS — this just removes the on-chain record.
     */
    function removeVideo(uint256 tokenId) external nonReentrant {
        Video storage video = _videos[tokenId];
        if (video.poster == address(0)) revert VideoNotFound();
        if (video.poster != msg.sender && owner() != msg.sender) revert NotPoster();

        address poster = video.poster;
        delete _videos[tokenId];

        emit VideoRemoved(tokenId, poster);
    }

    // ─── View functions ────────────────────────────────────────────────────────

    function getVideo(uint256 tokenId)
        external
        view
        returns (
            address poster,
            string memory ipfsCid,
            string memory playbackId,
            string memory caption,
            uint256 timestamp
        )
    {
        Video storage v = _videos[tokenId];
        if (v.poster == address(0)) revert VideoNotFound();
        return (v.poster, v.ipfsCid, v.playbackId, v.caption, v.timestamp);
    }

    function getUserVideos(address user) external view returns (uint256[] memory) {
        return _userVideos[user];
    }

    function totalVideos() external view returns (uint256) {
        return _totalVideos;
    }
}
