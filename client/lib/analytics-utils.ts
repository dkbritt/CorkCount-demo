// Utility functions to manage analytics interference with API calls

/**
 * Temporarily disable FullStory recording for critical API operations
 */
export function withAnalyticsDisabled<T>(
  operation: () => Promise<T>,
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    // Store original FullStory state
    const originalFS = (window as any).FS;
    let wasRecording = false;

    try {
      // Disable FullStory if available
      if (originalFS && typeof originalFS.shutdown === "function") {
        wasRecording = true;
        console.log("🚫 Temporarily disabling FullStory for API call...");
        originalFS.shutdown();
      }

      // Execute the operation
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      // Re-enable FullStory if it was running
      if (
        originalFS &&
        wasRecording &&
        typeof originalFS.restart === "function"
      ) {
        console.log("✅ Re-enabling FullStory...");
        setTimeout(() => {
          originalFS.restart();
        }, 100); // Small delay to ensure API call completes
      }
    }
  });
}

/**
 * Check if analytics are interfering with fetch
 */
export function detectAnalyticsInterference(): boolean {
  const fetchStr = window.fetch.toString();

  // Check if fetch has been wrapped/modified
  const isNativeFetch = fetchStr.includes("[native code]");
  const hasFullStory = !!(window as any).FS;
  const hasModifiedFetch = !isNativeFetch;

  console.log("Analytics Detection:", {
    hasFullStory,
    hasModifiedFetch,
    isNativeFetch,
  });

  return hasFullStory && hasModifiedFetch;
}

/**
 * Create a clean fetch function that bypasses analytics
 */
export function createCleanFetch(): typeof fetch {
  // Try to get original fetch before analytics wrapping
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const cleanFetch = iframe.contentWindow?.fetch;
  document.body.removeChild(iframe);

  return cleanFetch || window.fetch;
}
