-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PAID', 'PENDING', 'REFUNDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('GAME', 'APPLICATION', 'AI_AGENT');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OperationLevel" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'DANGER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'TODO', 'MESSAGE');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_no" VARCHAR(64) NOT NULL,
    "customer" VARCHAR(100) NOT NULL,
    "channel" VARCHAR(64) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "items" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "visits" INTEGER NOT NULL,
    "unique_users" INTEGER NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL,
    "new_users" INTEGER NOT NULL,
    "active_users" INTEGER NOT NULL,
    "orders" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_source_metrics" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "value" INTEGER NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traffic_source_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region_metrics" (
    "id" UUID NOT NULL,
    "region" VARCHAR(80) NOT NULL,
    "value" INTEGER NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "group" VARCHAR(64) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "value" JSONB NOT NULL,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "level" "OperationLevel" NOT NULL DEFAULT 'INFO',
    "module" VARCHAR(64) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100),
    "resource_id" VARCHAR(100),
    "summary" VARCHAR(255) NOT NULL,
    "method" VARCHAR(16),
    "path" VARCHAR(500),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(500),
    "status_code" INTEGER,
    "duration_ms" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "type" "ProjectType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "owner_id" UUID,
    "members" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "budget" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "started_at" DATE,
    "due_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "type" "NotificationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("notification_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_customer_idx" ON "orders"("customer");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_date_key" ON "daily_metrics"("date");

-- CreateIndex
CREATE INDEX "daily_metrics_date_idx" ON "daily_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_source_metrics_name_key" ON "traffic_source_metrics"("name");

-- CreateIndex
CREATE INDEX "traffic_source_metrics_sort_idx" ON "traffic_source_metrics"("sort");

-- CreateIndex
CREATE UNIQUE INDEX "region_metrics_region_key" ON "region_metrics"("region");

-- CreateIndex
CREATE INDEX "region_metrics_sort_idx" ON "region_metrics"("sort");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_group_idx" ON "system_settings"("group");

-- CreateIndex
CREATE INDEX "operation_logs_created_at_idx" ON "operation_logs"("created_at");

-- CreateIndex
CREATE INDEX "operation_logs_user_id_created_at_idx" ON "operation_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "operation_logs_module_action_idx" ON "operation_logs"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_status_updated_at_idx" ON "projects"("status", "updated_at");

-- CreateIndex
CREATE INDEX "projects_type_idx" ON "projects"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notification_reads_user_id_read_at_idx" ON "notification_reads"("user_id", "read_at");

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
