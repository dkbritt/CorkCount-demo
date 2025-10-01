/**
 * Auto-tagging utility for wines based on flavor_notes and description
 */

// Comprehensive flavor keyword mapping
const FLAVOR_KEYWORDS = {
  berry: ['berry', 'berries', 'strawberry', 'strawberries', 'raspberry', 'raspberries', 'blackberry', 'blackberries', 'blueberry', 'blueberries', 'cranberry', 'cranberries', 'cherry', 'cherries', 'currant', 'boysenberry'],
  earthy: ['earthy', 'earth', 'soil', 'mineral', 'minerality', 'stone', 'rocky', 'terroir', 'dirt', 'dusty', 'forest floor', 'mushroom', 'mushrooms', 'truffle'],
  citrus: ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'tangerine', 'mandarin', 'bergamot', 'yuzu', 'citrusy', 'zesty', 'tart'],
  floral: ['floral', 'flower', 'flowers', 'rose', 'violet', 'lavender', 'jasmine', 'honeysuckle', 'elderflower', 'lilac', 'peony', 'perfumed', 'aromatic'],
  chocolate: ['chocolate', 'cocoa', 'cacao', 'mocha', 'dark chocolate', 'milk chocolate', 'bittersweet', 'chocolatey'],
  vanilla: ['vanilla', 'vanillin', 'sweet', 'creamy', 'custard', 'caramel', 'butterscotch', 'toffee', 'honey'],
  spicy: ['spicy', 'spice', 'pepper', 'peppery', 'black pepper', 'white pepper', 'cinnamon', 'clove', 'nutmeg', 'allspice', 'cardamom', 'ginger', 'paprika', 'cayenne', 'hot'],
  buttery: ['buttery', 'butter', 'creamy', 'rich', 'lush', 'velvety', 'smooth', 'silky', 'luxurious', 'opulent'],
  nutty: ['nutty', 'nut', 'nuts', 'almond', 'hazelnut', 'walnut', 'pecan', 'cashew', 'pistachio', 'marzipan', 'nuttiness'],
  herbal: ['herbal', 'herb', 'herbs', 'basil', 'thyme', 'rosemary', 'sage', 'oregano', 'mint', 'eucalyptus', 'pine', 'cedar', 'tobacco', 'tea', 'green tea', 'medicinal']
};

// Additional contextual keywords that might indicate flavors
const CONTEXTUAL_KEYWORDS = {
  fruit: ['fruit', 'fruity', 'fresh fruit', 'ripe fruit', 'stone fruit', 'tropical fruit', 'dried fruit'],
  oak: ['oak', 'oaky', 'wood', 'woody', 'barrel', 'aged', 'toasty', 'toast', 'smoky', 'smoke'],
  sweet: ['sweet', 'sweetness', 'sugar', 'syrupy', 'jam', 'preserve', 'compote'],
  dry: ['dry', 'crisp', 'clean', 'refreshing', 'bright', 'acidic', 'tart'],
  bold: ['bold', 'robust', 'powerful', 'intense', 'concentrated', 'full-bodied', 'heavy'],
  light: ['light', 'delicate', 'subtle', 'gentle', 'soft', 'light-bodied', 'elegant']
};

/**
 * Extract flavor tags from wine description and flavor notes
 */
export function extractFlavorTags(flavorNotes: string = '', description: string = ''): string[] {
  const combinedText = `${flavorNotes} ${description}`.toLowerCase();
  const extractedTags = new Set<string>();

  // Primary flavor matching
  Object.entries(FLAVOR_KEYWORDS).forEach(([tag, keywords]) => {
    const found = keywords.some(keyword => {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(combinedText);
    });
    
    if (found) {
      extractedTags.add(tag);
    }
  });

  // Contextual flavor matching (less aggressive)
  Object.entries(CONTEXTUAL_KEYWORDS).forEach(([tag, keywords]) => {
    const found = keywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(combinedText);
    });
    
    if (found && !extractedTags.has(tag)) {
      extractedTags.add(tag);
    }
  });

  // Convert to sorted array and ensure lowercase
  return Array.from(extractedTags).sort();
}

/**
 * Process wine data and return with auto-generated tags
 */
export function autoTagWine(wineData: {
  flavorNotes?: string;
  description?: string;
  name?: string;
  type?: string;
}): string[] {
  const { flavorNotes = '', description = '', name = '', type = '' } = wineData;
  
  // Also consider wine name and type for additional context
  const contextText = `${name} ${type}`.toLowerCase();
  const tags = extractFlavorTags(flavorNotes, description + ' ' + contextText);
  
  // Add wine-type-specific tags
  const wineTypeSpecific = getWineTypeSpecificTags(type);
  
  // Combine and deduplicate
  const allTags = new Set([...tags, ...wineTypeSpecific]);
  
  return Array.from(allTags).sort();
}

/**
 * Get wine-type-specific default tags
 */
function getWineTypeSpecificTags(wineType: string): string[] {
  const type = wineType.toLowerCase();
  
  if (type.includes('red')) {
    return ['berry', 'earthy']; // Common in red wines
  } else if (type.includes('white')) {
    return ['citrus', 'floral']; // Common in white wines
  } else if (type.includes('rosé') || type.includes('rose')) {
    return ['berry', 'floral']; // Common in rosé wines
  } else if (type.includes('sparkling')) {
    return ['citrus', 'light']; // Common in sparkling wines
  } else if (type.includes('dessert')) {
    return ['sweet', 'vanilla']; // Common in dessert wines
  }
  
  return [];
}

/**
 * Validate and sanitize tags
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0 && tag.length <= 50) // Reasonable length limits
    .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
    .sort();
}

/**
 * Format tags for display
 */
export function formatTagsForDisplay(tags: string[]): string[] {
  return tags.map(tag => 
    tag.charAt(0).toUpperCase() + tag.slice(1)
  );
}

/**
 * Get suggested tags for manual editing
 */
export function getSuggestedTags(): string[] {
  return Object.keys(FLAVOR_KEYWORDS).sort();
}

/**
 * Batch process multiple wines for tagging
 */
export function batchAutoTagWines(wines: Array<{
  id: string;
  flavorNotes?: string;
  description?: string;
  name?: string;
  type?: string;
}>): Array<{ id: string; tags: string[] }> {
  return wines.map(wine => ({
    id: wine.id,
    tags: autoTagWine(wine)
  }));
}
