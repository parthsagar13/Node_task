const API_BASE = '/api';

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Auth endpoints
export async function userRegister(name: string, email: string, password: string) {
  const data = await apiCall('/auth/user/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

export async function userLogin(email: string, password: string) {
  const data = await apiCall('/auth/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

export async function sellerRegister(
  name: string,
  email: string,
  password: string,
  shop_name: string
) {
  const data = await apiCall('/auth/seller/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, shop_name }),
  });
  if (data.token) {
    localStorage.setItem('seller_token', data.token);
    localStorage.setItem('seller', JSON.stringify(data.seller));
  }
  return data;
}

export async function sellerLogin(email: string, password: string) {
  const data = await apiCall('/auth/seller/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    localStorage.setItem('seller_token', data.token);
    localStorage.setItem('seller', JSON.stringify(data.seller));
  }
  return data;
}

// Product endpoints
export async function getProducts() {
  return apiCall('/products/all', { method: 'GET' });
}

export async function getProductById(id: string) {
  return apiCall(`/products/${id}`, { method: 'GET' });
}

export async function getSellerProducts() {
  return apiCall('/products/my-products', { method: 'GET' });
}

export async function createProduct(
  name: string,
  description: string,
  price: number,
  stock: number
) {
  return apiCall('/products/add', {
    method: 'POST',
    body: JSON.stringify({ name, description, price, stock }),
  });
}

export async function updateProductStock(id: string, stock: number) {
  return apiCall(`/products/${id}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ stock }),
  });
}

// Cart endpoints
export async function getCart() {
  return apiCall('/cart/items', { method: 'GET' });
}

export async function addToCart(product_id: string, quantity: number) {
  return apiCall('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ product_id, quantity }),
  });
}

export async function updateCartItem(cartId: string, quantity: number) {
  return apiCall(`/cart/${cartId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCart(cartId: string) {
  return apiCall(`/cart/${cartId}`, { method: 'DELETE' });
}

export async function clearCart() {
  return apiCall('/cart', { method: 'DELETE' });
}

export async function calculateTotal(
  coupon_code?: string,
  wallet_points_used?: number
) {
  return apiCall('/cart/calculate-total', {
    method: 'POST',
    body: JSON.stringify({ coupon_code, wallet_points_used }),
  });
}

// Order endpoints
export async function placeOrder(coupon_code?: string, wallet_points_used?: number) {
  return apiCall('/orders/place', {
    method: 'POST',
    body: JSON.stringify({ coupon_code, wallet_points_used }),
  });
}

export async function getOrders() {
  return apiCall('/orders', { method: 'GET' });
}

export async function getOrderById(orderId: string) {
  return apiCall(`/orders/${orderId}`, { method: 'GET' });
}

export async function updatePaymentStatus(orderId: string, status: 'success' | 'failed') {
  return apiCall(`/orders/payment/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({ order_id: orderId, status }),
  });
}

export function getStoredUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function getStoredSeller() {
  const seller = localStorage.getItem('seller');
  return seller ? JSON.parse(seller) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function sellerLogout() {
  localStorage.removeItem('seller_token');
  localStorage.removeItem('seller');
}
