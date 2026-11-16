import React from 'react';
import { ShoppingBag, User, LogOut, Package } from 'lucide-react';

export default function Navbar({
  user,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onViewOrders,
  onGoHome,
}) {
  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="logo" onClick={onGoHome}>
          <span style={{ fontSize: '1.8rem' }}>🍔</span>
          <span>FoodRush</span>
        </div>

        <div className="nav-actions">
          {user && (
            <button className="nav-btn nav-btn-outline" onClick={onViewOrders}>
              <Package size={18} />
              <span>My Orders</span>
            </button>
          )}

          <button className="nav-btn nav-btn-primary" onClick={onOpenCart}>
            <ShoppingBag size={18} />
            <span>Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark)' }}>
                Hi, {user.name.split(' ')[0]}
              </span>
              <button
                className="nav-btn nav-btn-outline"
                style={{ padding: '8px 12px' }}
                onClick={onLogout}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="nav-btn nav-btn-outline" onClick={onOpenAuth}>
              <User size={18} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

