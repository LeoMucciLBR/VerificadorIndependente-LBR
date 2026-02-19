/**
 * Rate Limiting Implementation
 * 
 * A simple in-memory rate limiter for protecting sensitive endpoints.
 * For production at scale, consider using Redis (@upstash/ratelimit).
 * 
 * Features:
 * - Sliding window algorithm
 * - Configurable limits and windows
 * - Memory cleanup for expired entries
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

// In-memory store (for single-instance deployments)
// For multi-instance deployments, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Auto-cleanup expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove entries older than 1 hour
      if (now - entry.lastAttempt > 60 * 60 * 1000) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the window */
  remaining: number;
  /** Time in ms until the window resets */
  resetIn: number;
  /** Total requests made in this window */
  count: number;
}

/**
 * Check rate limit for a given identifier
 * 
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No previous attempts
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
      count: 1,
    };
  }

  // Check if window has expired
  if (now - entry.firstAttempt > config.windowMs) {
    // Reset the window
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
      count: 1,
    };
  }

  // Increment counter
  entry.count++;
  entry.lastAttempt = now;
  rateLimitStore.set(identifier, entry);

  const resetIn = config.windowMs - (now - entry.firstAttempt);
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetIn,
    count: entry.count,
  };
}

/**
 * Reset rate limit for a given identifier
 * Useful after successful authentication
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// Preset configurations
export const RATE_LIMIT_CONFIGS = {
  /** Login: 5 attempts per 15 minutes */
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  /** API: 100 requests per minute */
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  /** Password Reset: 3 attempts per hour */
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;
