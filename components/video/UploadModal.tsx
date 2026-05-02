"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Video, CheckCircle2, Loader2, AlertCircle, ExternalLink, ImagePlus, Zap, Plus } from "lucide-react";
import { useAccount } from "wagmi";
import { useWriteContract } from "wagmi";
import { validateVideoFile, getVideoDuration, validateVideoDuration, generateThumbnail, extractHashtags, cn } from "@/lib/utils";
import { uploadToLivepeer } from "@/lib/livepeer";
import { uploadFileToPinata, uploadJSONToPinata, buildVideoMetadata } from "@/lib/ipfs";
import { CONTRACTS, VIDEO_POST_ABI } from "@/lib/contracts";
import { useENSName } from "@/hooks/useENS";
import type { UploadProgress, VideoMetadata } from "@/types";

const GRAD = "linear-gradient(135deg, #00f5ff 0%, #bf5af2 50%, #ff375f 100%)";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (video: VideoMetadata) => void;
}

export function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const { address } = useAccount();
  const { name: ensName } = useENSName(address);
  const { writeContractAsync } = useWriteContract();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [mintOnChain, setMintOnChain] = useState(true);
  const [progress, setProgress] = useState<UploadProgress>({ stage: "idle", percent: 0, message: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    const validation = validateVideoFile(f);
    if (!validation.valid) { setProgress({ stage: "error", percent: 0, message: validation.error! }); return; }
    try {
      const duration = await getVideoDuration(f);
      const durationCheck = validateVideoDuration(duration);
      if (!durationCheck.valid) { setProgress({ stage: "error", percent: 0, message: durationCheck.error! }); return; }
    } catch { /* allow */ }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setProgress({ stage: "idle", percent: 0, message: "" });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".webm", ".mov"] },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
    noClick: true,
  });

  const handlePost = useCallback(async () => {
    if (!file || !address) return;
    try {
      setProgress({ stage: "uploading", percent: 0, message: "Uploading to Livepeer..." });
      const { playbackId } = await uploadToLivepeer(file, caption || file.name, (pct) =>
        setProgress({ stage: "uploading", percent: pct, message: `Uploading: ${pct}%` })
      );
      setProgress({ stage: "transcoding", percent: 30, message: thumbnailFile ? "Pinning cover image..." : "Transcoding video..." });
      let thumbnailCid = "";
      const thumbSource = thumbnailFile ?? await generateThumbnail(file, 2);
      if (thumbSource) {
        setProgress({ stage: "pinning", percent: 50, message: "Pinning thumbnail to IPFS..." });
        thumbnailCid = await uploadFileToPinata(thumbSource, thumbnailFile ? `cover-${Date.now()}.${thumbnailFile.name.split(".").pop()}` : `thumb-${Date.now()}.jpg`);
      }
      setProgress({ stage: "pinning", percent: 60, message: "Pinning video to IPFS permanently..." });
      const videoCid = await uploadFileToPinata(file, file.name, (pct) =>
        setProgress({ stage: "pinning", percent: 60 + pct * 0.2, message: `Pinning: ${pct}%` })
      );
      setProgress({ stage: "pinning", percent: 82, message: "Creating video metadata..." });
      const hashtags = extractHashtags(caption);
      const metadata = await buildVideoMetadata({ videoCid, thumbnailCid, playbackId, caption, hashtags, duration: 0, poster: address, posterEns: ensName || undefined });
      const metadataCid = await uploadJSONToPinata(metadata, `video-${Date.now()}.json`);
      setProgress({ stage: "posting", percent: 90, message: "Recording on Ethereum..." });
      const txHash = await writeContractAsync({
        address: CONTRACTS.mainnet.videoPost,
        abi: VIDEO_POST_ABI,
        functionName: "postVideo",
        args: [metadataCid, playbackId, caption],
      });
      setProgress({ stage: "done", percent: 100, message: "Posted successfully!", playbackId, cid: metadataCid, txHash });
      onSuccess?.({ cid: metadataCid, playbackId, caption, hashtags: extractHashtags(caption), duration: 0, poster: address!, posterEns: ensName || undefined, timestamp: Date.now(), likes: 0, comments: 0, tips: "0", views: 0, txHash: typeof txHash === "string" ? txHash : undefined });
    } catch (err) {
      setProgress({ stage: "error", percent: 0, message: err instanceof Error ? err.message : "Upload failed" });
    }
  }, [file, address, caption, ensName, thumbnailFile, writeContractAsync, onSuccess]);

  const reset = useCallback(() => {
    setFile(null); setPreview(""); setCaption(""); setThumbnailFile(null); setThumbnailPreview("");
    setProgress({ stage: "idle", percent: 0, message: "" });
  }, []);

  const handleClose = () => {
    if (progress.stage === "uploading" || progress.stage === "pinning") return;
    reset(); onClose();
  };

  const isUploading = ["uploading", "transcoding", "pinning", "posting"].includes(progress.stage);
  const hashtags = extractHashtags(caption);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: "fixed", inset: 0, background: "rgba(3,4,10,0.82)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 50 }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", left: 8, right: 8, bottom: 8, top: 56,
              zIndex: 51, borderRadius: 24, overflow: "hidden",
              display: "flex", flexDirection: "column",
              background: "linear-gradient(180deg, rgba(22,22,38,0.62), rgba(10,10,18,0.72))",
              backdropFilter: "blur(28px) saturate(170%)",
              WebkitBackdropFilter: "blur(28px) saturate(170%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Drag handle */}
            <div style={{ padding: "10px 0 4px", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.18)" }} />
            </div>

            {/* Header */}
            <div style={{ padding: "8px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,245,250,0.38)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  NEW POST · IPFS + ETHEREUM
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", marginTop: 2, color: "#f4f5fa" }}>
                  Upload Video
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f5fa", display: "grid", placeItems: "center" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Done state */}
            {progress.stage === "done" ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
                  <CheckCircle2 size={56} style={{ color: "#30d158", filter: "drop-shadow(0 0 20px rgba(48,209,88,0.8))" }} />
                </motion.div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: "#f4f5fa", margin: 0, letterSpacing: "-0.02em" }}>Video posted!</h3>
                  <p style={{ color: "rgba(244,245,250,0.55)", fontSize: 14, marginTop: 6 }}>Your video is live on ethvideos.eth</p>
                </div>
                {progress.txHash && (
                  <a href={`https://etherscan.io/tx/${progress.txHash}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 5, color: "#00f5ff", fontSize: 12 }}>
                    View on Etherscan <ExternalLink size={10} />
                  </a>
                )}
                <div style={{ display: "flex", gap: 10, width: "100%" }}>
                  <button onClick={reset} style={{ flex: 1, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f5fa", fontWeight: 700 }}>
                    Post another
                  </button>
                  <button onClick={handleClose} className="ev-pill-grad" style={{ flex: 1, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 900 }}>
                    Go to feed
                  </button>
                </div>
              </div>
            ) : (
              /* Scrollable body */
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 0" }}>

                {/* Error */}
                {progress.stage === "error" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,55,95,0.10)", border: "1px solid rgba(255,55,95,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
                    <AlertCircle size={14} style={{ color: "#ff375f", flexShrink: 0 }} />
                    <span style={{ color: "#ff375f", fontSize: 12 }}>{progress.message}</span>
                  </div>
                )}

                {/* Drop zone / preview */}
                {!file ? (
                  <div
                    {...getRootProps()}
                    className="ev-grad-border"
                    style={{
                      position: "relative", borderRadius: 18, marginBottom: 16,
                      aspectRatio: "9/16", maxHeight: 340,
                      background: "radial-gradient(60% 60% at 35% 30%, rgba(0,245,255,0.4), transparent 60%), radial-gradient(60% 60% at 65% 70%, rgba(191,90,242,0.4), transparent 60%), #0a0a18",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                      border: isDragActive ? "1px solid rgba(0,245,255,0.6)" : undefined,
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input {...getInputProps()} />
                    <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: "none" }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) onDrop([f]); e.target.value = ""; }} />
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: GRAD, display: "grid", placeItems: "center", boxShadow: "0 8px 28px rgba(0,245,255,0.35), 0 8px 28px rgba(191,90,242,0.28)" }}>
                      <Upload size={22} style={{ color: "#06070d" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#f4f5fa" }}>
                        {isDragActive ? "Drop it here!" : "Drag & drop your video"}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(244,245,250,0.45)", marginTop: 4 }}>MP4, WebM, or MOV · Max 500MB</div>
                    </div>
                    <button
                      type="button"
                      style={{ height: 36, padding: "0 20px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#f4f5fa", fontSize: 12, fontWeight: 700 }}
                    >
                      Browse files
                    </button>
                  </div>
                ) : (
                  /* Video preview */
                  <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", marginBottom: 16, aspectRatio: "9/16", maxHeight: 340, background: "#000" }}>
                    <video src={preview} className="w-full h-full object-cover" controls muted />
                    <button onClick={() => { setFile(null); setPreview(""); }}
                      style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "grid", placeItems: "center", color: "#fff", border: "none" }}>
                      <X size={12} />
                    </button>
                    <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", borderRadius: 999, padding: "2px 8px" }}>
                      <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>
                )}

                {/* Upload progress */}
                {isUploading && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                      <span style={{ color: "rgba(244,245,250,0.65)", display: "flex", alignItems: "center", gap: 6 }}>
                        <Loader2 size={12} style={{ animation: "ev-spin 1s linear infinite" }} />
                        {progress.message}
                      </span>
                      <span style={{ color: "#00f5ff", fontVariantNumeric: "tabular-nums" }}>{Math.round(progress.percent)}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", position: "relative" }}>
                      <motion.div style={{ height: "100%", background: GRAD, borderRadius: 999, boxShadow: "0 0 12px rgba(0,245,255,0.5)", width: `${progress.percent}%` }} transition={{ duration: 0.3 }} />
                      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "30%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "ev-shimmer 1.6s infinite" }} />
                    </div>
                  </div>
                )}

                {/* Caption */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(244,245,250,0.38)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Caption</div>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption... #ethereum #web3"
                    maxLength={300}
                    rows={3}
                    style={{ width: "100%", resize: "none", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#f4f5fa", fontSize: 13, lineHeight: 1.45, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>

                {/* Hashtags */}
                {hashtags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(244,245,250,0.38)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Hashtags</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {hashtags.map((tag) => (
                        <span key={tag} className="ev-grad-border" style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(0,245,255,0.06)", fontSize: 12, fontWeight: 700 }}>
                          <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>#{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mint on-chain toggle */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ padding: 14, borderRadius: 14, background: "linear-gradient(135deg, rgba(0,245,255,0.06), rgba(191,90,242,0.06))", border: "1px solid rgba(0,245,255,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: GRAD, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Zap size={16} style={{ color: "#06070d" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#f4f5fa" }}>Post on-chain (Ethereum)</div>
                      <div style={{ fontSize: 11, color: "rgba(244,245,250,0.38)", marginTop: 2 }}>VideoPost.sol · est. gas ~0.0008Ξ</div>
                    </div>
                    <button
                      onClick={() => setMintOnChain(!mintOnChain)}
                      style={{
                        width: 40, height: 22, borderRadius: 999, flexShrink: 0, position: "relative", border: "none",
                        background: mintOnChain ? GRAD : "rgba(255,255,255,0.1)",
                        boxShadow: mintOnChain ? "0 2px 8px rgba(0,245,255,0.3)" : undefined,
                        transition: "background 0.2s",
                      }}
                    >
                      <div style={{ position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: mintOnChain ? 20 : 2 }} />
                    </button>
                  </div>
                </div>

                {/* Custom thumbnail */}
                {file && !isUploading && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(244,245,250,0.38)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
                      Cover Image <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(optional)</span>
                    </div>
                    {thumbnailPreview ? (
                      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbnailPreview} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => { setThumbnailFile(null); setThumbnailPreview(""); }}
                          style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "grid", placeItems: "center", color: "#fff", border: "none" }}>
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.18)", padding: "12px", color: "rgba(244,245,250,0.45)", fontSize: 12, background: "transparent", cursor: "pointer" }}>
                        <ImagePlus size={14} /> Upload cover image
                      </button>
                    )}
                    <input ref={thumbnailInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)); } e.target.value = ""; }} />
                  </div>
                )}

                <div style={{ height: 100 }} />
              </div>
            )}

            {/* Footer CTA */}
            {progress.stage !== "done" && (
              <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(to top, rgba(6,7,13,0.95), transparent)", flexShrink: 0 }}>
                <button
                  onClick={handlePost}
                  disabled={!file || !address || isUploading}
                  className={cn(!file || !address || isUploading ? "" : "ev-pill-grad")}
                  style={{
                    height: 52, width: "100%", borderRadius: 16, fontSize: 15, fontWeight: 900, letterSpacing: "-0.02em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    ...(!file || !address || isUploading ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(244,245,250,0.35)" } : {}),
                  }}
                >
                  {isUploading ? <Loader2 size={20} style={{ animation: "ev-spin 1s linear infinite" }} /> : <><Upload size={18} /> Pin to IPFS &amp; Mint</>}
                </button>
                {!address && <p style={{ color: "rgba(244,245,250,0.38)", fontSize: 10, textAlign: "center", marginTop: 8 }}>Connect your wallet to post</p>}
                {file && address && !isUploading && (
                  <p style={{ color: "rgba(244,245,250,0.25)", fontSize: 10, textAlign: "center", marginTop: 8 }}>
                    Creators receive 95% of tips · 5% to platform treasury
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
