# Frontend Integration Guide

This guide shows how to integrate the Picture Curation API backend (running on localhost:4000) with your React/Next.js frontend (localhost:3000).

## Setup

### 1. Ensure Backend is Running

```bash
cd /data/workspace/backend
npm start
# Server runs on http://localhost:4000
```

### 2. Ensure Frontend Allows CORS

The backend is configured to accept requests from `http://localhost:3000`. If your frontend is on a different port, update `server.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true
}));
```

---

## API Service Layer (Recommended)

Create a service file for API calls (e.g., `src/api/photoService.ts`):

```typescript
import { 
  Photo, 
  Variation, 
  PendingApproval,
  UploadResponse,
  PendingApprovalsResponse,
  PreviewResponse,
  PublishResponse
} from './types';

const API_BASE = 'http://localhost:4000/api';

class PhotoService {
  // 1. Upload a photo
  async uploadPhoto(file: File): Promise<Photo> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data: UploadResponse = await response.json();
    return data.photo;
  }

  // 2. Get pending approvals
  async getPendingApprovals(): Promise<PendingApproval[]> {
    const response = await fetch(`${API_BASE}/pending-approvals`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch pending approvals');
    }

    const data: PendingApprovalsResponse = await response.json();
    return data.data;
  }

  // 3. Regenerate variations
  async regenerateVariations(photoId: string): Promise<Variation[]> {
    const response = await fetch(`${API_BASE}/regenerate/${photoId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Regeneration failed');
    }

    const data = await response.json();
    return data.variations;
  }

  // 4. Approve a variation
  async approveVariation(
    photoId: string,
    variationId: string,
    feedback?: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        variationId,
        feedback,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Approval failed');
    }
  }

  // 5. Get preview with caption
  async getPreview(photoId: string, variationId?: string): Promise<PreviewResponse> {
    const url = new URL(`${API_BASE}/preview/${photoId}`);
    if (variationId) {
      url.searchParams.append('variationId', variationId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get preview');
    }

    return response.json();
  }

  // 6. Publish to Instagram
  async publishPhoto(photoId: string, caption: string): Promise<PublishResponse> {
    const response = await fetch(`${API_BASE}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        caption,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Publishing failed');
    }

    return response.json();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new PhotoService();
```

---

## React Hooks (Custom Hooks)

Create reusable hooks for your components:

```typescript
// hooks/usePhoto.ts
import { useState, useCallback } from 'react';
import photoService from '../api/photoService';
import { Photo, Variation, PendingApproval } from '../types';

export function usePhoto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const photo = await photoService.uploadPhoto(file);
      return photo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await photoService.getPendingApprovals();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveVariation = useCallback(
    async (photoId: string, variationId: string, feedback?: string) => {
      setLoading(true);
      setError(null);
      try {
        await photoService.approveVariation(photoId, variationId, feedback);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Approval failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPreview = useCallback(async (photoId: string, variationId?: string) => {
    setLoading(true);
    setError(null);
    try {
      return await photoService.getPreview(photoId, variationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get preview';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishPhoto = useCallback(async (photoId: string, caption: string) => {
    setLoading(true);
    setError(null);
    try {
      return await photoService.publishPhoto(photoId, caption);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publishing failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    uploadPhoto,
    getPendingApprovals,
    approveVariation,
    getPreview,
    publishPhoto,
  };
}
```

---

## Example Components

### Upload Component

```typescript
// components/PhotoUpload.tsx
import React, { useRef, useState } from 'react';
import { usePhoto } from '../hooks/usePhoto';
import { Photo } from '../types';

interface PhotoUploadProps {
  onUploadSuccess?: (photo: Photo) => void;
}

export function PhotoUpload({ onUploadSuccess }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loading, error, uploadPhoto } = usePhoto();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      const photo = await uploadPhoto(file);
      setPreview(null);
      fileInputRef.current.value = '';
      onUploadSuccess?.(photo);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div className="photo-upload">
      <h2>Upload Photo</h2>
      {error && <div className="error">{error}</div>}

      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg"
        onChange={handleFileChange}
        disabled={loading}
      />

      <button
        onClick={handleUpload}
        disabled={loading || !preview}
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
```

### Approval Component

```typescript
// components/VariationSelector.tsx
import React, { useState } from 'react';
import { PendingApproval } from '../types';
import { usePhoto } from '../hooks/usePhoto';

interface VariationSelectorProps {
  pendingApproval: PendingApproval;
  onApprovalSuccess?: () => void;
}

export function VariationSelector({
  pendingApproval,
  onApprovalSuccess,
}: VariationSelectorProps) {
  const [selectedVariationId, setSelectedVariationId] = useState(
    pendingApproval.variations[2].id // Default to Medium
  );
  const [feedback, setFeedback] = useState('');
  const { loading, error, approveVariation } = usePhoto();

  const handleApprove = async () => {
    try {
      await approveVariation(
        pendingApproval.photo.id,
        selectedVariationId,
        feedback
      );
      onApprovalSuccess?.();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  return (
    <div className="variation-selector">
      <h3>{pendingApproval.photo.filename}</h3>

      <div className="variations-grid">
        {pendingApproval.variations.map((variation) => (
          <div
            key={variation.id}
            className={`variation ${
              selectedVariationId === variation.id ? 'selected' : ''
            }`}
            onClick={() => setSelectedVariationId(variation.id)}
          >
            <img
              src={variation.url}
              alt={variation.label}
              loading="lazy"
            />
            <span className="intensity">{variation.label}</span>
          </div>
        ))}
      </div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Optional feedback..."
        disabled={loading}
      />

      {error && <div className="error">{error}</div>}

      <button
        onClick={handleApprove}
        disabled={loading}
      >
        {loading ? 'Approving...' : 'Approve'}
      </button>
    </div>
  );
}
```

### Preview & Publish Component

```typescript
// components/PreviewPublish.tsx
import React, { useEffect, useState } from 'react';
import { Photo, Variation } from '../types';
import { usePhoto } from '../hooks/usePhoto';

interface PreviewPublishProps {
  photoId: string;
  onPublishSuccess?: () => void;
}

export function PreviewPublish({ photoId, onPublishSuccess }: PreviewPublishProps) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [caption, setCaption] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const { loading, error, getPreview, publishPhoto } = usePhoto();

  useEffect(() => {
    const loadPreview = async () => {
      const preview = await getPreview(photoId);
      setPhoto(preview.photo);
      setSelectedVariation(preview.selectedVariation);
      setGeneratedCaption(preview.caption);
      setCaption(preview.caption);
    };

    loadPreview();
  }, [photoId, getPreview]);

  const handlePublish = async () => {
    if (!photo) return;

    try {
      await publishPhoto(photo.id, caption);
      onPublishSuccess?.();
    } catch (err) {
      console.error('Publishing failed:', err);
    }
  };

  if (!photo || !selectedVariation) {
    return <div>Loading...</div>;
  }

  return (
    <div className="preview-publish">
      <h2>Preview & Publish</h2>

      <div className="preview-area">
        <img src={selectedVariation.url} alt="Preview" />
      </div>

      <div className="caption-editor">
        <label>
          AI-Generated Caption:
          <p className="ai-caption">{generatedCaption}</p>
        </label>

        <label>
          Custom Caption (optional):
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Edit or replace the caption..."
            disabled={loading}
          />
        </label>

        <p className="char-count">{caption.length} characters</p>
      </div>

      {error && <div className="error">{error}</div>}

      <button
        onClick={handlePublish}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Publishing...' : 'Publish to Instagram'}
      </button>
    </div>
  );
}
```

---

## Complete Workflow Example

```typescript
// pages/PhotoCuration.tsx
import React, { useState } from 'react';
import { Photo, PendingApproval } from '../types';
import { PhotoUpload } from '../components/PhotoUpload';
import { VariationSelector } from '../components/VariationSelector';
import { PreviewPublish } from '../components/PreviewPublish';
import { usePhoto } from '../hooks/usePhoto';

type Step = 'upload' | 'approve' | 'preview' | 'success';

export function PhotoCuration() {
  const [step, setStep] = useState<Step>('upload');
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const { getPendingApprovals } = usePhoto();

  const handleUploadSuccess = async (photo: Photo) => {
    setCurrentPhotoId(photo.id);
    
    // Wait for variations to be generated
    let retries = 0;
    const checkVariations = async () => {
      const approvals = await getPendingApprovals();
      const photoApprovals = approvals.filter((a) => a.photo.id === photo.id);

      if (photoApprovals.length > 0) {
        setPendingApprovals(photoApprovals);
        setStep('approve');
      } else if (retries < 10) {
        retries++;
        setTimeout(checkVariations, 1000);
      }
    };

    checkVariations();
  };

  const handleApprovalSuccess = () => {
    setStep('preview');
  };

  const handlePublishSuccess = () => {
    setStep('success');
    // Reset after a delay
    setTimeout(() => {
      setStep('upload');
      setCurrentPhotoId(null);
      setPendingApprovals([]);
    }, 2000);
  };

  return (
    <div className="photo-curation">
      <h1>Photo Curation Workflow</h1>

      {step === 'upload' && (
        <PhotoUpload onUploadSuccess={handleUploadSuccess} />
      )}

      {step === 'approve' && pendingApprovals.length > 0 && (
        <VariationSelector
          pendingApproval={pendingApprovals[0]}
          onApprovalSuccess={handleApprovalSuccess}
        />
      )}

      {step === 'preview' && currentPhotoId && (
        <PreviewPublish
          photoId={currentPhotoId}
          onPublishSuccess={handlePublishSuccess}
        />
      )}

      {step === 'success' && (
        <div className="success-message">
          ✅ Photo published successfully!
        </div>
      )}
    </div>
  );
}
```

---

## CSS Styling (Example)

```css
/* styles.css */

.photo-curation {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.photo-upload,
.variation-selector,
.preview-publish {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview {
  margin: 20px 0;
  max-width: 100%;
}

.preview img {
  width: 100%;
  border-radius: 8px;
}

.variations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin: 20px 0;
}

.variation {
  cursor: pointer;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.variation:hover {
  border-color: #0066cc;
  transform: scale(1.05);
}

.variation.selected {
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.variation img {
  width: 100%;
  display: block;
}

.variation .intensity {
  display: block;
  padding: 8px;
  text-align: center;
  font-size: 12px;
  background: #f5f5f5;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

button {
  background: #0066cc;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #0052a3;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  padding: 10px;
  background: #ffebee;
  border-radius: 4px;
  margin: 10px 0;
}

.success-message {
  color: #388e3c;
  padding: 15px;
  background: #e8f5e9;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}
```

---

## Environment Variables (Frontend)

Create a `.env` file in your frontend:

```env
REACT_APP_API_BASE_URL=http://localhost:4000/api
```

Then use it in your service:

```typescript
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';
```

---

## Testing the Integration

1. **Start Backend:**
   ```bash
   cd /data/workspace/backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd /path/to/frontend
   npm start
   ```

3. **Test Flow:**
   - Upload a JPG photo
   - Wait for variations to generate (2-3 seconds)
   - Select and approve a variation
   - Preview with AI caption
   - Publish to Instagram

---

## Troubleshooting

### CORS Error

**Error:** `Access to XMLHttpRequest at 'http://localhost:4000/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**
1. Ensure backend server is running
2. Check CORS configuration in `server.js` line 15
3. Restart both frontend and backend

### Variations Not Showing

**Problem:** Variations take too long to generate

**Solution:**
- Poll `/api/pending-approvals` with a delay
- Show a loading state while waiting
- Implement exponential backoff for retries

### Caption Not Generated

**Problem:** Caption is generic ("Beautiful moment captured! ✨")

**Solution:**
1. Set `CLAUDE_API_KEY` in backend `.env`
2. Restart backend server
3. Upload a new photo

### Image Not Found

**Problem:** 404 on `/uploads/...` images

**Solution:**
- Ensure `data/uploads` directory exists
- Check file permissions
- Verify upload completed successfully

---

## Deployment

For production deployment:

1. **Change API URL:**
   ```env
   REACT_APP_API_BASE_URL=https://api.youromain.com
   ```

2. **Update CORS in backend:**
   ```javascript
   origin: ['https://yourfrontend.com', 'https://yourapi.com']
   ```

3. **Use environment-specific configs**

---

## Additional Resources

- Backend API Documentation: See `README.md` in backend folder
- Type Definitions: See `TYPES.ts` in backend folder
- Testing Examples: See `TEST_EXAMPLES.md` in backend folder
