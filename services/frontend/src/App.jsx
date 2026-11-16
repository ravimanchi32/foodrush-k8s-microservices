import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RestaurantList from './components/RestaurantList';
import MenuModal from './components/MenuModal';
import CartDrawer from './components/CartDrawer';
import OrderTracking from './components/OrderTracking';
import AuthModal from './components/AuthModal';
import { api } from './api';
import { Package, Clock } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected restaurant & Menu modal state
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active view: 'home' | 'tracking' | 'orders'
  const [currentView, setCurrentView] = useState('home');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [orderList, setOrderList] = useState([]);

  // Auth modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Load user on startup if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then((userData) => {
          if (userData) setUser(userData);
          else localStorage.removeItem('token');
        })
        .catch(() => localStorage.removeItem('token'));
    }
  }, []);

  // Fetch restaurants
  const fetchRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const data = await api.getRestaurants(selectedCuisine, searchTerm);
      setRestaurants(data);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchRestaurants, 300);
    return () => clearTimeout(timeout);
  }, [selectedCuisine, searchTerm]);

  // Handle selecting a restaurant to view menu
  const handleSelectRestaurant = async (restaurant) => {
    setActiveRestaurant(restaurant);
    try {
      setLoadingMenu(true);
      const items = await api.getRestaurantMenu(restaurant.id);
      setMenuItems(items);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Cart management
  const handleAddToCart = (item, restaurant) => {
    // If cart has items from another restaurant, confirm reset
    if (cartRestaurant && cartRestaurant.id !== restaurant.id && cart.length > 0) {
      const confirmReset = window.confirm(
        `Your cart contains dishes from ${cartRestaurant.name}. Discard and start a new order from ${restaurant.name}?`
      );
      if (!confirmReset) return;
      setCart([]);
    }

    setCartRestaurant(restaurant);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const handleRemoveItem = (itemId) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i.id !== itemId);
      if (updated.length === 0) setCartRestaurant(null);
      return updated;
    });
  };

  // Place Order Checkout
  const handleCheckout = async (orderPayload) => {
    const newOrder = await api.createOrder(orderPayload);
    setCart([]);
    setCartRestaurant(null);
    setActiveOrderId(newOrder.id);
    setCurrentView('tracking');
  };

  // Auth Handlers
  const handleLogin = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.access_token);
    setUser(data.user);
  };

  const handleRegister = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('token', data.access_token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('home');
  };

  // Fetch user orders list
  const handleViewOrders = async () => {
    try {
      const orders = await api.getOrders();
      setOrderList(orders);
      setCurrentView('orders');
    } catch (err) {
      alert(err.message || 'Failed to fetch orders');
    }
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="app">
      <Navbar
        user={user}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onViewOrders={handleViewOrders}
        onGoHome={() => setCurrentView('home')}
      />

      {currentView === 'home' && (
        <RestaurantList
          restaurants={restaurants}
          selectedCuisine={selectedCuisine}
          onSelectCuisine={setSelectedCuisine}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectRestaurant={handleSelectRestaurant}
          loading={loadingRestaurants}
        />
      )}

      {currentView === 'tracking' && activeOrderId && (
        <OrderTracking
          orderId={activeOrderId}
          onBack={() => setCurrentView('home')}
          user={user}
        />
      )}

      {currentView === 'orders' && (
        <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px' }}>
            Your Order History
          </h2>

          {orderList.length === 0 ? (
            <div className="empty-state">
              <Package size={48} color="#aaa" />
              <p style={{ marginTop: '12px' }}>You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orderList.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--gray-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {ord.restaurant_name || 'Restaurant Order'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--dark-light)', marginTop: '4px' }}>
                      Order #{ord.id} • ${Number(ord.total_amount).toFixed(2)} • Status:{' '}
                      <strong style={{ color: 'var(--primary)' }}>{ord.status}</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                      {ord.created_at ? new Date(ord.created_at).toLocaleString() : ''}
                    </p>
                  </div>

                  <button
                    className="nav-btn nav-btn-outline"
                    onClick={() => {
                      setActiveOrderId(ord.id);
                      setCurrentView('tracking');
                    }}
                  >
                    Track Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Menu Modal */}
      <MenuModal
        restaurant={activeRestaurant}
        menuItems={menuItems}
        loadingMenu={loadingMenu}
        onClose={() => setActiveRestaurant(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        restaurant={cartRestaurant}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        user={user}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLogin}
        onRegisterSuccess={handleRegister}
      />
    </div>
  );
}

