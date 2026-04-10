import { BigInt, store } from "@graphprotocol/graph-ts";
import {
  VideoPosted as VideoPostedEvent,
  VideoRemoved as VideoRemovedEvent,
} from "../generated/VideoPost/VideoPost";
import {
  Liked as LikedEvent,
  Unliked as UnlikedEvent,
} from "../generated/Reactions/Reactions";
import { Video, Like, Creator } from "../generated/schema";

// ─── VideoPost handlers ───────────────────────────────────────────────────────

export function handleVideoPosted(event: VideoPostedEvent): void {
  let video = new Video(event.params.ipfsCid);
  video.tokenId = event.params.tokenId;
  video.poster = event.params.poster;
  video.ipfsCid = event.params.ipfsCid;
  video.playbackId = event.params.playbackId;
  video.caption = "";
  video.timestamp = event.params.timestamp;
  video.blockNumber = event.block.number;
  video.txHash = event.transaction.hash;
  video.likes = BigInt.fromI32(0);
  video.removed = false;
  video.save();

  let creatorId = event.params.poster.toHexString().toLowerCase();
  let creator = Creator.load(creatorId);
  if (creator == null) {
    creator = new Creator(creatorId);
    creator.address = event.params.poster;
    creator.videoCount = BigInt.fromI32(0);
    creator.totalLikesReceived = BigInt.fromI32(0);
    creator.firstPostAt = event.params.timestamp;
    creator.lastPostAt = event.params.timestamp;
  }
  creator.videoCount = creator.videoCount.plus(BigInt.fromI32(1));
  creator.lastPostAt = event.params.timestamp;
  creator.save();
}

export function handleVideoRemoved(event: VideoRemovedEvent): void {
  // VideoRemoved only emits tokenId. We can't look up by tokenId since Video
  // is keyed by CID. Mark removal in a best-effort manner: a future contract
  // upgrade should include ipfsCid in the VideoRemoved event.
  // For now, the Video entity will remain but can be filtered client-side.
}

// ─── Reactions handlers ───────────────────────────────────────────────────────
//
// NOTE: `videoCid` is `indexed string` in the Solidity event, so TheGraph
// receives the keccak256 hash as Bytes — not the original CID string.
// We use the hash as the key for Like entities. Video.likes is updated
// only when the CID hash can be matched (it cannot here), so likes are
// tracked separately via the Like entity count.

export function handleLiked(event: LikedEvent): void {
  // videoCidHash is the keccak256 of the original CID string (EVM indexed string)
  let videoCidHash = event.params.videoCid.toHexString();
  let likeId = event.params.user.toHexString() + "-" + videoCidHash;

  // Idempotent: only create if not already liked
  let like = Like.load(likeId);
  if (like == null) {
    like = new Like(likeId);
    like.user = event.params.user;
    like.videoCidHash = videoCidHash;
    like.timestamp = event.block.timestamp;
    like.save();
  }
}

export function handleUnliked(event: UnlikedEvent): void {
  let videoCidHash = event.params.videoCid.toHexString();
  let likeId = event.params.user.toHexString() + "-" + videoCidHash;
  store.remove("Like", likeId);
}
