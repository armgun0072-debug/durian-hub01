-- MySQL 8.0.16+. Check existing data before applying the constraint.
-- Prisma db push does not manage CHECK constraints. Reapply after a schema reset.
ALTER TABLE user_reviews
  ADD CONSTRAINT user_reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
