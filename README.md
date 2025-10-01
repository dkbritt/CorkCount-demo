# CorkCount Winery 🍷

A modern, full-stack wine e-commerce platform with advanced inventory management, automated tagging, and seamless order processing.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)

## 🌟 Features

### Customer Experience

- **Wine Catalog**: Browse and filter wines by type, price, and availability
- **Smart Search**: Find wines by name, type, or flavor characteristics
- **Shopping Cart**: Persistent cart with localStorage backup
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Order Tracking**: Real-time order status updates

### Admin Dashboard

- **Inventory Management**: Add, edit, and track wine inventory
- **Order Processing**: View and update order statuses
- **Batch Management**: Track wine batches and production runs
- **Analytics**: Sales metrics and inventory insights
- **Auto-Tagging**: AI-powered flavor tag generation

### Advanced Features

- **Automated Email System**: Order confirmations and status updates via Resend
- **Intelligent Wine Tagging**: Automatic flavor profile extraction
- **Real-time Updates**: Live inventory and order synchronization
- **Admin Authentication**: Secure admin panel access
- **Data Export**: Export capabilities for analytics

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling and development
- **React Router 6** for SPA routing
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations
- **React Query** for data fetching

### Backend

- **Express.js** server with TypeScript
- **Supabase** for database and real-time features
- **Resend** for transactional emails
- **Zod** for runtime type validation

### Development Tools

- **TypeScript** for type safety
- **Vitest** for testing
- **Prettier** for code formatting
- **PNPM** for package management

### Serverless Architecture

- **Netlify Functions** for API endpoints
  - Auto-scaling serverless compute
  - Edge deployment for low latency
  - Built-in CORS handling
  - Environment variable management

### Deployment

- **Netlify** for hosting and serverless functions
- **Netlify Functions** for API endpoints (auto-scaling, edge deployment)
- **Supabase** for managed database
- **Environment-based configuration**

## 📁 Project Structure

```
├── client/                    # React frontend
│   ├── components/
│   │   ├── admin/            # Admin dashboard components
│   │   ├── ui/               # Reusable UI components
│   │   └── ...               # Feature components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and services
│   ├── pages/                # Route components
│   └── App.tsx               # Main app component
├── server/                   # Express backend
│   ├── routes/               # API route handlers
│   └── index.ts              # Server configuration
├── shared/                   # Shared types and utilities
├── netlify/                  # Netlify serverless functions
│   └── functions/
│       ├── inventory.js      # Wine inventory API
│       ├── orders.js         # Order management API
│       ├── batches.js        # Batch tracking API
│       ├── auth.js           # Authentication API
│       ├── email.js          # Email notifications
│       ├── metrics.js        # Analytics API
│       ├── config.js         # Configuration API
│       └── ping.js           # Health check
├── docs/                     # Documentation
├── sql_migrations/           # Database migrations
└── ...                       # Config files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PNPM (recommended) or npm
- Supabase project
- Resend account (for emails)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd corkcount-winery
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration (Server-side only - secure)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# IMPORTANT: Do NOT use VITE_ prefixed Supabase variables as they expose secrets to the client
# Netlify Functions use non-VITE prefixed variables for server-side security

# Email Configuration (Required)
RESEND_API_KEY=your_resend_api_key
VITE_FROM_EMAIL=orders@yourdomain.com

# Optional Email Configuration
VITE_FIL_EMAIL=admin@yourdomain.com
VITE_TEST_EMAIL=test@yourdomain.com

# Admin Authentication
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=your_secure_password
```

### 4. Database Setup

Run the SQL migrations in your Supabase SQL Editor:

```bash
# Apply the auto-tagging migration
cat sql_migrations/add_tags_to_inventory.sql
# Copy and run in Supabase SQL Editor
```

Create the required tables:

