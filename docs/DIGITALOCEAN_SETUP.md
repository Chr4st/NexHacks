# DigitalOcean Setup Guide

## 1. Create Spaces Bucket

1. Go to DigitalOcean Console → Spaces
2. Click "Create Spaces Bucket"
3. Name: `flowguard-artifacts-{random}`
4. Region: `nyc3` (New York)
5. Enable CDN
6. Create

## 2. Generate API Keys

1. API → Spaces Keys
2. Generate New Key
3. Copy Access Key and Secret
4. Add to `.env`:
   ```bash
   DO_SPACES_KEY=<access-key>
   DO_SPACES_SECRET=<secret-key>
   DO_SPACES_BUCKET=flowguard-artifacts-{your-bucket-name}
   DO_SPACES_REGION=nyc3
   DO_SPACES_CDN_ENDPOINT=https://flowguard-artifacts-{your-bucket-name}.nyc3.cdn.digitaloceanspaces.com
   ```

## 3. Setup Droplet (CI Runner)

```bash
# Create droplet
doctl compute droplet create flowguard-ci \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc3 \
  --ssh-keys <your-ssh-key-id>

# SSH into droplet
ssh root@<droplet-ip>

# Run setup script
curl -fsSL https://raw.githubusercontent.com/Chr4st/NexHacks/main/scripts/setup-droplet.sh | bash
```

## 4. Verify Setup

```bash
# Check storage stats
flowguard storage --stats

# Upload test screenshot
flowguard storage --upload test.png
```

## 5. Setup Automated Cleanup

Add to crontab:
```bash
0 2 * * * cd /home/flowguard && /usr/bin/node scripts/cleanup-old-artifacts.js
```

This runs daily at 2 AM to clean up artifacts older than 30 days.

