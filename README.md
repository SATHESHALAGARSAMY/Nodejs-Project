# Data Pusher - Node.js Express Application

A production-ready Node.js Express web application that receives JSON data for accounts and forwards it to various destinations using webhook URLs with async processing, caching, rate limiting, and comprehensive testing.

## 🚀 Features

- ✅ **User Authentication & Authorization** - JWT-based auth with role-based access control (Admin & Normal user)
- ✅ **Account Management** - Full CRUD operations with auto-generated app secret tokens
- ✅ **Destination Management** - Configure multiple webhook destinations per account
- ✅ **Async Processing** - Bull.js queue system with Redis for background webhook delivery
- ✅ **Rate Limiting** - 5 requests/second per account for data handler endpoint
- ✅ **Caching** - Redis caching for frequently accessed data
- ✅ **Data Validation** - Express-validator for all endpoints
- ✅ **Logging** - Comprehensive event logging with filtering and search
- ✅ **Testing** - Full test suite with Mocha/Chai
- ✅ **API Documentation** - Swagger/OpenAPI documentation
- ✅ **Database Indexing** - Optimized queries with proper indexes
- ✅ **Cascade Delete** - Automatic cleanup of related data

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Postman Collection](#postman-collection)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Deployment](#deployment)

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- Redis (v6 or higher)
- SQLite3

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Nodejs-Project
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Install and Start Redis

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### On macOS:
```bash
brew install redis
brew services start redis
```

#### On Windows:
Download from https://redis.io/download and follow installation instructions.

### Step 4: Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database
DB_PATH=./data_pusher.db
```

### Step 5: Start the Application

#### Development Mode:
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The server will start on http://localhost:8080

## 🗄️ Database Schema

### Tables

#### 1. **users** (All Mandatory Fields)
- `user_id` - Primary key (auto-increment)
- `email` - Unique, required
- `password` - Required (encrypted)
- `created_at` - Required
- `updated_at` - Required
- `created_by` - User ID who created this user
- `updated_by` - User ID who last updated
- `status` - Y/N/D (Active/Inactive/Deleted)

#### 2. **accounts**
- `account_id` - Primary key (UUID)
- `email` - Unique, required
- `account_name` - Required
- `app_secret_token` - Auto-generated, unique
- `website` - Optional
- `created_at` - Required
- `updated_at` - Required
- `created_by` - User ID
- `updated_by` - User ID
- `status` - Y/N/D

#### 3. **destinations**
- `destination_id` - Primary key (UUID)
- `account_id` - Foreign key to accounts
- `url` - Required
- `http_method` - Required (GET/POST/PUT/DELETE/PATCH)
- `headers` - Required (JSON object)
- `created_at` - Required
- `updated_at` - Required
- `created_by` - User ID
- `updated_by` - User ID
- `status` - Y/N/D

#### 4. **roles**
- `role_id` - Primary key (1 or 2)
- `role_name` - Admin or Normal user
- `created_at` - Required
- `updated_at` - Required

#### 5. **account_members**
- `member_id` - Primary key (auto-increment)
- `account_id` - Foreign key to accounts
- `user_id` - Foreign key to users
- `role_id` - Foreign key to roles
- `created_at` - Required
- `updated_at` - Required
- `created_by` - User ID
- `updated_by` - User ID
- `status` - Y/N/D

#### 6. **logs**
- `event_id` - Primary key (unique string)
- `account_id` - Foreign key to accounts
- `destination_id` - Foreign key to destinations
- `received_timestamp` - Required
- `processed_timestamp` - Nullable
- `received_data` - JSON string
- `status` - pending/success/failed
- `error_message` - Nullable

## 🔌 API Endpoints

### Base URL
```
http://localhost:8080/api
```

### API Documentation
- **Swagger UI:** http://localhost:8080/api-docs
- **Postman Collection:** `Data_Pusher_API.postman_collection.json`
- **Postman Environment:** `Data_Pusher_API.postman_environment.json`

### Authentication Endpoints

#### 1. Signup (Register)
```bash
POST /api/user/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login
```bash
POST /api/user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 3. Logout
```bash
POST /api/user/logout
Authorization: Bearer <token>
```

#### 4. Invite User (Admin Only)
```bash
POST /api/user/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "accountId": "account-uuid",
  "roleId": 2
}
```

### Account Endpoints

#### 1. Create Account (Admin Only)
```bash
POST /api/account/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "account@example.com",
  "accountName": "My Account",
  "website": "https://example.com"
}
```

#### 2. Get All Accounts (with filtering)
```bash
GET /api/account?search=test&page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### 3. Get Account by ID
```bash
GET /api/account/:accountId
Authorization: Bearer <token>
```

