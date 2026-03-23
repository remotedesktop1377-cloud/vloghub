"use client";

import { useState, useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setBackgroundClips, setSelectedBackgroundMedia } from "@/store/slices/projectSlice";
import Image from "next/image";
import toast from "react-hot-toast";
import { defaultBackgroundImages } from "@/data/backgroundAssets";
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { HelperFunctions } from '@/utils/helperFunctions';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import checkIcon from "@/assets/images/check.svg";
import uploadIcon from "@/assets/images/media-upload.svg";
import styles from "./BackgroundMediaList.module.css";

type Tab = "colors" | "images" | "videos" | "upload";

interface MediaItem {
  id: string;
  src?: string;
  color?: string;
  name: string;
  type: "color" | "image" | "video";
}

export default function BackgroundMediaList() {
  const dispatch = useAppDispatch();
  const { selectedBackgroundMedia, backgroundClips, currentTime, duration } = useAppSelector((state) => state.projectState);
  const [activeTab, setActiveTab] = useState<Tab>("colors");
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [libraryVideos, setLibraryVideos] = useState<MediaItem[]>([]);

  const defaultColors: MediaItem[] = [
    { id: "color-1", type: "color", color: "#111827", name: "Midnight" },
    { id: "color-2", type: "color", color: "#0f766e", name: "Teal" },
    { id: "color-3", type: "color", color: "#7c3aed", name: "Violet" },
    { id: "color-4", type: "color", color: "#1d4ed8", name: "Royal Blue" },
    { id: "color-5", type: "color", color: "#b91c1c", name: "Crimson" },
    { id: "color-6", type: "color", color: "#f59e0b", name: "Amber" },
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const libraryData = await GoogleDriveServiceFunctions.loadLibraryData(false);
        const libs = (libraryData?.backgrounds || []).map((b: any) => {
          const src = b?.webContentLink
            ? HelperFunctions.normalizeGoogleDriveUrl(b.webContentLink)
            : b?.id
            ? `${API_ENDPOINTS.GOOGLE_DRIVE_MEDIA_BASE}?id=${encodeURIComponent(b.id)}`
            : (b?.url || '');
          return {
            id: String(b?.id || b?.name || crypto.randomUUID()),
            src,
            name: b?.name || 'Drive Video',
            type: 'video' as const,
          };
        });
        if (mounted) setLibraryVideos(libs);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const images: MediaItem[] = [
    ...defaultBackgroundImages.map((i) => ({ ...i, type: "image" as const })),
    ...uploadedMedia.filter((m) => m.type === "image"),
  ];

  const videos: MediaItem[] = [
    // Library videos loaded from Google Drive
    ...libraryVideos,
    ...uploadedMedia.filter((m) => m.type === "video"),
  ];

  const selectedBackground = useCallback(() => {
    const activeClip = backgroundClips
      .filter((clip) => currentTime >= clip.positionStart && currentTime < clip.positionEnd)
      .sort((a, b) => b.positionStart - a.positionStart)[0];

    if (activeClip) {
      return activeClip;
    }
    return selectedBackgroundMedia;
  }, [backgroundClips, currentTime, selectedBackgroundMedia]);

  const isSelected = useCallback(
    (item: MediaItem) => {
      const selected = selectedBackground();
      if (!selected) return false;
      if (item.type === "color") {
        return selected.type === "color" && selected.color === item.color;
      }
      return selected.type === item.type && selected.src === item.src;
    },
    [selectedBackground]
  );

  const handleSelect = (item: MediaItem) => {
    const newClipDuration = 5;
    const clipStart = Math.max(0, currentTime);
    const clipEnd = Math.max(clipStart + newClipDuration, duration || 0, clipStart + 0.1);
    const clipLabel = item.name || (item.type === "color" ? item.color : item.src) || "Background";

    const nextClip = {
      id: crypto.randomUUID(),
      type: item.type,
      src: item.src,
      color: item.color,
      name: clipLabel,
      positionStart: clipStart,
      positionEnd: clipEnd,
    };

    const nextClips = [...backgroundClips, nextClip].sort((a, b) => a.positionStart - b.positionStart);
    dispatch(setBackgroundClips(nextClips));

    dispatch(
      setSelectedBackgroundMedia({
        type: item.type,
        src: item.src,
        color: item.color,
        name: item.name,
      })
    );
    toast.success(`Background clip added: ${item.name}`);
  };

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      setIsUploading(true);
      const newItems: MediaItem[] = [];
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith("image/") ? "image" : "video";
        newItems.push({
          id: crypto.randomUUID(),
          src: url,
          name: file.name.replace(/\.[^.]+$/, ""),
          type,
        });
      });
      setUploadedMedia((prev) => [...prev, ...newItems]);
      setIsUploading(false);
      toast.success(`${files.length} file(s) added`);
      e.target.value = "";
    },
    []
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "colors" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("colors")}
        >
          Colors
        </button>
        <button
          className={`${styles.tab} ${activeTab === "images" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("images")}
        >
          Images
        </button>
        <button
          className={`${styles.tab} ${activeTab === "videos" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("videos")}
        >
          Videos
        </button>
        <button
          className={`${styles.tab} ${activeTab === "upload" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "colors" && (
          <div className={styles.grid}>
            {defaultColors.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.mediaCard} ${isSelected(item) ? styles.mediaCardSelected : ""}`}
                onClick={() => handleSelect(item)}
              >
                <div className={styles.mediaThumb} style={{ background: item.color }}>
                  {isSelected(item) && (
                    <div className={styles.tick}>
                      <Image src={checkIcon} alt="Selected" width={20} height={20} />
                    </div>
                  )}
                </div>
                <span className={styles.mediaName}>{item.name}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "images" && (
          <div className={styles.grid}>
            {images.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.mediaCard} ${isSelected(item) ? styles.mediaCardSelected : ""}`}
                onClick={() => handleSelect(item)}
              >
                <div className={styles.mediaThumb}>
                  {/* {item?.src?.startsWith("blob:") ? (
                    <img src={item.src} alt={item.name} className={styles.mediaImg} />
                  ) : ( */}
                    <Image
                      src={item.src}
                      alt={item.name}
                      fill
                      sizes="120px"
                      // unoptimized={item.src.startsWith("/background/")}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  {/* )} */}
                  {isSelected(item) && (
                    <div className={styles.tick}>
                      <Image src={checkIcon} alt="Selected" width={20} height={20} />
                    </div>
                  )}
                </div>
                <span className={styles.mediaName}>{item.name}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "videos" && (
          <div className={styles.grid}>
            {videos.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.mediaCard} ${isSelected(item) ? styles.mediaCardSelected : ""}`}
                onClick={() => handleSelect(item)}
              >
                <div className={styles.mediaThumb}>
                  <video src={HelperFunctions.normalizeGoogleDriveUrl(item.src)} autoPlay loop muted className={styles.videoThumb} />
                  {isSelected(item) && (
                    <div className={styles.tick}>
                      <Image src={checkIcon} alt="Selected" width={20} height={20} />
                    </div>
                  )}
                </div>
                <span className={styles.mediaName}>{item.name}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "upload" && (
          <label
            htmlFor="background-upload"
            className={styles.uploadArea}
            style={{ opacity: isUploading ? 0.6 : 1 }}
          >
            <input
              id="background-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              className={styles.hiddenInput}
              disabled={isUploading}
            />
            <Image src={uploadIcon} alt="Upload" width={48} height={48} className={styles.uploadIcon} />
            <span className={styles.uploadText}>
              {isUploading ? "Uploading..." : "Click to upload images or videos"}
            </span>
            <span className={styles.uploadHint}>Supports JPG, PNG, WebP, MP4, WebM</span>
          </label>
        )}
      </div>

      {selectedBackground() && (
        <div className={styles.selectedInfo}>
          Selected: <strong>{selectedBackground()?.name || selectedBackground()?.src || selectedBackground()?.color}</strong>
        </div>
      )}
    </div>
  );
}
