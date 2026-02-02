# ПЛАН РЕАЛИЗАЦИИ БЭКЕНДА MechanicCompanion

## Обзор проекта

Бэкенд приложение для клиентского React Native приложения MechanicCompanion - системы управления автосервисом для русскоговорящих автомехаников, детейлеров и владельцев автосервисов.

**Клиентское приложение**: `/Users/akozlov/projects/MechanicCompanion`

---

## Выбранный стек технологий

- **Framework**: NestJS
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Auth**: JWT + Refresh Token
- **File Storage**: Локальное хранилище на сервере
- **Email**: SMTP (Nodemailer)
- **PDF Generation**: Puppeteer
- **Containerization**: Docker + Docker Compose
- **Language**: TypeScript

---

## Основные требования из клиентского приложения

### Модели данных

**User (Пользователь)**
```typescript
{
  id: string;
  email: string;
  workshopName?: string;      // Название мастерской
  phone?: string;
  address?: string;
  logoUrl?: string;           // Логотип
  signatureUrl?: string;      // Подпись для PDF
  createdAt: string;
  updatedAt: string;
}
```

**Car (Автомобиль)**
```typescript
{
  id: string;
  userId: string;
  licensePlate: string;       // Госномер (уникальный)
  brand: string;              // Марка
  model: string;              // Модель
  year?: number;              // Год выпуска
  vin?: string;               // VIN-номер
  ownerName?: string;         // Владелец (ФИО)
  ownerPhone?: string;        // Телефон
  ownerEmail?: string;        // Email
  mainPhotoUrl?: string;      // Главное фото
  photos?: CarPhoto[];        // До 3 фото
  notes?: string;             // Заметки
  lastVisitDate?: string;     // Дата последнего визита
  visitsCount: number;        // Количество визитов
  createdAt: string;
  updatedAt: string;
}
```

**Visit (Визит/Заказ)**
```typescript
{
  id: string;
  carId: string;
  car?: Car;
  visitDate: string;
  workType: WorkType;         // Тип работ (enum)
  workDescription: string;
  estimatedCost?: number;     // Планируемая стоимость
  finalCost?: number;         // Итоговая стоимость
  estimatedCompletionDate?: string;
  status: VisitStatus;        // Статус (enum)

  // Чек-лист приёмки
  fuelLevel?: number;         // 0-100%
  mileage?: number;           // Пробег
  hasDamages: boolean;
  damagesDescription?: string;
  personalItems?: string;     // Личные вещи
  tireCondition?: string;     // Состояние шин

  photos?: VisitPhoto[];      // Фото ДО/ПОСЛЕ
  materials?: VisitMaterial[]; // Материалы
  documents?: VisitDocument[]; // Документы
  createdAt: string;
  updatedAt: string;
}
```

**VisitMaterial (Материалы/запчасти)**
```typescript
{
  id: string;
  visitId: string;
  name: string;               // Название
  quantity: number;           // Количество
  price: number;              // Цена за единицу
  createdAt: string;
}
```

**Enum типы**
```typescript
enum WorkType {
  DETAILING = 'detailing',
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  DIAGNOSTICS = 'diagnostics',
  TIRE_SERVICE = 'tire_service',
  OTHER = 'other',
}

enum VisitStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

enum PhotoType {
  BEFORE = 'before',
  AFTER = 'after',
}
```

### Ожидаемые API Endpoints

**Авторизация:**
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `POST /api/auth/refresh` - обновление токена
- `POST /api/auth/forgot-password` - восстановление пароля
- `POST /api/auth/reset-password` - сброс пароля
- `GET /api/auth/me` - получение текущего пользователя

**Автомобили:**
- `GET /api/cars` - список (с query params: search, sortBy)
- `POST /api/cars` - создание
- `GET /api/cars/:id` - получение по ID
- `PUT /api/cars/:id` - обновление
- `DELETE /api/cars/:id` - удаление
- `POST /api/cars/:id/photos` - загрузка фото

**Визиты:**
- `GET /api/cars/:carId/visits` - визиты автомобиля
- `GET /api/visits` - все визиты (с фильтрацией)
- `POST /api/visits` - создание
- `GET /api/visits/:id` - получение по ID
- `PUT /api/visits/:id` - обновление
- `DELETE /api/visits/:id` - удаление
- `PATCH /api/visits/:id/status` - изменение статуса
- `POST /api/visits/:id/photos` - загрузка фото
- `POST /api/visits/:id/documents` - загрузка документов
- `DELETE /api/visits/:id/documents/:docId` - удаление документа
- `GET /api/visits/:id/export-pdf` - генерация PDF
- `POST /api/visits/:id/send-report` - отправка отчёта на email

**Материалы визита:**
- `GET /api/visits/:visitId/materials` - список материалов
- `POST /api/visits/:visitId/materials` - добавление
- `PUT /api/materials/:id` - обновление
- `DELETE /api/materials/:id` - удаление

**Документы автомобиля:**
- `GET /api/cars/:carId/documents` - список документов
- `POST /api/cars/:carId/documents` - добавление
- `DELETE /api/documents/:id` - удаление

**Профиль:**
- `GET /api/profile` - получение профиля
- `PUT /api/profile` - обновление профиля
- `PUT /api/profile/password` - смена пароля
- `POST /api/profile/logo` - загрузка логотипа
- `POST /api/profile/signature` - загрузка подписи

**Файлы:**
- `POST /api/upload` - универсальный endpoint для загрузки файлов
- `GET /api/files/*` - раздача статических файлов

### Формат ответов API

Все ответы должны следовать стандартному формату:
```typescript
{
  data: T,              // Данные (объект или массив)
  message?: string,     // Опциональное сообщение
  success: boolean      // Статус операции
}
```

---

## ФАЗЫ РАЗРАБОТКИ

### Фаза 1: Инфраструктура и базовая настройка (2-3 часа)

