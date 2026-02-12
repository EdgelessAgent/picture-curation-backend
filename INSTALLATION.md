# Installation & Setup Guide

Complete step-by-step guide to install and verify the Picture Curation API server.

## Prerequisites

- **Node.js** >= 16 (check: `node --version`)
- **npm** >= 8 (check: `npm --version`)
- **Git** (optional, for version control)

## Installation Steps

### Step 1: Navigate to Project Directory

```bash
cd /data/workspace/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages listed in `package.json`:
- express (web framework)
- sharp (image processing)
- multer (file uploads)
- @anthropic-ai/sdk (Claude API)
- dotenv (configuration)
- cors (cross-origin support)
- uuid (unique IDs)
- nodemon (development auto-reload)

**Expected output:**
```
added 136 packages, and audited 137 packages
```

### Step 3: Configure Environment

Create or edit `.env` file:

```bash
# Option 1: Copy from example
cp .env.example .env

# Option 2: Manual setup
cat > .env << EOF
PORT=4000
NODE_ENV=development
CLAUDE_API_KEY=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
UPLOAD_DIR=./data/uploads
MAX_FILE_SIZE=52428800
DATA_DIR=./data
EOF
```

**Optional:** Add your API keys:
- `CLAUDE_API_KEY` - Get from [Anthropic Console](https://console.anthropic.com)
- `INSTAGRAM_ACCESS_TOKEN` - Get from [Meta Developers](https://developers.facebook.com)

### Step 4: Verify Setup

```bash
# Automated verification
./verify-setup.sh

# Or manual checks
ls -la data/                          # Check data directory
cat data/photos.json                 # Check data files
npm list                             # Check installed packages
```

### Step 5: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

**Expected output:**
```
✅ Picture Curation API running on http://localhost:4000
📁 Upload directory: /data/workspace/backend/data/uploads
💾 Data directory: /data/workspace/backend/data

📚 Available endpoints:
   POST   /api/upload
   GET    /api/pending-approvals
   POST   /api/regenerate/:photoId
   POST   /api/approve
   GET    /api/preview/:photoId
   POST   /api/publish
   GET    /api/health
```

## Verification

### Health Check

Test that the server is running:

```bash
curl http://localhost:4000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "server": "picture-curation-api",
  "port": 4000,
  "timestamp": "2026-02-12T22:30:00.000Z"
}
```

### Quick Functionality Test

```bash
# 1. Create a test image
convert -size 200x200 xc:blue test.jpg

# 2. Upload
curl -X POST http://localhost:4000/api/upload -F "file=@test.jpg"

# 3. Wait 2 seconds for variation generation

# 4. Check pending approvals
curl http://localhost:4000/api/pending-approvals | jq .

# 5. Clean up
rm test.jpg
```

## Troubleshooting Installation

### "npm: command not found"
**Solution:** Install Node.js from [nodejs.org](https://nodejs.org)

### "Cannot find module 'express'"
**Solution:** Run `npm install` again

### "EADDRINUSE: address already in use :::4000"
**Solution:** Kill the process using port 4000:
```bash
lsof -i :4000
kill -9 <PID>
npm start
```

### "Sharp compilation failed"
**Solution:** Rebuild native modules:
```bash
npm rebuild sharp
```

### Permissions errors on data directory
**Solution:** Fix permissions:
```bash
chmod -R 755 data/
mkdir -p data/uploads
```

## Directory Structure After Installation

```
backend/
├── node_modules/          # Dependencies (auto-created)
├── data/                  # Data storage (auto-created)
│   ├── uploads/           # Image files
│   ├── photos.json        # Photo records
│   ├── variations.json    # Variation records
│   └── approvals.json     # Approval records
├── server.js              # Main server
├── package.json           # Dependencies config
├── .env                   # Configuration
├── .env.example           # Config template
├── .gitignore            # Git rules
├── README.md             # Full documentation
├── QUICK_START.md        # Quick reference
├── FRONTEND_INTEGRATION.md # React guide
├── TEST_EXAMPLES.md      # API examples
├── TYPES.ts              # TypeScript types
├── PROJECT_SUMMARY.md    # This project overview
├── INSTALLATION.md       # This file
└── verify-setup.sh       # Setup verification
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 4000 | Server port |
| `NODE_ENV` | No | development | Environment |
| `CLAUDE_API_KEY` | No | (empty) | Claude API key for captions |
| `INSTAGRAM_ACCESS_TOKEN` | No | (empty) | Instagram token for publishing |
| `INSTAGRAM_USER_ID` | No | (empty) | Instagram user ID for publishing |
| `UPLOAD_DIR` | No | ./data/uploads | Where to save uploads |
| `DATA_DIR` | No | ./data | Where to save data files |
| `MAX_FILE_SIZE` | No | 52428800 | Max file size (bytes) |

