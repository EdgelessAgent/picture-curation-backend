# API Testing Examples

This document contains ready-to-use cURL commands for testing all endpoints. Run the server first:

```bash
npm start
# Server runs on http://localhost:4000
```

## Health Check

```bash
curl http://localhost:4000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "server": "picture-curation-api",
  "port": 4000,
  "timestamp": "2026-02-12T22:30:00.000Z"
}
```

---

## 1. Upload a Photo

First, create a test JPG image:

```bash
# Generate a simple test image (requires ImageMagick)
convert -size 800x600 xc:blue /tmp/test-image.jpg

# Or download a sample image
wget -O /tmp/test-image.jpg https://via.placeholder.com/800x600.jpg

# Or use any JPG on your system
```

Upload the photo:

```bash
curl -X POST http://localhost:4000/api/upload \
  -F "file=@/tmp/test-image.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "photo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "550e8400-e29b-41d4-a716-446655440000-original.jpg",
    "originalUrl": "/uploads/550e8400-e29b-41d4-a716-446655440000-original.jpg",
    "status": "pending",
    "createdAt": "2026-02-12T22:30:00.000Z"
  },
  "message": "Photo uploaded. Variations are being generated..."
}
```

**⚠️ Important:** Save the `photoId` (in this example: `550e8400-e29b-41d4-a716-446655440000`) for the next steps.

---

## 2. Check Pending Approvals

**Wait 2-3 seconds** for variations to be generated, then:

```bash
curl http://localhost:4000/api/pending-approvals
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "photo": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "filename": "550e8400-e29b-41d4-a716-446655440000-original.jpg",
        "originalUrl": "/uploads/550e8400-e29b-41d4-a716-446655440000-original.jpg",
        "status": "variations_ready",
        "createdAt": "2026-02-12T22:30:00.000Z"
      },
      "variations": [
        {
          "id": "var-uuid-1",
          "photoId": "550e8400-e29b-41d4-a716-446655440000",
          "intensity": 1,
          "label": "Subtle",
          "url": "/uploads/550e8400-e29b-41d4-a716-446655440000-var-1-var-uuid-1.jpg"
        },
        {
          "id": "var-uuid-2",
          "photoId": "550e8400-e29b-41d4-a716-446655440000",
          "intensity": 2,
          "label": "Light",
          "url": "/uploads/550e8400-e29b-41d4-a716-446655440000-var-2-var-uuid-2.jpg"
        },
        {
          "id": "var-uuid-3",
          "photoId": "550e8400-e29b-41d4-a716-446655440000",
          "intensity": 3,
          "label": "Medium",
          "url": "/uploads/550e8400-e29b-41d4-a716-446655440000-var-3-var-uuid-3.jpg"
        },
        {
          "id": "var-uuid-4",
          "photoId": "550e8400-e29b-41d4-a716-446655440000",
          "intensity": 4,
          "label": "Strong",
          "url": "/uploads/550e8400-e29b-41d4-a716-446655440000-var-4-var-uuid-4.jpg"
        },
        {
          "id": "var-uuid-5",
          "photoId": "550e8400-e29b-41d4-a716-446655440000",
          "intensity": 5,
          "label": "Intense",
          "url": "/uploads/550e8400-e29b-41d4-a716-446655440000-var-5-var-uuid-5.jpg"
        }
      ]
    }
  ],
  "total": 1
}
```

**⚠️ Important:** Save one of the variation IDs (e.g., `var-uuid-2`) for approving.

---

## 3. Regenerate Variations

Delete the old variations and create a new set:

```bash
curl -X POST http://localhost:4000/api/regenerate/550e8400-e29b-41d4-a716-446655440000
```

**Expected Response:**
```json
{
  "success": true,
  "variations": [
    {
      "id": "var-uuid-new-1",
      "photoId": "550e8400-e29b-41d4-a716-446655440000",
      "intensity": 1,
      "label": "Subtle",
      "url": "/uploads/550e8400-e29b-41d4-a716-446655440000-var-1-var-uuid-new-1.jpg"
    },
    // ... 4 more variations
  ],
  "message": "New variations generated"
}
```

---

## 4. Approve a Variation

Choose one of the variations and approve it:

```bash
curl -X POST http://localhost:4000/api/approve \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "550e8400-e29b-41d4-a716-446655440000",
    "variationId": "var-uuid-2",
    "feedback": "Love this light, slightly warm edit!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "approval": {
    "id": "approval-uuid-123",
    "photoId": "550e8400-e29b-41d4-a716-446655440000",
    "variationId": "var-uuid-2",
    "feedback": "Love this light, slightly warm edit!",
    "approvedAt": "2026-02-12T22:30:00.000Z"
  },
  "photo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "550e8400-e29b-41d4-a716-446655440000-original.jpg",
    "originalUrl": "/uploads/550e8400-e29b-41d4-a716-446655440000-original.jpg",
    "status": "approved",
    "createdAt": "2026-02-12T22:30:00.000Z"
  }
}
```

---

## 5. Preview Photo with Caption

Get the approved photo with a generated caption:

```bash
# Default to Medium intensity variation
curl http://localhost:4000/api/preview/550e8400-e29b-41d4-a716-446655440000
```

Or specify a specific variation:

```bash
curl 'http://localhost:4000/api/preview/550e8400-e29b-41d4-a716-446655440000?variationId=var-uuid-2'
```

