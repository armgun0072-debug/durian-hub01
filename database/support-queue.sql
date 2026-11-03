-- Apply once AFTER chat-support.sql (or an equivalent schema sync).
ALTER TABLE support_tickets ADD COLUMN queued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
UPDATE support_tickets SET queued_at = created_at;
CREATE INDEX support_tickets_status_queued_at_id_idx ON support_tickets(status, queued_at, id);
