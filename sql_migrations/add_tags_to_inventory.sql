-- Migration: Add tags column to Inventory table for auto-tagging wine flavors
-- Execute this SQL in your Supabase SQL Editor

-- Add tags column as JSONB array (recommended for PostgreSQL)
ALTER TABLE "Inventory" ADD COLUMN "tags" JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance on tags
CREATE INDEX idx_inventory_tags ON "Inventory" USING GIN ("tags");

-- Add comment for documentation
COMMENT ON COLUMN "Inventory"."tags" IS 'Auto-generated flavor tags based on flavor_notes and description (e.g., ["berry", "earthy", "citrus"])';

-- Alternative: If you prefer text array instead of JSONB, use this instead:
-- ALTER TABLE "Inventory" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
-- CREATE INDEX idx_inventory_tags_text ON "Inventory" USING GIN ("tags");

-- Example update to populate existing wines with auto-generated tags
-- (This will be done by the auto-tagging utility in the app)
-- UPDATE "Inventory" SET "tags" = '["example", "flavor"]'::jsonb WHERE "id" = 'some-wine-id';

-- Verification query - check if column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Inventory' AND column_name = 'tags';

-- Test query - show wines with their current tags (should be empty initially)
SELECT "id", "name", "flavor_notes", "tags" 
FROM "Inventory" 
LIMIT 5;
