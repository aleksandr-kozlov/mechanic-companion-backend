# MechanicCompanion Backend

<div align="center">

**REST API для системы управления автосервисом**

Backend для мобильного приложения MechanicCompanion - полнофункциональная система управления автосервисом для автомехаников, детейлеров и владельцев автосервисов.

[![NestJS](https://img.shields.io/badge/NestJS-11.1.13-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.2-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)

</div>

---

## 📊 Статус проекта

**Все основные фазы завершены! Проект готов к продакшену.**

- ✅ **Фаза 1:** Инфраструктура и базовая настройка
- ✅ **Фаза 2:** Авторизация и безопасность (JWT + Refresh Tokens)
- ✅ **Фаза 3:** Модуль автомобилей (Cars)
- ✅ **Фаза 4:** Модуль визитов (Visits)
- ✅ **Фаза 5:** Управление файлами
- ✅ **Фаза 6:** Email сервис (Nodemailer)
- ✅ **Фаза 7:** Генерация PDF отчётов (Puppeteer)
- ✅ **Фаза 8:** Модуль профиля пользователя
- ✅ **Фаза 9:** Security + Swagger документация

**Текущий статус:** Готов к тестированию и деплою

---

## 🚀 Быстрый старт

### Требования

- **Node.js** 20+ (LTS рекомендуется)
- **PostgreSQL** 16+
- **Docker** (опционально, но рекомендуется)
- **npm** или **yarn**

### Установка и запуск

#### Вариант 1: С Docker Compose (рекомендуется)

```bash
# 1. Клонируйте репозиторий
git clone <repository-url>
cd MechanicCompanionBackend

# 2. Установите зависимости
npm install

# 3. Настройте переменные окружения
cp .env.example .env
# Отредактируйте .env (см. секцию "Переменные окружения")

# 4. Запустите PostgreSQL через Docker
docker-compose up -d postgres

# 5. Примените миграции базы данных
npx prisma migrate dev --name init

# 6. (Опционально) Откройте Prisma Studio для просмотра БД
npx prisma studio

# 7. Запустите приложение в режиме разработки
npm run start:dev
```

Приложение будет доступно:
- **API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/health

#### Вариант 2: Локальный PostgreSQL

```bash
# 1-2. Те же шаги (клонирование + установка)

# 3. Убедитесь, что PostgreSQL запущен локально
# Создайте базу данных вручную или через команду:
createdb mechanic_companion

# 4. Настройте DATABASE_URL в .env
DATABASE_URL="postgresql://user:password@localhost:5432/mechanic_companion"

# 5-7. Продолжайте как в варианте 1
```

---

## 📚 API Документация

### Swagger UI

После запуска приложения, полная интерактивная документация API доступна по адресу:

**http://localhost:3000/api/docs**

Swagger включает:
- 📝 Описание всех 40 endpoints
- 🔐 Встроенная авторизация через JWT
- ✅ Схемы запросов и ответов с примерами
- 🧪 Возможность тестирования API прямо из браузера

### Основные группы endpoints

| Группа | Endpoints | Описание |
|--------|-----------|----------|
| **Auth** | 6 | Регистрация, вход, refresh token, восстановление пароля |
| **Profile** | 5 | Управление профилем, смена пароля, загрузка лого и подписи |
| **Cars** | 11 | CRUD автомобилей, фото, документы, поиск |
| **Visits** | 14 | CRUD визитов, статусы, фото, документы, PDF экспорт |
| **Materials** | 4 | Управление материалами и запчастями для визитов |

**Всего: 40 API endpoints**

---

## 🗂️ Структура проекта

```
MechanicCompanionBackend/
├── src/
│   ├── auth/                   # Аутентификация и авторизация
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── guards/             # JWT Guards
│   │   ├── strategies/         # Passport стратегии
│   │   ├── decorators/         # @CurrentUser декоратор
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── profile/                # Управление профилем
│   │   ├── dto/
│   │   ├── profile.controller.ts
│   │   ├── profile.service.ts
│   │   └── profile.module.ts
│   ├── cars/                   # Управление автомобилями
│   │   ├── dto/
│   │   ├── cars.controller.ts
│   │   ├── cars.service.ts
│   │   └── cars.module.ts
│   ├── visits/                 # Управление визитами
│   │   ├── dto/
│   │   ├── visits.controller.ts
│   │   ├── visits.service.ts
│   │   └── visits.module.ts
│   ├── materials/              # Материалы и запчасти
│   │   ├── dto/
│   │   ├── materials.controller.ts
│   │   ├── materials.service.ts
│   │   └── materials.module.ts
│   ├── mail/                   # Email сервис
│   │   ├── templates/          # Handlebars шаблоны
│   │   ├── mail.service.ts
│   │   └── mail.module.ts
│   ├── pdf/                    # PDF генерация
│   │   ├── templates/          # HTML шаблоны для PDF
│   │   ├── pdf.service.ts
│   │   └── pdf.module.ts
│   ├── prisma/                 # Prisma ORM
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/                 # Общие компоненты
│   │   ├── filters/            # Exception фильтры
│   │   └── interceptors/       # Response interceptors
│   ├── config/                 # Конфигурация
│   │   └── configuration.ts
│   ├── main.ts                 # Entry point (Security + Swagger)
│   └── app.module.ts           # Главный модуль
├── prisma/
│   └── schema.prisma           # Схема БД (11 моделей)
├── uploads/                    # Загруженные файлы (создаётся автоматически)
├── .env.example                # Пример переменных окружения
├── docker-compose.yml          # Docker конфигурация
├── Dockerfile                  # Multi-stage build
├── package.json
├── tsconfig.json
├── BACKEND_PLAN.md             # Детальный план разработки
├── CLAUDE.md                   # Инструкции для Claude Code
└── README.md                   # Этот файл
```

---

## 🔐 Безопасность

Проект включает полный набор security мер:

- ✅ **Helmet** - защита HTTP заголовков
- ✅ **CORS** - настраиваемая политика CORS
- ✅ **Rate Limiting** - защита от DDoS (100 req/min, auth: 5 req/min)
- ✅ **JWT Authentication** - Access (1h) + Refresh (7d) токены
- ✅ **Password Hashing** - bcrypt с 10 rounds
- ✅ **Input Validation** - class-validator для всех DTO
- ✅ **SQL Injection Protection** - Prisma ORM
- ✅ **File Upload Validation** - размер, тип, обработка

---

## 🗄️ База данных

### Схема Prisma

**11 моделей** организованных в 3 группы:

#### 1. Пользователи
- `User` - основная информация о пользователе
- `RefreshToken` - JWT refresh токены
- `PasswordResetToken` - токены восстановления пароля

#### 2. Автомобили
- `Car` - информация об автомобилях
- `CarPhoto` - фотографии автомобилей (до 3 шт)
- `CarDocument` - документы (PDF, DOC, DOCX)

#### 3. Визиты
- `Visit` - визиты в автосервис
- `VisitPhoto` - фото ДО/ПОСЛЕ (PhotoType enum)
- `VisitMaterial` - использованные материалы
- `VisitDocument` - документы визита

**Ключевые особенности:**
- Cascade удаление (User → Cars → Visits)
- Автоматическое обновление счётчиков (`visitsCount`, `lastVisitDate`)
- Составные уникальные индексы
- Decimal поля для точного расчёта денег

### Команды Prisma

```bash
# Применить миграции
npx prisma migrate dev

# Применить в продакшене
npx prisma migrate deploy

# Сгенерировать Prisma Client
npx prisma generate

# Открыть Prisma Studio (GUI для БД)
npx prisma studio

# Сбросить БД (⚠️ удалит все данные)
npx prisma migrate reset
```

---

## 📧 Email и PDF

### Email сервис

- **Библиотека:** Nodemailer + @nestjs-modules/mailer
- **Шаблоны:** Handlebars (`.hbs`)
- **Типы писем:**
  - Password Reset - восстановление пароля
  - Visit Report - отчёт о визите с PDF

### PDF генерация

- **Библиотека:** Puppeteer
- **Формат:** A4, 20mm margins
- **Шаблоны:** HTML + CSS (Handlebars)
- **Включает:**
  - Логотип и информация о мастерской
  - Детали автомобиля и визита
  - Фото ДО/ПОСЛЕ
  - Таблица материалов с итогами
  - Подпись мастера

**Endpoints:**
- `GET /api/visits/:id/export-pdf` - скачать PDF
- `POST /api/visits/:id/send-report` - отправить на email

---

## 🛠️ Команды разработки

```bash
# Разработка
npm run start:dev          # Запуск с hot-reload
npm run start:debug        # Запуск с debugger

# Сборка и продакшн
npm run build              # Сборка проекта
npm run start:prod         # Запуск production build

# Линтинг и форматирование
npm run lint               # ESLint проверка
npm run format             # Prettier форматирование

# База данных
npx prisma studio          # GUI для БД
npx prisma migrate dev     # Создать миграцию
npx prisma generate        # Генерация Prisma Client

# Docker
docker-compose up -d postgres     # Только PostgreSQL
docker-compose up --build         # Полная пересборка
docker-compose down               # Остановить все
docker-compose logs -f app        # Логи приложения
```

---

## 🌍 Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```env
# Сервер
NODE_ENV=development
PORT=3000
API_PREFIX=api

# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/mechanic_companion"

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM="MechanicCompanion <noreply@example.com>"

# Frontend URL (для ссылок в email)
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGIN=*

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Puppeteer (для Docker)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

⚠️ **Важно:** Никогда не коммитьте `.env` в Git!

---

## 🐳 Docker

### Запуск с Docker Compose

```bash
# Запустить только PostgreSQL
docker-compose up -d postgres

# Запустить весь стек (PostgreSQL + App)
docker-compose up --build

# Остановить все контейнеры
docker-compose down

# Посмотреть логи
docker-compose logs -f app
```

### Multi-stage Dockerfile

Проект использует оптимизированный multi-stage build:
- **Stage 1 (builder):** Установка зависимостей, генерация Prisma Client, сборка TypeScript
- **Stage 2 (production):** Минимальный образ с Chromium для Puppeteer

---

## 📝 API Примеры

### Регистрация

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "mechanic@example.com",
  "password": "SecurePass123",
  "workshopName": "Автосервис Быстрый Ремонт"
}
```

### Создание автомобиля

```bash
POST /api/cars
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "licensePlate": "А123БВ777",
  "brand": "Toyota",
  "model": "Camry",
  "year": 2020,
  "ownerName": "Иванов Иван Иванович",
  "ownerPhone": "+79991234567"
}
```

### Экспорт PDF отчёта

```bash
GET /api/visits/:id/export-pdf
Authorization: Bearer <access_token>
```

Больше примеров в **Swagger UI**: http://localhost:3000/api/docs

---

## 🧪 Тестирование

### Ручное тестирование

1. **Запустите приложение:**
   ```bash
   npm run start:dev
   ```

2. **Откройте Swagger UI:**
   ```
   http://localhost:3000/api/docs
   ```

3. **Протестируйте flow:**
   - Регистрация → Login → Получить токен
   - Создать автомобиль → Создать визит
   - Добавить материалы → Экспортировать PDF

### Postman Collection

Импортируйте Swagger JSON в Postman:
```
http://localhost:3000/api/docs-json
```

---

## 📦 Зависимости

### Основные

- **@nestjs/core** - NestJS framework
- **@prisma/client** - Prisma ORM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT tokens
- **@nestjs/jwt** & **@nestjs/passport** - Authentication
- **@nestjs-modules/mailer** - Email sending
- **puppeteer** - PDF generation
- **sharp** - Image processing
- **helmet** - Security headers
- **compression** - Response compression
- **@nestjs/swagger** - API documentation

### Dev зависимости

- **typescript** - TypeScript compiler
- **@nestjs/cli** - NestJS CLI
- **prisma** - Prisma CLI
- **eslint** & **prettier** - Code quality

Полный список в `package.json`

---

## 🚢 Деплой

### Подготовка к продакшену

1. **Обновите переменные окружения:**
   ```env
   NODE_ENV=production
   DATABASE_URL=<production-db-url>
   JWT_SECRET=<strong-random-secret>
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Примените миграции:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Соберите проект:**
   ```bash
   npm run build
   ```

