# ThumbGen - Make YouTube Easy with ThumbGen 🚀

**ThumbGen** is a complete, production-ready suite for YouTube creators, social media marketers, and content agencies. Create stunning YouTube thumbnails, extract video frames, download videos from URLs, and generate custom short videos (Reels/TikTok/Shorts) with voice in seconds.

---

## ✨ Features Overview

### 🎬 1. Short Video Generator with Voice (Reels / TikTok / Shorts)
- **Custom Duration Input:** Set clip lengths from 5 to 180 seconds (e.g. 15s for Shorts/TikTok, 30s for Reels, 60s for full Shorts).
- **Quick Preset Buttons:** One-click presets for **15s**, **30s**, **45s**, and **60s**.
- **Voice & Audio Extraction:** Captures full background audio and voice tracks seamlessly via Web Audio API.
- **✨ Dual Playback Modes:**
  - **Original HD Video (0 Lag):** Plays the original video segment directly with `#t=startTime,endTime` HTML5 media fragments at 100% full original resolution and 60 FPS.
  - **Recorded WebM File:** Previews and downloads generated `.webm` clips.
- **Hardware-Accelerated Encoding:** Uses VP8/H.264 codecs (`video/webm;codecs=vp8,opus`) to eliminate frame drops and recording lag.
- **Off-screen Hardware Decoder:** Renders source videos off-screen to keep Chromium hardware decoding active at full frame rate.
- **Single & Batch Generation:** Generate individual clips or export all short segments sequentially.

---

### 🎨 2. Image Upload & AI Thumbnail Generator
- **Drag & Drop Upload:** Drag images directly onto the canvas upload zone.
- **Format Support:** JPEG, PNG, WebP, GIF.
- **5 AI Color Templates:**
  - Bold Red (Red + Yellow)
  - Dark Blue (Navy + White)
  - Neon Green (Green + Black)
  - Purple Vibes (Purple + White)
  - Orange Pop (Orange + White)
- **Interactive Thumbnail Editor:** Customize overlay title, text color, background box color, font size (24px–72px), and position with real-time HTML5 Canvas rendering.
- **One-Click Download:** Export YouTube-standard 1280x720 PNG thumbnails.

---

### 📹 3. Video Frame Extractor (Option 2)
- **Frame Extraction:** Automatically extracts 10 high-resolution keyframes across the duration of any video.
- **Direct Video Upload & Sample Videos:** Upload MP4/WebM files or select built-in sample videos.
- **Interactive Frame Selector:** Click any extracted frame to immediately convert it into a YouTube thumbnail design.

---

### ⬇️ 4. Video Downloader from URL (Option 3)
- **Direct URL Proxy:** Download MP4/WebM files directly from remote URLs.
- **Third-Party Support:** Compatible with Google Drive, Dropbox, OneDrive, and self-hosted direct video links.
- **Progress Tracking:** Real-time download progress and metadata inspection (file size, resolution, duration).

---

### ⚡ 5. Production & UI Enhancements
- **Custom 3D App Icon:** Integrated 3D logo icon across navbar, favicon, apple-touch-icon, and OpenGraph metadata.
- **Next.js Production Built:** Verified `npm run build` with 0 warnings or type errors.
- **Hydration Safe:** Cleaned duplicate head tags and added `suppressHydrationWarning` for smooth client rendering.
- **High-Capacity API Limits:** Configured `25MB` body parser size limits on upload and generate API routes for high-res video frames.

---

## 🛠️ Technology Stack
- **Framework:** Next.js 14 (Pages Router) & React 18
- **Styling:** TailwindCSS with Google Fonts (`Inter` & `Outfit`)
- **Media Processing:** Web Audio API, HTML5 Canvas, MediaRecorder API
- **Deployment:** Vercel / Node.js production server ready

---

*ThumbGen © 2024 - Make YouTube Easy with ThumbGen.*
