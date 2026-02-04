# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MechanicCompanion Backend is a NestJS-based REST API for a mobile auto service management application. The system allows auto mechanics, detailers, and service center owners to manage cars, visits, materials, and generate PDF reports.

**Frontend Application:** `/Users/akozlov/projects/MechanicCompanion` (React Native)

**Current Status:** Phase 1 (Infrastructure) completed - Phase 2 (Authentication) is next.

## Common Commands

### Development
```bash
npm run start:dev         # Start with hot-reload
npm run build             # Build production bundle
npm run start:prod        # Run production version
```

### Database (Prisma)
```bash
npx prisma studio         # Open Prisma Studio (database GUI)
npx prisma migrate dev    # Create and apply migration (dev)
npx prisma migrate deploy # Apply migrations (production)
npx prisma generate       # Generate Prisma Client after schema changes
```

### Docker
```bash
docker-compose up -d postgres     # Start only PostgreSQL
docker-compose up                 # Start all services
docker-compose down               # Stop all services
docker-compose logs -f app        # View application logs
```

### Linting
```bash
npm run lint              # Run ESLint
npm run format            # Format with Prettier
```

## Architecture

### Technology Stack
- **Framework:** NestJS 11 with TypeScript 5.9
- **Database:** PostgreSQL 16 with Prisma 6.19.2 ORM
- **Authentication:** JWT with refresh tokens (bcrypt for password hashing)
- **File Processing:** Sharp (image compression), Puppeteer (PDF generation)
- **Email:** Nodemailer with Handlebars templates
- **Security:** Helmet, CORS, Rate limiting (@nestjs/throttler)
- **Containerization:** Docker with multi-stage builds

### Database Design Philosophy

The database uses **11 models** organized around three main entities:

1. **User System:** User, RefreshToken, PasswordResetToken
   - Users own all their data (cascade deletion)
   - Tokens are automatically cleaned up when users are deleted

2. **Car Management:** Car, CarPhoto, CarDocument
   - Each car has unique license plate per user (`@@unique([userId, licensePlate])`)
   - Tracks `visitsCount` and `lastVisitDate` for quick access
   - Photos limited to 3 per car; first photo becomes `mainPhotoUrl`

3. **Visit Management:** Visit, VisitPhoto, VisitMaterial, VisitDocument
   - Visits automatically update parent car's `visitsCount` and `lastVisitDate`
   - Photos are categorized as BEFORE/AFTER (PhotoType enum)
   - Materials track quantity and price as Decimal(10,2)
   - WorkType enum: DETAILING, MAINTENANCE, REPAIR, DIAGNOSTICS, TIRE_SERVICE, OTHER
   - VisitStatus enum: IN_PROGRESS, COMPLETED, DELIVERED, CANCELLED

**Important:** All foreign key relations use `onDelete: Cascade` - deleting a user cascades to all cars, which cascades to all visits and their related data.

### API Response Format

All API responses follow this standard format:
```typescript
{
  data: T,              // Object or array
  message?: string,     // Optional message
  success: boolean      // Operation status
}
```

Use a global `TransformInterceptor` to ensure consistency (see BACKEND_PLAN.md Phase 9).

### Expected API Structure

When implementing modules, follow this endpoint pattern:

**Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/me`

**Cars:** `/api/cars` (CRUD), `/api/cars/:id/photos`, `/api/cars/:carId/documents`

**Visits:** `/api/visits` (CRUD), `/api/cars/:carId/visits`, `/api/visits/:id/status`, `/api/visits/:id/photos`, `/api/visits/:id/documents`, `/api/visits/:id/export-pdf`, `/api/visits/:id/send-report`

**Materials:** `/api/visits/:visitId/materials` (CRUD on individual materials)

**Profile:** `/api/profile`, `/api/profile/password`, `/api/profile/logo`, `/api/profile/signature`

**Files:** `/api/upload` (universal upload), `/api/files/*` (static file serving)

### Module Structure Pattern

Each feature module should follow this structure:
```
src/{module}/
├── {module}.controller.ts
├── {module}.service.ts
├── {module}.module.ts
└── dto/
    ├── create-{entity}.dto.ts
    ├── update-{entity}.dto.ts
    └── query-{entity}.dto.ts (for list endpoints)
```

For complex modules (auth, files, pdf, mail), add additional folders:
- `guards/` - Route guards (JWT, roles, etc.)
- `strategies/` - Passport strategies
- `decorators/` - Custom parameter decorators
- `interceptors/` - Request/response interceptors
- `templates/` - Email/PDF templates

### Security Requirements

1. **Authentication:** All endpoints except `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` must be protected with `@UseGuards(JwtAuthGuard)`

2. **Authorization:** Always verify ownership before operations:
   ```typescript
   // Example: Verify car belongs to user
   const car = await prisma.car.findUnique({ where: { id } });
   if (car.userId !== currentUser.id) throw new ForbiddenException();
   ```

3. **Rate Limiting:**
   - Default: 100 requests/minute (configured in AppModule)
   - Auth endpoints: 5 requests/minute (use `@Throttle(5, 60)` decorator)

4. **File Validation:**
   - Images: JPG/PNG, max 10MB, compress to 1920x1080 @ 80% quality
   - Documents: PDF/DOC/DOCX, max 20MB
   - Store in `/uploads/{userId}/{type}/{uuid}.{ext}` structure

5. **Password Security:**
   - Use bcrypt with 10 rounds for hashing
   - JWT access token expires in 1h
   - Refresh token expires in 7d

### Critical Business Logic

**When creating a visit:**
- Increment `car.visitsCount`
- Update `car.lastVisitDate` to visit date

**When deleting a visit:**
- Decrement `car.visitsCount`
- Recalculate `car.lastVisitDate` from remaining visits
- Physically delete all associated files (photos, documents)

**When uploading car photos:**
- Limit to 3 photos per car
- Set `car.mainPhotoUrl` to first photo if not already set
- Compress with Sharp before saving

**When deleting a car:**
- Prisma cascades to all visits, photos, documents
- MUST manually delete physical files from `/uploads/` directory

### File Storage Strategy

Files are stored locally (not cloud storage for now):
- Path structure: `./uploads/{userId}/{type}/{uuid}.{ext}`
- Types: `car-photo`, `visit-photo-before`, `visit-photo-after`, `car-document`, `visit-document`, `logo`, `signature`
- Generate UUIDs for filenames to avoid conflicts
- Use Sharp for image processing before saving

Temp files (PDF generation): `./tmp/pdf/`

### Configuration Management

All configuration is centralized in `src/config/configuration.ts` and loaded via `@nestjs/config`. Access values using `ConfigService`:

```typescript
constructor(private configService: ConfigService) {}

const secret = this.configService.get<string>('jwt.secret');
```

Environment variables are loaded from `.env` (see `.env.example` for all required variables).

**Required .env variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Min 32 characters
- `JWT_REFRESH_SECRET` - Different from JWT_SECRET
- Email credentials (MAIL_HOST, MAIL_USER, MAIL_PASSWORD)

### PDF Generation

Use Puppeteer with Handlebars templates:
1. Render HTML template with visit data
2. Include images as base64 or file:// URLs
3. Generate A4 PDF with margins (20mm top/bottom, 15mm sides)
4. Include workshop logo, signature, visit details, materials table, before/after photos

Template should be in `src/pdf/templates/visit-report.html` (see detailed HTML in BACKEND_PLAN.md Phase 7).

### Email Templates

Use Handlebars templates in `src/mail/templates/`:
- `password-reset.hbs` - Contains reset link with token
- `visit-report.hbs` - Attaches generated PDF

Configure with `@nestjs-modules/mailer` and Nodemailer transport.

### Testing Strategy

Before implementing new features:
1. Check BACKEND_PLAN.md for detailed specifications
2. Ensure Prisma schema matches requirements
3. Implement service logic with PrismaService
4. Add DTOs with class-validator decorators
5. Create controller with proper guards and validation
6. Test manually with Postman/Insomnia (API docs in BACKEND_PLAN.md)

Integration with frontend happens after backend is complete (set `USE_MOCKS = false` in React Native app).

### Docker Deployment

The project uses multi-stage Docker builds:
- **Stage 1 (builder):** Install deps, generate Prisma Client, build TypeScript
- **Stage 2 (production):** Copy built files, install Chromium for Puppeteer, run with Node

**Important for Puppeteer:** Alpine Linux requires installing Chromium and system dependencies (see Dockerfile). Set:
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Development Workflow

Phase 2 (Authentication) is next. Implement in this order:
1. Create `src/auth/` module with structure from BACKEND_PLAN.md Phase 2.1
2. Implement JWT strategies (access + refresh tokens)
3. Create guards (`JwtAuthGuard`, `JwtRefreshGuard`)
4. Add `@CurrentUser()` decorator to extract user from JWT
5. Implement all auth endpoints with proper DTOs
6. Add global ValidationPipe, ExceptionFilter, TransformInterceptor
7. Test auth flow thoroughly before moving to Phase 3

**Reference BACKEND_PLAN.md for detailed specifications of each phase.**

## Known Issues & Gotchas

- Database migrations have not been run yet - first developer must run `npx prisma migrate dev --name init`
- Health check endpoint at `/api/health` exists in AppController
- The frontend expects Russian language responses (user is Russian-speaking)
- All timestamps should use ISO 8601 format
- Decimal fields in Prisma (costs, prices) return as strings - convert to numbers in DTOs if needed
