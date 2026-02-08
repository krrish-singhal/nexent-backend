# Nexent E-Commerce Backend API

A production-ready RESTful API backend for the Nexent e-commerce platform, built with Node.js, Express, and MongoDB. Features comprehensive user management, product catalog, shopping cart, order processing, payment integration, and wallet system.

## 🚀 Features

- **User Management** - Clerk authentication, profile management, address book, wishlist
- **Product Catalog** - Browse products, categories, personalized recommendations
- **Shopping Cart** - Add, update, remove items, real-time cart management
- **Order Processing** - Create orders, track status, reorder functionality
- **Payment Integration** - Stripe payment gateway with webhook support
- **Wallet & Coupons** - Digital wallet, coupon redemption, transaction history
- **Review System** - Product reviews with automated invoice email delivery
- **Admin Dashboard** - Product management, order management, customer analytics
- **File Uploads** - Cloudinary integration for images
- **Email Notifications** - Nodemailer integration for order confirmations and invoices
- **Background Jobs** - Inngest for asynchronous task processing

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk
- **Payment Processing**: Stripe
- **File Storage**: Cloudinary
- **Email Service**: Nodemailer (Gmail SMTP)
- **Background Jobs**: Inngest
- **File Uploads**: Multer

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- Stripe Account
- Clerk Account
- Cloudinary Account
- Gmail Account (for SMTP)
- Inngest Account

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/nexent
# or MongoDB Atlas
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nexent?retryWrites=true&w=majority

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Payment
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

### 4. Seed the database (optional)
```bash
npm run seed
```

### 5. Start the server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.js      # Cloudinary configuration
│   │   ├── db.js               # MongoDB connection
│   │   ├── env.js              # Environment variables
│   │   └── inngest.js          # Inngest client & functions
│   ├── controlllers/
│   │   ├── admin.controller.js    # Admin operations
│   │   ├── cart.controller.js     # Shopping cart logic
│   │   ├── order.controller.js    # Order management
│   │   ├── payment.controller.js  # Payment processing
│   │   ├── product.controller.js  # Product operations
│   │   ├── review.controller.js   # Review system
│   │   ├── user.controller.js     # User management
│   │   └── wallet.controller.js   # Wallet & coupons
│   ├── middleware/
│   │   ├── auth.middleware.js     # Authentication & authorization
│   │   └── multer.middleware.js   # File upload handling
│   ├── models/
│   │   ├── cart.models.js         # Cart schema
│   │   ├── coupon.model.js        # Coupon schema
│   │   ├── order.model.js         # Order schema
│   │   ├── product.models.js      # Product schema
│   │   ├── review.models.js       # Review schema
│   │   ├── user.model.js          # User schema
│   │   └── wallet.model.js        # Wallet schema
│   ├── routes/
│   │   ├── admin.routes.js        # Admin endpoints
│   │   ├── cart.routes.js         # Cart endpoints
│   │   ├── order.routes.js        # Order endpoints
│   │   ├── payment.routes.js      # Payment endpoints
│   │   ├── product.routes.js      # Product endpoints
│   │   ├── review.routes.js       # Review endpoints
│   │   ├── user.route.js          # User endpoints
│   │   ├── wallet.routes.js       # Wallet endpoints
│   │   └── webhook.route.js       # Stripe webhooks
│   ├── lib/
│   │   └── email.js               # Email service utilities
│   ├── seeds/
│   │   ├── index.js               # Database seeding
│   │   ├── all-products.js        # Sample products
│   │   └── products-data.js       # Product data
│   └── server.js                  # Express app entry point
├── package.json
└── README.md
```

## 🔐 Authentication

The API uses **Clerk** for authentication. Protected routes require a valid JWT token in the request headers.

### Headers Required:
```
Authorization: Bearer <clerk-jwt-token>
```

### Middleware:
- `protectRoute` - Validates user authentication
- `adminOnly` - Validates admin role (email must end with @nexent.in)

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

---

## 👤 User Routes

### 1. Sync User (Clerk Webhook)
```http
POST /api/user/sync
Content-Type: application/json

