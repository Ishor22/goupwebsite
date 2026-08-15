'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isUploadedImageUrl, isUploadedVideoUrl } from '@/lib/productMedia';
import { withPosterFrame } from '@/lib/video';

export type EditableProduct = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  status: 'PUBLISHED' | 'UNPUBLISHED';
};

type MediaMode = 'upload' | 'url';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, or WEBP image files are allowed.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image is too large. Please choose a file under 1.5 MB.';
  }
  return null;
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/brother/products/upload', { method: 'POST', body: formData });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to upload image. Please try again.');
  return result.url;
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_VIDEO_BYTES = 4 * 1024 * 1024;

function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return 'Only MP4, WEBM, or MOV video files are allowed.';
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return 'Video is too large. Please choose a file under 4 MB, or use a Video URL instead.';
  }
  return null;
}

async function uploadVideo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/brother/products/video-upload', { method: 'POST', body: formData });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to upload video. Please try again.');
  return result.url;
}

// Holds everything needed to resolve one media field (picture or video) at
// submit time: whichever input the brother actually touched wins, and if
// they touched nothing the existing value (if editing) is kept unchanged.
type MediaFieldState = {
  mode: MediaMode;
  file: File | null;
  preview: string | null;
  urlInput: string;
  removed: boolean;
};

function emptyMediaField(mode: MediaMode = 'upload'): MediaFieldState {
  return { mode, file: null, preview: null, urlInput: '', removed: false };
}

// mode defaults to how the existing value was actually stored: an
// uploaded picture is a data: URI, an uploaded video is a Blob URL --
// anything else was a pasted link.
function mediaFieldFromExisting(value: string | null, isUploadedValue: (v: string) => boolean): MediaFieldState {
  if (!value) return emptyMediaField('upload');
  if (isUploadedValue(value)) {
    return { mode: 'upload', file: null, preview: value, urlInput: '', removed: false };
  }
  return { mode: 'url', file: null, preview: value, urlInput: value, removed: false };
}

async function resolveMediaUrl(
  field: MediaFieldState,
  existingValue: string,
  upload: (file: File) => Promise<string>,
): Promise<string> {
  if (field.removed) return '';
  if (field.file) return upload(field.file);
  if (field.urlInput.trim()) return field.urlInput.trim();
  return existingValue;
}

function PictureField({
  idPrefix,
  field,
  onChange,
  onError,
}: {
  idPrefix: string;
  field: MediaFieldState;
  onChange: (next: MediaFieldState) => void;
  onError: (message: string) => void;
}) {
  const [urlPreviewFailed, setUrlPreviewFailed] = useState(false);
  // Debounced so a broken-link error doesn't flash on every keystroke while
  // the brother is still in the middle of typing or pasting a URL.
  const [debouncedUrlPreview, setDebouncedUrlPreview] = useState(field.mode === 'url' ? field.preview : null);

  useEffect(() => {
    if (field.mode !== 'url') return;
    setUrlPreviewFailed(false);
    if (!field.urlInput) {
      // Clearing (including right after a mode switch) is immediate --
      // only setting a *new* non-empty value is debounced, so there's
      // never a flash of a stale preview left over from before.
      setDebouncedUrlPreview(null);
      return;
    }
    const timer = setTimeout(() => setDebouncedUrlPreview(field.urlInput), 500);
    return () => clearTimeout(timer);
  }, [field.mode, field.urlInput]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      onError(error);
      event.target.value = '';
      return;
    }

    if (field.preview && field.preview.startsWith('blob:')) URL.revokeObjectURL(field.preview);
    onChange({ ...field, file, preview: URL.createObjectURL(file), removed: false });
  }

  function handleUrlChange(value: string) {
    onChange({ ...field, urlInput: value, preview: value || null, removed: false });
  }

  // Switching modes clears whatever the *other* mode held -- otherwise a
  // file picked earlier could silently outlive a switch to URL mode and
  // still win at submit time (already handled by resolveMediaUrl's
  // priority order), and -- the part that actually showed a visible bug --
  // a leftover preview from the mode just left behind stays on screen
  // under the newly selected mode, looking like it belongs there.
  function switchMode(mode: MediaMode) {
    if (mode === field.mode) return;
    if (mode === 'url' && field.preview && field.preview.startsWith('blob:')) {
      URL.revokeObjectURL(field.preview);
    }
    onChange(
      mode === 'upload'
        ? { ...field, mode, urlInput: '', preview: field.file ? field.preview : null }
        : { ...field, mode, file: null, preview: null },
    );
  }

  return (
    <div className="form-group">
      <label>Product Picture</label>
      <div className="media-mode-toggle">
        <label>
          <input
            type="radio"
            name={`${idPrefix}-mode`}
            checked={field.mode === 'upload'}
            onChange={() => switchMode('upload')}
          />
          Upload Picture
        </label>
        <label>
          <input
            type="radio"
            name={`${idPrefix}-mode`}
            checked={field.mode === 'url'}
            onChange={() => switchMode('url')}
          />
          Picture URL
        </label>
      </div>

      {field.mode === 'upload' ? (
        <input
          id={idPrefix}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="product-picture-input"
          onChange={handleFileChange}
        />
      ) : (
        <input
          id={idPrefix}
          type="text"
          placeholder="https://example.com/product.jpg"
          value={field.urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
      )}

      {field.mode === 'upload' && field.preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={field.preview} alt="Product preview" className="product-picture-preview" />
      )}
      {field.mode === 'url' && debouncedUrlPreview && !urlPreviewFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={debouncedUrlPreview}
          alt="Product preview"
          className="product-picture-preview"
          onError={() => setUrlPreviewFailed(true)}
        />
      )}
      {field.mode === 'url' && debouncedUrlPreview && urlPreviewFailed && (
        <p className="field-error">Couldn&apos;t load a preview for that link -- double-check the URL.</p>
      )}

      {(field.preview || field.file) && (
        <button
          type="button"
          className="cancel-button media-remove-button"
          onClick={() => onChange({ ...emptyMediaField(field.mode), removed: true })}
        >
          Remove Picture
        </button>
      )}
    </div>
  );
}

