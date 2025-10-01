# Wine Auto-Tagging System

This guide explains how to set up and use the automated wine tagging system that extracts flavor tags from wine descriptions.

## Overview

The auto-tagging system automatically generates flavor tags for wines based on their `flavor_notes` and `description` fields. It uses keyword matching to identify flavors and characteristics.

## Supported Tags

The system can automatically detect these flavor categories:

- **Berry**: strawberry, raspberry, blackberry, cherry, etc.
- **Earthy**: earth, soil, mineral, terroir, mushroom, etc.
- **Citrus**: lemon, lime, orange, grapefruit, etc.
- **Floral**: rose, violet, lavender, jasmine, etc.
- **Chocolate**: chocolate, cocoa, mocha, etc.
- **Vanilla**: vanilla, caramel, butterscotch, honey, etc.
- **Spicy**: pepper, cinnamon, clove, nutmeg, etc.
- **Buttery**: butter, creamy, rich, velvety, etc.
- **Nutty**: almond, hazelnut, walnut, marzipan, etc.
- **Herbal**: basil, thyme, mint, eucalyptus, tobacco, etc.

## Setup Instructions

### 1. Database Migration

First, add the `tags` column to your Inventory table by running this SQL in your Supabase SQL Editor:

```sql
-- Add tags column as JSONB array
ALTER TABLE "Inventory" ADD COLUMN "tags" JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX idx_inventory_tags ON "Inventory" USING GIN ("tags");
```

Or use the provided migration file: `sql_migrations/add_tags_to_inventory.sql`

### 2. Environment Setup

No additional environment variables are needed - the tagging system works entirely client-side.

## Usage

### Automatic Tagging

**New Wines**: When adding new wines through the admin interface, tags are automatically generated based on the flavor notes you enter.

**Existing Wines**: Use the batch auto-tagging feature in the admin settings:

1. Go to Admin Dashboard → Settings (gear icon)
2. Scroll to "Data Utilities" section
3. Click "Generate Auto-Tags" button
4. Wait for processing to complete

### Manual Review

After auto-tagging, you can:

1. Review generated tags in the inventory list
2. Manually edit tags if needed (future feature)
3. View tag statistics and coverage

## How It Works

### Keyword Matching

The system uses comprehensive keyword dictionaries to match text patterns:

```typescript
// Example: "Rich dark chocolate with berry notes" would generate:
// ["chocolate", "berry"]

// Example: "Crisp citrus with floral undertones" would generate:
// ["citrus", "floral"]
```

### Wine Type Inference

The system also considers wine types for additional context:

- **Red wines**: Automatically include "berry" and "earthy"
- **White wines**: Automatically include "citrus" and "floral"
- **Rosé wines**: Automatically include "berry" and "floral"
- **Sparkling wines**: Automatically include "citrus" and "light"
- **Dessert wines**: Automatically include "sweet" and "vanilla"

### Data Processing

1. **Input**: Combines `flavor_notes`, `description`, wine name, and type
2. **Extraction**: Matches keywords using word boundaries (no partial matches)
3. **Sanitization**: Converts to lowercase, removes duplicates, sorts alphabetically
4. **Storage**: Saves as JSONB array in database

## API Usage

You can also use the tagging functions programmatically:

```typescript
import { autoTagWine, sanitizeTags } from '@/lib/autoTagger';

// Generate tags for a single wine
const tags = autoTagWine({
  flavorNotes: "Rich dark berries with earthy undertones",
  description: "Full-bodied red wine with chocolate notes",
  name: "Cabernet Sauvignon",
  type: "Red Wine"
});
// Returns: ["berry", "earthy", "chocolate"]

// Batch process multiple wines
import { batchAutoTagInventory } from '@/lib/batchAutoTag';

const result = await batchAutoTagInventory();
console.log(`Processed ${result.processed} wines`);
```

## Troubleshooting

### Common Issues

**Error: "Auto-tagging failed"**
- Make sure you've run the database migration to add the `tags` column
- Check browser console for detailed error messages

**No tags generated**
- Ensure wines have flavor notes or descriptions
- Check that the text contains recognizable flavor keywords

**Tags seem inaccurate**
- The system uses basic keyword matching - complex descriptions may need manual review
- Consider editing flavor notes to use more specific terms

### Performance

- Batch processing handles ~100 wines efficiently
- Large inventories (1000+ wines) may take several minutes
- The operation is safe to retry if interrupted

## Future Enhancements

- Manual tag editing interface
- Custom tag categories
- Machine learning integration
- Tag-based wine recommendations
- Advanced filtering by flavor profiles

## Files Modified

- `client/lib/autoTagger.ts` - Core tagging logic
- `client/lib/batchAutoTag.ts` - Batch processing utilities
- `client/components/admin/InventoryTab.tsx` - Auto-tagging integration
- `client/components/admin/SettingsModal.tsx` - Batch processing UI
- `sql_migrations/add_tags_to_inventory.sql` - Database migration

## Support

If you encounter issues with the auto-tagging system:

1. Check the browser console for error messages
2. Verify the database migration was applied correctly
3. Ensure wines have flavor notes or descriptions to analyze
4. Try processing a small batch first to test functionality
