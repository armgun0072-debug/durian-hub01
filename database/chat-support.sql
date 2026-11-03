-- Apply once to an existing Durian Hub database, after taking a backup.
-- Fresh installations can use the updated Prisma schema directly.
ALTER TABLE `chat_rooms` ADD COLUMN `closed_at` DATETIME(3) NULL;

-- A post is claimed atomically by the accepted deal API. Use that deal's
-- immutable creation time for both the winning room and other closed rooms.
UPDATE `chat_rooms` r
JOIN (
  SELECT post_id, MIN(created_at) AS closed_at
  FROM deals WHERE status IN ('ACCEPTED', 'COMPLETED', 'DISPUTED')
  GROUP BY post_id
) d ON d.post_id = r.post_id
SET r.closed_at = d.closed_at
WHERE r.status IN ('DEAL_CLOSED', 'ARCHIVED') AND r.closed_at IS NULL;

CREATE TABLE `support_tickets` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `room_id` INTEGER NOT NULL,
  `requester_id` INTEGER NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
  `resolution` TEXT NULL,
  `handled_by_id` INTEGER NULL,
  `resolved_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `support_tickets_room_id_requester_id_key` (`room_id`, `requester_id`),
  INDEX `support_tickets_status_updated_at_idx` (`status`, `updated_at`),
  CONSTRAINT `support_tickets_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `support_tickets_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `support_messages` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `ticket_id` INTEGER NOT NULL,
  `sender_id` INTEGER NOT NULL,
  `is_admin` BOOLEAN NOT NULL DEFAULT false,
  `content` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `support_messages_ticket_id_created_at_idx` (`ticket_id`, `created_at`),
  CONSTRAINT `support_messages_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `support_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Inspect these exceptions; no reliable close timestamp exists for these rooms.
SELECT id, post_id, status FROM chat_rooms
WHERE status IN ('DEAL_CLOSED', 'ARCHIVED') AND closed_at IS NULL;
