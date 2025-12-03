const API_BASE = "/api";

// Storage helpers (defined first so they can be used by other functions)
export function getStoredUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function getStoredSeller() {
  const seller = localStorage.getItem("seller");
  return seller ? JSON.parse(seller) : null;
}

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

// Auth endpoints
export async function userRegister(
  name: string,
  email: string,
  password: string,
) {
  const data = await apiCall("/auth/user/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return data;
}

export async function userLogin(email: string, password: string) {
  const data = await apiCall("/auth/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return data;
}

export async function sellerRegister(
  name: string,
  email: string,
  password: string,
  shop_name: string,
) {
  const data = await apiCall("/auth/seller/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, shop_name }),
  });
  if (data.seller) {
    localStorage.setItem("seller", JSON.stringify(data.seller));
  }
  return data;
}

export async function sellerLogin(email: string, password: string) {
  const data = await apiCall("/auth/seller/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.seller) {
    localStorage.setItem("seller", JSON.stringify(data.seller));
  }
  return data;
}

// Product endpoints
export async function getProducts() {
  return apiCall("/products/all", { method: "GET" });
}

export async function getProductById(id: string) {
  return apiCall(`/products/${id}`, { method: "GET" });
}

export async function getSellerProducts() {
  const seller = getStoredSeller();
  const sellerId = seller?.id || '';
  return apiCall(`/products/my-products?seller_id=${sellerId}`, { method: "GET" });
}

export async function createProduct(
  name: string,
  description: string,
  price: number,
  stock: number,
) {
  const seller = getStoredSeller();
  return apiCall("/products/add", {
    method: "POST",
    body: JSON.stringify({ name, description, price, stock, seller_id: seller?.id }),
  });
}

export async function updateProductStock(id: string, stock: number) {
  const seller = getStoredSeller();
  return apiCall(`/products/${id}/stock`, {
    method: "PUT",
    body: JSON.stringify({ stock, seller_id: seller?.id }),
  });
}

// Cart endpoints
export async function getCart() {
  const user = getStoredUser();
  const userId = user?.id || '';
  return apiCall(`/cart/items?user_id=${userId}`, { method: "GET" });
}

export async function addToCart(product_id: string, quantity: number) {
  const user = getStoredUser();
  return apiCall("/cart/add", {
    method: "POST",
    body: JSON.stringify({ product_id, quantity, user_id: user?.id }),
  });
}

export async function updateCartItem(cartId: string, quantity: number) {
  const user = getStoredUser();
  return apiCall(`/cart/${cartId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity, user_id: user?.id }),
  });
}

export async function removeFromCart(cartId: string) {
  const user = getStoredUser();
  const userId = user?.id || '';
  return apiCall(`/cart/${cartId}?user_id=${userId}`, { method: "DELETE" });
}

export async function clearCart() {
  const user = getStoredUser();
  const userId = user?.id || '';
  return apiCall(`/cart?user_id=${userId}`, { method: "DELETE" });
}

// Order endpoints
export async function placeOrder(
  coupon_code?: string,
  wallet_points_used?: number,
) {
  const user = getStoredUser();
  return apiCall("/orders/place", {
    method: "POST",
    body: JSON.stringify({ coupon_code, wallet_points_used, user_id: user?.id }),
  });
}

export async function getOrders() {
  const user = getStoredUser();
  const userId = user?.id || '';
  return apiCall(`/orders?user_id=${userId}`, { method: "GET" });
}

export async function getOrderById(orderId: string) {
  const user = getStoredUser();
  const userId = user?.id || '';
  return apiCall(`/orders/${orderId}?user_id=${userId}`, { method: "GET" });
}

export async function updatePaymentStatus(
  orderId: string,
  status: "success" | "failed",
) {
  return apiCall(`/orders/payment/${orderId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function logout() {
  localStorage.removeItem("user");
}

export function sellerLogout() {
  localStorage.removeItem("seller");
}
