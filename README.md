# Poultry Farm Management System

A comprehensive multi-tenant SaaS application for managing poultry farms, built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Features

### 🏢 Multi-Tenant Architecture
- Organization-based data isolation
- Role-based access control (Owner, Manager, Worker)
- Secure authentication with NextAuth.js v5

### 🐔 Farm Management
- Create and manage multiple farms
- Assign managers to farms
- Track farm locations and descriptions

### 🏠 Shed Management
- Organize sheds within farms
- Set capacity limits for each shed
- Track shed status and performance

### 🥚 Production Tracking
- Daily egg production recording
- Track total, broken, and damaged eggs
- Automatic sellable eggs calculation
- Historical production data

### 👥 Attendance Management
- Worker attendance tracking
- Multiple attendance status options
- Bulk attendance operations
- Attendance history and analytics

### 📊 Analytics & Reporting
- Real-time dashboard with KPIs
- Production trends and comparisons
- Attendance rate monitoring
- Performance analytics

### 📱 Mobile-Responsive Design
- Touch-friendly interfaces
- Optimized for mobile devices
- Progressive Web App capabilities

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **State Management**: Zustand
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd poultry-farm-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database URL and other configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/poultry_farm_db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   RESEND_API_KEY="your-resend-api-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed with demo data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Accounts

After seeding, you can use these demo accounts:

- **Owner**: `owner@demo.com` / `password123`
- **Manager**: `manager@demo.com` / `password123`
- **Worker**: `worker1@demo.com` / `password123`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── farms/             # Farm management
│   ├── production/        # Production tracking
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── validations.ts    # Zod schemas
│   └── ...
└── types/                # TypeScript type definitions

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seeding
```

## Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Organization**: Multi-tenant isolation
- **User**: Authentication and role management
- **Farm**: Farm management
- **Shed**: Shed organization within farms
- **Production**: Daily egg production records
- **Attendance**: Worker attendance tracking
- **AuditLog**: System audit trail

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login

### Farms
- `GET /api/farms` - List farms
- `POST /api/farms` - Create farm
- `PUT /api/farms/[id]` - Update farm
- `DELETE /api/farms/[id]` - Delete farm

### Sheds
- `GET /api/sheds` - List sheds
- `POST /api/sheds` - Create shed
- `PUT /api/sheds/[id]` - Update shed
- `DELETE /api/sheds/[id]` - Delete shed

### Production
- `GET /api/production` - List production records
- `POST /api/production` - Create production record
- `PUT /api/production/[id]` - Update production record
- `DELETE /api/production/[id]` - Delete production record

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Create attendance record (single or bulk)

### Users
- `GET /api/users` - List users (Owner only)
- `POST /api/users` - Create user (Owner only)
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Deactivate user (Owner only)

## Role-Based Access Control

### Owner
- Full system access
- User management
- Organization settings
- All farm and production operations

### Manager
- Farm and shed management
- Production data entry and editing
- Attendance management
- Analytics and reporting

### Worker
- View dashboard
- Record production data
- View own attendance
- Limited read access

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Zod
- SQL injection prevention with Prisma
- CSRF protection
- Rate limiting
- Audit logging

## Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run all tests
npm run test:all
```

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `RESEND_API_KEY` | Resend email service API key | No |
| `FROM_EMAIL` | Default sender email | No |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@poultryfarmsaas.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and ML predictions
- [ ] Integration with IoT sensors
- [ ] Multi-language support
- [ ] Advanced reporting with custom templates
- [ ] API webhooks
- [ ] Third-party integrations