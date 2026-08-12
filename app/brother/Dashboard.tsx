'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

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

type ProductFormValues = {
  name: string;
  price: string;
  description: string;
  videoUrl: string;
};

const emptyForm: ProductFormValues = { name: '', price: '', description: '', videoUrl: '' };

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    price: String(product.price),
    description: product.description || '',
    videoUrl: product.videoUrl || '',
  };
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, or WEBP image files are allowed.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image is too large. Please choose a file under 4 MB.';
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

function ProductPicture({
  id,
  previewUrl,
  onChange,
  onError,
}: {
  id: string;
  previewUrl: string | null;
  onChange: (file: File) => void;
  onError: (message: string) => void;
}) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      onError(error);
      event.target.value = '';
      return;
    }

    onChange(file);
  }

  return (
    <div className="form-group">
      <label htmlFor={id}>Product Picture</label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="product-picture-input"
        onChange={handleFileChange}
      />
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Product preview" className="product-picture-preview" />
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

  const [newProduct, setNewProduct] = useState<ProductFormValues>(emptyForm);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ProductFormValues>(emptyForm);
  const [editExistingImageUrl, setEditExistingImageUrl] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
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

  function handleNewImageSelected(file: File) {
    setNewImageFile(file);
    setNewImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function resetNewProductForm() {
    setNewProduct(emptyForm);
    setNewImageFile(null);
    setNewImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function handleAddProduct() {
    const price = parsedPrice(newProduct.price);
    if (!newProduct.name.trim() || price === null) {
      showMessage('कृपया नाम र मूल्य सही तरिकाले भर्नुहोस्।', true);
      return;
    }

    setAdding(true);
    try {
      const imageUrl = newImageFile ? await uploadImage(newImageFile) : '';

      const response = await fetch('/api/brother/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, price, imageUrl }),
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
    setEditValues(toFormValues(product));
    setEditExistingImageUrl(product.imageUrl);
    setEditImageFile(null);
    setEditImagePreview(product.imageUrl);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(emptyForm);
    setEditImageFile(null);
    setEditImagePreview(null);
  }

  function handleEditImageSelected(file: File) {
    setEditImageFile(file);
    setEditImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  async function saveEdit(id: string) {
    const price = parsedPrice(editValues.price);
    if (!editValues.name.trim() || price === null) {
      showMessage('कृपया नाम र मूल्य सही तरिकाले भर्नुहोस्।', true);
      return;
    }

    setBusyId(id);
    try {
      // If a new file was chosen, upload it and use the new URL; otherwise
      // resubmit the same existing URL unchanged so the image is kept.
      const imageUrl = editImageFile ? await uploadImage(editImageFile) : editExistingImageUrl || '';

      const response = await fetch(`/api/brother/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editValues, price, imageUrl }),
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
          value={newProduct.name}
          onChange={(e) => setNewProduct((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="product-price">Product Price (AED)</label>
        <input
          id="product-price"
          type="number"
          min="0"
          step="0.01"
          value={newProduct.price}
          onChange={(e) => setNewProduct((f) => ({ ...f, price: e.target.value }))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="product-description">Product Description</label>
        <input
          id="product-description"
          type="text"
          value={newProduct.description}
          onChange={(e) => setNewProduct((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <ProductPicture
        id="product-image"
        previewUrl={newImagePreview}
        onChange={handleNewImageSelected}
        onError={(m) => showMessage(m, true)}
      />
      <div className="form-group">
        <label htmlFor="product-video">Product Video URL</label>
        <input
          id="product-video"
          type="text"
          value={newProduct.videoUrl}
          onChange={(e) => setNewProduct((f) => ({ ...f, videoUrl: e.target.value }))}
        />
      </div>
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
                    value={editValues.name}
                    onChange={(e) => setEditValues((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Price (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editValues.price}
                    onChange={(e) => setEditValues((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={editValues.description}
                    onChange={(e) => setEditValues((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <ProductPicture
                  id={`edit-product-image-${product.id}`}
                  previewUrl={editImagePreview}
                  onChange={handleEditImageSelected}
                  onError={(m) => showMessage(m, true)}
                />
                <div className="form-group">
                  <label>Video URL</label>
                  <input
                    type="text"
                    value={editValues.videoUrl}
                    onChange={(e) => setEditValues((f) => ({ ...f, videoUrl: e.target.value }))}
                  />
                </div>
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