4. **Запустите:**
   ```bash
   npm run start:prod
   ```

### Docker деплой

```bash
# Сборка образа
docker build -t mechanic-companion-backend .

# Запуск контейнера
docker run -p 3000:3000 --env-file .env mechanic-companion-backend
```

### Рекомендации

- Используйте **PM2** или **systemd** для process management
- Настройте **Nginx** как reverse proxy
- Включите **SSL/TLS** (Let's Encrypt)
- Настройте **логирование** (Winston, Pino)
- Используйте **мониторинг** (Sentry, DataDog)

---

## 🤝 Интеграция с фронтендом

**React Native приложение:** `/Users/akozlov/projects/MechanicCompanion`

### Настройка фронтенда

В React Native проекте обновите `src/config.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:3000/api';
export const USE_MOCKS = false; // Переключить на false для работы с API
```

### Формат ответов API

Все ответы следуют стандартному формату:

```typescript
{
  "data": T,              // Данные (объект или массив)
  "message"?: string,     // Опциональное сообщение
  "success": boolean      // Статус операции
}
```

---

## 📄 Лицензия

Этот проект разработан для приложения MechanicCompanion.

---

## 📞 Поддержка

- **Документация проекта:** `BACKEND_PLAN.md`
- **Инструкции для Claude Code:** `CLAUDE.md`
- **Swagger API:** http://localhost:3000/api/docs
- **Prisma Studio:** `npx prisma studio`

---

<div align="center">

**Сделано с ❤️ используя NestJS, Prisma и TypeScript**

**Версия:** 1.0.0 | **Статус:** Production Ready ✅

</div>
