-- NextAuth v4 uses the maintained Prisma adapter. Preserve users and OAuth
-- account data while replacing fields that belonged only to the v3 adapter.
DELETE FROM "accounts"
WHERE NOT EXISTS (
    SELECT 1 FROM "users" WHERE "users"."id" = "accounts"."user_id"
);

DELETE FROM "sessions"
WHERE NOT EXISTS (
    SELECT 1 FROM "users" WHERE "users"."id" = "sessions"."user_id"
);

ALTER TABLE "accounts"
    DROP COLUMN "compound_id",
    DROP COLUMN "access_token_expires",
    ADD COLUMN "expires_at" INTEGER,
    ADD COLUMN "token_type" TEXT,
    ADD COLUMN "scope" TEXT,
    ADD COLUMN "id_token" TEXT,
    ADD COLUMN "session_state" TEXT;

DROP INDEX IF EXISTS "accounts_compound_id_key";
CREATE UNIQUE INDEX "accounts_provider_id_provider_account_id_key"
    ON "accounts"("provider_id", "provider_account_id");

ALTER TABLE "accounts"
    ADD CONSTRAINT "accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions" DROP COLUMN "access_token";
DROP INDEX IF EXISTS "sessions_access_token_key";

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verification_requests" RENAME TO "verification_tokens";
