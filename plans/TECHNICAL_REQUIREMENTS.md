# FlowGuard AI — Technical Requirements & Pre-Development Setup

**Date:** 2026-01-18
**Status:** Pre-Implementation
**Purpose:** Complete checklist of requirements, API keys, and setup steps before development begins

---

## Table of Contents

1. [Required Accounts & API Keys](#required-accounts--api-keys)
2. [Environment Variables](#environment-variables)
3. [Local Development Setup](#local-development-setup)
4. [Cloud Infrastructure Setup](#cloud-infrastructure-setup)
5. [Dependency Installation](#dependency-installation)
6. [Pre-Implementation Checklist](#pre-implementation-checklist)
7. [Implementation Order](#implementation-order)

---

## Required Accounts & API Keys

### 1. Anthropic (REQUIRED - Core Feature)
**Purpose:** Claude 3.5 Sonnet for vision-based UX analysis

- **Account:** Sign up at https://console.anthropic.com
- **Pricing:** Pay-as-you-go ($3/million input tokens, $15/million output tokens)
- **Free Tier:** $5 credit for new accounts
- **Required for:** Vision API calls to analyze screenshots
- **API Key Location:** https://console.anthropic.com/settings/keys

**Steps:**
1. Create account at https://console.anthropic.com
2. Add payment method (required after free credit)
3. Navigate to Settings → API Keys
4. Click "Create Key"
5. Copy key starting with `sk-ant-...`
6. Set environment variable: `ANTHROPIC_API_KEY=sk-ant-...`

**Rate Limits:**
- **Tier 1 (Free):** 50 requests/min, 40,000 tokens/min
- **Tier 2 (Paid):** 1,000 requests/min, 100,000 tokens/min
- **Upgrade automatically** after first payment

---

### 2. MongoDB Atlas (REQUIRED - Primary Storage)
**Purpose:** Time-series storage, vision cache, flow definitions

- **Account:** Sign up at https://cloud.mongodb.com
- **Pricing:** Free tier (M0) available with 512MB storage
- **Required for:** ALL data persistence (replaces JSON files)
- **Connection String Format:** `mongodb+srv://username:password@cluster.mongodb.net/flowguard`

**Steps:**
1. Create account at https://cloud.mongodb.com
2. Create new project: "FlowGuard"
3. Build cluster → Choose M0 (Free tier)
4. Choose region: Closest to your location
5. Cluster name: `flowguard-cluster`
6. Security:
   - Database Access → Add new database user
   - Username: `flowguard-admin`
   - Password: (generate secure password, save it!)
   - Built-in Role: `Atlas admin`
7. Network Access → Add IP Address → "Allow access from anywhere" (0.0.0.0/0)
8. Connect → Drivers → Node.js → Copy connection string
9. Replace `<password>` with your password
10. Set environment variable: `MONGODB_URI=mongodb+srv://...`

**Post-Setup:**
- Database name: `flowguard`
- Collections will be created automatically on first use

---

### 3. Arize Phoenix (REQUIRED - Sponsor Track $1,000)
**Purpose:** AI observability, experiment tracking, evaluation loops

- **Account:** Phoenix is open-source, runs locally via Docker
- **Pricing:** Free (self-hosted)
- **Alternative:** Arize Phoenix Cloud (paid, optional)
- **Required for:** Tracing all AI decisions, running experiments

**Local Setup (Recommended for Development):**
```bash
# Run Phoenix locally via Docker
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest

# Phoenix UI available at: http://localhost:6006
# OTLP endpoint: http://localhost:4317
```

**Cloud Setup (Optional for Production):**
1. Sign up at https://app.arize.com
2. Create Phoenix project
3. Get cloud endpoint URL
4. Set `PHOENIX_ENDPOINT=https://your-instance.arize.com/v1/traces`

**Environment Variables:**
- Local: `PHOENIX_ENDPOINT=http://localhost:6006/v1/traces`
- Cloud: `PHOENIX_ENDPOINT=https://your-phoenix.arize.com/v1/traces`

---

### 4. DigitalOcean (REQUIRED - Cloud Infrastructure)
**Purpose:** Functions, Spaces, App Platform, Droplets

- **Account:** Sign up at https://cloud.digitalocean.com
- **Pricing:**
  - Functions: $1.85/100K GB-seconds
  - Spaces: $5/month for 250GB
  - Droplets: $6/month (Basic)
  - App Platform: $5/month (Basic)
- **Free Credit:** $200 credit for 60 days (via referral links)
- **Required for:** Cloud execution, webhook handling, storage

**Steps:**
1. Create account at https://cloud.digitalocean.com
2. Add payment method (required even for free credit)
3. Navigate to API → Tokens/Keys → Generate New Token
   - Token name: `flowguard-api`
   - Expiration: No expiration
   - Scopes: Read + Write
4. Copy token starting with `dop_v1_...`
5. Set environment variable: `DO_API_TOKEN=dop_v1_...`

**Spaces Setup:**
1. Create → Spaces Object Storage
2. Choose region: `nyc3` (or closest)
3. Unique name: `flowguard-artifacts-{your-initials}`
4. Enable CDN: Yes
5. Generate Spaces access keys:
   - Navigate to API → Spaces Keys → Generate New Key
   - Key name: `flowguard-spaces`
   - Copy Access Key and Secret Key
6. Set environment variables:
   - `DO_SPACES_KEY=<access-key>`
   - `DO_SPACES_SECRET=<secret-key>`
   - `DO_SPACES_BUCKET=flowguard-artifacts-{your-initials}`
   - `DO_SPACES_REGION=nyc3`

---

### 5. Browserbase (REQUIRED - Cloud Browser Testing)
**Purpose:** Cloud browser execution, session recordings

- **Account:** Sign up at https://browserbase.com
- **Pricing:**
  - Free tier: 100 sessions/month
  - Pro: $50/month (1000 sessions)
- **Required for:** CI/CD browser testing, session recordings

**Steps:**
1. Create account at https://browserbase.com
2. Create new project: "FlowGuard"
3. Navigate to Settings → API Keys
4. Create API key
5. Copy project ID and API key
6. Set environment variables:
   - `BROWSERBASE_API_KEY=<api-key>`
   - `BROWSERBASE_PROJECT_ID=<project-id>`

**Note:** For local development, Browserbase is optional. Use local Playwright initially.

---

### 6. CrUX API (REQUIRED - Real User Metrics)
**Purpose:** Chrome User Experience real user metrics

- **Account:** Google Cloud Console
- **Pricing:** Free (no quota limits)
- **Required for:** Baseline UX metrics (LCP, CLS, INP)

**Steps:**
1. Go to https://console.cloud.google.com
2. Create new project: "flowguard"
3. Enable Chrome UX Report API:
   - Navigate to APIs & Services → Library
   - Search "Chrome UX Report API"
   - Click Enable
4. Create API key:
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - Restrict key → Chrome UX Report API only
5. Set environment variable: `CRUX_API_KEY=<api-key>`

**Note:** CrUX data not available for all URLs. Implement graceful fallback.

---

### 7. Wood Wide AI (REQUIRED - Sponsor Track $750)
**Purpose:** Statistical analysis, significance testing

- **Account:** Sign up at https://woodwide.ai
- **Pricing:** Contact for API access (beta program)
- **Required for:** Statistical validation of UX claims
- **API Docs:** https://docs.woodwide.ai

**Steps:**
1. Sign up at https://woodwide.ai
2. Request API access (mention NexHacks 2026)
3. Receive API key via email
4. Set environment variable: `WOOD_WIDE_API_KEY=<api-key>`

**Note:** If Wood Wide unavailable, implement basic statistical tests (t-test, z-score) as fallback.

---

### 8. GitHub (REQUIRED - GitHub App Integration)
**Purpose:** PR automation, check runs, webhooks

- **Account:** GitHub account (free)
- **Pricing:** Free for public repos, GitHub Apps free
- **Required for:** Automated testing on pull requests

**GitHub App Setup:**
1. Navigate to https://github.com/settings/apps
2. Click "New GitHub App"
3. App name: `FlowGuard UX Analyzer`
4. Homepage URL: `https://github.com/your-org/flowguard`
5. Webhook URL: `https://your-droplet-ip/api/webhooks/github` (set later)
6. Webhook secret: Generate random string (save it!)
   ```bash
   openssl rand -hex 32
   ```
7. Permissions:
   - Repository: Contents (Read), Pull requests (Read & Write), Checks (Read & Write)
8. Subscribe to events: `pull_request`, `push`
9. Create app
10. Generate private key (download `.pem` file)
11. Set environment variables:
   - `GITHUB_APP_ID=<app-id>`
   - `GITHUB_PRIVATE_KEY="$(cat path/to/private-key.pem)"`
   - `GITHUB_WEBHOOK_SECRET=<webhook-secret>`

**Note:** GitHub App installation happens per repository. Users install your app.

---

## Environment Variables

### Complete `.env` File Template

Create `.env` file in project root:

```bash
# ============================================
# FlowGuard AI - Environment Variables
# ============================================

# -------------------- REQUIRED --------------------

# Anthropic API (Vision Analysis)
ANTHROPIC_API_KEY=sk-ant-api03-...

# MongoDB Atlas (Primary Storage)
MONGODB_URI=mongodb+srv://flowguard-admin:PASSWORD@flowguard-cluster.mongodb.net/flowguard?retryWrites=true&w=majority

# Arize Phoenix (AI Observability)
# Local:
PHOENIX_ENDPOINT=http://localhost:6006/v1/traces
# Production (if using cloud):
# PHOENIX_ENDPOINT=https://your-phoenix.arize.com/v1/traces

# DigitalOcean (Cloud Infrastructure)
DO_API_TOKEN=dop_v1_...
DO_SPACES_KEY=<access-key>
DO_SPACES_SECRET=<secret-key>
DO_SPACES_BUCKET=flowguard-artifacts-xyz
DO_SPACES_REGION=nyc3

# Browserbase (Cloud Browser Testing)
BROWSERBASE_API_KEY=<api-key>
BROWSERBASE_PROJECT_ID=<project-id>

# CrUX API (Real User Metrics)
CRUX_API_KEY=<google-api-key>

# Wood Wide AI (Statistical Analysis)
WOOD_WIDE_API_KEY=<api-key>

# GitHub App (PR Automation)
GITHUB_APP_ID=<app-id>
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=<webhook-secret>

# -------------------- OPTIONAL --------------------

# Environment
NODE_ENV=development  # development | production

# Execution Mode
EXECUTION_MODE=local  # local | cloud

# Feature Flags
ENABLE_VISION_CACHE=true
ENABLE_BROWSERBASE=false  # Set true for cloud testing
ENABLE_CRUX=true
ENABLE_WOOD_WIDE=true

# Performance
MAX_CONCURRENT_FLOWS=3
VISION_API_TIMEOUT=30000  # 30 seconds
SCREENSHOT_QUALITY=90     # 0-100

# Logging
LOG_LEVEL=info  # debug | info | warn | error
LOG_FORMAT=pretty  # pretty | json
```

### Environment Variable Validation

Add to `src/config.ts`:

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  // Required
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  MONGODB_URI: z.string().startsWith('mongodb'),
  PHOENIX_ENDPOINT: z.string().url(),
  DO_SPACES_KEY: z.string().min(1),
  DO_SPACES_SECRET: z.string().min(1),
  DO_SPACES_BUCKET: z.string().min(1),
  DO_SPACES_REGION: z.string().min(1),

  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  EXECUTION_MODE: z.enum(['local', 'cloud']).default('local'),
  ENABLE_VISION_CACHE: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const config = EnvSchema.parse(process.env);
```

---

## Local Development Setup

### Prerequisites

- **Node.js:** >= 18.0.0 (check: `node --version`)
- **npm:** >= 9.0.0 (check: `npm --version`)
- **Docker:** Latest (for Phoenix) (check: `docker --version`)
- **Git:** Latest (check: `git --version`)

### Step-by-Step Setup

#### 1. Clone Repository
```bash
cd /Users/jibril/Desktop/Coding/NexHacks
git checkout feat/flowguard-enhanced-architecture
```

#### 2. Install Dependencies
```bash
npm install

# Install NEW dependencies for MongoDB, DO, etc.
npm install mongodb @aws-sdk/client-s3 @octokit/rest @octokit/auth-app
```

#### 3. Set Up Environment Variables
```bash
# Copy template
cp .env.example .env

# Edit with your API keys
nano .env  # or your preferred editor
```

#### 4. Start Phoenix Locally
```bash
# In separate terminal
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest

# Verify: Open http://localhost:6006 in browser
```

#### 5. Verify MongoDB Connection
```bash
# Test connection
npm run test:db-connection
```

Create test script in `scripts/test-db-connection.ts`:
```typescript
import { MongoClient } from 'mongodb';

async function testConnection() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    console.log('✅ MongoDB connected successfully');
    await client.db('flowguard').command({ ping: 1 });
    console.log('✅ Database ping successful');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
```

#### 6. Install Playwright Browsers
```bash
npx playwright install chromium
npx playwright install-deps chromium
```

#### 7. Run Type Checking
```bash
npm run typecheck
```

#### 8. Run Tests
```bash
npm test
```

---

## Cloud Infrastructure Setup

### DigitalOcean Droplet Setup

#### 1. Create Droplet
```bash
# Via UI:
# - Create → Droplets
# - Image: Ubuntu 24.04 LTS
# - Plan: Basic $6/month (1GB RAM)
# - Region: nyc3
# - Authentication: SSH key
# - Hostname: flowguard-runner
```

#### 2. Configure Droplet
```bash
# SSH into droplet
ssh root@<droplet-ip>

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Playwright dependencies
npx playwright install-deps chromium

# Install FlowGuard
git clone https://github.com/your-org/flowguard.git /opt/flowguard
cd /opt/flowguard
npm install
npm run build

# Set up environment variables
cat > /etc/flowguard/.env <<EOF
ANTHROPIC_API_KEY=...
MONGODB_URI=...
PHOENIX_ENDPOINT=...
EOF

# Create systemd service
cat > /etc/systemd/system/flowguard.service <<EOF
[Unit]
Description=FlowGuard Test Runner
After=network.target

[Service]
Type=simple
User=flowguard
WorkingDirectory=/opt/flowguard
EnvironmentFile=/etc/flowguard/.env
ExecStart=/usr/bin/node dist/cli.js run --format json
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl enable flowguard
systemctl start flowguard
```

### DigitalOcean Functions Setup

#### 1. Install `doctl` CLI
```bash
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.98.0/doctl-1.98.0-linux-amd64.tar.gz
tar xf doctl-1.98.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init
# Paste your DO API token
```

#### 2. Create Functions Project
```bash
# Initialize
doctl serverless init --language js flowguard-functions

# Connect to namespace
doctl serverless connect
```

#### 3. Deploy Webhook Function
Create `packages/flowguard/webhook-handler/index.js`:
```javascript
export async function main(args) {
  const { body, headers } = args;

  // Verify GitHub signature
  const signature = headers['x-hub-signature-256'];
  // ... signature verification ...

  // Queue test in MongoDB
  // ... implementation ...

  return {
    statusCode: 202,
    body: { message: 'Test queued', jobId: '...' }
  };
}
```

Deploy:
```bash
doctl serverless deploy flowguard-functions
```

---

## Dependency Installation

### Update `package.json`

Add new dependencies:

```json
{
  "dependencies": {
    // Existing
    "@anthropic-ai/sdk": "^0.32.0",
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.56.0",
    "@opentelemetry/resources": "^2.4.0",
    "@opentelemetry/sdk-trace-node": "^1.29.0",
    "@opentelemetry/semantic-conventions": "^1.28.0",
    "commander": "^12.1.0",
    "playwright": "^1.49.0",
    "yaml": "^2.6.1",
    "zod": "^3.24.1",

    // NEW - MongoDB
    "mongodb": "^6.11.0",

    // NEW - DigitalOcean Spaces (S3-compatible)
    "@aws-sdk/client-s3": "^3.699.0",

    // NEW - GitHub App
    "@octokit/rest": "^21.0.2",
    "@octokit/auth-app": "^7.1.3",

    // NEW - Browserbase (if used)
    "playwright-core": "^1.49.0"
  }
}
```

Install all:
```bash
npm install
```

---

## Pre-Implementation Checklist

### ✅ Phase 0: Accounts & Keys (Complete This First!)

- [ ] **Anthropic API**
  - [ ] Account created
  - [ ] API key generated
  - [ ] Payment method added
  - [ ] `ANTHROPIC_API_KEY` in `.env`
  - [ ] Test: `curl https://api.anthropic.com/v1/messages` with key

- [ ] **MongoDB Atlas**
  - [ ] Account created
  - [ ] M0 cluster created
  - [ ] Database user created
  - [ ] IP whitelist configured (0.0.0.0/0)
  - [ ] Connection string obtained
  - [ ] `MONGODB_URI` in `.env`
  - [ ] Test: Connection script passes

- [ ] **Arize Phoenix**
  - [ ] Docker installed
  - [ ] Phoenix container running on port 6006
  - [ ] UI accessible at http://localhost:6006
  - [ ] `PHOENIX_ENDPOINT` in `.env`
  - [ ] Test: Send test trace

- [ ] **DigitalOcean**
  - [ ] Account created
  - [ ] Payment method added
  - [ ] API token generated
  - [ ] Spaces bucket created
  - [ ] Spaces keys generated
  - [ ] All DO env vars in `.env`
  - [ ] Test: Upload test file to Spaces

- [ ] **Browserbase** (Optional initially)
  - [ ] Account created
  - [ ] Project created
  - [ ] API key obtained
  - [ ] Env vars in `.env`
  - [ ] Test: Create test session

- [ ] **CrUX API**
  - [ ] Google Cloud project created
  - [ ] CrUX API enabled
  - [ ] API key generated
  - [ ] `CRUX_API_KEY` in `.env`
  - [ ] Test: Fetch test URL metrics

- [ ] **Wood Wide AI**
  - [ ] Beta access requested
  - [ ] API key received
  - [ ] `WOOD_WIDE_API_KEY` in `.env`
  - [ ] Test: Run test analysis

- [ ] **GitHub App** (For Phase 5)
  - [ ] GitHub App created
  - [ ] Private key downloaded
  - [ ] Webhook secret generated
  - [ ] All GitHub env vars in `.env`

### ✅ Phase 0: Local Environment

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Docker installed and running (`docker --version`)
- [ ] Git configured
- [ ] `feat/flowguard-enhanced-architecture` branch checked out
- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file created with ALL required keys
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Existing tests pass (`npm test`)
- [ ] Phoenix running locally (http://localhost:6006)
- [ ] MongoDB connection test passes

---

## Implementation Order

### Week 1: Foundation (Phase 1)

**Day 1-2: MongoDB Integration**
- [ ] Create `src/db/` directory structure
- [ ] Implement schemas (time-series, vision cache, flows)
- [ ] Create database client and connection pool
- [ ] Implement repository pattern (CRUD operations)
- [ ] Write tests for all database operations
- [ ] **REMOVE all JSON file writes** from existing code

**Day 3: Vision Cache**
- [ ] Implement screenshot hashing (SHA-256)
- [ ] Create cache lookup before API calls
- [ ] Implement TTL expiration (7-day default)
- [ ] Add cache hit/miss metrics
- [ ] Test: Verify 80%+ cache hit rate

**Day 4-5: CLI MongoDB Integration**
- [ ] Update `flowguard run` to save to MongoDB
- [ ] Add `flowguard trends <flow>` command
- [ ] Add `flowguard search <query>` (Atlas Search)
- [ ] Add `flowguard costs` analytics
- [ ] Test: All commands with `--format json`

### Week 2: Cloud Infrastructure (Phase 2 & 3)

**Day 1-2: Phoenix Experiments**
- [ ] Create Python evaluation scripts
- [ ] Build benchmark dataset (50+ examples)
- [ ] Implement experiment runner
- [ ] Set up A/B testing infrastructure
- [ ] Run first experiment, measure accuracy

**Day 3-4: DigitalOcean Setup**
- [ ] Implement Spaces storage client
- [ ] Deploy Functions for webhooks
- [ ] Set up Droplet for test execution
- [ ] Configure App Platform for dashboard
- [ ] Test: Upload screenshot to Spaces

**Day 5: Browserbase Integration**
- [ ] Implement session creation
- [ ] Connect Playwright to cloud browser
- [ ] Add session recording links to reports
- [ ] Test: Run flow on Browserbase

### Week 3: Automation & Analytics (Phase 4, 5, 6)

**Day 1-2: GitHub App**
- [ ] Create webhook handler
- [ ] Implement signature verification
- [ ] Add PR comment generation
- [ ] Create GitHub Check runs
- [ ] Test: Trigger via test PR

**Day 3-4: CrUX & Wood Wide**
- [ ] Implement CrUX API client
- [ ] Add graceful fallback for missing data
- [ ] Integrate Wood Wide statistical analysis
- [ ] Add metrics to reports
- [ ] Test: Generate report with all insights

**Day 5: Integration Testing**
- [ ] End-to-end test: GitHub PR → Test → MongoDB → Report
- [ ] Verify Phoenix traces for entire flow
- [ ] Check cost optimizations (cache hit rate)
- [ ] Performance test: <30s flow execution
- [ ] Security audit: No API keys in logs

### Week 4: Polish & Demo

**Day 1-2: Agent-Native Features**
- [ ] Ensure all commands support `--format json`
- [ ] Add structured error codes
- [ ] Implement MCP tool definitions (optional)
- [ ] Test: Agent can run flows autonomously

**Day 3: Documentation**
- [ ] Update README with new features
- [ ] Create API documentation
- [ ] Write deployment guide
- [ ] Record demo video

**Day 4: NexHacks Prep**
- [ ] Prepare live demo script
- [ ] Create backup recorded demo
- [ ] Test on fresh environment
- [ ] Prepare judge presentation

**Day 5: Final Testing**
- [ ] Run full test suite
- [ ] Verify all sponsor integrations
- [ ] Check error handling
- [ ] Confirm hackathon submission requirements

---

## Quick Start Script

Create `scripts/setup.sh` for one-command setup:

```bash
#!/bin/bash
set -e

echo "🚀 FlowGuard AI - Development Setup"
echo "===================================="

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install Node.js 18+ first."
  exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "⚠️  Docker not found. Phoenix tracing will be unavailable."
else
  echo "✅ Docker $(docker --version) found"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check .env file
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating from template..."
  cp .env.example .env
  echo "⚠️  Please edit .env and add your API keys"
  exit 1
fi

# Start Phoenix
echo "🔥 Starting Arize Phoenix..."
docker run -d -p 6006:6006 -p 4317:4317 --name flowguard-phoenix arizephoenix/phoenix:latest

# Test MongoDB connection
echo "🍃 Testing MongoDB connection..."
npm run test:db-connection

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium
npx playwright install-deps chromium

# Build
echo "🏗️  Building..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ Setup complete!"
echo "📊 Phoenix UI: http://localhost:6006"
echo "🚀 Run: npm run dev"
```

Make executable:
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

## Troubleshooting

### MongoDB Connection Issues
```bash
# Test connection string
mongosh "mongodb+srv://flowguard-admin:PASSWORD@cluster.mongodb.net/flowguard"

# Check IP whitelist
# MongoDB Atlas → Network Access → verify 0.0.0.0/0 is allowed
```

### Phoenix Not Starting
```bash
# Check if port is in use
lsof -i :6006

# Kill existing process
docker stop flowguard-phoenix
docker rm flowguard-phoenix

# Restart
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest
```

### Anthropic API Rate Limits
```bash
# Check current tier
curl https://api.anthropic.com/v1/rate-limits \
  -H "x-api-key: $ANTHROPIC_API_KEY"

# Implement exponential backoff in code
# See src/vision.ts for retry logic
```

### Browserbase Session Failures
```bash
# Verify API key
curl https://api.browserbase.com/v1/sessions \
  -H "x-bb-api-key: $BROWSERBASE_API_KEY"

# Check project ID
echo $BROWSERBASE_PROJECT_ID
```

---

## Cost Estimates

### Monthly Costs (Development)

| Service | Tier | Cost/Month | Notes |
|---------|------|------------|-------|
| Anthropic API | Pay-as-you-go | $20-50 | ~500 vision calls/day |
| MongoDB Atlas | M0 Free | $0 | 512MB storage |
| Arize Phoenix | Self-hosted | $0 | Docker container |
| DigitalOcean | Basic | $18 | Droplet + Spaces + Functions |
| Browserbase | Free | $0 | 100 sessions/month |
| CrUX API | Free | $0 | No limits |
| Wood Wide AI | Beta | $0 | Free during beta |
| **Total** | | **~$40/month** | With vision cache |

### Cost Optimization
- **Vision Cache:** 80% cache hit = $160/month savings
- **MongoDB:** Stay on M0 free tier (<512MB data)
- **Browserbase:** Use local Playwright for dev, Browserbase for CI only
- **DO Droplet:** $6/month Basic is sufficient for CI tests

---

## Next Steps

**After completing this checklist:**

1. ✅ Verify all API keys working
2. ✅ Run `scripts/setup.sh`
3. ✅ Review `plans/feat-flowguard-enhanced-architecture.md`
4. 🚀 Run `/workflows:work` to begin implementation
5. 📊 Monitor Phoenix at http://localhost:6006 during development

**Ready to start?** Type `/workflows:work` to begin Phase 1 (MongoDB Integration).
