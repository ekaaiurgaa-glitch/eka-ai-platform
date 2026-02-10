class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private window: number;

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    const validTimestamps = timestamps.filter(t => now - t < this.window);
    
    if (validTimestamps.length >= this.limit) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  reset(key: string) {
    this.requests.delete(key);
  }
}

export const chatRateLimiter = new RateLimiter(20, 60000);
export const apiRateLimiter = new RateLimiter(100, 60000);
