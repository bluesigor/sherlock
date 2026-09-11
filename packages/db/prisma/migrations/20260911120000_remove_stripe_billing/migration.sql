-- DropColumn
ALTER TABLE "Org" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionStatus",
DROP COLUMN "stripeLastUpdatedAt";

-- DropEnum
DROP TYPE "StripeSubscriptionStatus";
