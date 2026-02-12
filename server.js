require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { Anthropic } = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:4000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('data/uploads'));

// Setup file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG files are allowed'));
    }
  },
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 52428800) }
});

// Ensure data directories exist
const uploadsDir = process.env.UPLOAD_DIR || './data/uploads';
const dataDir = process.env.DATA_DIR || './data';
const photosFile = path.join(dataDir, 'photos.json');
const variationsFile = path.join(dataDir, 'variations.json');
const approvalsFile = path.join(dataDir, 'approvals.json');

[uploadsDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize JSON files if they don't exist
if (!fs.existsSync(photosFile)) {
  fs.writeFileSync(photosFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(variationsFile)) {
  fs.writeFileSync(variationsFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(approvalsFile)) {
  fs.writeFileSync(approvalsFile, JSON.stringify([], null, 2));
}

// Helper functions
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getPhotos() {
  return readJSON(photosFile);
}

function getVariations() {
  return readJSON(variationsFile);
}

function getApprovals() {
  return readJSON(approvalsFile);
}

function savePhoto(photo) {
  const photos = getPhotos();
  const index = photos.findIndex(p => p.id === photo.id);
  if (index === -1) {
    photos.push(photo);
  } else {
    photos[index] = photo;
  }
  writeJSON(photosFile, photos);
  return photo;
}

function saveVariation(variation) {
  const variations = getVariations();
  const index = variations.findIndex(v => v.id === variation.id);
  if (index === -1) {
    variations.push(variation);
  } else {
    variations[index] = variation;
  }
  writeJSON(variationsFile, variations);
  return variation;
}

function saveApproval(approval) {
  const approvals = getApprovals();
  approvals.push(approval);
  writeJSON(approvalsFile, approvals);
  return approval;
}

async function generateVariations(photoId, imagePath) {
  const variations = [];
  const intensities = [
    { level: 1, label: 'Subtle' },
    { level: 2, label: 'Light' },
    { level: 3, label: 'Medium' },
    { level: 4, label: 'Strong' },
    { level: 5, label: 'Intense' }
  ];

  const image = sharp(imagePath);
  const metadata = await image.metadata();

  for (const { level, label } of intensities) {
    const factor = level / 5; // 0.2 to 1.0
    
    // Calculate adjustments (more intense = more dramatic)
    const brightness = 1 + (factor * 0.15); // +0 to +15% brightness
    const contrast = 1 + (factor * 0.3); // +0 to +30% contrast
    const saturation = 1 + (factor * 0.25); // +0 to +25% saturation
    const warmth = Math.round(factor * 10); // 0 to 10 warmth shift

    const variationId = uuidv4();
    const filename = `${photoId}-var-${level}-${variationId}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    // Apply edits using sharp
    await sharp(imagePath)
      .modulate({
        brightness: brightness,
        saturation: saturation
      })
      .linear(contrast, 0) // Apply contrast
      // Warmth adjustment via color shift
      .tint({ r: warmth, g: 0, b: -warmth * 0.5 })
      .jpeg({ quality: 90 })
      .toFile(filepath);

    const variation = {
      id: variationId,
      photoId: photoId,
      intensity: level,
      label: label,
      url: `/uploads/${filename}`
    };

    variations.push(variation);
    saveVariation(variation);
  }

  return variations;
}

async function generateCaption(photoPath, photoId) {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      return 'Beautiful photo ready to share! 📸✨';
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(photoPath);
    const base64Image = imageBuffer.toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Generate a short, snappy Instagram caption (max 150 characters) for this photo. No hashtags, just creative and engaging text. Respond with only the caption, nothing else.'
            }
          ],
        }
      ],
    });

    const caption = message.content[0].type === 'text' ? message.content[0].text.trim() : 'Beautiful moment captured! ✨';
    return caption;
  } catch (error) {
    console.error('Error generating caption:', error);
    // Return default caption if API fails
    return 'Beautiful moment captured! ✨';
  }
}

// Routes

// 1. POST /api/upload - Upload and process a photo
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const photoId = uuidv4();
    const filename = `${photoId}-original.jpg`;
    const filepath = path.join(uploadsDir, filename);

    // Save original file
    await sharp(req.file.buffer)
      .jpeg({ quality: 95 })
      .toFile(filepath);

    // Create photo record
    const photo = {
      id: photoId,
      filename: filename,
      originalUrl: `/uploads/${filename}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    savePhoto(photo);

    // Generate variations asynchronously
    setImmediate(async () => {
      try {
        photo.status = 'variations_ready';
        await generateVariations(photoId, filepath);
        savePhoto(photo);
      } catch (error) {
        console.error('Error generating variations:', error);
      }
    });

    res.json({
      success: true,
      photo: photo,
      message: 'Photo uploaded. Variations are being generated...'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /api/pending-approvals - Get all photos waiting for approval with variations
app.get('/api/pending-approvals', (req, res) => {
  try {
    const photos = getPhotos().filter(p => p.status === 'variations_ready');
    const variations = getVariations();

    const pendingApprovals = photos.map(photo => ({
      photo: photo,
      variations: variations.filter(v => v.photoId === photo.id)
    }));

    res.json({
      success: true,
      data: pendingApprovals,
      total: pendingApprovals.length
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /api/regenerate/:photoId - Create new set of 5 variations
app.post('/api/regenerate/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const photos = getPhotos();
    const photo = photos.find(p => p.id === photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Find original file
    const originalFile = path.join(uploadsDir, photo.filename);
    if (!fs.existsSync(originalFile)) {
      return res.status(404).json({ error: 'Original file not found' });
    }

    // Delete old variations
    const variations = getVariations();
    const oldVariations = variations.filter(v => v.photoId === photoId);
    oldVariations.forEach(v => {
      const filePath = path.join(uploadsDir, path.basename(v.url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Remove old variations from data
    const updatedVariations = variations.filter(v => v.photoId !== photoId);
    writeJSON(variationsFile, updatedVariations);

    // Generate new variations
    const newVariations = await generateVariations(photoId, originalFile);

    res.json({
      success: true,
      variations: newVariations,
      message: 'New variations generated'
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. POST /api/approve - Approve a variation for a photo
app.post('/api/approve', (req, res) => {
  try {
    const { photoId, variationId, feedback } = req.body;

    if (!photoId || !variationId) {
      return res.status(400).json({ error: 'photoId and variationId are required' });
    }

    const photos = getPhotos();
    const photo = photos.find(p => p.id === photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Update photo status
    photo.status = 'approved';
    savePhoto(photo);

    // Save approval record
    const approval = {
      id: uuidv4(),
      photoId: photoId,
      variationId: variationId,
      feedback: feedback || '',
      approvedAt: new Date().toISOString()
    };

    saveApproval(approval);

    res.json({
      success: true,
      approval: approval,
      photo: photo
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. GET /api/preview/:photoId - Get photo with selected variation and AI caption
app.get('/api/preview/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const { variationId } = req.query;

    const photos = getPhotos();
    const photo = photos.find(p => p.id === photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const variations = getVariations();
    let selectedVariation = variationId 
      ? variations.find(v => v.id === variationId && v.photoId === photoId)
      : variations.find(v => v.photoId === photoId && v.intensity === 3); // Default to Medium

    if (!selectedVariation) {
      selectedVariation = variations.find(v => v.photoId === photoId);
    }

    if (!selectedVariation) {
      return res.status(404).json({ error: 'No variations found for this photo' });
    }

    // Generate caption for the selected variation
    const variationPath = path.join(uploadsDir, path.basename(selectedVariation.url));
    const caption = await generateCaption(variationPath, photoId);

    res.json({
      success: true,
      photo: photo,
      selectedVariation: selectedVariation,
      caption: caption
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. POST /api/publish - Publish photo to Instagram
app.post('/api/publish', async (req, res) => {
  try {
    const { photoId, caption } = req.body;

    if (!photoId) {
      return res.status(400).json({ error: 'photoId is required' });
    }

    const photos = getPhotos();
    const photo = photos.find(p => p.id === photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Mock Instagram publishing (actual implementation would require Instagram API)
    const publicationRecord = {
      id: uuidv4(),
      photoId: photoId,
      caption: caption || 'Beautiful photo shared! ✨',
      instagramPostId: `mock-ig-${uuidv4()}`, // Mock Instagram post ID
      publishedAt: new Date().toISOString(),
      status: 'published'
    };

    // Update photo status
    photo.status = 'published';
    savePhoto(photo);

    res.json({
      success: true,
      message: 'Photo published successfully (mocked)',
      publication: publicationRecord,
      note: 'To enable real Instagram publishing, provide INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in .env'
    });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'picture-curation-api',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Picture Curation API running on http://localhost:${PORT}`);
  console.log('📁 Upload directory:', path.resolve(uploadsDir));
  console.log('💾 Data directory:', path.resolve(dataDir));
  console.log('');
  console.log('📚 Available endpoints:');
  console.log('   POST   /api/upload');
  console.log('   GET    /api/pending-approvals');
  console.log('   POST   /api/regenerate/:photoId');
  console.log('   POST   /api/approve');
  console.log('   GET    /api/preview/:photoId');
  console.log('   POST   /api/publish');
  console.log('   GET    /api/health');
});

module.exports = app;