#### 1.1 Инициализация проекта
- [ ] Создание NestJS проекта с TypeScript
  ```bash
  npm i -g @nestjs/cli
  nest new MechanicCompanionBackend
  ```
- [ ] Настройка ESLint, Prettier
- [ ] Структура проекта (модули: auth, cars, visits, materials, documents, profile, files, mail, pdf)
- [ ] Настройка переменных окружения (.env, @nestjs/config)
- [ ] Установка необходимых зависимостей:
  ```bash
  npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
  npm install @prisma/client
  npm install -D prisma
  npm install class-validator class-transformer
  npm install @nestjs/platform-express multer
  npm install sharp # для сжатия изображений
  npm install nodemailer @nestjs-modules/mailer handlebars
  npm install puppeteer
  npm install @nestjs/throttler # rate limiting
  npm install helmet compression
  ```

#### 1.2 Настройка PostgreSQL и Prisma
- [ ] Инициализация Prisma
  ```bash
  npx prisma init
  ```
- [ ] Создание schema.prisma с моделями:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  workshopName  String?   @map("workshop_name")
  phone         String?
  address       String?
  logoUrl       String?   @map("logo_url")
  signatureUrl  String?   @map("signature_url")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  cars          Car[]
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
  @@index([userId])
}

model Car {
  id             String    @id @default(uuid())
  userId         String    @map("user_id")
  licensePlate   String    @map("license_plate")
  brand          String
  model          String
  year           Int?
  vin            String?
  ownerName      String?   @map("owner_name")
  ownerPhone     String?   @map("owner_phone")
  ownerEmail     String?   @map("owner_email")
  mainPhotoUrl   String?   @map("main_photo_url")
  notes          String?
  lastVisitDate  DateTime? @map("last_visit_date")
  visitsCount    Int       @default(0) @map("visits_count")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  photos    CarPhoto[]
  documents CarDocument[]
  visits    Visit[]

  @@unique([userId, licensePlate])
  @@map("cars")
  @@index([userId])
  @@index([licensePlate])
}

model CarPhoto {
  id        String   @id @default(uuid())
  carId     String   @map("car_id")
  photoUrl  String   @map("photo_url")
  createdAt DateTime @default(now()) @map("created_at")

  car Car @relation(fields: [carId], references: [id], onDelete: Cascade)

  @@map("car_photos")
  @@index([carId])
}

model CarDocument {
  id           String   @id @default(uuid())
  carId        String   @map("car_id")
  documentUrl  String   @map("document_url")
  documentName String   @map("document_name")
  createdAt    DateTime @default(now()) @map("created_at")

  car Car @relation(fields: [carId], references: [id], onDelete: Cascade)

  @@map("car_documents")
  @@index([carId])
}

enum WorkType {
  DETAILING
  MAINTENANCE
  REPAIR
  DIAGNOSTICS
  TIRE_SERVICE
  OTHER
}

enum VisitStatus {
  IN_PROGRESS
  COMPLETED
  DELIVERED
  CANCELLED
}

model Visit {
  id                      String       @id @default(uuid())
  carId                   String       @map("car_id")
  visitDate               DateTime     @map("visit_date")
  workType                WorkType     @map("work_type")
  workDescription         String       @map("work_description")
  estimatedCost           Decimal?     @map("estimated_cost") @db.Decimal(10, 2)
  finalCost               Decimal?     @map("final_cost") @db.Decimal(10, 2)
  estimatedCompletionDate DateTime?    @map("estimated_completion_date")
  status                  VisitStatus  @default(IN_PROGRESS)
  fuelLevel               Int?         @map("fuel_level")
  mileage                 Int?
  hasDamages              Boolean      @default(false) @map("has_damages")
  damagesDescription      String?      @map("damages_description")
  personalItems           String?      @map("personal_items")
  tireCondition           String?      @map("tire_condition")
  createdAt               DateTime     @default(now()) @map("created_at")
  updatedAt               DateTime     @updatedAt @map("updated_at")

  car       Car              @relation(fields: [carId], references: [id], onDelete: Cascade)
  photos    VisitPhoto[]
  materials VisitMaterial[]
  documents VisitDocument[]

  @@map("visits")
  @@index([carId])
  @@index([status])
}

enum PhotoType {
  BEFORE
  AFTER
}

model VisitPhoto {
  id        String    @id @default(uuid())
  visitId   String    @map("visit_id")
  photoUrl  String    @map("photo_url")
  photoType PhotoType @map("photo_type")
  createdAt DateTime  @default(now()) @map("created_at")

  visit Visit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@map("visit_photos")
  @@index([visitId])
}

model VisitMaterial {
  id        String   @id @default(uuid())
  visitId   String   @map("visit_id")
  name      String
  quantity  Decimal  @db.Decimal(10, 2)
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")

  visit Visit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@map("visit_materials")
  @@index([visitId])
}

model VisitDocument {
  id           String   @id @default(uuid())
  visitId      String   @map("visit_id")
  documentUrl  String   @map("document_url")
  documentName String   @map("document_name")
  createdAt    DateTime @default(now()) @map("created_at")

  visit Visit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@map("visit_documents")
  @@index([visitId])
}
```

- [ ] Создание миграций
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Создание seed.ts для тестовых данных
- [ ] Создание PrismaModule и PrismaService

#### 1.3 Docker и Docker Compose
- [ ] Создание Dockerfile (multi-stage build)
- [ ] Создание docker-compose.yml с сервисами postgres и app
- [ ] Настройка volumes для PostgreSQL и uploads
- [ ] Создание .dockerignore
- [ ] Тестирование запуска через docker-compose

---

### Фаза 2: Авторизация и безопасность (3-4 часа)

#### 2.1 Auth Module

**Структура:**
```
src/auth/
├── auth.controller.ts
├── auth.service.ts
├── auth.module.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts
│   └── reset-password.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── jwt-refresh.guard.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
└── decorators/
    └── current-user.decorator.ts