Body: Clerk user webhook payload
```

### 2. Get Current User
```http
GET /api/user/me
Authorization: Bearer <token>
```
**Response:**
```json
{
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "clerkId": "...",
    "addresses": [],
    "wishlist": []
  }
}
```

### 3. Get User Profile
```http
GET /api/user/profile
Authorization: Bearer <token>
```

### 4. Update User Profile
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- name: string
- phone: string
- profileImage: file (optional)
```

### 5. Add Address
```http
POST /api/user/addresses
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "label": "Home",
  "fullName": "John Doe",
  "streetAddress": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "phoneNumber": "+1234567890",
  "isDefault": true
}
```

### 6. Get All Addresses
```http
GET /api/user/addresses
Authorization: Bearer <token>
```

### 7. Update Address
```http
PUT /api/user/addresses/:addressId
Authorization: Bearer <token>
Content-Type: application/json

Body: Same as Add Address
```

### 8. Delete Address
```http
DELETE /api/user/addresses/:addressId
Authorization: Bearer <token>
```

### 9. Add to Wishlist
```http
POST /api/user/wishlist
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "productId": "product_id_here"
}
```

### 10. Remove from Wishlist
```http
DELETE /api/user/wishlist/:productId
Authorization: Bearer <token>
```

### 11. Get Wishlist
```http
GET /api/user/wishlist
Authorization: Bearer <token>
```

---

## 🛍️ Product Routes

### 1. Get All Products
```http
GET /api/products?category=<category>&search=<query>
```
**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search in product name/description

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "_id": "...",
      "name": "Product Name",
      "description": "...",
      "price": 99.99,
      "stock": 50,
      "category": "electronics",
      "images": ["url1", "url2"],
      "averageRating": 4.5,
      "totalReviews": 120,
      "returnPolicy": {
        "returnable": true,
        "refundable": true,
        "returnDays": 7
      }
    }
  ]
}
```

### 2. Get Product by ID
```http
GET /api/products/:id
Authorization: Bearer <token>
```

### 3. Get Personalized Recommendations
```http
GET /api/products/recommendations/personalized
Authorization: Bearer <token>
```
Returns product recommendations based on user's wishlist and purchase history.

---

## 🛒 Cart Routes

### 1. Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

### 2. Add to Cart
```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "productId": "product_id",
  "quantity": 2
}
```

### 3. Update Cart Item
```http
PUT /api/cart/:productId
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "quantity": 3
}
```

### 4. Remove from Cart
```http
DELETE /api/cart/:productId
Authorization: Bearer <token>
```

### 5. Clear Cart
```http
DELETE /api/cart
Authorization: Bearer <token>
```

---

## 📦 Order Routes

### 1. Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "products": [
    {
      "product": "product_id",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "totalAmount": 199.98,
  "shippingAddress": {
    "fullName": "John Doe",
    "streetAddress": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "phoneNumber": "+1234567890"
  },
  "paymentMethod": "stripe",
  "paymentIntentId": "pi_xxxxx"
}
```

### 2. Get User Orders
```http
GET /api/orders
Authorization: Bearer <token>
```
**Response:**
```json
{
  "orders": [
    {
      "_id": "...",
      "user": "...",
      "products": [...],
      "totalAmount": 199.98,
      "status": "processing",
      "shippingAddress": {...},
      "paymentMethod": "stripe",
      "createdAt": "...",
      "hidden": false
    }
  ]
}
```

### 3. Hide Order
```http
DELETE /api/orders/:orderId
Authorization: Bearer <token>
```
Soft deletes order from user's view (sets `hidden: true`)

### 4. Reorder
```http
POST /api/orders/reorder/:orderId
Authorization: Bearer <token>
```
Creates a new order with the same items as a previous order.

---

## 💳 Payment Routes