- `Inventory` - Wine inventory
- `Orders` - Customer orders
- `Batches` - Wine batch tracking

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:8080`

## 📊 Database Schema

### Inventory Table

```sql
CREATE TABLE "Inventory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  winery TEXT DEFAULT 'KB Winery',
  vintage INTEGER,
  region TEXT,
  type TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  description TEXT,
  flavor_notes JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Orders Table

```sql
CREATE TABLE "Orders" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Batches Table

```sql
CREATE TABLE "Batches" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT UNIQUE NOT NULL,
  wine_type TEXT NOT NULL,
  production_date DATE,
  harvest_date DATE,
  grape_variety TEXT,
  vineyard_location TEXT,
  quantity_produced INTEGER,
  alcohol_content DECIMAL(4,2),
  ph_level DECIMAL(3,2),
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🤖 Auto-Tagging System

The application features an intelligent wine tagging system that automatically generates flavor profiles:

### Supported Tag Categories

- **Berry**: strawberry, raspberry, blackberry, cherry
- **Citrus**: lemon, lime, orange, grapefruit
- **Earthy**: mineral, terroir, mushroom, soil
- **Floral**: rose, violet, lavender, jasmine
- **Chocolate**: chocolate, cocoa, mocha
- **Vanilla**: vanilla, caramel, butterscotch
- **Spicy**: pepper, cinnamon, clove, nutmeg
- **Herbal**: basil, thyme, mint, tobacco

### Usage

```typescript
import { autoTagWine } from "@/lib/autoTagger";

const tags = autoTagWine({
  flavorNotes: "Rich dark berries with earthy undertones",
  description: "Full-bodied red wine with chocolate notes",
  name: "Cabernet Sauvignon",
  type: "Red Wine",
});
// Returns: ["berry", "earthy", "chocolate"]
```

For detailed documentation, see [AUTO_TAGGING_GUIDE.md](docs/AUTO_TAGGING_GUIDE.md)

## 🔧 Development

### Available Scripts

```bash
pnpm dev          # Start development server (includes Netlify Functions)
pnpm build        # Build for production (client + server + functions)
pnpm start        # Start production server
pnpm test         # Run tests
pnpm typecheck    # Type checking
pnpm format.fix   # Format code
```

### Local Development

The development server runs both the React frontend and Netlify Functions locally:

- **Frontend**: `http://localhost:8080`
- **API Functions**: `http://localhost:8080/api/*` (proxied to Netlify Functions)
- **Direct Function Access**: `http://localhost:8080/.netlify/functions/*`

Functions are automatically rebuilt when changed during development.

### API Endpoints

#### Core APIs

- `GET /api/ping` - Health check
- `GET /api/config/supabase` - Supabase configuration status

#### Inventory Management

- `GET /api/inventory` - List wines with pagination
- `GET /api/inventory?detailed=true` - List wines with detailed fields (region, rating, description, flavor notes, image, tags)
- `GET /api/inventory/:id` - Get single wine details
- `POST /api/inventory` - Add new wine (admin)
- `PUT /api/inventory/:id` - Update wine (admin)
- `PUT /api/inventory/update` - Bulk update quantities (admin)
- `DELETE /api/inventory/:id` - Delete wine (admin)

#### Order Management

- `GET /api/orders` - List orders with pagination (admin)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status (admin)
- `DELETE /api/orders/:id` - Delete order (admin)

#### Batch Management

- `GET /api/batches` - List wine batches (admin)
- `POST /api/batches` - Create new batch (admin)
- `PUT /api/batches/:id` - Update batch (admin)
- `DELETE /api/batches/:id` - Delete batch (admin)

#### Analytics & Utilities

- `GET /api/metrics` - Sales and inventory metrics (admin)
- `POST /api/email` - Send transactional emails
- `POST /api/auth/login` - Admin authentication

#### Query Parameters

**Inventory API Parameters:**