## Running Commands Reference

```bash
# Start (production mode)
npm start

# Start (development mode with auto-reload)
npm run dev

# Install dependencies
npm install

# Check syntax
node --check server.js

# Verify setup
./verify-setup.sh

# View server logs
npm run dev 2>&1

# Kill server process
pkill -f "node server.js"
```

## Data Files

### Initial State After Installation

All JSON files start empty:

```bash
cat data/photos.json        # []
cat data/variations.json    # []
cat data/approvals.json     # []
ls data/uploads/            # (empty directory)
```

### Reset to Clean State

```bash
# Clear all data
rm -rf data/uploads/* data/*.json

# Restart server (auto-recreates files)
npm start
```

## Common Setup Issues & Solutions

### Issue: "Port 4000 already in use"
```bash
# Find what's using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=4001 npm start
```

### Issue: "ENOENT: no such file or directory, open 'data/photos.json'"
```bash
# Data directory wasn't created
mkdir -p data/uploads

# Restart server
npm start
```

### Issue: "Cannot upload files"
```bash
# Check permissions
chmod 755 data/uploads
chmod 644 data/*.json

# Verify disk space
df -h
```

### Issue: "Variations not generating"
```bash
# Check Node.js has write access
touch data/test.json
rm data/test.json

# Check for errors in logs
npm run dev 2>&1 | grep -i error
```

### Issue: "Captions not showing"
```bash
# CLAUDE_API_KEY not set
# Edit .env and add your key
CLAUDE_API_KEY=sk-ant-...

# Restart server
npm start

# Upload new photo to test
```

## Performance Tuning (Optional)

### Increase file upload limit
Edit `.env`:
```env
MAX_FILE_SIZE=104857600  # 100MB instead of 50MB
```

### Optimize image quality
Edit `server.js` line 223:
```javascript
.jpeg({ quality: 85 })  // Lower quality, smaller file
```

### Adjust intensity levels
Edit `server.js` lines 162-190 to customize brightness/contrast adjustments

## Security Setup (Optional)

### Add rate limiting
```bash
npm install express-rate-limit
```

Add to `server.js`:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

### Add file type validation
Already implemented in `server.js` line 50-52

### Add request size limits
Already configured in `server.js` line 24-25

## Next Steps After Installation

1. **Read Documentation**
   - QUICK_START.md (2 min)
   - README.md (10 min)

2. **Test the API**
   - See TEST_EXAMPLES.md for curl examples
   - Or use Postman/Insomnia

3. **Integrate Frontend**
   - See FRONTEND_INTEGRATION.md
   - Connect your React/Next.js app

4. **Customize (Optional)**
   - Adjust image processing parameters
   - Add authentication
   - Upgrade to production database

## Verification Checklist

- [ ] Node.js installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Dependencies installed (`npm install` completes)
- [ ] .env file created or copied
- [ ] Data directories created (`ls -la data/`)
- [ ] Server starts without errors (`npm start`)
- [ ] Health check works (`curl http://localhost:4000/api/health`)
- [ ] File upload works (see TEST_EXAMPLES.md)
- [ ] Variations generate (wait 2-3 sec, check pending-approvals)

## Getting Help

If something doesn't work:

1. **Check the logs**
   ```bash
   npm run dev  # Shows all output
   ```

2. **Run setup verification**
   ```bash
   ./verify-setup.sh
   ```

3. **Review troubleshooting sections**
   - INSTALLATION.md (this file) - Setup issues
   - README.md - General issues
   - TEST_EXAMPLES.md - Testing issues
   - FRONTEND_INTEGRATION.md - Frontend issues

4. **Verify each step manually**
   ```bash
   # Step by step
   node --check server.js          # Syntax OK?
   npm list                        # Packages OK?
   ls data/                        # Directories OK?
   PORT=5000 node server.js        # Server starts?
   curl http://localhost:5000/api/health  # API works?
   ```

## System Requirements

### Minimum
- Node.js 16+
- 100MB disk space
- 512MB RAM

### Recommended
- Node.js 18+
- 500MB disk space
- 2GB RAM

### For Production
- Node.js 20+ LTS
- 5GB disk space (for image cache)
- 4GB RAM
- PostgreSQL or SQLite database
- Nginx reverse proxy
- HTTPS/SSL certificate

## Support

For detailed API documentation: **README.md**  
For React integration: **FRONTEND_INTEGRATION.md**  
For testing: **TEST_EXAMPLES.md**  
For types: **TYPES.ts**  

---

**Installation Complete!** 🎉

Your Picture Curation API is ready to use.

Start the server with: `npm start`

Access it at: `http://localhost:4000`
