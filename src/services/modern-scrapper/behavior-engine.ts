/**
 * Behavioral Engine for Human-like Automation
 * 
 * Simulates realistic human browsing patterns:
 * - Natural timing variations
 * - Realistic reading and interaction patterns
 * - Adaptive behavior based on content
 * - Machine learning-inspired pattern recognition
 */

import { logger } from 'utils/logger';

interface BehaviorPattern {
  preDelay: { min: number; max: number };
  readTime: { min: number; max: number };
  scrollProbability: number;
  mouseMoveProbability: number;
  interactionDelay: { min: number; max: number };
}

type BehaviorProfile = 'human' | 'casual' | 'aggressive';

interface NavigationBehavior {
  preDelay: { min: number; max: number };
  readTime: { min: number; max: number };
  postDelay: { min: number; max: number };
}

export class BehaviorEngine {
  private profile: BehaviorProfile;
  private sessionStartTime: number;
  private actionCount: number = 0;
  private patterns: Record<BehaviorProfile, BehaviorPattern>;

  constructor(profile: BehaviorProfile = 'human') {
    this.profile = profile;
    this.sessionStartTime = Date.now();
    
    this.patterns = {
      human: {
        preDelay: { min: 1500, max: 4000 },
        readTime: { min: 2000, max: 8000 },
        scrollProbability: 0.4,
        mouseMoveProbability: 0.6,
        interactionDelay: { min: 800, max: 2500 }
      },
      casual: {
        preDelay: { min: 800, max: 2000 },
        readTime: { min: 1000, max: 4000 },
        scrollProbability: 0.2,
        mouseMoveProbability: 0.3,
        interactionDelay: { min: 500, max: 1500 }
      },
      aggressive: {
        preDelay: { min: 200, max: 800 },
        readTime: { min: 300, max: 1500 },
        scrollProbability: 0.1,
        mouseMoveProbability: 0.1,
        interactionDelay: { min: 100, max: 800 }
      }
    };

    logger.info(`🧠 Behavior engine initialized with profile: ${profile}`);
  }

  /**
   * Get navigation behavior based on current context
   */
  public getNavigationBehavior(): NavigationBehavior {
    const pattern = this.patterns[this.profile];
    const fatigue = this.calculateFatigue();
    
    // Apply fatigue factor to timing
    const fatigueMultiplier = 1 + (fatigue * 0.5);
    
    return {
      preDelay: {
        min: Math.floor(pattern.preDelay.min * fatigueMultiplier),
        max: Math.floor(pattern.preDelay.max * fatigueMultiplier)
      },
      readTime: {
        min: Math.floor(pattern.readTime.min * fatigueMultiplier),
        max: Math.floor(pattern.readTime.max * fatigueMultiplier)
      },
      postDelay: {
        min: Math.floor(pattern.interactionDelay.min * fatigueMultiplier),
        max: Math.floor(pattern.interactionDelay.max * fatigueMultiplier)
      }
    };
  }

  /**
   * Calculate fatigue factor based on session duration and actions
   */
  private calculateFatigue(): number {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const hoursPassed = sessionDuration / (1000 * 60 * 60);
    
    // Fatigue increases over time and with more actions
    const timeFatigue = Math.min(hoursPassed * 0.2, 1);
    const actionFatigue = Math.min(this.actionCount * 0.01, 1);
    
    return Math.min(timeFatigue + actionFatigue, 1);
  }

  /**
   * Get typing behavior pattern
   */
  public getTypingBehavior(): { wpm: number; errorRate: number; pauseProbability: number } {
    const patterns = {
      human: { wpm: 65 + Math.random() * 35, errorRate: 0.02, pauseProbability: 0.15 },
      casual: { wpm: 45 + Math.random() * 25, errorRate: 0.03, pauseProbability: 0.20 },
      aggressive: { wpm: 80 + Math.random() * 40, errorRate: 0.01, pauseProbability: 0.05 }
    };
    
    return patterns[this.profile];
  }

  /**
   * Get mouse movement pattern
   */
  public getMouseMovementPattern(): { speed: number; accuracy: number; humanness: number } {
    const patterns = {
      human: { speed: 1200 + Math.random() * 800, accuracy: 0.85, humanness: 0.9 },
      casual: { speed: 800 + Math.random() * 600, accuracy: 0.75, humanness: 0.8 },
      aggressive: { speed: 2000 + Math.random() * 1000, accuracy: 0.95, humanness: 0.6 }
    };
    
    return patterns[this.profile];
  }

  /**
   * Get scroll behavior
   */
  public getScrollBehavior(): { speed: number; distance: number; probability: number } {
    const pattern = this.patterns[this.profile];
    
    return {
      speed: 100 + Math.random() * 200,
      distance: 150 + Math.random() * 300,
      probability: pattern.scrollProbability
    };
  }