```

**Endpoints:**
- [ ] `POST /api/auth/register` - регистрация
  - Валидация email уникальности
  - Хеширование пароля (bcrypt, rounds: 10)
  - Генерация JWT access token (expires: 1h)
  - Генерация refresh token (expires: 7d)
  - Возврат `{ token, refreshToken, user }`

- [ ] `POST /api/auth/login` - вход
  - Валидация credentials
  - Генерация access + refresh tokens
  - Возврат `{ token, refreshToken, user }`

- [ ] `POST /api/auth/refresh` - обновление токена
  - Валидация refresh token из БД
  - Генерация нового access token
  - Опционально: rotation refresh token
  - Возврат `{ token, refreshToken }`

- [ ] `POST /api/auth/forgot-password` - восстановление пароля
  - Генерация reset token (UUID)
  - Сохранение в БД с expiration (1 час)
  - Отправка email с ссылкой
  - Возврат `{ success: true, message: 'Email отправлен' }`

- [ ] `POST /api/auth/reset-password` - сброс пароля
  - Валидация reset token
  - Обновление пароля
  - Инвалидация reset token
  - Возврат `{ success: true }`

- [ ] `GET /api/auth/me` - получение текущего пользователя
  - Защищено JwtAuthGuard
  - Возврат user без password

#### 2.2 Guards и Middleware
- [ ] JwtAuthGuard - проверка JWT токена в заголовке Authorization
- [ ] JwtRefreshGuard - проверка refresh token
- [ ] JwtStrategy - извлечение user из токена
- [ ] ValidationPipe - глобальная валидация DTO (whitelist: true, transform: true)
- [ ] ExceptionFilter - централизованная обработка ошибок
- [ ] TransformInterceptor - трансформация ответов в формат `{ data, message, success }`
- [ ] CORS настройка (origin: '*' для разработки, конкретные домены для продакшена)

#### 2.3 Дополнительная модель для reset tokens
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@map("password_reset_tokens")
  @@index([userId])
  @@index([token])
}
```

---

### Фаза 3: Модуль автомобилей (Cars) (2-3 часа)

#### 3.1 Cars Module

**Структура:**
```
src/cars/
├── cars.controller.ts
├── cars.service.ts
├── cars.module.ts
└── dto/
    ├── create-car.dto.ts
    ├── update-car.dto.ts
    └── query-cars.dto.ts
```

**Endpoints:**
- [ ] `GET /api/cars` - список автомобилей
  - Query params:
    - `search` (по госномеру, марке, модели, владельцу)
    - `sortBy` (date | brand, default: date)
  - Фильтр по userId текущего пользователя
  - Включает visitsCount, lastVisitDate
  - Пагинация (опционально для MVP)

- [ ] `POST /api/cars` - создание автомобиля
  - Валидация обязательных полей: licensePlate, brand, model, ownerName, ownerPhone
  - Проверка уникальности госномера в рамках userId
  - Валидация VIN (17 символов, если указан)
  - Валидация email (если указан)
  - Возврат созданного автомобиля

- [ ] `GET /api/cars/:id` - получение автомобиля
  - Проверка прав доступа (car.userId === currentUser.id)
  - Включает связанные данные: photos, documents, visits

- [ ] `PUT /api/cars/:id` - обновление автомобиля
  - Проверка прав доступа
  - Валидация изменения госномера на уникальность
  - Возврат обновлённого автомобиля

- [ ] `DELETE /api/cars/:id` - удаление автомобиля
  - Проверка прав доступа
  - Каскадное удаление связанных данных (Prisma onDelete: Cascade)
  - Физическое удаление файлов фото и документов
  - Возврат `{ success: true }`

- [ ] `POST /api/cars/:id/photos` - загрузка фото (до 3 шт)
  - Проверка прав доступа
  - Валидация формата (JPEG/PNG)
  - Проверка лимита (максимум 3 фото)
  - Сжатие изображений (sharp: max 1920x1080, quality 80%)
  - Установка mainPhotoUrl если первое фото
  - Возврат массива URL загруженных фото

#### 3.2 Car Documents
- [ ] `GET /api/cars/:carId/documents` - список документов
  - Проверка прав доступа

- [ ] `POST /api/cars/:carId/documents` - загрузка документа
  - Проверка прав доступа
  - Валидация формата (PDF/DOC/DOCX)
  - Сохранение с уникальным именем
  - Возврат документа с URL

- [ ] `DELETE /api/documents/:id` - удаление документа
  - Проверка прав доступа (через car -> user)
  - Физическое удаление файла
  - Возврат `{ success: true }`

#### 3.3 Бизнес-логика
- [ ] При создании автомобиля: установка visitsCount = 0
- [ ] При удалении автомобиля: удаление всех связанных файлов
- [ ] Валидация VIN: 17 символов, латиница и цифры
- [ ] Поиск: case-insensitive, по частичному совпадению

---

### Фаза 4: Модуль визитов (Visits) (3-4 часа)

#### 4.1 Visits Module

**Структура:**
```
src/visits/
├── visits.controller.ts
├── visits.service.ts
├── visits.module.ts
└── dto/
    ├── create-visit.dto.ts
    ├── update-visit.dto.ts
    ├── update-status.dto.ts
    └── query-visits.dto.ts
```

**Endpoints:**
- [ ] `GET /api/visits` - все визиты пользователя
  - Query params:
    - `carId` - фильтр по автомобилю
    - `status` - фильтр по статусу
    - `dateFrom`, `dateTo` - фильтр по датам
  - Сортировка по visitDate DESC
  - Включает связанные данные: car, materials, photos

- [ ] `GET /api/cars/:carId/visits` - визиты конкретного автомобиля
  - Проверка прав доступа
  - Сортировка по visitDate DESC