### 1. Create Payment Intent
```http
POST /api/payment/create-intent
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "amount": 19999,
  "metadata": {
    "userId": "user_id",
    "products": "json_string_of_products"
  }
}
```
**Response:**
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx"
}
```

### 2. Confirm Order (Manual Payment)
```http
POST /api/payment/confirm-order
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "orderId": "order_id_here"
}
```

### 3. Stripe Webhook (Internal)
```http
POST /api/payment/webhook
Stripe-Signature: <stripe-signature-header>
```
Handles Stripe webhook events (payment_intent.succeeded, etc.)

---

## 💰 Wallet Routes

### 1. Get Wallet
```http
GET /api/wallet
Authorization: Bearer <token>
```
**Response:**
```json
{
  "wallet": {
    "_id": "...",
    "user": "...",
    "coins": 150,
    "transactions": [...]
  }
}
```

### 2. Redeem Coupon
```http
POST /api/wallet/redeem
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "orderId": "order_id_here"
}
```
**Response:**
```json
{
  "message": "Coupon redeemed successfully",
  "coupon": {
    "code": "ABC123",
    "discount": 10,
    "expiryDate": "2026-03-10T..."
  },
  "expiryInfo": "Expires on March 10, 2026"
}
```

### 3. Get User Coupons
```http
GET /api/wallet/coupons
Authorization: Bearer <token>
```

### 4. Validate Coupon
```http
POST /api/wallet/validate-coupon
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "code": "ABC123"
}
```
**Response:**
```json
{
  "valid": true,
  "discount": 10,
  "expiryDate": "2026-03-10T..."
}
```

### 5. Get Transactions
```http
GET /api/wallet/transactions
Authorization: Bearer <token>
```

---

## ⭐ Review Routes

### 1. Create Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "productId": "product_id",
  "orderId": "order_id",
  "rating": 5,
  "comment": "Great product!"
}
```
- Automatically sends invoice email when first review for an order is created
- Updates product's average rating and total review count

### 2. Delete Review
```http
DELETE /api/reviews/:reviewId
Authorization: Bearer <token>
```

---

## 🔧 Admin Routes

**Note:** All admin routes require authentication and admin role (@nexent.in email domain)

### 1. Create Product
```http
POST /api/admin/products
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Body:
- name: string
- description: string
- price: number
- stock: number
- category: string
- images: file[] (up to 3 images)
- returnPolicy.returnable: boolean
- returnPolicy.refundable: boolean
- returnPolicy.returnDays: number
```

### 2. Get All Products (Admin)
```http
GET /api/admin/products
Authorization: Bearer <admin-token>
```

### 3. Update Product
```http
PUT /api/admin/products/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Body: Same as Create Product
```

### 4. Delete Product
```http
DELETE /api/admin/products/:id
Authorization: Bearer <admin-token>
```

### 5. Get All Orders
```http
GET /api/admin/orders
Authorization: Bearer <admin-token>
```

### 6. Update Order Status
```http
PATCH /api/admin/orders/:orderId/status
Authorization: Bearer <admin-token>
Content-Type: application/json

Body:
{
  "status": "shipped"
}
```
**Valid status values:** pending, processing, shipped, delivered, cancelled

### 7. Get All Customers
```http
GET /api/admin/customers
Authorization: Bearer <admin-token>
```

