export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: "http" | "https" | "socks5";
  country?: string;
  type?: "datacenter" | "residential" | "mobile";
  rotating?: boolean;
}

export interface ProxyStats {
  total: number;
  failed: number;
  working: number;
  success_rate: number;
  last_rotation: Date;
}

export interface BrowserFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  secChUa: string;
  secChUaPlatform: string;
  viewport: { width: number; height: number };
  timezone: string;
  cookiesEnabled: boolean;
}
