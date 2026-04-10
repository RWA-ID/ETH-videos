// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Reactions
 * @notice Lightweight on-chain like/unlike reactions for ethvideos.eth.
 *         Gas-optimized: uses packed bit storage where possible.
 *         Emits events so off-chain indexers can track counts.
 */
contract Reactions {
    // videoCid => total likes
    mapping(string => uint256) private _likeCounts;

    // keccak256(abi.encodePacked(user, videoCid)) => has liked
    mapping(bytes32 => bool) private _liked;

    event Liked(address indexed user, string indexed videoCid);
    event Unliked(address indexed user, string indexed videoCid);

    error AlreadyLiked();
    error NotLiked();
    error EmptyCID();

    /**
     * @notice Like a video. One like per address per video.
     */
    function like(string calldata videoCid) external {
        if (bytes(videoCid).length == 0) revert EmptyCID();

        bytes32 key = _key(msg.sender, videoCid);
        if (_liked[key]) revert AlreadyLiked();

        _liked[key] = true;
        ++_likeCounts[videoCid];

        emit Liked(msg.sender, videoCid);
    }

    /**
     * @notice Unlike a video.
     */
    function unlike(string calldata videoCid) external {
        bytes32 key = _key(msg.sender, videoCid);
        if (!_liked[key]) revert NotLiked();

        _liked[key] = false;
        --_likeCounts[videoCid];

        emit Unliked(msg.sender, videoCid);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    function getLikeCount(string calldata videoCid)
        external
        view
        returns (uint256)
    {
        return _likeCounts[videoCid];
    }

    function hasLiked(address user, string calldata videoCid)
        external
        view
        returns (bool)
    {
        return _liked[_key(user, videoCid)];
    }

    function _key(address user, string calldata videoCid)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(user, videoCid));
    }
}
