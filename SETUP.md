# Broadway Property Management - Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Git

## Quick Start

### 1. Database Setup

```sql
-- Create PostgreSQL database
CREATE DATABASE broadway_pm;
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Update .env with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=your_password
# DB_NAME=broadway_pm
# DB_SYNCHRONIZE=true
# JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
# JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_in_production
# NODE_ENV=development

# Install dependencies
npm install

# Start development server
npm run start:dev
```

Backend will run on: http://localhost:3000

### 3. Frontend Setup

```bash
cd frontend

# Create environment file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:3000" > .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: http://localhost:3001

The frontend proxies API requests through `/api` → backend (see `frontend/next.config.ts`), so a single public tunnel on port **3001** works for partners.

## Partner preview tunnel

See [PARTNER_DEMO.md](./PARTNER_DEMO.md) for `localtunnel` / Cloudflare Tunnel steps.

## Dashboard departments

After login, `/dashboard` shows department tiles (Clients, Properties, Finance, Taxes, Sales, etc.) with live counts. Click a tile for the full module.

## Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000

## Test Authentication

You can test the authentication system:

1. Visit http://localhost:3001
2. Click "Sign Up"
3. Fill in:
   - Workspace/Business Name: Test Account
   - Email: test@example.com
   - Password: test123
4. Select a plan and submit

## Features Available

### Property Management
- Buildings and units management
- Tenant management
- Lease/contract tracking

### Financial Management
- Payment processing
- Invoice generation
- Expense tracking
- Revenue analytics

### Compliance (Rwanda-specific)
- Tax obligation tracking
- RRA integration
- Compliance reporting

### Multi-tenancy
- Platform owner dashboard
- Client workspace management
- Role-based access control

## Development Notes

- Backend uses NestJS with TypeORM
- Frontend uses Next.js with TypeScript
- Database auto-synchronization is enabled in development
- JWT tokens are used for authentication
- CORS is configured to allow frontend access

## Production Deployment

For production deployment:

1. Set `DB_SYNCHRONIZE=false` and run migrations
2. Use strong JWT secrets
3. Configure production database
4. Set `NODE_ENV=production`
5. Configure proper CORS origins
6. Set up SSL certificates

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in .env
- Ensure database exists

### Frontend can't connect to backend
- Verify backend is running on port 3000
- Check .env.local in frontend
- Ensure CORS is properly configured

### Authentication issues
- Check JWT secrets are set
- Verify database tables are created
- Check browser console for errors