- [ ] `POST /api/visits` - создание визита
  - Валидация carId принадлежности пользователю
  - Автоматический статус "IN_PROGRESS"
  - Обновление lastVisitDate и visitsCount у автомобиля
  - Возврат созданного визита с car

- [ ] `GET /api/visits/:id` - получение визита
  - Проверка прав доступа (через car -> user)
  - Включает: car, materials, photos, documents

- [ ] `PUT /api/visits/:id` - обновление визита
  - Проверка прав доступа
  - Обновление lastVisitDate у автомобиля при изменении даты
  - Возврат обновлённого визита

- [ ] `DELETE /api/visits/:id` - удаление визита
  - Проверка прав доступа
  - Пересчёт visitsCount у автомобиля
  - Обновление lastVisitDate (из оставшихся визитов)
  - Каскадное удаление materials, photos, documents
  - Физическое удаление файлов
  - Возврат `{ success: true }`

- [ ] `PATCH /api/visits/:id/status` - изменение статуса
  - Проверка прав доступа
  - Валидация статуса (IN_PROGRESS, COMPLETED, DELIVERED, CANCELLED)
  - Возврат обновлённого визита

- [ ] `POST /api/visits/:id/photos` - загрузка фото (до 10 шт)
  - Проверка прав доступа
  - Body: `{ type: 'before' | 'after', files: File[] }`
  - Валидация формата и размера
  - Проверка лимита (максимум 10 фото)
  - Сжатие изображений
  - Возврат массива загруженных фото

#### 4.2 Visit Materials Module

**Структура:**
```
src/materials/
├── materials.controller.ts
├── materials.service.ts
├── materials.module.ts
└── dto/
    ├── create-material.dto.ts
    └── update-material.dto.ts
```

**Endpoints:**
- [ ] `GET /api/visits/:visitId/materials` - список материалов
  - Проверка прав доступа

- [ ] `POST /api/visits/:visitId/materials` - добавление материала
  - Проверка прав доступа
  - Поля: name, quantity, price
  - Валидация: quantity > 0, price >= 0
  - Возврат созданного материала

- [ ] `PUT /api/materials/:id` - обновление материала
  - Проверка прав доступа (через visit -> car -> user)
  - Валидация полей
  - Возврат обновлённого материала

- [ ] `DELETE /api/materials/:id` - удаление материала
  - Проверка прав доступа
  - Возврат `{ success: true }`

#### 4.3 Visit Documents
- [ ] `GET /api/visits/:visitId/documents` - список документов
- [ ] `POST /api/visits/:visitId/documents` - загрузка документа
- [ ] `DELETE /api/documents/:id` - удаление документа (общий с car documents)

#### 4.4 Бизнес-логика
- [ ] При создании визита:
  - Увеличение visitsCount у автомобиля
  - Обновление lastVisitDate у автомобиля

- [ ] При удалении визита:
  - Уменьшение visitsCount у автомобиля
  - Обновление lastVisitDate (взять дату последнего оставшегося визита)

- [ ] При обновлении даты визита:
  - Пересчёт lastVisitDate у автомобиля (если это самый последний визит)

---

### Фаза 5: Файловое хранилище (1-2 часа)

#### 5.1 Files Module

**Структура:**
```
src/files/
├── files.controller.ts
├── files.service.ts
├── files.module.ts
└── interceptors/
    └── file-upload.interceptor.ts
```

**Endpoints:**
- [ ] `POST /api/upload` - универсальный endpoint для загрузки
  - Multer middleware для multipart/form-data
  - Query param: `type` (car-photo, visit-photo, document, logo, signature)
  - Типы файлов:
    - images: jpg, jpeg, png (до 10MB)
    - documents: pdf, doc, docx (до 20MB)
  - Сохранение в структуру: `/uploads/{userId}/{type}/{uuid}.{ext}`
  - Для изображений: сжатие через sharp (max 1920x1080, quality 80%)
  - Возврат: `{ url: '/api/files/...' }`

- [ ] `GET /api/files/*` - раздача статических файлов
  - Express.static middleware для /uploads
  - Проверка прав доступа (опционально для MVP, можно отложить)
  - Headers: Content-Type, Cache-Control

- [ ] `DELETE /api/files/:path` - удаление файла
  - Проверка прав доступа
  - Физическое удаление с диска
  - Возврат `{ success: true }`

#### 5.2 Утилиты
- [ ] `FileValidator` - валидация типа, размера, расширения
- [ ] `ImageProcessor` - сжатие и оптимизация изображений
- [ ] `FileStorage` - утилита для работы с файловой системой
- [ ] `generateUniqueFilename()` - генерация UUID имён файлов

#### 5.3 Конфигурация
```typescript
// config/file-upload.config.ts
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: {
    image: 10 * 1024 * 1024,  // 10MB
    document: 20 * 1024 * 1024, // 20MB
  },
  allowedMimeTypes: {
    image: ['image/jpeg', 'image/png'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  uploadDir: './uploads',
  imageCompression: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 80,
  },
};
```

---

### Фаза 6: Email сервис (1-2 часа)

#### 6.1 Mail Module

**Структура:**
```
src/mail/
├── mail.service.ts
├── mail.module.ts
├── templates/
│   ├── password-reset.hbs
│   └── visit-report.hbs
└── interfaces/
    └── mail-options.interface.ts
```

**Настройка:**
- [ ] Установка @nestjs-modules/mailer и nodemailer
- [ ] Конфигурация SMTP транспорта (Gmail, Mailgun, или SendGrid)
- [ ] Настройка Handlebars для шаблонов

**Функции:**
- [ ] `sendPasswordResetEmail(email: string, resetToken: string)`
  - Шаблон с приветствием, инструкцией и кнопкой
  - Ссылка: `https://app.example.com/reset-password?token={resetToken}`
  - Срок действия: 1 час

- [ ] `sendVisitReportEmail(email: string, pdfBuffer: Buffer, visitData: any)`
  - Шаблон с информацией о визите
  - Прикрепление PDF файла
  - Персонализация с данными автомобиля

