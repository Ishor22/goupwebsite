'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isUploadedImageUrl, isUploadedVideoUrl } from '@/lib/productMedia';

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  status: 'PUBLISHED' | 'UNPUBLISHED';
  createdAt: string;
};

type Profile = { email: string; bio: string | null; photoUrl: string | null };

type TextFormValues = { name: string; price: string; description: string };

const emptyTextForm: TextFormValues = { name: '', price: '', description: '' };

function toTextFormValues(product: Product): TextFormValues {
  return {
    name: product.name,
    price: String(product.price),
    description: product.description || '',
  };
}

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
    setUrlPreviewFailed(false);
    onChange({ ...field, urlInput: value, preview: value || null, removed: false });
  }

  // Switching modes clears whatever the *other* mode held -- otherwise a
  // file picked earlier could silently outlive a switch to URL mode and
  // still win at submit time, even though it's no longer visible on screen.
  function switchMode(mode: MediaMode) {
    if (mode === 'url' && field.preview && field.preview.startsWith('blob:')) {
      URL.revokeObjectURL(field.preview);
    }
    onChange(
      mode === 'upload'
        ? { ...field, mode, urlInput: '' }
        : { ...field, mode, file: null, preview: field.urlInput || null },
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
      {field.mode === 'url' && field.preview && !urlPreviewFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={field.preview}
          alt="Product preview"
          className="product-picture-preview"
          onError={() => setUrlPreviewFailed(true)}
        />
      )}
      {field.mode === 'url' && field.preview && urlPreviewFailed && (
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

  // Switching modes clears whatever the *other* mode held -- otherwise a
  // file picked earlier could silently outlive a switch to URL mode and
  // still win at submit time, even though it's no longer visible on screen.
  function switchMode(mode: MediaMode) {
    if (mode === 'url' && field.preview && field.preview.startsWith('blob:')) {
      URL.revokeObjectURL(field.preview);
    }
    onChange(mode === 'upload' ? { ...field, mode } : { ...field, mode, file: null, preview: null });
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
        <video src={field.preview} controls className="product-video-preview" />
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

export default function Dashboard({
  brotherName,
  initialProfile,
  initialProducts,
}: {
  brotherName: string;
  initialProfile: Profile;
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [profile, setProfile] = useState(initialProfile);
  const [profileForm, setProfileForm] = useState({
    email: initialProfile.email,
    bio: initialProfile.bio || '',
    photoUrl: initialProfile.photoUrl || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [newText, setNewText] = useState<TextFormValues>(emptyTextForm);
  const [newImage, setNewImage] = useState<MediaFieldState>(emptyMediaField());
  const [newVideo, setNewVideo] = useState<MediaFieldState>(emptyMediaField('url'));
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<TextFormValues>(emptyTextForm);
  const [editExistingImageUrl, setEditExistingImageUrl] = useState('');
  const [editExistingVideoUrl, setEditExistingVideoUrl] = useState('');
  const [editImage, setEditImage] = useState<MediaFieldState>(emptyMediaField());
  const [editVideo, setEditVideo] = useState<MediaFieldState>(emptyMediaField('url'));
  const [busyId, setBusyId] = useState<string | null>(null);

  function showMessage(text: string, isError = false) {
    setMessage({ text, isError });
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/brother/logout', { method: 'POST' });
    } finally {
      router.push('/brother/login');
      router.refresh();
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const response = await fetch('/api/brother/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update profile. Please try again.');

      setProfile(result.profile);
      showMessage('Profile updated successfully.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to update profile. Please try again.', true);
    } finally {
      setSavingProfile(false);
    }
  }

  function parsedPrice(value: string): number | null {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function resetNewProductForm() {
    setNewText(emptyTextForm);
    setNewImage(emptyMediaField());
    setNewVideo(emptyMediaField('url'));
  }

  async function handleAddProduct() {
    const price = parsedPrice(newText.price);
    if (!newText.name.trim() || price === null) {
      showMessage('कृपया नाम र मूल्य सही तरिकाले भर्नुहोस्।', true);
      return;
    }

    setAdding(true);
    try {
      const [imageUrl, videoUrl] = await Promise.all([
        resolveMediaUrl(newImage, '', uploadImage),
        resolveMediaUrl(newVideo, '', uploadVideo),
      ]);

      const response = await fetch('/api/brother/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newText, price, imageUrl, videoUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to add product. Please try again.');

      setProducts((prev) => [result.product, ...prev]);
      resetNewProductForm();
      showMessage('Product added successfully.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to add product. Please try again.', true);
    } finally {
      setAdding(false);
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditText(toTextFormValues(product));
    setEditExistingImageUrl(product.imageUrl || '');
    setEditExistingVideoUrl(product.videoUrl || '');
    setEditImage(mediaFieldFromExisting(product.imageUrl, isUploadedImageUrl));
    setEditVideo(mediaFieldFromExisting(product.videoUrl, isUploadedVideoUrl));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText(emptyTextForm);
    setEditImage(emptyMediaField());
    setEditVideo(emptyMediaField('url'));
  }

  async function saveEdit(id: string) {
    const price = parsedPrice(editText.price);
    if (!editText.name.trim() || price === null) {
      showMessage('कृपया नाम र मूल्य सही तरिकाले भर्नुहोस्।', true);
      return;
    }

    setBusyId(id);
    try {
      const [imageUrl, videoUrl] = await Promise.all([
        resolveMediaUrl(editImage, editExistingImageUrl, uploadImage),
        resolveMediaUrl(editVideo, editExistingVideoUrl, uploadVideo),
      ]);

      const response = await fetch(`/api/brother/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editText, price, imageUrl, videoUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update product. Please try again.');

      setProducts((prev) => prev.map((p) => (p.id === id ? result.product : p)));
      setEditingId(null);
      showMessage('Product updated successfully.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to update product. Please try again.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setBusyId(id);
    try {
      const response = await fetch(`/api/brother/products/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete product. Please try again.');

      setProducts((prev) => prev.filter((p) => p.id !== id));
      showMessage('Product deleted successfully.');
    } catch (err: any) {
      showMessage(err.message || 'Unable to delete product. Please try again.', true);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <h2>Welcome, {brotherName}</h2>
        <button className="cancel-button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      {message && <p className={`admin-message${message.isError ? ' error' : ''}`}>{message.text}</p>}

      <h3 className="dashboard-section-title">प्रोफाइल</h3>
      <div className="form-group">
        <label htmlFor="profile-email">Email</label>
        <input
          id="profile-email"
          type="email"
          value={profileForm.email}
          onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="profile-bio">Bio</label>
        <input
          id="profile-bio"
          type="text"
          value={profileForm.bio}
          onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="profile-photo">Photo URL</label>
        <input
          id="profile-photo"
          type="text"
          value={profileForm.photoUrl}
          onChange={(e) => setProfileForm((f) => ({ ...f, photoUrl: e.target.value }))}
        />
      </div>
      <div className="admin-actions">
        <button className="save-button" onClick={handleSaveProfile} disabled={savingProfile}>
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <h3 className="dashboard-section-title">नयाँ उत्पादन थप्नुहोस्</h3>
      <div className="form-group">
        <label htmlFor="product-name">Product Name</label>
        <input
          id="product-name"
          type="text"
          value={newText.name}
          onChange={(e) => setNewText((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="product-price">Product Price (AED)</label>
        <input
          id="product-price"
          type="number"
          min="0"
          step="0.01"
          value={newText.price}
          onChange={(e) => setNewText((f) => ({ ...f, price: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="product-description">Product Description</label>
        <input
          id="product-description"
          type="text"
          value={newText.description}
          onChange={(e) => setNewText((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <PictureField idPrefix="product-image" field={newImage} onChange={setNewImage} onError={(m) => showMessage(m, true)} />
      <VideoField idPrefix="product-video" field={newVideo} onChange={setNewVideo} onError={(m) => showMessage(m, true)} />
      <div className="admin-actions">
        <button className="save-button" onClick={handleAddProduct} disabled={adding}>
          {adding ? 'Saving...' : 'Publish Product'}
        </button>
      </div>

      <h3 className="dashboard-section-title">मेरा उत्पादनहरू</h3>
      <ul className="admin-product-list">
        {products.length === 0 && <li>कुनै उत्पादन थपिएको छैन।</li>}
        {products.map((product) => {
          const isEditing = editingId === product.id;
          const isBusy = busyId === product.id;

          if (isEditing) {
            return (
              <li key={product.id} className="admin-product-row admin-product-row-editing">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={editText.name}
                    onChange={(e) => setEditText((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Price (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editText.price}
                    onChange={(e) => setEditText((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={editText.description}
                    onChange={(e) => setEditText((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <PictureField
                  idPrefix={`edit-product-image-${product.id}`}
                  field={editImage}
                  onChange={setEditImage}
                  onError={(m) => showMessage(m, true)}
                />
                <VideoField
                  idPrefix={`edit-product-video-${product.id}`}
                  field={editVideo}
                  onChange={setEditVideo}
                  onError={(m) => showMessage(m, true)}
                />
                <div className="admin-brother-actions">
                  <button className="save-button" onClick={() => saveEdit(product.id)} disabled={isBusy}>
                    {isBusy ? 'Saving...' : 'Save'}
                  </button>
                  <button className="cancel-button" onClick={cancelEdit} disabled={isBusy}>
                    Cancel
                  </button>
                </div>
              </li>
            );
          }

          return (
            <li key={product.id} className="admin-product-row">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="admin-product-thumb" loading="lazy" />
              ) : (
                <div className="admin-product-thumb admin-product-thumb-placeholder" aria-hidden="true" />
              )}
              <div className="admin-product-info">
                <span className="admin-product-name">{product.name}</span>
                <span className="admin-product-price">AED {product.price.toFixed(2)}</span>
                <span className={`admin-product-status admin-product-status-${product.status.toLowerCase()}`}>
                  {product.status === 'PUBLISHED' ? 'Published' : 'Unpublished'}
                </span>
              </div>
              <div className="admin-brother-actions">
                <button className="cancel-button" onClick={() => startEdit(product)} disabled={isBusy}>
                  Edit
                </button>
                <button className="delete-button" onClick={() => handleDelete(product.id)} disabled={isBusy}>
                  {isBusy ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
