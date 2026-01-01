/**
 * CLOUDFLARE ENVIRONMENT BINDINGS
 * This file tells TypeScript about the resources you've bound to your project.
 */

interface CloudflareEnv {
  // D1 Database for relational data
  DB: D1Database;
  
  // KV Namespace for fast redirect lookups
  CAMPAIGNS: KVNamespace;
  
  // Analytics Engine for tracking events
  ANALYTICS?: {
    writeDataPoint: (data: {
      blobs?: string[];
      doubles?: number[];
      indexes?: string[];
    }) => void;
  };

  // Secrets/Environment Variables
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
}

// Ensure global scope for these types
declare global {
  interface D1Database {
    prepare: (query: string) => D1PreparedStatement;
  }
  
  interface D1PreparedStatement {
    bind: (...args: any[]) => D1PreparedStatement;
    all: <T = any>() => Promise<{ results: T[] }>;
    first: <T = any>(colName?: string) => Promise<T | null>;
    run: () => Promise<{ success: boolean }>;
  }

  interface KVNamespace {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string) => Promise<void>;
    delete: (key: string) => Promise<void>;
  }
}

export {};
