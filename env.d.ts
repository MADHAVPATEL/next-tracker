/**
 * CLOUDFLARE ENVIRONMENT BINDINGS
 * This file augments the global scope to let TypeScript know about your Cloudflare resources.
 */

import "@cloudflare/next-on-pages";

declare global {
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

    // Cloudflare Credentials for Analytics SQL API
    CLOUDFLARE_API_TOKEN?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
  }

  // Define basic shapes for Cloudflare types if @cloudflare/workers-types is not installed
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
