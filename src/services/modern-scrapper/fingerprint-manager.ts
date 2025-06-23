/**
 * Advanced Fingerprint Manager
 *
 * Generates sophisticated browser fingerprints that:
 * - Mimic real user environments
 * - Rotate intelligently to avoid pattern detection
 * - Include hardware and software consistency
 * - Support multiple browser engines and OS combinations
 */

import { logger } from "utils/logger";

interface BrowserFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
    devicePixelRatio: number;
  };
  timezone: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  webgl: {
    vendor: string;
    renderer: string;
  };
  canvas: string;
  audio: string;
  fonts: string[];
  plugins: string[];
}

export class FingerprintManager {
  private fingerprintPool: BrowserFingerprint[] = [];

  // Real browser fingerprint templates
  private browserTemplates = [
    {
      name: "Chrome Windows 119",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      platform: "Win32",
      hardwareConcurrency: [4, 6, 8, 12, 16],
      deviceMemory: [4, 8, 16, 32],
      screenResolutions: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 },
        { width: 1440, height: 900 },
        { width: 2560, height: 1440 },
      ],
    },
    {
      name: "Chrome macOS 119",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      platform: "MacIntel",
      hardwareConcurrency: [4, 8, 10, 12],
      deviceMemory: [8, 16, 32],
      screenResolutions: [
        { width: 1440, height: 900 },
        { width: 1680, height: 1050 },
        { width: 1920, height: 1200 },
        { width: 2560, height: 1600 },
        { width: 2880, height: 1800 },
      ],
    },
    {
      name: "Chrome Linux 119",
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      platform: "Linux x86_64",
      hardwareConcurrency: [2, 4, 6, 8, 12],
      deviceMemory: [4, 8, 16],
      screenResolutions: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1600, height: 900 },
        { width: 2560, height: 1440 },
      ],
    },
    {
      name: "Firefox Windows 119",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0",
      platform: "Win32",
      hardwareConcurrency: [4, 6, 8, 12],
      deviceMemory: [4, 8, 16],
      screenResolutions: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 },
      ],
    },
    {
      name: "Edge Windows 119",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
      platform: "Win32",
      hardwareConcurrency: [4, 6, 8, 12],
      deviceMemory: [4, 8, 16],
      screenResolutions: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 },
      ],
    },
  ];

  private timezones = [
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "America/Toronto",
  ];

  private languages = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "en-US,en;q=0.9,es;q=0.8",
    "en-GB,en;q=0.9,fr;q=0.8",
    "en-US,en;q=0.9,de;q=0.8",
    "en-CA,en;q=0.9,fr;q=0.8",
  ];

  private webglVendors = [
    {
      vendor: "Google Inc. (Intel)",
      renderer: "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    },
    {
      vendor: "Google Inc. (NVIDIA)",
      renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    },
    {
      vendor: "Google Inc. (AMD)",
      renderer: "ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
    },
    { vendor: "Apple", renderer: "Apple GPU" },
    {
      vendor: "Intel Open Source Technology Center",
      renderer: "Mesa DRI Intel(R) UHD Graphics 620 (KBL GT2)",
    },
  ];

  constructor() {
    this.generateFingerprintPool();
  }

  /**
   * Generate a pool of realistic fingerprints
   */
  private generateFingerprintPool(): void {
    logger.info("🎭 Generating advanced fingerprint pool...");

    for (let i = 0; i < 50; i++) {
      // Generate 50 unique fingerprints
      const template =
        this.browserTemplates[Math.floor(Math.random() * this.browserTemplates.length)];
      const fingerprint = this.generateFingerprintFromTemplate(template);
      this.fingerprintPool.push(fingerprint);
    }

    logger.info(`✅ Generated ${this.fingerprintPool.length} unique fingerprints`);
  }

  /**
   * Generate fingerprint from template
   */
  private generateFingerprintFromTemplate(template: any): BrowserFingerprint {
    const resolution =
      template.screenResolutions[Math.floor(Math.random() * template.screenResolutions.length)];
    const webgl = this.webglVendors[Math.floor(Math.random() * this.webglVendors.length)];

    return {
      userAgent: template.userAgent,
      acceptLanguage: this.languages[Math.floor(Math.random() * this.languages.length)],
      acceptEncoding: "gzip, deflate, br",
      screen: {
        width: resolution.width,
        height: resolution.height,
        colorDepth: 24,
        pixelDepth: 24,
        devicePixelRatio: this.getRealisticDPR(resolution.width),
      },
      timezone: this.timezones[Math.floor(Math.random() * this.timezones.length)],
      platform: template.platform,
      hardwareConcurrency:
        template.hardwareConcurrency[
          Math.floor(Math.random() * template.hardwareConcurrency.length)
        ],
      deviceMemory: template.deviceMemory[Math.floor(Math.random() * template.deviceMemory.length)],
      webgl: webgl,
      canvas: this.generateCanvasFingerprint(),
      audio: this.generateAudioFingerprint(),
      fonts: this.generateFontList(template.platform),
      plugins: this.generatePluginList(template.name),
    };
  }

  /**
   * Get realistic device pixel ratio based on screen width
   */
  private getRealisticDPR(width: number): number {
    if (width >= 2560) return 2; // High-DPI displays
    if (width >= 1920) return Math.random() < 0.3 ? 1.25 : 1; // Some high-DPI 1080p
    return 1; // Standard displays
  }

  /**
   * Generate canvas fingerprint
   */
  private generateCanvasFingerprint(): string {
    const variations = [
      "canvas_fp_1a2b3c4d5e6f",
      "canvas_fp_9z8y7x6w5v4u",
      "canvas_fp_q1w2e3r4t5y6",
      "canvas_fp_a9s8d7f6g5h4",
      "canvas_fp_m1n2b3v4c5x6",
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Generate audio fingerprint
   */
  private generateAudioFingerprint(): string {
    const variations = [
      "audio_fp_123.456789",
      "audio_fp_987.654321",
      "audio_fp_456.789123",
      "audio_fp_321.654987",
      "audio_fp_789.123456",
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Generate realistic font list based on platform
   */
  private generateFontList(platform: string): string[] {
    const commonFonts = [
      "Arial",
      "Arial Black",
      "Arial Narrow",
      "Calibri",
      "Cambria",
      "Century Gothic",
      "Comic Sans MS",
      "Consolas",
      "Courier New",
      "Georgia",
      "Helvetica",
      "Impact",
      "Lucida Console",
      "Lucida Grande",
      "Palatino",
      "Tahoma",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
    ];

    const windowsFonts = ["Segoe UI", "Microsoft Sans Serif", "MS Gothic", "Yu Gothic"];

    const macFonts = ["San Francisco", "Helvetica Neue", "Avenir", "Menlo", "Monaco"];

    const linuxFonts = ["Ubuntu", "Liberation Sans", "DejaVu Sans", "Noto Sans"];

    let fonts = [...commonFonts];

    if (platform.includes("Win")) {
      fonts.push(...windowsFonts);
    } else if (platform.includes("Mac")) {
      fonts.push(...macFonts);
    } else if (platform.includes("Linux")) {
      fonts.push(...linuxFonts);
    }

    // Return random subset of fonts (realistic number)
    const numFonts = 15 + Math.floor(Math.random() * 10); // 15-25 fonts
    return fonts.sort(() => 0.5 - Math.random()).slice(0, numFonts);
  }

  /**
   * Generate plugin list based on browser
   */
  private generatePluginList(browserName: string): string[] {
    const chromePlugins = ["Chrome PDF Plugin", "Chrome PDF Viewer", "Native Client"];

    const firefoxPlugins = ["PDF.js", "OpenH264 Video Codec"];

    if (browserName.includes("Chrome") || browserName.includes("Edge")) {
      return chromePlugins;
    } else if (browserName.includes("Firefox")) {
      return firefoxPlugins;
    }

    return chromePlugins; // Default to Chrome
  }

  /**
   * Get a random fingerprint from the pool
   */
  public getRandomFingerprint(): BrowserFingerprint {
    const index = Math.floor(Math.random() * this.fingerprintPool.length);
    const fingerprint = this.fingerprintPool[index];

    logger.debug(`🎭 Using fingerprint: ${fingerprint.userAgent.substring(0, 50)}...`);

    return fingerprint;
  }

  /**
   * Generate advanced fingerprint with consistency checks
   */
  public generateAdvancedFingerprint(): BrowserFingerprint {
    // Ensure consistent fingerprint relationships
    const template =
      this.browserTemplates[Math.floor(Math.random() * this.browserTemplates.length)];
    const fingerprint = this.generateFingerprintFromTemplate(template);

    // Consistency checks
    this.ensureConsistency(fingerprint);

    return fingerprint;
  }

  /**
   * Ensure fingerprint consistency
   */
  private ensureConsistency(fingerprint: BrowserFingerprint): void {
    // Ensure memory and cores are realistic
    if (fingerprint.deviceMemory < 4 && fingerprint.hardwareConcurrency > 4) {
      fingerprint.hardwareConcurrency = 4;
    }

    if (fingerprint.deviceMemory >= 16 && fingerprint.hardwareConcurrency < 6) {
      fingerprint.hardwareConcurrency = 8;
    }

    // Ensure screen resolution and DPR are consistent
    if (fingerprint.screen.width >= 2560 && fingerprint.screen.devicePixelRatio < 1.5) {
      fingerprint.screen.devicePixelRatio = 2;
    }

    // Ensure timezone matches language preference
    if (
      fingerprint.acceptLanguage.includes("en-GB") &&
      !fingerprint.timezone.includes("Europe/London")
    ) {
      fingerprint.timezone = "Europe/London";
    }
  }

  /**
   * Get fingerprint statistics
   */
  public getStats(): any {
    const platformCounts = this.fingerprintPool.reduce((acc, fp) => {
      acc[fp.platform] = (acc[fp.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const browserCounts = this.fingerprintPool.reduce((acc, fp) => {
      const browser = fp.userAgent.includes("Chrome")
        ? "Chrome"
        : fp.userAgent.includes("Firefox")
        ? "Firefox"
        : fp.userAgent.includes("Edge")
        ? "Edge"
        : "Other";
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.fingerprintPool.length,
      platforms: platformCounts,
      browsers: browserCounts,
    };
  }
}
