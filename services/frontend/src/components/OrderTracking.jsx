import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Truck, ChefHat, RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '../api';

const ORDER_STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'On The Way', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderTracking({ orderId, onBack, user }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await api.getOrderTracking(orderId);
      setOrder(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch order status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 10 seconds for real-time tracking updates
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleAdvanceStatus = async () => {
    if (!order) return;
    const currentIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);
    if (currentIndex < ORDER_STEPS.length - 1) {
      const nextStatus = ORDER_STEPS[currentIndex + 1].key;
      try {
        setUpdating(true);
        const updated = await api.updateOrderStatus(order.id, nextStatus);
        setOrder(updated);
      } catch (err) {
        alert(err.message || 'Could not update status');
      } finally {
        setUpdating(false);
      }
    }
  };

  if (loading && !order) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p>Loading order #{orderId} details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: '#d63031' }}>{error}</p>
        <button className="nav-btn nav-btn-outline" style={{ marginTop: '16px' }} onClick={onBack}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);
  const progressPercent =
    currentStepIndex >= 0 ? (currentStepIndex / (ORDER_STEPS.length - 1)) * 100 : 0;

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <button
        className="nav-btn nav-btn-outline"
        onClick={onBack}
        style={{ marginBottom: '24px' }}
      >
        <ArrowLeft size={16} /> Back to Restaurants
      </button>

      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--gray-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--dark-light)',
                fontWeight: 600,
              }}
            >
              Order #{order.id}
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              {order.restaurant_name || 'Restaurant Order'}
            </h2>
          </div>

          <button
            className="nav-btn nav-btn-outline"
            onClick={fetchOrder}
            title="Refresh order status"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Status Stepper */}
        <div className="stepper-container">
          <div className="stepper-line">
            <div className="stepper-progress" style={{ width: `${progressPercent}%` }} />
          </div>

          {ORDER_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="step-icon">
                  <Icon size={20} />
                </div>
                <span className="step-label">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Demo Status Simulator for Testing */}
        {user?.role === 'admin' && (
          <div
            style={{
              margin: '24px 0',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed #ced6e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Admin / Test Control</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--dark-light)' }}>
                Advance status to simulate restaurant and delivery driver actions.
              </p>
            </div>
            <button
              className="nav-btn nav-btn-primary"
              style={{ fontSize: '0.85rem' }}
              onClick={handleAdvanceStatus}
              disabled={updating || currentStepIndex === ORDER_STEPS.length - 1}
            >
              {updating ? 'Updating...' : 'Advance Next Stage'}
            </button>
          </div>
        )}

        {/* Order Details Breakdown */}
        <div style={{ marginTop: '28px', borderTop: '1px solid var(--gray-border)', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
            Items Ordered
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.95rem',
                }}
              >
                <span>
                  {item.quantity}x {item.item_name}
                </span>
                <span style={{ fontWeight: 600 }}>${Number(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--gray-border)',
              fontSize: '1.15rem',
              fontWeight: 800,
            }}
          >
            <span>Total Paid</span>
            <span style={{ color: 'var(--primary)' }}>
              ${Number(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Delivery Address & Payment Info */}
        <div
          style={{
            marginTop: '24px',
            background: '#f8f9fa',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            fontSize: '0.88rem',
          }}
        >
          <div>
            <p style={{ color: 'var(--dark-light)', fontWeight: 600 }}>Delivery Destination</p>
            <p style={{ fontWeight: 600, marginTop: '4px' }}>{order.delivery_address}</p>
          </div>
          <div>
            <p style={{ color: 'var(--dark-light)', fontWeight: 600 }}>Payment Method</p>
            <p style={{ fontWeight: 600, marginTop: '4px' }}>
              {order.payment?.payment_method} ({order.payment?.status})
            </p>
            {order.payment?.transaction_id && (
              <p style={{ fontSize: '0.75rem', color: '#888' }}>
                Ref: {order.payment.transaction_id}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

