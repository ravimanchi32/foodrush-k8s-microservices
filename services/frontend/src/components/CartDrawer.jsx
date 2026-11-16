import React, { useState } from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  restaurant,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  user,
  onOpenAuth,
}) {
  const [address, setAddress] = useState(user?.address || '742 Evergreen Terrace, Springfield');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? 2.99 : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Please provide a delivery address');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onCheckout({
        restaurant_id: restaurant.id,
        delivery_address: address,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Your Order</h3>
            {restaurant && (
              <p style={{ fontSize: '0.82rem', color: 'var(--dark-light)' }}>
                From {restaurant.name}
              </p>
            )}
          </div>
          <button className="close-btn" style={{ position: 'static' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: '3rem' }}>🛒</span>
              <p style={{ marginTop: '12px' }}>Your cart is empty.</p>
              <p style={{ fontSize: '0.85rem' }}>Add some tasty dishes from the menu!</p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#ffeae6',
                    color: '#d63031',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--gray-border)',
                      paddingBottom: '12px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{item.name}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--dark-light)' }}>
                        ${Number(item.price).toFixed(2)} each
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="qty-control">
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <span style={{ fontWeight: 700, minWidth: '55px', textAlign: 'right' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        style={{ color: '#e74c3c', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Delivery & Payment Form */}
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
                  Delivery Details
                </h4>

                <div className="form-group">
                  <label>Delivery Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street, apartment, and city..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CARD">Credit / Debit Card (Instant)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: 'var(--dark-light)',
                marginBottom: '6px',
              }}
            >
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: 'var(--dark-light)',
                marginBottom: '10px',
              }}
            >
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--dark)',
                marginBottom: '18px',
                borderTop: '1px solid var(--gray-border)',
                paddingTop: '8px',
              }}
            >
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {submitting ? (
                'Processing Order...'
              ) : !user ? (
                'Sign In to Checkout'
              ) : (
                <>
                  <span>Place Order • ${total.toFixed(2)}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

