'use client';

import { useState } from 'react';
import { useCart } from './CartContext';

// Sits as a SIBLING of the card's <a>, never nested inside it -- nesting a
// <button> inside an <a> is invalid HTML and would fire both the add-to-cart
// handler and the navigation on one click. Adding from here must never
// leave the current page, so it only ever updates the cart badge in place.
export default function CardAddToCartButton({ productId }: { productId: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    addItem(productId, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button type="button" className="card-add-to-cart-button" onClick={handleClick}>
      {added ? 'Added to Cart!' : 'Add to Cart'}
    </button>
  );
}
