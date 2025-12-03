# E-commerce API

A RESTful API for an e-commerce platform built with Node.js, Express, and MySQL.

## Features

- User and Seller authentication
- Product management
- Shopping cart functionality
- Order processing with coupons and wallet points
- Payment status management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Language**: TypeScript
- **Validation**: Joi

## Project Structure

```
├── src/
│   ├── index.ts
│   ├── config/
│   │   └── database.ts
│   ├── middleware/
│   │   └── validation.ts
│   └── routes/
│       ├── auth.ts
│       ├── products.ts
│       ├── cart.ts
│       └── orders.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Installation

1. Clone the repository:

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your MySQL database in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce
PORT=3000
```

5. Create the database in MySQL:
```sql
CREATE DATABASE ecommerce;
```

6. Start the development server:
```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |

## API Documentation

Base URL: `http://localhost:3000/api`

---

## Authentication Endpoints

### Register User

**POST** `/api/auth/user/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "wallet_points": 50
  }
}
```

---

### Login User

**POST** `/api/auth/user/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "wallet_points": 50
  }
}
```

---

### Register Seller

**POST** `/api/auth/seller/register`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@shop.com",
  "password": "password123",
  "shop_name": "Jane's Electronics"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller registered successfully",
  "seller": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Jane Smith",
    "email": "jane@shop.com",
    "shop_name": "Jane's Electronics"
  }
}
```

---

### Login Seller

**POST** `/api/auth/seller/login`

**Request Body:**
```json
{
  "email": "jane@shop.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "seller": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Jane Smith",
    "email": "jane@shop.com",
    "shop_name": "Jane's Electronics"
  }
}
```

---

## Product Endpoints

### Add Product

**POST** `/api/products/add`

**Request Body:**
```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "price": 29.99,
  "stock": 100,
  "seller_id": "037eb40b-ed9a-4a4a-9fb1-8fd7d9158727"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product added successfully",
  "product": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "price": 29.99,
    "stock": 100
  }
}
```

---

### Get All Products

**GET** `/api/products/all`

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "seller_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Wireless Mouse",
      "description": "Ergonomic wireless mouse with USB receiver",
      "price": 29.99,
      "stock": 100,
      "shop_name": "Jane's Electronics",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Get Product by ID

**GET** `/api/products/:id`

**Example:** `/api/products/770e8400-e29b-41d4-a716-446655440002`

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "seller_id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "price": 29.99,
    "stock": 100,
    "shop_name": "Jane's Electronics",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get Seller's Products

**GET** `/api/products/my-products?seller_id={seller_id}`

**Example:** `/api/products/my-products?seller_id=660e8400-e29b-41d4-a716-446655440001`

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "seller_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Wireless Mouse",
      "description": "Ergonomic wireless mouse with USB receiver",
      "price": 29.99,
      "stock": 100,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Update Product Stock

**PUT** `/api/products/:id/stock`

**Example:** `/api/products/770e8400-e29b-41d4-a716-446655440002/stock`

**Request Body:**
```json
{
  "stock": 150,
  "seller_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock updated successfully"
}
```

---

### Delete Product

**DELETE** `/api/products/:id`

**Example:** `/api/products/770e8400-e29b-41d4-a716-446655440002`

**Request Body:**
```json
{
  "seller_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Cart Endpoints

### Add to Cart

**POST** `/api/cart/add`

**Request Body:**
```json
{
  "product_id": "770e8400-e29b-41d4-a716-446655440002",
  "quantity": 2,
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart"
}
```

---

### Get Cart Items

**GET** `/api/cart/items?user_id={user_id}`

**Example:** `/api/cart/items?user_id=550e8400-e29b-41d4-a716-446655440000`

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "product_id": "770e8400-e29b-41d4-a716-446655440002",
      "quantity": 2,
      "name": "Wireless Mouse",
      "price": 29.99,
      "stock": 100,
      "created_at": "2024-01-15T11:00:00.000Z",
      "updated_at": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

### Update Cart Item Quantity

**PUT** `/api/cart/:cartId`

**Example:** `/api/cart/880e8400-e29b-41d4-a716-446655440003`

**Request Body:**
```json
{
  "quantity": 3,
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart updated successfully"
}
```

---

### Remove from Cart

**DELETE** `/api/cart/:cartId?user_id={user_id}`

**Example:** `/api/cart/880e8400-e29b-41d4-a716-446655440003?user_id=550e8400-e29b-41d4-a716-446655440000`

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### Calculate Cart Total

**POST** `/api/cart/calculate-total`

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "coupon_code": "WELCOME10",
  "wallet_points_used": 20
}
```

**Response:**
```json
{
  "success": true,
  "subtotal": 59.98,
  "discount": 5.998,
  "wallet_deduction": 20,
  "total": 33.982,
  "item_count": 1
}
```

---

### Clear Cart

**DELETE** `/api/cart?user_id={user_id}`

**Example:** `/api/cart?user_id=550e8400-e29b-41d4-a716-446655440000`

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

## Order Endpoints

### Place Order

**POST** `/api/orders/place`

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "coupon_code": "WELCOME10",
  "wallet_points_used": 20
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully. Awaiting payment confirmation.",
  "order": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "total_price": 33.98,
    "discount_amount": 5.998,
    "wallet_points_used": 20,
    "payment_status": "pending",
    "coupon_code": "WELCOME10"
  }
}
```

---

### Get User Orders

**GET** `/api/orders?user_id={user_id}`

**Example:** `/api/orders?user_id=550e8400-e29b-41d4-a716-446655440000`

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "total_price": 33.98,
      "discount_amount": 5.998,
      "wallet_points_used": 20,
      "payment_status": "pending",
      "order_status": "pending",
      "created_at": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

---

### Get Order Details

**GET** `/api/orders/:orderId?user_id={user_id}`

**Example:** `/api/orders/990e8400-e29b-41d4-a716-446655440004?user_id=550e8400-e29b-41d4-a716-446655440000`

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "total_price": 33.98,
    "discount_amount": 5.998,
    "wallet_points_used": 20,
    "coupon_code": "WELCOME10",
    "payment_status": "pending",
    "order_status": "pending",
    "created_at": "2024-01-15T12:00:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z",
    "items": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440005",
        "order_id": "990e8400-e29b-41d4-a716-446655440004",
        "product_id": "770e8400-e29b-41d4-a716-446655440002",
        "quantity": 2,
        "price": 29.99,
        "name": "Wireless Mouse",
        "created_at": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}
```

---

### Update Payment Status

**PUT** `/api/orders/payment/:orderId`

**Example:** `/api/orders/payment/990e8400-e29b-41d4-a716-446655440004`

**Request Body:**
```json
{
  "status": "success"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment success",
  "order": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "payment_status": "success",
    "order_status": "processing"
  }
}
```

---

## Health Check

**GET** `/api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with wallet points |
| `sellers` | Seller accounts with shop info |
| `products` | Product catalog |
| `coupons` | Discount coupons |
| `user_coupons` | User-coupon assignments |
| `cart` | Shopping cart items |
| `orders` | Order records |
| `order_items` | Individual items in orders |

### Default Coupons

| Code | Discount | Validity |
|------|----------|----------|
| WELCOME10 | 10% | 30 days |
| SAVE20 | 20% | 7 days |
| SUMMER15 | 15% | 30 days |

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Validation errors:

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

## License

ISC
