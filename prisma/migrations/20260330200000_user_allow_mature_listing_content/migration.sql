-- Opt-in to see moderator-cleared profanity listings in full (18+). Replaces blur-only column when present.
ALTER TABLE "user" ADD COLUMN "allowMatureListingContent" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user'
          AND column_name = 'blurProfanityApprovedListingImages'
    ) THEN
        UPDATE "user"
        SET "allowMatureListingContent" = NOT COALESCE("blurProfanityApprovedListingImages", true);
        ALTER TABLE "user" DROP COLUMN "blurProfanityApprovedListingImages";
    END IF;
END $$;