**Expected Response:**
```json
{
  "success": true,
  "photo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "550e8400-e29b-41d4-a716-446655440000-original.jpg",
    "originalUrl": "/uploads/550e8400-e29b-41d4-a716-446655440000-original.jpg",
    "status": "approved",
    "createdAt": "2026-02-12T22:30:00.000Z"
  },
  "selectedVariation": {
    "id": "var-uuid-2",
    "photoId": "550e8400-e29b-41d4-a716-446655440000",
    "intensity": 2,
    "label": "Light",
    "url": "/uploads/550e8400-e29b-41d4-a716-446655440000-var-2-var-uuid-2.jpg"
  },
  "caption": "Golden hour magic ✨ Every moment tells a story"
}
```

**Note:** Caption is generated by Claude if `CLAUDE_API_KEY` is set in .env. Otherwise, a default caption is returned.

---

## 6. Publish to Instagram

Publish the approved photo with an optional custom caption:

```bash
curl -X POST http://localhost:4000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "550e8400-e29b-41d4-a716-446655440000",
    "caption": "Golden hour moments 🌅✨ #nature #photography"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Photo published successfully (mocked)",
  "publication": {
    "id": "pub-uuid-123",
    "photoId": "550e8400-e29b-41d4-a716-446655440000",
    "caption": "Golden hour moments 🌅✨ #nature #photography",
    "instagramPostId": "mock-ig-abc-123",
    "publishedAt": "2026-02-12T22:30:00.000Z",
    "status": "published"
  },
  "note": "To enable real Instagram publishing, provide INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in .env"
}
```

---

## Full Test Sequence

Run all these commands in order to test the complete workflow:

```bash
#!/bin/bash

# 1. Create test image
convert -size 800x600 xc:blue /tmp/test-image.jpg

# 2. Upload
UPLOAD=$(curl -s -X POST http://localhost:4000/api/upload \
  -F "file=@/tmp/test-image.jpg")
PHOTO_ID=$(echo $UPLOAD | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Photo ID: $PHOTO_ID"

# 3. Wait for variations
sleep 3

# 4. Get pending approvals
PENDING=$(curl -s http://localhost:4000/api/pending-approvals)
VARIATION_ID=$(echo $PENDING | grep -o '"id":"var-uuid-[^"]*' | head -1 | cut -d'"' -f4)
echo "Variation ID: $VARIATION_ID"

# 5. Approve
curl -s -X POST http://localhost:4000/api/approve \
  -H "Content-Type: application/json" \
  -d "{
    \"photoId\": \"$PHOTO_ID\",
    \"variationId\": \"$VARIATION_ID\",
    \"feedback\": \"Perfect!\"
  }"

# 6. Preview
curl -s "http://localhost:4000/api/preview/$PHOTO_ID"

# 7. Publish
curl -s -X POST http://localhost:4000/api/publish \
  -H "Content-Type: application/json" \
  -d "{
    \"photoId\": \"$PHOTO_ID\",
    \"caption\": \"Beautiful sunset!\"
  }"
```

---

## Error Cases

### Invalid file type (non-JPG)

```bash
curl -X POST http://localhost:4000/api/upload \
  -F "file=@test.png"
```

**Response (400):**
```json
{
  "error": "Only JPG files are allowed"
}
```

### Photo not found

```bash
curl http://localhost:4000/api/preview/invalid-photo-id
```

**Response (404):**
```json
{
  "error": "Photo not found"
}
```

### Missing required fields

```bash
curl -X POST http://localhost:4000/api/approve \
  -H "Content-Type: application/json" \
  -d '{"photoId": "123"}'
```

**Response (400):**
```json
{
  "error": "photoId and variationId are required"
}
```

---

## View Generated Files

```bash
# List all uploaded images and variations
ls -lh data/uploads/

# View photo records
cat data/photos.json | jq .

# View variation records
cat data/variations.json | jq .

# View approval records
cat data/approvals.json | jq .
```

---

## Test with Postman

Import this as a Postman collection:

1. Create a new Postman collection
2. Add these requests:

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `http://localhost:4000/api/upload` | form-data: `file` (JPG) |
| GET | `http://localhost:4000/api/pending-approvals` | - |
| POST | `http://localhost:4000/api/regenerate/:photoId` | - |
| POST | `http://localhost:4000/api/approve` | `{"photoId":"...", "variationId":"..."}` |
| GET | `http://localhost:4000/api/preview/:photoId` | - |
| POST | `http://localhost:4000/api/publish` | `{"photoId":"...", "caption":"..."}` |
| GET | `http://localhost:4000/api/health` | - |

---

## Frontend Testing (JavaScript)

```javascript
// Upload
const formData = new FormData();
formData.append('file', imageFile);
const uploadRes = await fetch('http://localhost:4000/api/upload', {
  method: 'POST',
  body: formData
});
const { photo } = await uploadRes.json();

// Pending approvals
const pendingRes = await fetch('http://localhost:4000/api/pending-approvals');
const { data: pendingApprovals } = await pendingRes.json();

// Approve
const approveRes = await fetch('http://localhost:4000/api/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photoId: photo.id,
    variationId: selectedVariation.id
  })
});

// Preview
const previewRes = await fetch(`http://localhost:4000/api/preview/${photo.id}`);
const { caption } = await previewRes.json();

// Publish
const publishRes = await fetch('http://localhost:4000/api/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photoId: photo.id,
    caption: customCaption
  })
});
```

---

## Troubleshooting

### "Server is not running"

Start with: `npm start`

### "Port 4000 already in use"

Kill the process:
```bash
lsof -i :4000
kill -9 <PID>
```

### Variations take too long

Variation generation runs asynchronously. Variations are ready when photo status changes to `variations_ready`. Poll `/api/pending-approvals` until you see variations.

### captions are generic

If you see generic captions instead of AI-generated ones:
- Set `CLAUDE_API_KEY` in `.env`
- Restart the server
- Generate a new photo

### Images look oversaturated

The intensity levels are adjustable in `server.js` lines 162-190. Modify the factor multipliers if needed.
