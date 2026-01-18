import express, { Express, Request, Response, NextFunction } from 'express';
import type { WebhookHandler } from './webhook-handler.js';
import type { PullRequestPayload } from './types.js';

export interface WebhookServerConfig {
  webhookHandler: WebhookHandler;
  webhookSecret: string;
}

export function createWebhookServer(config: WebhookServerConfig): Express {
  const { webhookHandler } = config;
  const app = express();

  app.use(express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf.toString();
    }
  }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'flowguard-webhook-server',
      timestamp: new Date().toISOString()
    });
  });

  app.post('/webhooks/github', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const event = req.headers['x-github-event'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (!signature) {
        res.status(401).json({ error: 'Missing signature header' });
        return;
      }

      if (!event) {
        res.status(400).json({ error: 'Missing event header' });
        return;
      }

      try {
        const payload = webhookHandler.verifyAndParse(rawBody, signature);

        res.status(202).json({ 
          status: 'accepted',
          event,
          message: 'Webhook received and processing'
        });

        if (event === 'pull_request') {
          await webhookHandler.handlePullRequest(payload as PullRequestPayload);
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Invalid webhook signature') {
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Webhook error:', error);
      next(error);
    }
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  });

  return app;
}

export function startServer(app: Express, port: number = 3000): void {
  app.listen(port, () => {
    console.log(`FlowGuard webhook server listening on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Webhook endpoint: http://localhost:${port}/webhooks/github`);
  });
}
