'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';

export default function AddToCartControl({ productId }: { productId: string }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(productId, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="add-to-cart-row">
      <div className="quantity-stepper">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <span aria-live="polite">{quantity}</span>
        <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(99, q + 1))}>
          +
        </button>
      </div>
      <button type="button" className="save-button" onClick={handleAdd}>
        {added ? 'Added!' : 'Add to Cart'}
      </button>
      {added && (
        <button type="button" className="cancel-button" onClick={() => router.push('/cart')}>
          View Cart
        </button>
      )}
    </div>
  );
}
