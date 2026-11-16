const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth Microservice Endpoints
  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },

  async register(userData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    return data;
  },

  async getMe() {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return null;
    return await res.json();
  },

  // Backend Microservice Endpoints
  async getRestaurants(cuisine = '', search = '') {
    const params = new URLSearchParams();
    if (cuisine) params.append('cuisine', cuisine);
    if (search) params.append('search', search);
    const res = await fetch(`/api/restaurants?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return await res.json();
  },

  async getRestaurantMenu(restaurantId) {
    const res = await fetch(`/api/restaurants/${restaurantId}/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return await res.json();
  },

  async createOrder(orderPayload) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(orderPayload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to place order');
    return data;
  },

  async getOrders() {
    const res = await fetch('/api/orders', {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  },

  async getOrderTracking(orderId) {
    const res = await fetch(`/api/orders/${orderId}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch order details');
    return await res.json();
  },

  async updateOrderStatus(orderId, status) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update order status');
    return data;
  },
};

