/**
 * Configuration for FlowGuard
 * Supports local testing mode where external services are optional
 */

export interface Config {
  // Core
  mongodbUri?: string;
  anthropicApiKey?: string;
  
  // Optional services
  phoenixEndpoint?: string;
  doSpacesKey?: string;
  doSpacesSecret?: string;
  doSpacesBucket?: string;
  doSpacesRegion?: string;
  cruxApiKey?: string;
  woodWideApiKey?: string;
  githubAppId?: string;
  githubPrivateKey?: string;
  githubWebhookSecret?: string;
  browserbaseApiKey?: string;
  browserbaseProjectId?: string;
  
  // Feature flags
  enableVision: boolean;
  enablePhoenix: boolean;
  enableSpaces: boolean;
  enableCrux: boolean;
  enableWoodWide: boolean;
  enableGithub: boolean;
  enableBrowserbase: boolean;
  
  // Local testing mode
  localTesting: boolean;
  useMockMongo: boolean;
}

/**
 * Get configuration with local testing support
 */
export function getConfig(): Config {
  const localTesting = process.env.LOCAL_TESTING === 'true' || !process.env.MONGODB_URI;
  
  return {
    // Core (optional in local testing)
    mongodbUri: process.env.MONGODB_URI,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    
    // Optional services
    phoenixEndpoint: process.env.PHOENIX_ENDPOINT,
    doSpacesKey: process.env.DO_SPACES_KEY,
    doSpacesSecret: process.env.DO_SPACES_SECRET,
    doSpacesBucket: process.env.DO_SPACES_BUCKET,
    doSpacesRegion: process.env.DO_SPACES_REGION || 'nyc3',
    cruxApiKey: process.env.CRUX_API_KEY,
    woodWideApiKey: process.env.WOOD_WIDE_API_KEY,
    githubAppId: process.env.GITHUB_APP_ID,
    githubPrivateKey: process.env.GITHUB_PRIVATE_KEY,
    githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    browserbaseApiKey: process.env.BROWSERBASE_API_KEY,
    browserbaseProjectId: process.env.BROWSERBASE_PROJECT_ID,
    
    // Feature flags (auto-detect based on env vars)
    enableVision: !!process.env.ANTHROPIC_API_KEY || localTesting,
    enablePhoenix: !!process.env.PHOENIX_ENDPOINT && !localTesting,
    enableSpaces: !!(process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET) && !localTesting,
    enableCrux: !!process.env.CRUX_API_KEY && !localTesting,
    enableWoodWide: !!process.env.WOOD_WIDE_API_KEY && !localTesting,
    enableGithub: !!(process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY) && !localTesting,
    enableBrowserbase: !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) && !localTesting,
    
    // Local testing mode
    localTesting,
    useMockMongo: localTesting && !process.env.MONGODB_URI,
  };
}

/**
 * Validate required config (only in production mode)
 */
export function validateConfig(): void {
  const config = getConfig();
  
  if (!config.localTesting) {
    if (!config.mongodbUri) {
      throw new Error('MONGODB_URI is required in production mode');
    }
  }
  
  // Vision is optional even in production (can use --no-vision flag)
  // Other services are always optional
}