**Шаблон password-reset.hbs:**
```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Восстановление пароля</title>
</head>
<body>
  <h1>Восстановление пароля</h1>
  <p>Здравствуйте!</p>
  <p>Вы запросили восстановление пароля для вашего аккаунта в MechanicCompanion.</p>
  <p>Нажмите на кнопку ниже, чтобы сбросить пароль:</p>
  <a href="{{resetLink}}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
    Сбросить пароль
  </a>
  <p>Ссылка действительна в течение 1 часа.</p>
  <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
  <br>
  <p>С уважением,<br>Команда MechanicCompanion</p>
</body>
</html>
```

**Обработка ошибок:**
- [ ] Логирование неудачных отправок
- [ ] Retry механизм (опционально)
- [ ] Graceful degradation (не ломать основной флоу при ошибке email)

---

### Фаза 7: Генерация PDF отчётов (2-3 часа)

#### 7.1 PDF Module

**Структура:**
```
src/pdf/
├── pdf.service.ts
├── pdf.module.ts
├── templates/
│   ├── visit-report.html
│   └── styles.css
└── interfaces/
    └── pdf-options.interface.ts
```

**Endpoints:**
- [ ] `GET /api/visits/:id/export-pdf` - генерация и возврат PDF
  - Проверка прав доступа
  - Генерация PDF
  - Возврат файла с headers:
    ```
    Content-Type: application/pdf
    Content-Disposition: attachment; filename="visit-{id}-{date}.pdf"
    ```

- [ ] `POST /api/visits/:id/send-report` - генерация + отправка на email
  - Body: `{ email: string }`
  - Валидация email формата
  - Генерация PDF
  - Отправка через Mail Service
  - Возврат `{ success: true, message: 'Отчёт отправлен на email' }`

#### 7.2 Шаблон HTML для PDF

