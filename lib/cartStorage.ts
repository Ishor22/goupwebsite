// Client-only localStorage helpers for the shopping cart. The cart only
// ever stores {productId, quantity} pairs -- never a price, name, or any
// other product detail -- so there is nothing here a shopper could tamper
// with that would matter: every checkout re-reads current price and
// availability from the database (see /api/orders).
export type CartItem = { productId: string; quantity: number };

const STORAGE_KEY = 'dbg_cart_v1';
const CART_CHANGED_EVENT = 'dbg-cart-changed';

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        item && typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function onCartChanged(handler: () => void) {
  window.addEventListener(CART_CHANGED_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CART_CHANGED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function addCartItem(productId: string, quantity: number) {
  const items = readCart();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }
  writeCart(items);
  return items;
}

export function setCartItemQuantity(productId: string, quantity: number) {
  let items = readCart();
  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== productId);
  } else {
    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity = quantity;
    } else {
      items.push({ productId, quantity });
    }
  }
  writeCart(items);
  return items;
}

export function removeCartItem(productId: string) {
  const items = readCart().filter((i) => i.productId !== productId);
  writeCart(items);
  return items;
}

export function clearCart() {
  writeCart([]);
  return [];
}
