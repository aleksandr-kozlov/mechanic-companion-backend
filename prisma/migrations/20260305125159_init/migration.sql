-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('DETAILING', 'MAINTENANCE', 'REPAIR', 'DIAGNOSTICS', 'TIRE_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "baypad_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "workshop_name" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "logo_url" TEXT,
    "signature_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baypad_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baypad_refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baypad_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baypad_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baypad_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baypad_cars" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "vin" TEXT,
    "owner_name" TEXT,
    "owner_phone" TEXT,
    "owner_email" TEXT,
    "notes" TEXT,
    "last_visit_date" TIMESTAMP(3),
    "visits_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baypad_cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baypad_visits" (
    "id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "work_type" "WorkType" NOT NULL,
    "work_description" TEXT NOT NULL,
    "estimated_cost" DECIMAL(10,2),
    "final_cost" DECIMAL(10,2),
    "estimated_completion_date" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "fuel_level" INTEGER,
    "mileage" INTEGER,
    "has_damages" BOOLEAN NOT NULL DEFAULT false,
    "damages_description" TEXT,
    "personal_items" TEXT,
    "tire_condition" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baypad_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baypad_visit_materials" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baypad_visit_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baypad_visit_documents" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baypad_visit_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "baypad_users_email_key" ON "baypad_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "baypad_refresh_tokens_token_key" ON "baypad_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "baypad_refresh_tokens_user_id_idx" ON "baypad_refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "baypad_password_reset_tokens_token_key" ON "baypad_password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "baypad_password_reset_tokens_user_id_idx" ON "baypad_password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "baypad_password_reset_tokens_token_idx" ON "baypad_password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "baypad_cars_user_id_idx" ON "baypad_cars"("user_id");

-- CreateIndex
CREATE INDEX "baypad_cars_license_plate_idx" ON "baypad_cars"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "baypad_cars_user_id_license_plate_key" ON "baypad_cars"("user_id", "license_plate");

-- CreateIndex
CREATE INDEX "baypad_visits_car_id_idx" ON "baypad_visits"("car_id");

-- CreateIndex
CREATE INDEX "baypad_visits_status_idx" ON "baypad_visits"("status");

-- CreateIndex
CREATE INDEX "baypad_visit_materials_visit_id_idx" ON "baypad_visit_materials"("visit_id");

-- CreateIndex
CREATE INDEX "baypad_visit_documents_visit_id_idx" ON "baypad_visit_documents"("visit_id");

-- AddForeignKey
ALTER TABLE "baypad_refresh_tokens" ADD CONSTRAINT "baypad_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "baypad_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baypad_password_reset_tokens" ADD CONSTRAINT "baypad_password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "baypad_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baypad_cars" ADD CONSTRAINT "baypad_cars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "baypad_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baypad_visits" ADD CONSTRAINT "baypad_visits_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "baypad_cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baypad_visit_materials" ADD CONSTRAINT "baypad_visit_materials_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "baypad_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baypad_visit_documents" ADD CONSTRAINT "baypad_visit_documents_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "baypad_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
