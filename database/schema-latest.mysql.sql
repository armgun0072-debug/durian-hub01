-- Generated from prisma/schema.prisma. MySQL 8.0.16+.
-- For a NEW EMPTY database only. No seed data or database selection included.
-- Includes hardening.sql; do not apply that constraint a second time.

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `email_verified_at` DATETIME(3) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `location_id` INTEGER NULL,
    `active_role` ENUM('SELLER', 'BUYER', 'CUTTER', 'ADMIN') NOT NULL DEFAULT 'SELLER',
    `is_kyc_verified` BOOLEAN NOT NULL DEFAULT false,
    `trust_score` INTEGER NOT NULL DEFAULT 100,
    `rating_avg` DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
    `rating_count` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    `suspended_until` DATETIME(3) NULL,
    `suspension_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `purpose` ENUM('VERIFY_EMAIL', 'RESET_PASSWORD') NOT NULL,
    `code_hash` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_codes_user_id_purpose_created_at_idx`(`user_id`, `purpose`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `role_type` ENUM('SELLER', 'BUYER', 'CUTTER', 'ADMIN') NOT NULL,
    `is_primary_role` BOOLEAN NOT NULL DEFAULT false,
    `business_name` VARCHAR(191) NULL,
    `license_number` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'PENDING_APPROVAL', 'REJECTED') NOT NULL DEFAULT 'ACTIVE',
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_roles_user_id_role_type_key`(`user_id`, `role_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_verification_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `requested_role` ENUM('SELLER', 'BUYER', 'CUTTER', 'ADMIN') NOT NULL,
    `business_name` VARCHAR(191) NOT NULL,
    `license_number` VARCHAR(191) NULL,
    `document_type` ENUM('GAP_CERTIFICATE', 'FARMER_BOOK', 'COMMERCIAL_LICENSE', 'CUTTER_CERT_OR_PORT', 'NATIONAL_ID_WITH_PIC') NOT NULL,
    `document_url` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewed_by_admin_id` INTEGER NULL,
    `admin_remark` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_at` DATETIME(3) NULL,

    INDEX `role_verification_requests_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regional_seasons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `region_code` VARCHAR(191) NOT NULL,
    `region_name` VARCHAR(191) NOT NULL,
    `provinces_summary` TEXT NOT NULL,
    `popular_varieties` VARCHAR(191) NOT NULL,
    `harvest_period` VARCHAR(191) NOT NULL,
    `highlight_note` TEXT NULL,

    UNIQUE INDEX `regional_seasons_region_code_key`(`region_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `province` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `regional_season_id` INTEGER NULL,

    INDEX `locations_province_idx`(`province`),
    UNIQUE INDEX `locations_province_district_key`(`province`, `district`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `durian_varieties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_th` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `icon_emoji` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `durian_varieties_name_th_key`(`name_th`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `durian_grades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `grade_code` VARCHAR(191) NOT NULL,
    `name_th` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `durian_grades_grade_code_key`(`grade_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `post_type` ENUM('SELL', 'BUY', 'CUT_SERVICE') NOT NULL,
    `variety_id` INTEGER NULL,
    `grade_id` INTEGER NULL,
    `location_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `price_per_kg` DECIMAL(10, 2) NULL,
    `price_unit` ENUM('PER_KG', 'PER_TON', 'LUMP_SUM') NOT NULL DEFAULT 'PER_KG',
    `quantity_kg` DECIMAL(12, 2) NULL,
    `dry_matter_pct` DECIMAL(4, 1) NULL,
    `available_date` DATE NOT NULL,
    `is_price_outlier` BOOLEAN NOT NULL DEFAULT false,
    `report_count` INTEGER NOT NULL DEFAULT 0,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('OPEN', 'CLOSED', 'HIDDEN_BY_ADMIN') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `marketplace_posts_post_type_variety_id_grade_id_created_at_idx`(`post_type`, `variety_id`, `grade_id`, `created_at`),
    INDEX `marketplace_posts_location_id_status_idx`(`location_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `initiator_id` INTEGER NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'DEAL_CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `last_message_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closed_at` DATETIME(3) NULL,

    INDEX `chat_rooms_initiator_id_last_message_at_idx`(`initiator_id`, `last_message_at`),
    INDEX `chat_rooms_owner_id_last_message_at_idx`(`owner_id`, `last_message_at`),
    UNIQUE INDEX `chat_rooms_post_id_initiator_id_key`(`post_id`, `initiator_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `requester_id` INTEGER NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `resolution` TEXT NULL,
    `handled_by_id` INTEGER NULL,
    `queued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `support_tickets_status_updated_at_idx`(`status`, `updated_at`),
    INDEX `support_tickets_status_queued_at_id_idx`(`status`, `queued_at`, `id`),
    UNIQUE INDEX `support_tickets_room_id_requester_id_key`(`room_id`, `requester_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticket_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `support_messages_ticket_id_created_at_idx`(`ticket_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `message_type` ENUM('TEXT', 'PRODUCT_CARD', 'QUICK_REPLY', 'IMAGE') NOT NULL DEFAULT 'TEXT',
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_room_id_created_at_idx`(`room_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_market_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stat_date` DATE NOT NULL,
    `variety_id` INTEGER NOT NULL,
    `grade_id` INTEGER NOT NULL,
    `location_id` INTEGER NOT NULL,
    `avg_buy_price` DECIMAL(10, 2) NULL,
    `avg_sell_price` DECIMAL(10, 2) NULL,
    `min_price` DECIMAL(10, 2) NULL,
    `max_price` DECIMAL(10, 2) NULL,
    `avg_cut_wage_per_kg` DECIMAL(10, 2) NULL,
    `official_ref_price` DECIMAL(10, 2) NULL,
    `total_buy_volume_kg` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `total_sell_volume_kg` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `sample_post_count` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `daily_market_stats_stat_date_variety_id_idx`(`stat_date`, `variety_id`),
    UNIQUE INDEX `daily_market_stats_stat_date_variety_id_grade_id_location_id_key`(`stat_date`, `variety_id`, `grade_id`, `location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `reporter_id` INTEGER NOT NULL,
    `reason` ENUM('FAKE_PRICE', 'SPAM', 'SCAM', 'WRONG_INFO') NOT NULL,
    `detail` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `initiator_id` INTEGER NOT NULL,
    `receiver_id` INTEGER NOT NULL,
    `agreed_price` DECIMAL(10, 2) NOT NULL,
    `agreed_price_per_kg` DECIMAL(10, 2) NULL,
    `agreed_quantity_kg` DECIMAL(12, 2) NULL,
    `cut_date` DATE NULL,
    `note` TEXT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'COMPLETED', 'DISPUTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deal_id` INTEGER NOT NULL,
    `reviewer_id` INTEGER NOT NULL,
    `reviewee_id` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_reviews_deal_id_reviewer_id_key`(`deal_id`, `reviewer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `otp_codes` ADD CONSTRAINT `otp_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_verification_requests` ADD CONSTRAINT `role_verification_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_verification_requests` ADD CONSTRAINT `role_verification_requests_reviewed_by_admin_id_fkey` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_regional_season_id_fkey` FOREIGN KEY (`regional_season_id`) REFERENCES `regional_seasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_posts` ADD CONSTRAINT `marketplace_posts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_posts` ADD CONSTRAINT `marketplace_posts_variety_id_fkey` FOREIGN KEY (`variety_id`) REFERENCES `durian_varieties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_posts` ADD CONSTRAINT `marketplace_posts_grade_id_fkey` FOREIGN KEY (`grade_id`) REFERENCES `durian_grades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_posts` ADD CONSTRAINT `marketplace_posts_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_images` ADD CONSTRAINT `post_images_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `marketplace_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_rooms` ADD CONSTRAINT `chat_rooms_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `marketplace_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_rooms` ADD CONSTRAINT `chat_rooms_initiator_id_fkey` FOREIGN KEY (`initiator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_rooms` ADD CONSTRAINT `chat_rooms_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_messages` ADD CONSTRAINT `support_messages_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_messages` ADD CONSTRAINT `support_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_market_stats` ADD CONSTRAINT `daily_market_stats_variety_id_fkey` FOREIGN KEY (`variety_id`) REFERENCES `durian_varieties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_market_stats` ADD CONSTRAINT `daily_market_stats_grade_id_fkey` FOREIGN KEY (`grade_id`) REFERENCES `durian_grades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_market_stats` ADD CONSTRAINT `daily_market_stats_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_reports` ADD CONSTRAINT `post_reports_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `marketplace_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_reports` ADD CONSTRAINT `post_reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deals` ADD CONSTRAINT `deals_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `marketplace_posts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deals` ADD CONSTRAINT `deals_initiator_id_fkey` FOREIGN KEY (`initiator_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deals` ADD CONSTRAINT `deals_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reviews` ADD CONSTRAINT `user_reviews_deal_id_fkey` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reviews` ADD CONSTRAINT `user_reviews_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reviews` ADD CONSTRAINT `user_reviews_reviewee_id_fkey` FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- MySQL 8.0.16+. Check existing data before applying the constraint.
-- Prisma db push does not manage CHECK constraints. Reapply after a schema reset.
ALTER TABLE user_reviews
  ADD CONSTRAINT user_reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
