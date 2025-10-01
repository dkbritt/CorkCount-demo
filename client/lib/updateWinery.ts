// Utility to update existing winery names from "CorkCount Winery" to "Foxglove Creek Winery"
// Note: This bulk operation would be more efficient as a dedicated server endpoint
import { apiFetch } from "@/lib/api";

export async function updateExistingWineryNames(): Promise<{
  success: boolean;
  updated: number;
  error?: string;
}> {
  try {
    // First, fetch all inventory items that need updating
    const response = await apiFetch("/inventory?admin=true");
    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("Error fetching inventory:", result.error);
      return { success: false, updated: 0, error: result.error };
    }

    const inventory = result.inventory || [];
    const itemsToUpdate = inventory.filter(
      (item: any) => item.winery === "CorkCount Winery",
    );

    if (itemsToUpdate.length === 0) {
      return { success: true, updated: 0 };
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Update each item individually
    for (const item of itemsToUpdate) {
      try {
        const updateResponse = await apiFetch(`/inventory/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winery: "Foxglove Creek Winery" }),
        });
        const updateResult = await updateResponse.json();

        if (updateResponse.ok && updateResult.success) {
          updatedCount++;
        } else {
          errors.push(
            `Failed to update item ${item.id}: ${updateResult.error}`,
          );
        }
      } catch (err) {
        errors.push(
          `Error updating item ${item.id}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    }

    console.log(
      `Updated ${updatedCount} inventory records from "CorkCount Winery" to "Foxglove Creek Winery"`,
    );

    if (errors.length > 0) {
      console.warn("Some updates failed:", errors);
      return {
        success: updatedCount > 0,
        updated: updatedCount,
        error: `${errors.length} items failed to update. Check console for details.`,
      };
    }

    return { success: true, updated: updatedCount };
  } catch (err) {
    console.error("Error in updateExistingWineryNames:", err);
    return {
      success: false,
      updated: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Run this once to update all existing records
export async function runWineryUpdate(): Promise<void> {
  const result = await updateExistingWineryNames();

  if (result.success) {
    console.log(
      `✅ Successfully updated ${result.updated} winery names to "Foxglove Creek Winery"`,
    );
  } else {
    console.error(`❌ Failed to update winery names: ${result.error}`);
  }
}
