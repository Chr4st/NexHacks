# GitHub App Setup Guide

This guide walks you through setting up the FlowGuard GitHub App for automatic PR testing.

## Prerequisites

- GitHub account with admin access to your organization/repository
- Node.js 18+
- A server or service to receive webhooks (e.g., DigitalOcean Droplet, Vercel, etc.)

## 1. Create GitHub App

1. Go to **GitHub → Settings → Developer settings → GitHub Apps**
2. Click **"New GitHub App"**
3. Fill in the details:

| Field | Value |
|-------|-------|
| **App name** | FlowGuard (your-org) |
| **Homepage URL** | https://github.com/YOUR_ORG/flowguard |
| **Webhook URL** | https://your-server.com/webhooks/github |
| **Webhook secret** | Generate a random string (save this!) |

## 2. Set Permissions

Under **Repository permissions**:

| Permission | Access |
|------------|--------|
| **Pull requests** | Read & write |
| **Checks** | Read & write |
| **Contents** | Read-only |
| **Issues** | Read & write |

## 3. Subscribe to Events

Check these events:
- ✅ `Pull request`
- ✅ `Push`

## 4. Generate Private Key

1. After creating the app, scroll down to **"Private keys"**
2. Click **"Generate a private key"**
3. Download the `.pem` file and store it securely
4. **Never commit this file to git!**

## 5. Configure Environment

Add these to your `.env`:

```bash
# GitHub App Configuration
GITHUB_APP_ID=<your-app-id>
GITHUB_PRIVATE_KEY_PATH=./github-app-private-key.pem
GITHUB_WEBHOOK_SECRET=<your-webhook-secret>

# Or use inline private key (escape newlines)
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

## 6. Install App to Repository

1. Go to your GitHub App settings page
2. Click **"Install App"** in the sidebar
3. Select your organization or personal account
4. Choose which repositories to install on
5. Click **Install**

## 7. Start Webhook Server

### Option A: Run Locally with ngrok

```bash
# Terminal 1: Start the webhook server
npm run build
node dist/github/server.js

# Terminal 2: Expose with ngrok
ngrok http 3000
```

Update the webhook URL in your GitHub App settings with the ngrok URL.

### Option B: Deploy to DigitalOcean

```bash
# Using doctl CLI
doctl apps create --spec deploy/app.yaml
```

### Option C: Deploy to Vercel

The webhook handler can be deployed as a serverless function.

## 8. Test the Integration

1. Open a new Pull Request in your repository
2. Check your webhook server logs for incoming events
3. Verify:
   - ✅ Check run appears on the PR
   - ✅ FlowGuard tests execute
   - ✅ PR comment with results is posted

## Troubleshooting

### Webhook not receiving events

1. Check the webhook URL is correct
2. Verify the server is running and accessible
3. Check GitHub App → Advanced → Recent Deliveries

### Signature verification failed

1. Ensure `GITHUB_WEBHOOK_SECRET` matches the secret in GitHub App settings
2. Check the raw body is being preserved correctly

### Authentication errors

1. Verify `GITHUB_APP_ID` is correct
2. Check the private key file path and contents
3. Ensure the app is installed on the repository

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate keys regularly** - Generate new private keys periodically
3. **Use HTTPS** - Always use secure connections for webhooks
4. **Validate signatures** - Always verify webhook signatures
5. **Limit permissions** - Only request necessary permissions

## Architecture

```
┌─────────────────┐      ┌──────────────────┐
│   GitHub PR     │──────│  Webhook Server  │
│   Events        │      │  (Express)       │
└─────────────────┘      └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │  Webhook Handler │
                         └────────┬─────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
  ┌───────▼───────┐      ┌───────▼───────┐      ┌───────▼───────┐
  │ GitHub App    │      │ Test Runner   │      │ Comment       │
  │ Client        │      │ (FlowGuard)   │      │ Generator     │
  └───────────────┘      └───────────────┘      └───────────────┘
```

## API Reference

See [src/github/index.ts](../src/github/index.ts) for available exports.
