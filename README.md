# Picture Curation API Server

A Node.js/Express backend API for a picture curation web application. Handles photo uploads, automatic variation generation, approval workflows, caption generation, and Instagram publishing.

## Features

✅ **Photo Upload** - Accept JPG files and store on disk  
✅ **Auto Variation Generation** - Create 5 editing variations (Subtle to Intense)  
✅ **Approval Workflow** - Manage photo approvals with feedback  
✅ **AI Captions** - Generate snappy Instagram captions using Claude API  
✅ **Preview & Publish** - Preview with captions and publish to Instagram (mocked)  
✅ **Production Ready** - CORS, error handling, validation, data persistence  

## Tech Stack

- **Express.js** - Web framework
- **Sharp** - Image processing & editing
- **Multer** - File upload handling
- **Anthropic Claude API** - Caption generation
- **JSON Storage** - Simple persistent data (or upgrade to SQLite)

## Setup

### 1. Install Dependencies

```bash
cd /data/workspace/backend
npm install
```

### 2. Configure Environment

Copy the example file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
PORT=4000
CLAUDE_API_KEY=sk-ant-...your-claude-key...
INSTAGRAM_ACCESS_TOKEN=your_instagram_token (optional, for real publishing)
INSTAGRAM_USER_ID=your_user_id (optional)
```

### 3. Create Data Directories

```bash
mkdir -p data/uploads
```

(These are created automatically on first run)

### 4. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs on `http://localhost:4000`

## API Endpoints

### 1. Upload a Photo

```http
POST /api/upload
Content-Type: multipart/form-data

file: <JPG file>
```

**Response:**
```json
{
  "success": true,
  "photo": {
    "id": "uuid-123",
    "filename": "uuid-123-original.jpg",
    "originalUrl": "/uploads/uuid-123-original.jpg",
    "status": "pending",
    "createdAt": "2026-02-12T22:30:00.000Z"
  },
  "message": "Photo uploaded. Variations are being generated..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/upload \
  -F "file=@/path/to/image.jpg"
```

---

### 2. Get Pending Approvals

```http
GET /api/pending-approvals
```

