import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';

export default function MenuModal({
  restaurant,
  menuItems,
  onClose,
  onAddToCart,
  loadingMenu,
}) {
  const [addedItemId, setAddedItemId] = useState(null);

  if (!restaurant) return null;

  const handleAdd = (item) => {
    onAddToCart(item, restaurant);
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1200);
  };

  // Group items by category
  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>
          {restaurant.name}
        </h2>
        <p style={{ color: 'var(--dark-light)', fontSize: '0.9rem', marginBottom: '20px' }}>
          {restaurant.cuisine} • {restaurant.address}
        </p>

        {loadingMenu ? (
          <div className="empty-state">
            <p>Loading menu...</p>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="empty-state">
            <p>No menu items available at the moment.</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  borderBottom: '2px solid var(--gray-border)',
                  paddingBottom: '8px',
                  marginBottom: '14px',
                }}
              >
                {category}
              </h3>

              <div className="menu-grid">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div key={item.id} className="menu-item-card">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="menu-item-img"
                        />
                      )}
                      <div className="menu-item-info">
                        <h4 className="menu-item-title">{item.name}</h4>
                        <p className="menu-item-desc">{item.description}</p>
                        <span className="menu-item-price">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>

                      <button
                        className="nav-btn nav-btn-primary"
                        style={{
                          padding: '8px 14px',
                          backgroundColor:
                            addedItemId === item.id ? 'var(--secondary)' : 'var(--primary)',
                        }}
                        onClick={() => handleAdd(item)}
                      >
                        {addedItemId === item.id ? (
                          <>
                            <Check size={16} /> Added
                          </>
                        ) : (
                          <>
                            <Plus size={16} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