- `page` - Page number for pagination (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `admin` - Set to "true" for admin view (includes all wines)
- `detailed` - Set to "true" for detailed wine information

**Detailed vs Basic Response:**

```javascript
// Basic response (?detailed=false or omitted)
{
  "id": "uuid",
  "name": "Wine Name",
  "winery": "KB Winery",
  "vintage": 2024,
  "type": "Red",
  "price": 25.99,
  "inStock": 12,
  "image": "/placeholder.svg"
}

// Detailed response (?detailed=true)
{
  "id": "uuid",
  "name": "Wine Name",
  "winery": "KB Winery",
  "vintage": 2024,
  "region": "Napa Valley",
  "type": "Red",
  "price": 25.99,
  "inStock": 12,
  "rating": 4.5,
  "description": "Full wine description",
  "flavorNotes": ["berry", "chocolate", "vanilla"],
  "image": "actual_image_url",
  "tags": ["premium", "organic"]
}
```

### Adding Features

#### New API Route

1. Create route handler in `server/routes/`
2. Register in `server/index.ts`
3. Add shared types in `shared/api.ts`

#### New Page

1. Create component in `client/pages/`
2. Add route in `client/App.tsx`

## 🚀 Deployment

### Netlify (Recommended)

The project is configured for Netlify deployment:

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
pnpm build
# Deploy dist/spa/ folder to static hosting
# Deploy netlify/functions/ as serverless functions
```

## 🎨 Styling

The application uses a comprehensive design system built with:

- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible components
- **Custom CSS variables** for theming
- **Responsive design** patterns

### Theme Customization

Modify colors and typography in:

- `tailwind.config.ts` - Tailwind configuration
- `client/global.css` - CSS variables and global styles

## 🧪 Testing

```bash
pnpm test        # Run all tests
pnpm test:watch  # Watch mode
```

Tests are written with Vitest and cover:

- Utility functions
- Component rendering
- API endpoints
- Auto-tagging logic

## 📈 Performance

### Optimization Features

- **Code splitting** with React Router
- **Lazy loading** for heavy components
- **Optimized images** and assets
- **Efficient state management**
- **Database indexing** for queries

### Monitoring

- Error tracking with structured logging
- Performance metrics
- Database query optimization
- Cache strategies

## 🔒 Security

### Implementation

- **Environment variables** for secrets
- **Input validation** with Zod
- **SQL injection prevention**
- **XSS protection**
- **Secure admin authentication**

### Best Practices

- Regular dependency updates
- Security headers
- Data sanitization
- Access control

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Follow TypeScript best practices
- Use Prettier for formatting
- Write meaningful commit messages
- Add JSDoc for complex functions

### Pull Request Process

1. Ensure tests pass
2. Update documentation
3. Follow the PR template
4. Request review from maintainers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛠️ Troubleshooting

### Common Issues

**502 Bad Gateway Errors:**

- Check environment variables are set correctly
- Verify Supabase connection in `/api/config/supabase`
- Ensure all required environment variables are configured

**Inventory API Issues:**

- Use `?detailed=true` for full wine information
- Check pagination parameters (`page`, `limit`)
- Verify admin authentication for admin endpoints

**Build Failures:**

- Run `pnpm install` to ensure dependencies are current
- Check TypeScript errors with `pnpm typecheck`
- Verify environment variables are properly configured

**Development Server:**

- Frontend runs on port 8080
- Netlify Functions are accessible at `/api/*`
- Check browser console for client-side errors
- Check terminal output for server-side errors

## 🆘 Support

### Documentation

- [Auto-Tagging Guide](docs/AUTO_TAGGING_GUIDE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

### Getting Help

- Check existing [GitHub Issues](../../issues)
- Create a new issue for bugs or feature requests
- Join our community discussions

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Radix UI](https://radix-ui.com) for accessible components
- [Tailwind CSS](https://tailwindcss.com) for the styling system
- [Resend](https://resend.com) for email delivery

---

**Built with ❤️ for wine enthusiasts and modern web development**
# CorkCount-demo
