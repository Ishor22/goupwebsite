'use client';

import { useState } from 'react';
import EmptyState from '@/components/dashboard/EmptyState';
import { IconSearch } from '@/components/dashboard/icons';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  createdAt: string;
  customer: { name: string; phone: string | null };
  phone: string;
};

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

export default function AdminOrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const filtered = initialOrders.filter((order) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.customer.name.toLowerCase().includes(q) ||
      order.phone.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesPayment = !paymentFilter || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <>
      <div className="orders-filter-bar">
        <div className="dash-search-bar">
          <IconSearch />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, customer, or phone"
            aria-label="Search orders"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by order status">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} aria-label="Filter by payment status">
          <option value="">All Payment Statuses</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={initialOrders.length === 0 ? 'No orders yet.' : 'No orders match your search.'} />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order">{order.orderNumber}</td>
                  <td data-label="Customer">{order.customer.name}</td>
                  <td data-label="Items">{order.itemCount}</td>
                  <td data-label="Total">AED {order.total.toFixed(2)}</td>
                  <td data-label="Payment">
                    <span className={`payment-status-badge payment-status-${order.paymentStatus.toLowerCase()}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className={`order-status-badge order-status-${order.status.toLowerCase()}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td data-label="Actions">
                    <a href={`/admin/orders/${order.id}`} className="cancel-button">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
