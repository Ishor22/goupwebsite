'use client';

import StatCard from '@/components/dashboard/StatCard';
import { useCart } from './CartContext';

export default function CartCountStat() {
  const { itemCount } = useCart();
  return <StatCard label="Cart Items" value={itemCount} />;
}