Returns all photos with `variations_ready` status + their 5 variations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "photo": {
        "id": "uuid-123",
        "filename": "uuid-123-original.jpg",
        "originalUrl": "/uploads/uuid-123-original.jpg",
        "status": "variations_ready",
        "createdAt": "2026-02-12T22:30:00.000Z"
      },
      "variations": [
        {
          "id": "var-uuid-1",
          "photoId": "uuid-123",
          "intensity": 1,
          "label": "Subtle",
          "url": "/uploads/uuid-123-var-1-var-uuid-1.jpg"
        },
        {
          "id": "var-uuid-2",
          "photoId": "uuid-123",
          "intensity": 2,
          "label": "Light",
          "url": "/uploads/uuid-123-var-2-var-uuid-2.jpg"
        },
        // ... 3 more variations (Medium, Strong, Intense)
      ]
    }
  ],
  "total": 1
}
```

**cURL Example:**
```bash
curl http://localhost:4000/api/pending-approvals
```

---

### 3. Regenerate Variations

```http
POST /api/regenerate/:photoId
```

Creates a fresh set of 5 variations for a photo (deletes old ones).

**Response:**
```json
{
  "success": true,
  "variations": [
    {
      "id": "var-uuid-1",
      "photoId": "uuid-123",
      "intensity": 1,
      "label": "Subtle",
      "url": "/uploads/uuid-123-var-1-var-uuid-1.jpg"
    }
    // ... 4 more variations
  ],
  "message": "New variations generated"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/regenerate/uuid-123
```

---

### 4. Approve a Variation

```http
POST /api/approve
Content-Type: application/json

{
  "photoId": "uuid-123",
  "variationId": "var-uuid-2",
  "feedback": "Love the light edit!" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "approval": {
    "id": "approval-uuid",
    "photoId": "uuid-123",
    "variationId": "var-uuid-2",
    "feedback": "Love the light edit!",
    "approvedAt": "2026-02-12T22:30:00.000Z"
  },
  "photo": {
    "id": "uuid-123",
    "status": "approved",
    ...
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/approve \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "uuid-123",
    "variationId": "var-uuid-2",
    "feedback": "Perfect edit!"
  }'
```

---

### 5. Preview Photo with Caption

```http
GET /api/preview/:photoId?variationId=var-uuid-2
```

Returns the photo, selected variation, and AI-generated caption.

**Response:**
```json
{
  "success": true,
  "photo": {
    "id": "uuid-123",
    "filename": "uuid-123-original.jpg",
    "originalUrl": "/uploads/uuid-123-original.jpg",
    "status": "approved",
    "createdAt": "2026-02-12T22:30:00.000Z"
  },
  "selectedVariation": {
    "id": "var-uuid-2",
    "photoId": "uuid-123",
    "intensity": 2,
    "label": "Light",
    "url": "/uploads/uuid-123-var-2-var-uuid-2.jpg"
  },
  "caption": "Golden hour magic ✨ Every moment tells a story"
}
```

**cURL Example:**
```bash
# Default to Medium intensity
curl http://localhost:4000/api/preview/uuid-123

# Or specify a variation
curl 'http://localhost:4000/api/preview/uuid-123?variationId=var-uuid-2'
```

---

### 6. Publish to Instagram

```http
POST /api/publish
Content-Type: application/json

{
  "photoId": "uuid-123",
  "caption": "Custom caption for Instagram"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Photo published successfully (mocked)",
  "publication": {
    "id": "pub-uuid",
    "photoId": "uuid-123",
    "caption": "Custom caption for Instagram",
    "instagramPostId": "mock-ig-...",
    "publishedAt": "2026-02-12T22:30:00.000Z",
    "status": "published"
  },
  "note": "To enable real Instagram publishing, provide INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in .env"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "uuid-123",
    "caption": "Amazing photo!"
  }'
```

---

### 7. Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "server": "picture-curation-api",
  "port": 4000,
  "timestamp": "2026-02-12T22:30:00.000Z"
}
```

---

## Data Storage

### File Structure

```
/data/workspace/backend/
├── data/
│   ├── photos.json          # Photo records
│   ├── variations.json      # Variation records
│   ├── approvals.json       # Approval records
│   └── uploads/             # Uploaded JPG files
│       ├── uuid-original.jpg
│       ├── uuid-var-1-var-uuid.jpg
│       └── ...
├── server.js
├── package.json
├── .env
├── .env.example
└── README.md
```

### Data Schema

**photos.json:**
```json
[
  {
    "id": "uuid-123",
    "filename": "uuid-123-original.jpg",
    "originalUrl": "/uploads/uuid-123-original.jpg",
    "status": "pending | variations_ready | approved | captioned | published",
    "createdAt": "2026-02-12T22:30:00.000Z"
  }
]
```

**variations.json:**
```json
[
  {
    "id": "var-uuid-1",
    "photoId": "uuid-123",
    "intensity": 1,
    "label": "Subtle | Light | Medium | Strong | Intense",
    "url": "/uploads/uuid-123-var-1-var-uuid-1.jpg"
  }
]
```

**approvals.json:**
```json
[
  {
    "id": "approval-uuid",
    "photoId": "uuid-123",
    "variationId": "var-uuid-2",
    "feedback": "Optional feedback from user",
    "approvedAt": "2026-02-12T22:30:00.000Z"
  }
]
```

---

## Image Variation Processing

### Intensity Levels

Each uploaded photo automatically generates 5 variations with different editing intensities:

| Intensity | Label | Adjustments |
|-----------|-------|------------|
| 1 | Subtle | +7.5% brightness, +15% contrast, +12.5% saturation, minimal warmth |
| 2 | Light | +10% brightness, +20% contrast, +15% saturation, light warmth |
| 3 | Medium | +12.5% brightness, +25% contrast, +17.5% saturation, moderate warmth |
| 4 | Strong | +15% brightness, +30% contrast, +20% saturation, warm tint |
| 5 | Intense | +17.5% brightness, +30% contrast, +25% saturation, strong warmth |

### Processing Details

Using **Sharp.js**:
- Modulate: Brightness & Saturation
- Linear: Contrast adjustment
- Tint: Warmth (color temperature shift)
- Output: JPEG quality 90

---

## Caption Generation

Uses **Claude API** to analyze the selected variation image and generate short, snappy Instagram captions.

**Features:**
- Max 150 characters
- No hashtags
- Creative and engaging
- Falls back to default if API unavailable

**Example Captions Generated:**
- "Golden hour magic ✨ Every moment tells a story"
- "Chasing light and shadows"
- "Nature's canvas speaks louder than words"
- "This is what joy looks like 🌅"

---

## Frontend Integration (localhost:3000)

The server is configured with CORS for localhost:3000. Your frontend can:

```javascript
// Upload
const formData = new FormData();
formData.append('file', imageFile);
const uploadRes = await fetch('http://localhost:4000/api/upload', {
  method: 'POST',
  body: formData
});

// Get pending approvals
const pendingRes = await fetch('http://localhost:4000/api/pending-approvals');

// Approve a variation
const approveRes = await fetch('http://localhost:4000/api/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photoId: 'uuid-123',
    variationId: 'var-uuid-2'
  })
});

// Preview with caption
const previewRes = await fetch('http://localhost:4000/api/preview/uuid-123?variationId=var-uuid-2');

// Publish
const publishRes = await fetch('http://localhost:4000/api/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photoId: 'uuid-123',
    caption: 'Custom caption'
  })
});
```

---

## Testing with Postman/cURL

See **API Endpoints** section above for full cURL examples.

### Quick Test Sequence

```bash
# 1. Upload a test image
curl -X POST http://localhost:4000/api/upload \
  -F "file=@test-image.jpg"

# Copy the returned photoId

# 2. Check pending approvals (wait a moment for variation generation)
curl http://localhost:4000/api/pending-approvals

# 3. Approve a variation
curl -X POST http://localhost:4000/api/approve \
  -H "Content-Type: application/json" \
  -d '{"photoId": "YOUR_PHOTO_ID", "variationId": "YOUR_VARIATION_ID"}'

# 4. Preview with caption
curl 'http://localhost:4000/api/preview/YOUR_PHOTO_ID'

# 5. Publish
curl -X POST http://localhost:4000/api/publish \
  -H "Content-Type: application/json" \
  -d '{"photoId": "YOUR_PHOTO_ID", "caption": "Amazing photo!"}'

# 6. Health check
curl http://localhost:4000/api/health
```

---

## Troubleshooting

### Port 4000 Already in Use
```bash
# Find process on port 4000
lsof -i :4000

# Kill it
kill -9 <PID>
```

### Missing Claude API Key
- Caption generation will fall back to default text
- No error thrown — graceful degradation

### File Upload Fails
- Check file is JPG/JPEG format
- Check file size < 50MB
- Ensure `data/uploads` directory exists and is writable

### Variations Not Generated Yet
- Variations are generated asynchronously
- Poll `/api/pending-approvals` after a few seconds
- Check server logs for errors

---

## Production Deployment

### Before Deploying:

1. **Set environment variables** in production:
   ```bash
   export CLAUDE_API_KEY=sk-ant-...
   export INSTAGRAM_ACCESS_TOKEN=...
   export NODE_ENV=production
   ```

2. **Use a process manager** (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "picture-api"
   pm2 save
   ```

3. **Enable HTTPS** with reverse proxy (Nginx):
   ```nginx
   server {
     listen 443 ssl;
     server_name api.example.com;
     
     ssl_certificate /etc/ssl/certs/cert.pem;
     ssl_certificate_key /etc/ssl/private/key.pem;
     
     location / {
       proxy_pass http://localhost:4000;
     }
   }
   ```

4. **Database** - Upgrade from JSON to SQLite/PostgreSQL for scale
5. **File Storage** - Use cloud storage (AWS S3) instead of local disk

---

## License

MIT

---

**Questions? Check the server logs:**
```bash
npm run dev
```

All requests and errors are logged to the console.
