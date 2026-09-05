# ThumbGen - Architecture Documentation 🏗️

This document outlines the architecture, data flow, component hierarchy, and media processing pipeline for **ThumbGen**.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js / React)                       │
│  ┌────────────┐ ┌─────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │ UploadArea │ │ VideoInput  │ │VideoDownloader │ │VideoShortGen    │  │
│  └─────┬──────┘ └──────┬──────┘ └───────┬────────┘ └────────┬────────┘  │
│        │               │                │                   │           │
│        └───────────────┼────────────────┴───────────────────┘           │
│                        │                                                │
│          ┌─────────────▼────────────────┐                               │
│          │   Next.js Pages & Head SEO   │                               │
│          └─────────────┬────────────────┘                               │
│                        │                                                │
│          ┌─────────────▼────────────────┐                               │
│          │  HTML5 Canvas & Web Audio    │                               │
│          │  MediaRecorder & VP8 Codecs  │                               │
│          └─────────────┬────────────────┘                               │
└────────────────────────┼────────────────────────────────────────────────┘
                         │ HTTP / Streaming APIs
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Serverless API Layer (Node.js)                         │
│  ┌────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐  │
│  │ /api/upload    │ │ /api/generate   │ │ /api/download-video (Proxy) │  │
│  │ (25MB payload) │ │ (25MB payload)  │ │ /api/extract-video (oEmbed) │  │
│  └───────┬────────┘ └────────┬────────┘ └──────────────┬──────────────┘  │
└──────────┼───────────────────┼─────────────────────────┼────────────────┘
           │                   │                         │
           ▼                   ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Data & State Persistence Layer                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ lib/db.js (JSON Sessions) & Blob Memory Management                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎬 Component Hierarchy

- **`pages/index.jsx`**: Main controller component containing state, Header logo, and feature options.
- **`components/UploadArea.jsx`**: Drag-and-drop zone converting files to base64 image data.
- **`components/VideoInput.jsx`**: HTML5 `<video>` canvas frame extractor (extracts 10 keyframes).
- **`components/VideoDownloader.jsx`**: Remote video URL proxy downloader with progress tracking.
- **`components/VideoShortGenerator.jsx`**: Short video creator with:
  - Custom duration state (`shortDuration`).
  - Web Audio Context (`setupAudioContext`) for audio track routing.
  - Native video track capture (`video.captureStream()`) & canvas fallback (`captureStream(30)`).
  - Off-screen `<video>` element with hardware acceleration.
  - Modal Preview with **Original HD (0-Lag)** media fragment player (`videoUrl#t=startTime,endTime`) and **Recorded WebM** player.
- **`components/ThumbnailGrid.jsx`**: Grid rendering generated thumbnail variations.
- **`components/ThumbnailEditor.jsx`**: Live canvas editor with real-time text, color picker, and font controls.

---

## 📡 API Endpoints Architecture

1. **`POST /api/upload`**:
   - Accepts base64 image payload (limit: **25MB**).
   - Generates unique session ID and creates session entry in `data/sessions.json`.
2. **`POST /api/generate`**:
   - Fetches session base image.
   - Generates 5 template variations (`Bold Red`, `Dark Blue`, `Neon Green`, `Purple Vibes`, `Orange Pop`).
3. **`POST /api/download-video`**:
   - Proxy streams remote video files directly to the browser to bypass browser CORS restrictions.
   - Parses third-party share links (Google Drive, Dropbox, OneDrive).
4. **`POST /api/extract-video`**:
   - Validates video URLs and extracts YouTube oEmbed metadata.

---

*Architecture Documentation - ThumbGen 2024.*