function VideoField({
  idPrefix,
  field,
  onChange,
  onError,
}: {
  idPrefix: string;
  field: MediaFieldState;
  onChange: (next: MediaFieldState) => void;
  onError: (message: string) => void;
}) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateVideoFile(file);
    if (error) {
      onError(error);
      event.target.value = '';
      return;
    }

    if (field.preview && field.preview.startsWith('blob:')) URL.revokeObjectURL(field.preview);
    onChange({ ...field, file, preview: URL.createObjectURL(file), removed: false });
  }

  function handleUrlChange(value: string) {
    onChange({ ...field, urlInput: value, removed: false });
  }

  // Switching modes clears whatever the *other* mode held. This matters
  // more here than it sounds: without it, switching from an existing
  // YouTube/link-mode video to "Upload Video" (without picking a file yet)
  // left the old link in field.preview, and since the upload branch below
  // renders <video src={preview}> whenever mode is "upload" and preview is
  // set, that YouTube URL would get handed straight to <video> as if it
  // were a direct file -- producing a broken, unplayable player.
  function switchMode(mode: MediaMode) {
    if (mode === field.mode) return;
    if (mode === 'url' && field.preview && field.preview.startsWith('blob:')) {
      URL.revokeObjectURL(field.preview);
    }
    onChange(
      mode === 'upload'
        ? { ...field, mode, urlInput: '', preview: field.file ? field.preview : null }
        : { ...field, mode, file: null, preview: null },
    );
  }

  return (
    <div className="form-group">
      <label>Product Video</label>
      <div className="media-mode-toggle">
        <label>
          <input
            type="radio"
            name={`${idPrefix}-mode`}
            checked={field.mode === 'upload'}
            onChange={() => switchMode('upload')}
          />
          Upload Video
        </label>
        <label>
          <input
            type="radio"
            name={`${idPrefix}-mode`}
            checked={field.mode === 'url'}
            onChange={() => switchMode('url')}
          />
          Video URL
        </label>
      </div>

      {field.mode === 'upload' ? (
        <input
          id={idPrefix}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="product-picture-input"
          onChange={handleFileChange}
        />
      ) : (
        <input
          id={idPrefix}
          type="text"
          placeholder="https://youtube.com/watch?v=... or a direct video link"
          value={field.urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
      )}

      {field.mode === 'upload' && field.preview && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={withPosterFrame(field.preview)} controls className="product-video-preview" />
      )}

      {(field.preview || field.file || field.urlInput) && (
        <button
          type="button"
          className="cancel-button media-remove-button"
          onClick={() => onChange({ ...emptyMediaField(field.mode), removed: true })}
        >
          Remove Video
        </button>
      )}
    </div>
  );
}

export default function ProductForm({ product }: { product?: EditableProduct }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [image, setImage] = useState<MediaFieldState>(() =>
    product ? mediaFieldFromExisting(product.imageUrl, isUploadedImageUrl) : emptyMediaField(),
  );
  const [video, setVideo] = useState<MediaFieldState>(() =>
    product ? mediaFieldFromExisting(product.videoUrl, isUploadedVideoUrl) : emptyMediaField('url'),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function parsedPrice(): number | null {
    const n = Number(price);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceValue = parsedPrice();
    if (!name.trim() || priceValue === null) {
      setError('कृपया नाम र मूल्य सही तरिकाले भर्नुहोस्।');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const [imageUrl, videoUrl] = await Promise.all([
        resolveMediaUrl(image, product?.imageUrl || '', uploadImage),
        resolveMediaUrl(video, product?.videoUrl || '', uploadVideo),
      ]);

      const response = await fetch(product ? `/api/brother/products/${product.id}` : '/api/brother/products', {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: priceValue, description, imageUrl, videoUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save product. Please try again.');

      router.push('/brother/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Unable to save product. Please try again.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="dash-section-card">
        <h2>Product Information</h2>
        {product && (
          <p className="dash-page-subtitle" style={{ marginBottom: 16 }}>
            Status:{' '}
            <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>
              {product.status === 'PUBLISHED' ? 'Published' : 'Unpublished'}
            </span>
            {' -- set by the admin, not editable here.'}
          </p>
        )}
        <div className="form-group">
          <label htmlFor="product-name">Product Name</label>
          <input id="product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="product-price">Product Price (AED)</label>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="product-description">Product Description</label>
          <input
            id="product-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="dash-section-card">
        <PictureField idPrefix="product-image" field={image} onChange={setImage} onError={setError} />
      </div>

      <div className="dash-section-card">
        <VideoField idPrefix="product-video" field={video} onChange={setVideo} onError={setError} />
      </div>

      {error && <p className="admin-message error">{error}</p>}

      <div className="admin-actions">
        <button type="submit" className="save-button" disabled={saving}>
          {saving ? 'Saving...' : product ? 'Save Product' : 'Publish Product'}
        </button>
        <a href="/brother/products" className="cancel-button">
          Cancel
        </a>
      </div>
    </form>
  );
}
