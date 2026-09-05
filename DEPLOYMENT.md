# ThumbGen - Deployment Guide 🚀

This guide provides instructions for deploying **ThumbGen** to production environments (Vercel, Docker, Node.js VPS, Netlify).

---

## ⚡ 1. Local Production Build Test

Before deploying, test the production bundle locally:

```bash
cd thumbgen

# Clean and compile Next.js production build
npm run build

# Start production server
npm start
```

Visit **http://localhost:3000** to verify the production app.

---

## ☁️ 2. Deploy to Vercel (Recommended)

Vercel is the creator of Next.js and provides instant deployment with zero setup.

### Step 1: Push to GitHub / GitLab
```bash
git init
git add .
git commit -m "ThumbGen Production Ready"
git remote add origin https://github.com/YOUR_USERNAME/thumbgen.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import your `thumbgen` repository.
4. Framework Preset: **Next.js**.
5. Click **Deploy**.

Vercel automatically configures SSL, global CDN, and API route serverless execution.

---

## 🐳 3. Docker Deployment

### `Dockerfile`
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

### Build & Run Docker Container
```bash
docker build -t thumbgen .
docker run -p 3000:3000 thumbgen
```

---

## ⚙️ 4. Production API Limits & Optimizations
- **Body Parser Limits:** Configured to `25MB` in API routes (`upload.js`, `generate.js`) to handle high-resolution video frames without throwing `413 Payload Too Large`.
- **Media Hardware Acceleration:** Browsers encode WebM/MP4 video clips using hardware VP8/H.264 codecs with off-screen video rendering.

---

*ThumbGen Deployment Guide © 2024.*
