# Quick Start Guide

Get the Picture Curation API running in 3 minutes.

## 1. Install & Start

```bash
cd /data/workspace/backend
npm install
npm start
```

Server runs on: **http://localhost:4000**

## 2. Test the API

```bash
# Health check
curl http://localhost:4000/api/health

# Upload a test image
curl -X POST http://localhost:4000/api/upload \
  -F "file=@/path/to/image.jpg"

# Get pending approvals
curl http://localhost:4000/api/pending-approvals
```

## 3. Connect Your Frontend

Frontend connects to `http://localhost:4000`. CORS is pre-configured for localhost:3000.

**JavaScript:**
```javascript
// Upload
const formData = new FormData();
formData.append('file', imageFile);
const res = await fetch('http://localhost:4000/api/upload', {
  method: 'POST',
  body: formData
});
const { photo } = await res.json();

// Get pending approvals
const pendingRes = await fetch('http://localhost:4000/api/pending-approvals');
const { data: approvals } = await pendingRes.json();

// Approve
await fetch('http://localhost:4000/api/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photoId: photo.id,
    variationId: variation.id
  })
});

// Preview with caption
const preview = await fetch(`http://localhost:4000/api/preview/${photo.id}`);
const { caption } = await preview.json();

// Publish
await fetch('http://localhost:4000/api/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photoId: photo.id,
    caption: 'Your caption'
  })
});
```

---

## API Endpoints (Summary)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` | Upload JPG photo → returns Photo object |
| GET | `/api/pending-approvals` | Get photos + 5 variations each waiting for approval |
| POST | `/api/regenerate/:photoId` | Create new set of 5 variations |
| POST | `/api/approve` | Approve a variation for a photo |
| GET | `/api/preview/:photoId` | Get photo + variation + AI caption |
| POST | `/api/publish` | Publish to Instagram (mocked) |
| GET | `/api/health` | Health check |

---

## Configuration

### Environment Variables (.env)

Required:
```env
PORT=4000
NODE_ENV=development
```

Optional (for AI captions):
```env
CLAUDE_API_KEY=sk-ant-...
```

Optional (for real Instagram posting):
```env
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_USER_ID=...
```

See `.env.example` for all options.

---

## Data Storage

- **Photos:** `data/photos.json`
- **Variations:** `data/variations.json`
- **Approvals:** `data/approvals.json`
- **Uploads:** `data/uploads/`

All stored as JSON files. Easy to inspect and debug.

---

## Key Features

✅ **Auto Variation Generation** - 5 intensity levels for each photo  
✅ **Image Editing** - Brightness, contrast, saturation, warmth adjustments  
✅ **AI Captions** - Claude API generates Instagram-ready captions  
✅ **CORS Ready** - Pre-configured for localhost:3000  
✅ **Error Handling** - Production-ready error responses  
✅ **Type Safe** - TypeScript types included (TYPES.ts)  

---

## File Structure

```
backend/
├── server.js                    # Main server (all endpoints)
├── package.json                 # Dependencies
├── .env                         # Config (you edit this)
├── .env.example                 # Config template
├── README.md                    # Full documentation
├── QUICK_START.md              # This file
├── FRONTEND_INTEGRATION.md     # How to integrate with React/Next
├── TEST_EXAMPLES.md            # Example cURL commands
├── TYPES.ts                    # TypeScript type definitions
├── data/
│   ├── photos.json            # Photo records
│   ├── variations.json        # Variation records
│   ├── approvals.json         # Approval records
│   └── uploads/               # Uploaded images
└── node_modules/              # Dependencies (auto-installed)
```

---

## Common Tasks

### Upload a Photo

```bash
curl -X POST http://localhost:4000/api/upload \
  -F "file=@photo.jpg"
```

Returns photo ID that you use in next requests.

### Check Status

```bash
curl http://localhost:4000/api/pending-approvals | jq .
```

Shows all photos waiting for approval + their variations.

### View Files

```bash
# See all uploaded images
ls -lh data/uploads/

# Inspect photo data
cat data/photos.json | jq .

# See all approvals
cat data/approvals.json | jq .
```

### Reset Everything

```bash
rm -rf data/uploads/* data/*.json
npm start  # Recreates empty data files
```

---

## Integration Checklist

- [ ] Backend running on localhost:4000
- [ ] Frontend can reach http://localhost:4000/api/health
- [ ] File upload works (POST /api/upload)
- [ ] Variations generate (check GET /api/pending-approvals after 2-3 sec)
- [ ] Approval works (POST /api/approve)
- [ ] Preview shows caption (GET /api/preview)
- [ ] Publish succeeds (POST /api/publish)

---

## Troubleshooting

**Port 4000 in use?**
```bash
lsof -i :4000
kill -9 <PID>
```

**Npm install fails?**
```bash
rm package-lock.json
npm install
```

**Variations not showing?**
- Wait 2-3 seconds after upload
- Check server logs for errors
- Verify `data/uploads` directory exists

**AI captions not working?**
- Set `CLAUDE_API_KEY` in `.env`
- Restart server
- Upload new photo

**CORS error from frontend?**
- Ensure backend is running
- Frontend must be on localhost:3000
- Check CORS config in server.js line 15

---

## What's Next?

1. **Read Full Docs:** `README.md`
2. **Integration Guide:** `FRONTEND_INTEGRATION.md`
3. **Test Examples:** `TEST_EXAMPLES.md`
4. **Type Definitions:** `TYPES.ts`

---

## Production Deployment

Before going live:

1. Set real Claude API key
2. Set real Instagram tokens (if using real API)
3. Use environment-specific .env files
4. Enable HTTPS with reverse proxy (Nginx)
5. Use database (SQLite → PostgreSQL for scale)
6. Add logging and monitoring
7. Rate limiting on upload endpoint
8. File size validation

See README.md "Production Deployment" section for details.

---

## Questions?

- Check server logs: `npm run dev` shows all requests
- Review API docs: See README.md
- Look at test examples: See TEST_EXAMPLES.md
- Check types: See TYPES.ts

---

**Happy curation! 📸✨**