#### 4. Update Account
```bash
PUT /api/account/:accountId
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountName": "Updated Name",
  "website": "https://newwebsite.com"
}
```

#### 5. Delete Account (Admin Only)
```bash
DELETE /api/account/:accountId
Authorization: Bearer <token>
```

### Destination Endpoints

#### 1. Create Destination (Admin Only)
```bash
POST /api/destination/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountId": "account-uuid",
  "url": "https://webhook.site/unique-url",
  "httpMethod": "POST",
  "headers": {
    "APP_ID": "1234APPID1234",
    "APP_SECRET": "secretkey",
    "ACTION": "user.update",
    "Content-Type": "application/json",
    "Accept": "*"
  }
}
```

#### 2. Get Destinations by Account ID
```bash
GET /api/destination/account/:accountId?page=1&limit=10
Authorization: Bearer <token>
```

#### 3. Get Destination by ID
```bash
GET /api/destination/:destinationId
Authorization: Bearer <token>
```

#### 4. Update Destination
```bash
PUT /api/destination/:destinationId
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://new-webhook.site/url",
  "headers": {...}
}
```

#### 5. Delete Destination (Admin Only)
```bash
DELETE /api/destination/:destinationId
Authorization: Bearer <token>
```

### Data Handler Endpoint

#### Incoming Data (Rate Limited: 5 req/sec per account)
```bash
POST /api/server/incoming_data
CL-X-TOKEN: <app_secret_token>
CL-X-EVENT-ID: <unique-event-id>
Content-Type: application/json

{
  "user_id": 123,
  "action": "user.update",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Data Received"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid Data"
}
```

### Log Endpoints

#### 1. Get Logs (with filtering)
```bash
GET /api/log?accountId=xxx&destinationId=yyy&status=success&page=1&limit=10
Authorization: Bearer <token>
```

#### 2. Get Log by Event ID
```bash
GET /api/log/event/:eventId
Authorization: Bearer <token>
```

#### 3. Get Log Statistics
```bash
GET /api/log/stats?accountId=xxx
Authorization: Bearer <token>
```

## 📮 Postman Collection

A complete Postman collection is included for easy API testing!

### Quick Import

1. Open Postman
2. Click **Import**
3. Import these files:
   - `Data_Pusher_API.postman_collection.json`
   - `Data_Pusher_API.postman_environment.json`
4. Select "Data Pusher - Local" environment
5. Start testing!

### Features

✅ **70+ Pre-configured Requests** - All endpoints ready to test  
✅ **Auto-Save Variables** - Tokens and IDs saved automatically  
✅ **Complete Workflows** - Step-by-step testing scenarios  
✅ **Environment Setup** - Easy switching between dev/staging/prod  
✅ **Test Scripts** - Automatic validation  

### Quick Start

```bash
# 1. Start your server
npm run dev

# 2. Open Postman and import collection
# 3. Run: Authentication → Signup
# 4. Run: Accounts → Create Account
# 5. Run: Destinations → Create Destination
# 6. Run: Data Handler → Send Incoming Data
# 7. Run: Logs → Get Logs by Account
```

📖 **Detailed guide:** See [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)

### Account Member Endpoints

#### 1. Create Account Member (Admin Only)
```bash
POST /api/account-member/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountId": "account-uuid",
  "userId": 1,
  "roleId": 2
}
```

#### 2. Get Account Members
```bash
GET /api/account-member/account/:accountId
Authorization: Bearer <token>
```

#### 3. Update Account Member Role (Admin Only)
```bash
PUT /api/account-member/:memberId
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": 1
}
```

#### 4. Delete Account Member (Admin Only)
```bash
DELETE /api/account-member/:memberId
Authorization: Bearer <token>
```