**visit-report.html:**
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Отчёт о визите</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #007bff;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .logo {
      max-width: 150px;
      max-height: 80px;
    }
    .workshop-info {
      text-align: right;
    }
    h1 {
      color: #007bff;
      margin: 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      background: #f0f0f0;
      padding: 10px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .info-item {
      padding: 5px 0;
    }
    .label {
      font-weight: bold;
      color: #666;
    }
    .checklist {
      list-style: none;
      padding: 0;
    }
    .checklist li {
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    .photo-grid img {
      width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .materials-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .materials-table th,
    .materials-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .materials-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .total-row {
      font-weight: bold;
      background: #f9f9f9;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-in-progress { background: #ffc107; color: white; }
    .status-completed { background: #28a745; color: white; }
    .status-delivered { background: #007bff; color: white; }
    .status-cancelled { background: #dc3545; color: white; }
    .footer {
      margin-top: 50px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .signature {
      max-width: 200px;
      margin: 20px auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      {{#if workshopLogo}}
      <img src="{{workshopLogo}}" alt="Логотип" class="logo">
      {{/if}}
      <h1>{{workshopName}}</h1>
      <p>{{workshopPhone}}<br>{{workshopAddress}}</p>
    </div>
    <div class="workshop-info">
      <h2>ОТЧЁТ О ВИЗИТЕ</h2>
      <p>Дата: {{reportDate}}</p>
      <p>№ {{visitId}}</p>
    </div>
  </div>

  <!-- Информация об автомобиле -->
  <div class="section">
    <div class="section-title">ИНФОРМАЦИЯ ОБ АВТОМОБИЛЕ</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Марка и модель:</span> {{carBrand}} {{carModel}}
      </div>
      <div class="info-item">
        <span class="label">Госномер:</span> {{carLicensePlate}}
      </div>
      <div class="info-item">
        <span class="label">VIN:</span> {{carVin}}
      </div>
      <div class="info-item">
        <span class="label">Год выпуска:</span> {{carYear}}
      </div>
      <div class="info-item">
        <span class="label">Владелец:</span> {{ownerName}}
      </div>
      <div class="info-item">
        <span class="label">Телефон:</span> {{ownerPhone}}
      </div>
    </div>
  </div>

  <!-- Информация о визите -->
  <div class="section">
    <div class="section-title">ИНФОРМАЦИЯ О ВИЗИТЕ</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Дата приёмки:</span> {{visitDate}}
      </div>
      <div class="info-item">
        <span class="label">Тип работ:</span> {{workType}}
      </div>
      <div class="info-item">
        <span class="label">Статус:</span> <span class="status-badge status-{{status}}">{{statusText}}</span>
      </div>
      <div class="info-item">
        <span class="label">Планируемая готовность:</span> {{estimatedCompletionDate}}
      </div>
    </div>
    <div class="info-item" style="margin-top: 10px;">
      <span class="label">Описание работ:</span><br>
      {{workDescription}}
    </div>
  </div>

  <!-- Чек-лист приёмки -->
  <div class="section">
    <div class="section-title">ЧЕК-ЛИСТ ПРИЁМКИ</div>
    <ul class="checklist">
      <li><span class="label">Уровень топлива:</span> {{fuelLevel}}%</li>
      <li><span class="label">Пробег:</span> {{mileage}} км</li>
      <li><span class="label">Повреждения:</span> {{#if hasDamages}}Да - {{damagesDescription}}{{else}}Нет{{/if}}</li>
      <li><span class="label">Личные вещи в салоне:</span> {{personalItems}}</li>
      <li><span class="label">Состояние шин:</span> {{tireCondition}}</li>
    </ul>
  </div>

  <!-- Фото ДО -->
  {{#if beforePhotos}}
  <div class="section">
    <div class="section-title">ФОТО ДО РАБОТ</div>
    <div class="photo-grid">
      {{#each beforePhotos}}
      <img src="{{this}}" alt="Фото до">
      {{/each}}
    </div>
  </div>
  {{/if}}

  <!-- Фото ПОСЛЕ -->
  {{#if afterPhotos}}
  <div class="section">
    <div class="section-title">ФОТО ПОСЛЕ РАБОТ</div>
    <div class="photo-grid">
      {{#each afterPhotos}}
      <img src="{{this}}" alt="Фото после">
      {{/each}}
    </div>
  </div>
  {{/if}}

  <!-- Материалы и запчасти -->
  {{#if materials}}
  <div class="section">
    <div class="section-title">ИСПОЛЬЗОВАННЫЕ МАТЕРИАЛЫ И ЗАПЧАСТИ</div>
    <table class="materials-table">
      <thead>
        <tr>
          <th>Наименование</th>
          <th>Количество</th>
          <th>Цена за ед.</th>
          <th>Сумма</th>
        </tr>
      </thead>
      <tbody>
        {{#each materials}}
        <tr>
          <td>{{name}}</td>
          <td>{{quantity}}</td>
          <td>{{price}} ₽</td>
          <td>{{total}} ₽</td>
        </tr>
        {{/each}}
        <tr class="total-row">
          <td colspan="3">Итого материалы:</td>
          <td>{{materialsTotal}} ₽</td>
        </tr>
      </tbody>
    </table>
  </div>
  {{/if}}

  <!-- Стоимость -->
  <div class="section">
    <div class="section-title">СТОИМОСТЬ</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Планируемая стоимость:</span> {{estimatedCost}} ₽
      </div>
      <div class="info-item">
        <span class="label">Итоговая стоимость:</span> <strong>{{finalCost}} ₽</strong>
      </div>
    </div>
  </div>

  <!-- Подпись -->
  <div class="footer">
    {{#if signature}}
    <img src="{{signature}}" alt="Подпись" class="signature">
    {{/if}}
    <p>Мастер: ________________</p>
    <p>Дата формирования отчёта: {{generatedAt}}</p>
  </div>
</body>
</html>
```

#### 7.3 Puppeteer конфигурация
```typescript
// pdf.service.ts
import puppeteer from 'puppeteer';

async generatePDF(visitData: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Рендерим HTML из шаблона
  const html = this.renderTemplate(visitData);

  await page.setContent(html, {
    waitUntil: 'networkidle0',
  });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
  });

  await browser.close();

  return pdfBuffer;
}
```

---

### Фаза 8: Профиль пользователя (1 час)

#### 8.1 Profile Module

**Структура:**
```
src/profile/
├── profile.controller.ts
├── profile.service.ts
├── profile.module.ts
└── dto/
    ├── update-profile.dto.ts
    └── change-password.dto.ts
```

**Endpoints:**
- [ ] `GET /api/profile` - получение профиля
  - Возврат User без password и refreshTokens

- [ ] `PUT /api/profile` - обновление профиля
  - Обновляемые поля: workshopName, phone, address
  - Валидация телефона (российский формат)
  - Возврат обновлённого профиля

- [ ] `PUT /api/profile/password` - смена пароля
  - Body: `{ oldPassword, newPassword }`
  - Валидация старого пароля
  - Хеширование нового пароля
  - Инвалидация всех refresh tokens (опционально)
  - Возврат `{ success: true }`

- [ ] `POST /api/profile/logo` - загрузка логотипа
  - Multipart upload
  - Сжатие до 400x400
  - Удаление старого логотипа
  - Обновление logoUrl
  - Возврат `{ logoUrl }`

- [ ] `POST /api/profile/signature` - загрузка подписи
  - Multipart upload
  - Прозрачный PNG
  - Сжатие до 300x100
  - Удаление старой подписи
  - Обновление signatureUrl
  - Возврат `{ signatureUrl }`

---

### Фаза 9: Финальная настройка и тестирование (2-3 часа)

#### 9.1 Безопасность и оптимизация

**Security:**
- [ ] Установка и настройка Helmet
  ```typescript
  app.use(helmet());
  ```

- [ ] Rate limiting (@nestjs/throttler)
  ```typescript
  // app.module.ts
  ThrottlerModule.forRoot({
    ttl: 60,
    limit: 100, // 100 запросов в минуту
  }),

  // auth.controller.ts
  @Throttle(5, 60) // 5 запросов в минуту для auth endpoints
  ```

- [ ] CORS настройка
  ```typescript
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });
  ```

**Optimization:**
- [ ] Compression middleware
  ```typescript
  import * as compression from 'compression';
  app.use(compression());
  ```

- [ ] Request logging (опционально - Pino)

- [ ] Глобальная обработка ошибок
  ```typescript
  app.useGlobalFilters(new HttpExceptionFilter());
  ```

- [ ] Валидация всех DTO
  ```typescript
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  ```

- [ ] Transform Interceptor для стандартизации ответов
  ```typescript
  app.useGlobalInterceptors(new TransformInterceptor());
  ```

**Database optimization:**
- [ ] Проверка всех индексов в Prisma schema
- [ ] Добавление составных индексов для частых запросов
- [ ] Connection pooling настройка

#### 9.2 Документация API

**Swagger/OpenAPI:**
- [ ] Установка @nestjs/swagger
- [ ] Настройка в main.ts
  ```typescript
  const config = new DocumentBuilder()
    .setTitle('MechanicCompanion API')
    .setDescription('API для системы управления автосервисом')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  ```

- [ ] Декораторы @ApiTags, @ApiOperation, @ApiResponse для всех endpoints
- [ ] Описание всех DTO с @ApiProperty
- [ ] Примеры запросов/ответов

**README.md:**
```markdown
# MechanicCompanion Backend

## Запуск проекта

### Локальная разработка
```bash
# Установка зависимостей
npm install

# Настройка .env
cp .env.example .env

# Запуск PostgreSQL (если без Docker)
# или docker-compose up -d postgres

# Миграции
npx prisma migrate dev

# Запуск в режиме разработки
npm run start:dev
```

### Docker
```bash
# Сборка и запуск всех сервисов
docker-compose up --build

# Только backend
docker-compose up app
```

## API Документация
После запуска доступна по адресу: http://localhost:3000/api/docs

## Переменные окружения
См. `.env.example`

## Структура проекта
...
```

#### 9.3 Тестирование

**Ручное тестирование (Postman/Insomnia):**
- [ ] Auth flow:
  - [ ] Регистрация нового пользователя
  - [ ] Логин
  - [ ] Refresh token
  - [ ] Forgot password
  - [ ] Reset password

- [ ] Cars CRUD:
  - [ ] Создание автомобиля
  - [ ] Получение списка
  - [ ] Поиск по госномеру
  - [ ] Обновление
  - [ ] Загрузка фото
  - [ ] Удаление

- [ ] Visits CRUD:
  - [ ] Создание визита
  - [ ] Получение списка
  - [ ] Добавление материалов
  - [ ] Изменение статуса
  - [ ] Загрузка фото
  - [ ] Удаление

- [ ] PDF и Email:
  - [ ] Генерация PDF отчёта
  - [ ] Отправка отчёта на email

- [ ] Profile:
  - [ ] Обновление профиля
  - [ ] Смена пароля
  - [ ] Загрузка логотипа

**Проверка безопасности:**
- [ ] Попытка доступа к чужим данным (должен быть 403)
- [ ] Запросы без токена (должен быть 401)
- [ ] Невалидные данные (должны быть ошибки валидации)
- [ ] Rate limiting (слишком много запросов)

**Проверка в Docker:**
- [ ] Сборка образа без ошибок
- [ ] Запуск контейнеров
- [ ] Доступность API
- [ ] Соединение с PostgreSQL
- [ ] Сохранение файлов в volume

**Load testing (опционально):**
```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/cars
```

#### 9.4 Финальные штрихи
- [ ] Добавление health check endpoint
  ```typescript
  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
  ```

- [ ] Логирование важных операций (регистрация, изменение пароля, удаление данных)
- [ ] Graceful shutdown
- [ ] Настройка .gitignore (node_modules, .env, uploads/, dist/)
- [ ] Создание .env.example с комментариями

---

## СТРУКТУРА ПРОЕКТА

```
MechanicCompanionBackend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   └── reset-password.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── jwt-refresh.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   ├── cars/
│   │   ├── cars.controller.ts
│   │   ├── cars.service.ts
│   │   ├── cars.module.ts
│   │   └── dto/
│   │       ├── create-car.dto.ts
│   │       ├── update-car.dto.ts
│   │       └── query-cars.dto.ts
│   ├── visits/
│   │   ├── visits.controller.ts
│   │   ├── visits.service.ts
│   │   ├── visits.module.ts
│   │   └── dto/
│   │       ├── create-visit.dto.ts
│   │       ├── update-visit.dto.ts
│   │       ├── update-status.dto.ts
│   │       └── query-visits.dto.ts
│   ├── materials/
│   │   ├── materials.controller.ts
│   │   ├── materials.service.ts
│   │   ├── materials.module.ts
│   │   └── dto/
│   │       ├── create-material.dto.ts
│   │       └── update-material.dto.ts
│   ├── documents/
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   └── documents.module.ts
│   ├── files/
│   │   ├── files.controller.ts
│   │   ├── files.service.ts
│   │   ├── files.module.ts
│   │   └── interceptors/
│   │       └── file-upload.interceptor.ts
│   ├── mail/
│   │   ├── mail.service.ts
│   │   ├── mail.module.ts
│   │   ├── templates/
│   │   │   ├── password-reset.hbs
│   │   │   └── visit-report.hbs
│   │   └── interfaces/
│   │       └── mail-options.interface.ts
│   ├── pdf/
│   │   ├── pdf.service.ts
│   │   ├── pdf.module.ts
│   │   ├── templates/
│   │   │   ├── visit-report.html
│   │   │   └── styles.css
│   │   └── interfaces/
│   │       └── pdf-options.interface.ts
│   ├── profile/
│   │   ├── profile.controller.ts
│   │   ├── profile.service.ts
│   │   ├── profile.module.ts
│   │   └── dto/
│   │       ├── update-profile.dto.ts
│   │       └── change-password.dto.ts
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── decorators/
│   │       └── api-response.decorator.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   └── file-upload.config.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── uploads/              # Volume для файлов (не коммитится)
├── tmp/                  # Временные файлы
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .env                  # Не коммитится
├── .dockerignore
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
├── README.md
└── BACKEND_PLAN.md      # Этот файл
```

---

## ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

Создайте файл `.env` на основе `.env.example`:

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/mechanic_companion

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
# Для Gmail: включить 2FA и создать App Password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=MechanicCompanion <noreply@mechaniccompanion.com>

# Files
UPLOAD_DIR=./uploads
MAX_IMAGE_SIZE=10485760    # 10MB в байтах
MAX_DOCUMENT_SIZE=20971520 # 20MB в байтах

# PDF
PDF_TEMP_DIR=./tmp/pdf

# CORS
CORS_ORIGIN=*  # В продакшене указать конкретные домены

# Rate Limiting
THROTTLE_TTL=60           # время в секундах
THROTTLE_LIMIT=100        # количество запросов
THROTTLE_AUTH_LIMIT=5     # лимит для auth endpoints

# App URL (для email ссылок)
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8081  # React Native Metro bundler
```

---

## DOCKER КОНФИГУРАЦИЯ

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: mechanic_companion_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mechanic_companion
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: mechanic_companion_backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@postgres:5432/mechanic_companion
      PORT: 3000
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
      - ./tmp:/app/tmp
    depends_on:
      postgres:
        condition: service_healthy
    command: sh -c "npx prisma migrate deploy && npm run start:prod"
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Dockerfile
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Установка Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p uploads tmp/pdf && chmod -R 777 uploads tmp

EXPOSE 3000

CMD ["node", "dist/main"]
```

### .dockerignore
```
node_modules
dist
.env
.git
.gitignore
README.md
uploads
tmp
*.log
.DS_Store
```

---

## ОЦЕНКА ВРЕМЕНИ

| Фаза | Описание | Время |
|------|----------|-------|
| 1 | Инфраструктура и настройка | 2-3 часа |
| 2 | Авторизация и безопасность | 3-4 часа |
| 3 | Модуль автомобилей | 2-3 часа |
| 4 | Модуль визитов | 3-4 часа |
| 5 | Файловое хранилище | 1-2 часа |
| 6 | Email сервис | 1-2 часа |
| 7 | Генерация PDF | 2-3 часа |
| 8 | Профиль пользователя | 1 час |
| 9 | Финализация и тестирование | 2-3 часа |
| **ИТОГО** | **17-25 часов** | **2-3 рабочих дня** |

---

## ПРИОРИТЕТЫ ДЛЯ MVP

### Критичные (Must Have):
1. ✅ Авторизация (регистрация, логин, refresh token)
2. ✅ CRUD автомобилей
3. ✅ CRUD визитов
4. ✅ Материалы визитов
5. ✅ Загрузка файлов (фото, документы)
6. ✅ Docker контейнеризация

### Важные (Should Have):
7. ✅ Email (восстановление пароля)
8. ✅ PDF генерация
9. ✅ Профиль пользователя
10. ✅ Rate limiting

### Желательные (Nice to Have):
11. ⭕ Swagger документация
12. ⭕ Логирование (Winston/Pino)
13. ⭕ Unit тесты
14. ⭕ E2E тесты

---

## СЛЕДУЮЩИЕ ШАГИ

После завершения базовой версии бэкенда:

1. **Интеграция с клиентским приложением**
   - Изменить `USE_MOCKS = false` в клиентском приложении
   - Обновить `API_URL` на адрес бэкенда
   - Тестирование интеграции

2. **Дополнительные фичи**
   - Push уведомления (Firebase Cloud Messaging)
   - Статистика и аналитика
   - Экспорт данных (CSV, Excel)
   - Backup и restore

3. **Оптимизация**
   - Кеширование (Redis)
   - CDN для статических файлов
   - Database query optimization
   - Мониторинг (Prometheus, Grafana)

4. **Деплой**
   - Выбор хостинга (AWS, DigitalOcean, Railway, Render)
   - CI/CD настройка (GitHub Actions)
   - SSL сертификат
   - Domain настройка

---

## ПОЛЕЗНЫЕ КОМАНДЫ

```bash
# Разработка
npm run start:dev         # Запуск в dev режиме с hot-reload
npm run build             # Сборка проекта
npm run start:prod        # Запуск production версии

# Prisma
npx prisma studio         # Открыть Prisma Studio (GUI для БД)
npx prisma migrate dev    # Создать и применить миграцию
npx prisma migrate deploy # Применить миграции (production)
npx prisma generate       # Сгенерировать Prisma Client
npx prisma db seed        # Запустить seed

# Docker
docker-compose up         # Запустить все сервисы
docker-compose up -d      # Запустить в фоновом режиме
docker-compose down       # Остановить все сервисы
docker-compose logs -f    # Просмотр логов
docker-compose exec app sh # Войти в контейнер app

# Database
docker-compose exec postgres psql -U postgres -d mechanic_companion # Подключиться к PostgreSQL
```

---

## КОНТРОЛЬНЫЙ СПИСОК (CHECKLIST)

Используйте этот checklist для отслеживания прогресса:

### Фаза 1: Инфраструктура ⬜
- [ ] NestJS проект инициализирован
- [ ] Зависимости установлены
- [ ] Prisma настроен и схема создана
- [ ] Миграции применены
- [ ] Docker и docker-compose работают
- [ ] .env настроен

### Фаза 2: Авторизация ⬜
- [ ] Auth module создан
- [ ] Register endpoint работает
- [ ] Login endpoint работает
- [ ] Refresh token работает
- [ ] JWT guards настроены
- [ ] Forgot/reset password работают

### Фаза 3: Автомобили ⬜
- [ ] Cars CRUD endpoints созданы
- [ ] Валидация работает
- [ ] Поиск и сортировка работают
- [ ] Загрузка фото работает
- [ ] Документы работают

### Фаза 4: Визиты ⬜
- [ ] Visits CRUD endpoints созданы
- [ ] Materials CRUD работает
- [ ] Обновление счётчиков автомобилей работает
- [ ] Загрузка фото работает
- [ ] Документы работают

### Фаза 5: Файлы ⬜
- [ ] Upload endpoint работает
- [ ] Сжатие изображений работает
- [ ] Раздача файлов работает
- [ ] Удаление файлов работает

### Фаза 6: Email ⬜
- [ ] SMTP настроен
- [ ] Password reset email работает
- [ ] Visit report email работает
- [ ] Шаблоны красивые

### Фаза 7: PDF ⬜
- [ ] PDF generation работает
- [ ] Шаблон красивый
- [ ] Фото встраиваются
- [ ] Send report endpoint работает

### Фаза 8: Профиль ⬜
- [ ] Profile endpoints работают
- [ ] Change password работает
- [ ] Logo/signature upload работают

### Фаза 9: Финализация ⬜
- [ ] Security настроена (Helmet, CORS, Rate limiting)
- [ ] Swagger документация
- [ ] README написан
- [ ] Ручное тестирование пройдено
- [ ] Docker тестирование пройдено

---

## КОНТАКТЫ И РЕСУРСЫ

**Документация:**
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Puppeteer Docs](https://pptr.dev/)

**Клиентское приложение:**
- Путь: `/Users/akozlov/projects/MechanicCompanion`
- README: См. DEVELOPMENT_PLAN.md в клиентском проекте

---

*Последнее обновление: 2025-02-02*