  /**
   * Generate realistic delay based on content type
   */
  public getContentBasedDelay(contentType: 'text' | 'image' | 'video' | 'form' | 'api'): number {
    const baseDelays = {
      text: { human: 3000, casual: 1500, aggressive: 500 },
      image: { human: 2000, casual: 1000, aggressive: 300 },
      video: { human: 5000, casual: 2500, aggressive: 800 },
      form: { human: 4000, casual: 2000, aggressive: 600 },
      api: { human: 1000, casual: 500, aggressive: 200 }
    };
    
    const baseDelay = baseDelays[contentType][this.profile];
    const variation = baseDelay * 0.5 * (Math.random() - 0.5);
    const fatigue = this.calculateFatigue();
    
    return Math.floor(baseDelay + variation + (fatigue * baseDelay * 0.3));
  }

  /**
   * Generate random pause pattern
   */
  public shouldTakeBreak(): boolean {
    this.actionCount++;
    
    // Increase break probability based on actions and time
    const baseBreakProbability = {
      human: 0.05,
      casual: 0.03,
      aggressive: 0.01
    };
    
    const fatigue = this.calculateFatigue();
    const adjustedProbability = baseBreakProbability[this.profile] + (fatigue * 0.1);
    
    return Math.random() < adjustedProbability;
  }

  /**
   * Get break duration
   */
  public getBreakDuration(): number {
    const baseDurations = {
      human: 30000, // 30 seconds
      casual: 15000, // 15 seconds  
      aggressive: 5000 // 5 seconds
    };
    
    const baseDuration = baseDurations[this.profile];
    const variation = baseDuration * (Math.random() - 0.5);
    
    return Math.floor(baseDuration + variation);
  }

  /**
   * Adapt behavior based on success/failure
   */  public adaptBehavior(success: boolean, responseTime: number): void {
    if (!success) {
      // Increase delays on failure
      const pattern = this.patterns[this.profile];
      pattern.preDelay.min *= 1.2;
      pattern.preDelay.max *= 1.2;
      pattern.readTime.min *= 1.3;
      pattern.readTime.max *= 1.3;
      
      logger.info('🔧 Adapted behavior: increased delays due to failure');
    } else if (responseTime < 1000) {
      // Slightly reduce delays on fast successful responses
      const pattern = this.patterns[this.profile];
      pattern.preDelay.min *= 0.95;
      pattern.preDelay.max *= 0.95;
      
      logger.debug('⚡ Adapted behavior: slightly reduced delays due to fast response');
    }
    
    // Prevent delays from becoming too extreme
    this.normalizeDelays();
  }

  /**
   * Normalize delays to prevent extreme values
   */
  private normalizeDelays(): void {
    const pattern = this.patterns[this.profile];
    
    // Ensure minimum delays
    pattern.preDelay.min = Math.max(pattern.preDelay.min, 100);
    pattern.preDelay.max = Math.max(pattern.preDelay.max, pattern.preDelay.min + 500);
    
    pattern.readTime.min = Math.max(pattern.readTime.min, 200);
    pattern.readTime.max = Math.max(pattern.readTime.max, pattern.readTime.min + 1000);
    
    // Ensure maximum delays don't get too high
    pattern.preDelay.max = Math.min(pattern.preDelay.max, 30000);
    pattern.readTime.max = Math.min(pattern.readTime.max, 60000);
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): any {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const fatigue = this.calculateFatigue();
    
    return {
      profile: this.profile,
      sessionDuration: Math.floor(sessionDuration / 1000), // seconds
      actionCount: this.actionCount,
      fatigue: Math.round(fatigue * 100), // percentage
      avgActionsPerMinute: Math.round(this.actionCount / (sessionDuration / 60000)),
      currentPattern: this.patterns[this.profile]
    };
  }

  /**
   * Reset session (useful for long-running processes)
   */
  public resetSession(): void {
    this.sessionStartTime = Date.now();
    this.actionCount = 0;
    
    // Reset patterns to defaults
    this.patterns = {
      human: {
        preDelay: { min: 1500, max: 4000 },
        readTime: { min: 2000, max: 8000 },
        scrollProbability: 0.4,
        mouseMoveProbability: 0.6,
        interactionDelay: { min: 800, max: 2500 }
      },
      casual: {
        preDelay: { min: 800, max: 2000 },
        readTime: { min: 1000, max: 4000 },
        scrollProbability: 0.2,
        mouseMoveProbability: 0.3,
        interactionDelay: { min: 500, max: 1500 }
      },
      aggressive: {
        preDelay: { min: 200, max: 800 },
        readTime: { min: 300, max: 1500 },
        scrollProbability: 0.1,
        mouseMoveProbability: 0.1,
        interactionDelay: { min: 100, max: 800 }
      }
    };
    
    logger.info(`🔄 Behavior session reset for profile: ${this.profile}`);
  }
}