## 📝 Usage Examples

### Complete Workflow Example

#### 1. Register and Login
```bash
# Register
curl -X POST http://localhost:8080/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Login
curl -X POST http://localhost:8080/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

#### 2. Create Account
```bash
curl -X POST http://localhost:8080/api/account/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"myaccount@example.com",
    "accountName":"My Business",
    "website":"https://mybusiness.com"
  }'
```

#### 3. Create Destination
```bash
curl -X POST http://localhost:8080/api/destination/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId":"ACCOUNT_ID",
    "url":"https://webhook.site/your-unique-url",
    "httpMethod":"POST",
    "headers":{
      "Content-Type":"application/json",
      "Authorization":"Bearer webhook-token"
    }
  }'
```

#### 4. Send Data to Webhook
```bash
curl -X POST http://localhost:8080/api/server/incoming_data \
  -H "CL-X-TOKEN: YOUR_APP_SECRET_TOKEN" \
  -H "CL-X-EVENT-ID: evt-$(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":123,
    "action":"user.update",
    "data":{"name":"John Doe"}
  }'
```

#### 5. Check Logs
```bash
curl -X GET "http://localhost:8080/api/log?accountId=ACCOUNT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Test Coverage
The test suite includes:
- User authentication tests
- Account CRUD operations
- Destination CRUD operations
- Data handler functionality
- Validation tests
- Error handling tests

### Running Specific Tests
```bash
# Run only authentication tests
npx mocha test/api.test.js --grep "Authentication"

# Run with verbose output
npm test -- --reporter spec
```

## 🔒 Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Password Encryption** - AES encryption for passwords
3. **Rate Limiting** - Prevents abuse with configurable limits
4. **Helmet.js** - Security headers
5. **CORS** - Cross-origin resource sharing protection
6. **Input Validation** - Express-validator on all endpoints
7. **SQL Injection Protection** - Parameterized queries

## 🚀 Deployment

### Prerequisites for Production

1. **Redis Server** - Running and accessible
2. **Environment Variables** - Properly configured
3. **SSL Certificate** - For HTTPS (recommended)
4. **Process Manager** - PM2 or similar

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start app.js --name data-pusher

# Monitor
pm2 monit

# View logs
pm2 logs data-pusher

# Restart
pm2 restart data-pusher

# Stop
pm2 stop data-pusher
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure Redis with password
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure log rotation
- [ ] Database backups
- [ ] Rate limiting configuration
- [ ] CORS whitelist configuration

## 📊 Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       v
┌─────────────────────────────────┐
│     Express.js Server           │
│  ┌────────────────────────────┐ │
│  │   Middleware Layer         │ │
│  │  - Authentication          │ │
│  │  - Authorization           │ │
│  │  - Rate Limiting           │ │
│  │  - Validation              │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │   Route Handlers           │ │
│  │  - /api/user               │ │
│  │  - /api/account            │ │
│  │  - /api/destination        │ │
│  │  - /api/server             │ │
│  │  - /api/log                │ │
│  └────────────────────────────┘ │
└───────────┬─────────────────────┘
            │
    ┌───────┴────────┐
    │                │
    v                v
┌─────────┐    ┌──────────┐
│ SQLite  │    │  Redis   │
│   DB    │    │  Cache   │
└─────────┘    └────┬─────┘
                    │
                    v
              ┌──────────┐
              │   Bull   │
              │  Queue   │
              └────┬─────┘
                   │
                   v
           ┌───────────────┐
           │   Webhook     │
           │  Dispatcher   │
           └───────┬───────┘
                   │
                   v
           ┌───────────────┐
           │  Destination  │
           │   Webhooks    │
           └───────────────┘
```

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite3
- **Cache & Queue:** Redis, Bull.js
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Testing:** Mocha, Chai, Supertest
- **Documentation:** Swagger (swagger-ui-express)
- **Security:** Helmet.js, bcryptjs, crypto
- **HTTP Client:** Axios

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support, email support@datapusher.com or open an issue in the repository.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Full CRUD operations for all modules
- Async webhook processing
- Redis caching
- Comprehensive testing
- API documentation

---

**Built with ❤️ using Node.js and Express.js**
