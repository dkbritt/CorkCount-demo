// Secure Supabase client that makes API calls to serverless functions
// This prevents environment variables from being bundled into the client

import { apiFetch } from "./api";

// API endpoint helpers via dynamic resolution
const api = {
  fetch: (path: string, init?: RequestInit) => apiFetch(path, init),
};

// Check if Supabase is configured by testing the API
async function checkSupabaseConfig(): Promise<{
  isConfigured: boolean;
  isInsecureUrl: boolean;
}> {
  try {
    const response = await api.fetch("/config/supabase");
    if (!response.ok) {
      return { isConfigured: false, isInsecureUrl: false };
    }
    const config = await response.json();
    return {
      isConfigured: config.isConfigured || false,
      isInsecureUrl: config.isInsecureUrl || false,
    };
  } catch (error) {
    console.warn("Could not check Supabase configuration:", error);
    return { isConfigured: false, isInsecureUrl: false };
  }
}

// Authentication functions
export const auth = {
  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    try {
      const response = await api.fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          data: { user: null },
          error: { message: result.error || "Authentication failed" },
        };
      }

      return {
        data: {
          user: result.user,
          session: result.session,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: { user: null },
        error: { message: "Network error during authentication" },
      };
    }
  },

  async getUser() {
    // For now, return null as we're not implementing full session management
    return {
      data: { user: null },
      error: null,
    };
  },

  async signOut() {
    // For now, just return success
    return {
      error: null,
    };
  },
};

// Database query builder functions
function createQueryBuilder(tableName: string) {
  const queryBuilder: any = {
    // SELECT operations
    select: (columns = "*") => {
      queryBuilder._select = columns;
      return queryBuilder;
    },

    // WHERE conditions
    gte: (column: string, value: any) => {
      queryBuilder._filters = queryBuilder._filters || [];
      queryBuilder._filters.push({ type: "gte", column, value });
      return queryBuilder;
    },

    eq: (column: string, value: any) => {
      queryBuilder._filters = queryBuilder._filters || [];
      queryBuilder._filters.push({ type: "eq", column, value });
      return queryBuilder;
    },

    // ORDER BY
    order: (column: string, options?: { ascending?: boolean }) => {
      queryBuilder._order = { column, ascending: options?.ascending !== false };
      return queryBuilder;
    },

    // LIMIT
    limit: (count: number) => {
      queryBuilder._limit = count;
      return queryBuilder;
    },

    // DELETE
    delete: () => {
      queryBuilder._delete = true;
      return queryBuilder;
    },

    // Execute the query
    async then(resolve: any, reject: any) {
      try {
        let result;

        if (tableName === "Inventory" && queryBuilder._select) {
          // Handle inventory fetching
          const response = await api.fetch("/inventory");
          const apiResult = await response.json();

          if (!response.ok || !apiResult.success) {
            result = {
              data: null,
              error: {
                message: apiResult.error || "Failed to fetch inventory",
              },
            };
          } else {
            result = { data: apiResult.wines, error: null };
          }
        } else if (tableName === "Orders" && queryBuilder._select) {
          // Handle orders fetching
          const response = await api.fetch("/orders");
          const apiResult = await response.json();

          if (!response.ok || !apiResult.success) {
            result = {
              data: null,
              error: { message: apiResult.error || "Failed to fetch orders" },
            };
          } else {
            result = { data: apiResult.orders, error: null };
          }
        } else if (tableName === "Batches") {
          // CRUD for batches
          if (queryBuilder._insert) {
            const payload = Array.isArray(queryBuilder._insert)
              ? queryBuilder._insert[0]
              : queryBuilder._insert;
            const response = await api.fetch("/batches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const apiResult = await response.json();
            if (!response.ok || !apiResult.success) {
              result = {
                data: null,
                error: { message: apiResult.error || "Failed to create batch" },
              };
            } else {
              result = { data: apiResult.batch, error: null };
            }
          } else if (queryBuilder._update) {
            const idFilter = (queryBuilder._filters || []).find(
              (f: any) => f.type === "eq" && f.column === "id",
            );
            const id = idFilter?.value;
            if (!id) {
              result = {
                data: null,
                error: { message: "Missing id for update" },
              };
            } else {
              const response = await api.fetch(`/batches/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryBuilder._update),
              });
              const apiResult = await response.json();
              if (!response.ok || !apiResult.success) {
                result = {
                  data: null,
                  error: {
                    message: apiResult.error || "Failed to update batch",
                  },
                };
              } else {
                result = { data: apiResult.batch, error: null };
              }
            }
          } else if (queryBuilder._delete) {
            const idFilter = (queryBuilder._filters || []).find(
              (f: any) => f.type === "eq" && f.column === "id",
            );
            const id = idFilter?.value;
            if (!id) {
              result = {
                data: null,
                error: { message: "Missing id for delete" },
              };
            } else {
              const response = await api.fetch(`/batches/${id}`, {
                method: "DELETE",
              });
              const apiResult = await response.json().catch(() => ({}));
              if (!response.ok || apiResult.success === false) {
                result = {
                  data: null,
                  error: {
                    message:
                      (apiResult && apiResult.error) ||
                      "Failed to delete batch",
                  },
                };
              } else {
                result = { data: { id }, error: null };
              }
            }
          } else if (queryBuilder._select) {
            const response = await api.fetch("/batches");
            const apiResult = await response.json();
            if (!response.ok || !apiResult.success) {
              result = {
                data: null,
                error: {
                  message: apiResult.error || "Failed to fetch batches",
                },
              };
            } else {
              result = { data: apiResult.batches, error: null };
            }
          } else {
            result = {
              data: null,
              error: { message: `Unsupported operation on ${tableName}` },
            };
          }
        } else {
          result = {
            data: null,
            error: { message: `Unsupported operation on ${tableName}` },
          };
        }

        resolve(result);
      } catch (error) {
        reject({ data: null, error: { message: "Network error" } });
      }
    },

    // INSERT operations
    insert: (data: any) => {
      queryBuilder._insert = data;
      return queryBuilder;
    },

    // UPDATE operations
    update: (data: any) => {
      queryBuilder._update = data;
      return queryBuilder;
    },

    // DELETE already defined

    // SELECT single result
    single: () => {
      queryBuilder._single = true;
      return queryBuilder;
    },
  };

  return queryBuilder;
}

// Database operations
function from(tableName: string) {
  return createQueryBuilder(tableName);
}

// Main client object
export const secureSupabase = {
  auth,
  from,
  checkSupabaseConfig,
};

// Export configuration helpers
export async function isSupabaseConfigured(): Promise<boolean> {
  const config = await checkSupabaseConfig();
  return config.isConfigured;
}

export async function isSupabaseInsecureUrl(): Promise<boolean> {
  const config = await checkSupabaseConfig();
  return config.isInsecureUrl;
}

// Default export
export default secureSupabase;