### 8. Get Dashboard Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin-token>
```
**Response:**
```json
{
  "totalRevenue": 45000,
  "totalOrders": 250,
  "totalProducts": 150,
  "totalUsers": 500,
  "recentOrders": [...],
  "topProducts": [...]
}
```

---

## 📊 Database Models

### User Model
```javascript
{
  email: String (unique),
  name: String,
  phone: String,
  imageUrl: String,
  profileImage: String,
  clerkId: String (unique),
  addresses: [AddressSchema],
  wishlist: [ObjectId ref Product],
  wallet: ObjectId ref Wallet,
  timestamps: true
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  stock: Number,
  category: String,
  images: [String],
  totalReviews: Number,
  averageRating: Number (0-5),
  returnPolicy: {
    returnable: Boolean,
    refundable: Boolean,
    returnDays: Number
  },
  timestamps: true
}
```

### Order Model
```javascript
{
  user: ObjectId ref User,
  products: [{
    product: ObjectId ref Product,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  shippingAddress: AddressSchema,
  paymentMethod: String,
  paymentIntentId: String,
  status: String (enum),
  hidden: Boolean,
  invoiceSent: Boolean,
  timestamps: true
}
```

### Cart Model
```javascript
{
  user: ObjectId ref User (unique),
  products: [{
    product: ObjectId ref Product,
    quantity: Number
  }],
  timestamps: true
}
```

### Wallet Model
```javascript
{
  user: ObjectId ref User (unique),
  coins: Number (default: 0),
  transactions: [{
    type: String (credit/debit),
    amount: Number,
    description: String,
    createdAt: Date
  }]
}
```

### Coupon Model
```javascript
{
  user: ObjectId ref User,
  code: String (unique, 6 chars),
  discount: Number,
  isUsed: Boolean,
  expiryDate: Date,
  order: ObjectId ref Order,
  timestamps: true
}
```

### Review Model
```javascript
{
  user: ObjectId ref User,
  product: ObjectId ref Product,
  order: ObjectId ref Order,
  rating: Number (1-5),
  comment: String,
  timestamps: true
}
```

---

## 🔄 Background Jobs (Inngest)

The backend uses Inngest for background job processing:

- **Email Delivery**: Asynchronous order confirmations and invoice emails
- **Data Processing**: Heavy computational tasks
- **Scheduled Jobs**: Cleanup tasks, reminders

**Inngest Dashboard:** Available at `/api/inngest`

---

## 📧 Email System

### Email Templates:
1. **Order Confirmation Email** - Sent after successful order creation
2. **Invoice Email** - Sent when user submits first review for an order

### Configuration:
Uses Gmail SMTP. Create an App Password:
1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App passwords → Generate new password
4. Use this password in `EMAIL_PASS` environment variable

---

## 🔒 Security Features

- **Clerk Authentication**: Secure JWT-based authentication
- **Role-based Access Control**: Admin-only routes protection
- **Stripe Webhook Verification**: Validates webhook signatures
- **CORS Configuration**: Restricts cross-origin requests
- **Input Validation**: Mongoose schema validation
- **File Upload Restrictions**: Limited file types and sizes
- **Environment Variables**: Sensitive data protection

---

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production` in environment variables
2. Use MongoDB Atlas for database
3. Configure production webhook URLs in Stripe/Clerk dashboards
4. Set up Cloudinary production account
5. Configure production SMTP settings

### Deployment Platforms

#### Render / Railway / Heroku:
```bash
# Set environment variables in platform dashboard
# Push to main branch
git push origin main
```

#### VPS (Ubuntu):
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone <repo-url>
cd backend
npm install

# Start with PM2
pm2 start src/server.js --name nexent-api
pm2 save
pm2 startup
```

#### Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🧪 Testing

### Manual Testing with cURL

**Get Products:**
```bash
curl http://localhost:3000/api/products
```

**Create User (with auth):**
```bash
curl -X POST http://localhost:3000/api/user/sync \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

---

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Populate Optimization**: Selective field population
- **Response Compression**: Gzip compression enabled
- **Connection Pooling**: MongoDB connection pool
- **Caching Strategy**: Implement Redis for frequently accessed data (recommended)

---

## 🐛 Error Handling

All routes implement try-catch blocks with appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 📞 Support

For issues and questions:
- Open an issue in the repository
- Contact: support@nexent.in

---

## 📄 License

ISC License

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Changelog

### v1.0.0 (Current)
- Initial production release
- User authentication with Clerk
- Product catalog and search
- Shopping cart functionality
- Order management
- Stripe payment integration
- Wallet and coupon system
- Review system with automated invoice emails
- Admin dashboard
- Email notifications
- Cloudinary file uploads
- Inngest background jobs

---

**Built with ❤️ by the Nexent Team**
