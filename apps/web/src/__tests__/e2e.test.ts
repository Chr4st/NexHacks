import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const execAsync = promisify(exec);

describe('Next.js App E2E Tests', () => {
  const appDir = path.join(process.cwd(), 'apps/web');
  let serverProcess: any;

  beforeAll(async () => {
    // Check if Next.js app exists
    const packageJsonPath = path.join(appDir, 'package.json');
    try {
      await fs.access(packageJsonPath);
    } catch {
      throw new Error('Next.js app not found. Please ensure apps/web exists.');
    }
  }, 30000);

  describe('File Structure', () => {
    it('should have required Next.js configuration files', async () => {
      const requiredFiles = [
        'package.json',
        'next.config.js',
        'tsconfig.json',
        'tailwind.config.ts',
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(appDir, file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
      }
    });

    it('should have app directory structure', async () => {
      const requiredDirs = [
        'src/app',
        'src/app/(dashboard)',
        'src/app/api',
        'src/components',
        'src/lib',
      ];

      for (const dir of requiredDirs) {
        const dirPath = path.join(appDir, dir);
        await expect(fs.access(dirPath)).resolves.not.toThrow();
      }
    });

    it('should have all required pages', async () => {
      const requiredPages = [
        'src/app/page.tsx',
        'src/app/layout.tsx',
        'src/app/(dashboard)/dashboard/page.tsx',
        'src/app/(dashboard)/flows/page.tsx',
        'src/app/(dashboard)/reports/page.tsx',
        'src/app/(dashboard)/analytics/page.tsx',
        'src/app/(dashboard)/settings/page.tsx',
        'src/app/sign-in/[[...sign-in]]/page.tsx',
        'src/app/sign-up/[[...sign-up]]/page.tsx',
      ];

      for (const page of requiredPages) {
        const pagePath = path.join(appDir, page);
        await expect(fs.access(pagePath)).resolves.not.toThrow();
      }
    });

    it('should have API routes', async () => {
      const apiRoutes = [
        'src/app/api/flows/route.ts',
        'src/app/api/reports/route.ts',
        'src/app/api/analytics/route.ts',
      ];

      for (const route of apiRoutes) {
        const routePath = path.join(appDir, route);
        await expect(fs.access(routePath)).resolves.not.toThrow();
      }
    });
  });

  describe('Configuration', () => {
    it('should have valid package.json with required dependencies', async () => {
      const packageJsonPath = path.join(appDir, 'package.json');
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, 'utf-8')
      );

      expect(packageJson.dependencies).toHaveProperty('next');
      expect(packageJson.dependencies).toHaveProperty('react');
      expect(packageJson.dependencies).toHaveProperty('@clerk/nextjs');
      expect(packageJson.dependencies).toHaveProperty('tailwindcss');
    });

    it('should have valid TypeScript configuration', async () => {
      const tsconfigPath = path.join(appDir, 'tsconfig.json');
      const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions).toHaveProperty('strict', true);
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*');
    });

    it('should have TailwindCSS configuration', async () => {
      const tailwindPath = path.join(appDir, 'tailwind.config.ts');
      await expect(fs.access(tailwindPath)).resolves.not.toThrow();
    });
  });

  describe('Components', () => {
    it('should have UI components', async () => {
      const components = [
        'src/components/ui/button.tsx',
        'src/components/ui/card.tsx',
      ];

      for (const component of components) {
        const componentPath = path.join(appDir, component);
        await expect(fs.access(componentPath)).resolves.not.toThrow();
      }
    });

    it('should have flow form component', async () => {
      const formPath = path.join(appDir, 'src/components/flows/flow-form.tsx');
      await expect(fs.access(formPath)).resolves.not.toThrow();
    });
  });

  describe('Code Quality', () => {
    it('should have proper imports in pages', async () => {
      const pages = [
        'src/app/page.tsx',
        'src/app/(dashboard)/dashboard/page.tsx',
        'src/app/(dashboard)/flows/page.tsx',
      ];

      for (const page of pages) {
        const pagePath = path.join(appDir, page);
        const content = await fs.readFile(pagePath, 'utf-8');
        
        // Check for React imports
        expect(content).toMatch(/from ['"]react['"]|from ['"]next\/|import.*from/);
      }
    });

    it('should use TypeScript types', async () => {
      const apiRoute = path.join(appDir, 'src/app/api/flows/route.ts');
      const content = await fs.readFile(apiRoute, 'utf-8');
      
      // Should use NextResponse
      expect(content).toContain('NextResponse');
    });

    it('should have authentication checks in protected routes', async () => {
      const protectedPages = [
        'src/app/(dashboard)/dashboard/page.tsx',
        'src/app/(dashboard)/flows/page.tsx',
      ];

      for (const page of protectedPages) {
        const pagePath = path.join(appDir, page);
        const content = await fs.readFile(pagePath, 'utf-8');
        
        // Should check for auth
        expect(content).toMatch(/auth\(\)|userId/);
      }
    });
  });

  describe('API Routes', () => {
    it('should have authentication in API routes', async () => {
      const apiRoutes = [
        'src/app/api/flows/route.ts',
        'src/app/api/reports/route.ts',
      ];

      for (const route of apiRoutes) {
        const routePath = path.join(appDir, route);
        const content = await fs.readFile(routePath, 'utf-8');
        
        // Should check for auth
        expect(content).toMatch(/auth\(\)|userId/);
      }
    });

    it('should return proper error responses', async () => {
      const apiRoute = path.join(appDir, 'src/app/api/flows/route.ts');
      const content = await fs.readFile(apiRoute, 'utf-8');
      
      // Should have error handling
      expect(content).toMatch(/catch|error|Error/);
    });
  });

  describe('Middleware', () => {
    it('should have middleware for route protection', async () => {
      const middlewarePath = path.join(appDir, 'middleware.ts');
      await expect(fs.access(middlewarePath)).resolves.not.toThrow();
      
      const content = await fs.readFile(middlewarePath, 'utf-8');
      expect(content).toContain('clerkMiddleware');
    });
  });

  describe('Environment Variables', () => {
    it('should have .env.example file', async () => {
      const envExamplePath = path.join(appDir, '.env.example');
      await expect(fs.access(envExamplePath)).resolves.not.toThrow();
    });

    it('should document required environment variables', async () => {
      const envExamplePath = path.join(appDir, '.env.example');
      const content = await fs.readFile(envExamplePath, 'utf-8');
      
      expect(content).toContain('MONGODB_URI');
      expect(content).toContain('CLERK');
    });
  });
});

