/**
 * Deep repository analyzer for discovering routes and generating comprehensive flows
 */

import { Octokit } from '@octokit/rest';
import { parseRepoUrl } from './github';
import fs from 'fs/promises';
import path from 'path';

export interface RepoAnalysis {
  repository: {
    owner: string;
    repo: string;
    fullName: string;
    description: string;
    homepage: string;
    language: string;
  };
  routes: Route[];
  components: string[];
  apiEndpoints: string[];
  analyzedAt: string;
  fileCount: number;
}

export interface Route {
  path: string;
  type: 'page' | 'api' | 'dynamic';
  file: string;
  params?: string[];
}

const CACHE_DIR = path.join(process.cwd(), 'src/.cache/repo-analysis');

/**
 * Get cached analysis or analyze repo from scratch
 */
export async function getOrAnalyzeRepo(
  repoUrl: string,
  forceRefresh = false
): Promise<RepoAnalysis> {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const cacheFile = path.join(CACHE_DIR, `${owner}-${repo}.json`);

  // Try to load from cache
  if (!forceRefresh) {
    try {
      const cached = await fs.readFile(cacheFile, 'utf-8');
      const analysis = JSON.parse(cached);
      console.log(`✅ Loaded analysis from cache for ${owner}/${repo}`);
      return analysis;
    } catch {
      // Cache miss, proceed with analysis
      console.log(`📊 No cache found, analyzing ${owner}/${repo}...`);
    }
  }

  // Analyze repo
  const analysis = await analyzeRepository(repoUrl);

  // Save to cache
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(analysis, null, 2));
    console.log(`💾 Cached analysis for ${owner}/${repo}`);
  } catch (error) {
    console.error('Failed to cache analysis:', error);
  }

  return analysis;
}

/**
 * Analyze repository structure and discover routes
 */
async function analyzeRepository(repoUrl: string): Promise<RepoAnalysis> {
  const { owner, repo } = parseRepoUrl(repoUrl);

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  // Get repo metadata
  const { data: repoData } = await octokit.repos.get({ owner, repo });

  // Discover files
  const allFiles = await discoverFiles(octokit, owner, repo);
  console.log(`📁 Discovered ${allFiles.length} files total`);
  console.log(`📁 Route files found:`, allFiles.filter(f => f.path.includes('routes/')).map(f => f.path));

  // Analyze routes (including Express routes)
  const routes = await discoverRoutes(allFiles, octokit, owner, repo);
  const components = allFiles
    .filter((f) => f.path.includes('/components/') && (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')))
    .map((f) => f.path);
  const apiEndpoints = routes.filter((r) => r.type === 'api').map((r) => r.path);

  return {
    repository: {
      owner,
      repo,
      fullName: repoData.full_name,
      description: repoData.description || '',
      homepage: repoData.homepage || '',
      language: repoData.language || 'Unknown',
    },
    routes,
    components,
    apiEndpoints,
    analyzedAt: new Date().toISOString(),
    fileCount: allFiles.length,
  };
}

/**
 * Recursively discover all files in the repository
 */
async function discoverFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  path = '',
  maxDepth = 10,
  currentDepth = 0
): Promise<Array<{ path: string; type: string; size: number }>> {
  if (currentDepth >= maxDepth) return [];

  try {
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (!Array.isArray(contents)) return [];

    const files: Array<{ path: string; type: string; size: number }> = [];

    for (const item of contents) {
      if (item.type === 'file') {
        files.push({
          path: item.path,
          type: item.type,
          size: item.size || 0,
        });
      } else if (item.type === 'dir') {
        // Skip ONLY node_modules and .git
        const skipDirs = ['node_modules', '.git'];
        if (skipDirs.some((skip) => item.path.includes(skip))) continue;

        // Recursively explore directories
        const subFiles = await discoverFiles(octokit, owner, repo, item.path, maxDepth, currentDepth + 1);
        files.push(...subFiles);
      }
    }

    return files;
  } catch (error) {
    console.error(`Failed to fetch contents for ${path}:`, error);
    return [];
  }
}

/**
 * Discover routes from files (Next.js, React Router, Express, etc.)
 */
async function discoverRoutes(
  files: Array<{ path: string; type: string; size: number }>,
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Route[]> {
  const routes: Route[] = [];

  // Next.js App Router pattern
  const appRoutes = files.filter((f) => f.path.match(/\/app\/.*\/page\.(tsx|jsx|ts|js)$/));
  for (const file of appRoutes) {
    const routePath = extractNextAppRoute(file.path);
    const params = extractRouteParams(routePath);
    routes.push({
      path: routePath,
      type: 'page',
      file: file.path,
      params,
    });
  }

  // Next.js Pages Router pattern
  const pageRoutes = files.filter((f) => f.path.match(/\/pages\/.*\.(tsx|jsx|ts|js)$/) && !f.path.includes('_app') && !f.path.includes('_document'));
  for (const file of pageRoutes) {
    const routePath = extractNextPageRoute(file.path);
    const params = extractRouteParams(routePath);
    routes.push({
      path: routePath,
      type: 'page',
      file: file.path,
      params,
    });
  }

  // API Routes (Next.js)
  const apiRoutes = files.filter((f) => f.path.match(/\/(api|app\/api)\/.*\/route\.(ts|js)$/) || f.path.match(/\/pages\/api\/.*\.(ts|js)$/));
  for (const file of apiRoutes) {
    const routePath = extractApiRoute(file.path);
    const params = extractRouteParams(routePath);
    routes.push({
      path: routePath,
      type: 'api',
      file: file.path,
      params,
    });
  }

  // React Router (common patterns)
  const srcFiles = files.filter((f) => f.path.match(/\/src\/.*\.(tsx|jsx)$/) && (f.path.includes('routes') || f.path.includes('pages')));
  for (const file of srcFiles) {
    const routePath = extractReactRoute(file.path);
    if (routePath && !routes.some((r) => r.path === routePath)) {
      routes.push({
        path: routePath,
        type: 'page',
        file: file.path,
      });
    }
  }

  // Express routes (for Node.js/Express apps)
  const expressRouteFiles = files.filter(
    (f) =>
      (f.path.includes('routes/') ||
       f.path.includes('controllers/') ||
       f.path.match(/\/(app|index|server)\.(js|ts)$/) ||
       f.path.match(/^(app|index|server)\.(js|ts)$/)) &&
      (f.path.endsWith('.js') || f.path.endsWith('.ts'))
  );

  console.log(`Found ${expressRouteFiles.length} potential Express route files:`, expressRouteFiles.map(f => f.path));

  for (const file of expressRouteFiles) {
    const expressRoutes = await extractExpressRoutes(octokit, owner, repo, file.path);
    console.log(`  Extracted ${expressRoutes.length} routes from ${file.path}`);
    routes.push(...expressRoutes);
  }

  return routes;
}

/**
 * Extract route path from Next.js App Router file
 */
function extractNextAppRoute(filePath: string): string {
  // app/dashboard/page.tsx -> /dashboard
  // app/blog/[slug]/page.tsx -> /blog/[slug]
  const match = filePath.match(/\/app\/(.*)\/page\.(tsx|jsx|ts|js)$/);
  if (!match) return '/';
  const routePath = match[1] || '';
  return '/' + routePath;
}

/**
 * Extract route path from Next.js Pages Router file
 */
function extractNextPageRoute(filePath: string): string {
  // pages/dashboard.tsx -> /dashboard
  // pages/blog/[slug].tsx -> /blog/[slug]
  // pages/index.tsx -> /
  const match = filePath.match(/\/pages\/(.*)\.(?:tsx|jsx|ts|js)$/);
  if (!match) return '/';
  const routePath = match[1] || '';
  if (routePath === 'index') return '/';
  return '/' + routePath;
}

/**
 * Extract API route path
 */
function extractApiRoute(filePath: string): string {
  // app/api/users/route.ts -> /api/users
  // pages/api/users.ts -> /api/users
  const appMatch = filePath.match(/\/app\/api\/(.*)\/route\.(ts|js)$/);
  if (appMatch) {
    return '/api/' + (appMatch[1] || '');
  }

  const pagesMatch = filePath.match(/\/pages\/api\/(.*)\.(?:ts|js)$/);
  if (pagesMatch) {
    return '/api/' + (pagesMatch[1] || '');
  }

  return '/api';
}

/**
 * Extract route from React Router patterns
 */
function extractReactRoute(filePath: string): string | null {
  // src/pages/Dashboard.tsx -> /dashboard
  // src/routes/Blog.tsx -> /blog
  const match = filePath.match(/\/(pages|routes)\/([^/]+)\.(tsx|jsx)$/);
  if (!match) return null;
  const name = match[2].replace(/^(index|home)$/i, '');
  if (!name) return '/';
  return '/' + name.toLowerCase();
}

/**
 * Extract dynamic route parameters
 */
function extractRouteParams(routePath: string): string[] | undefined {
  const params = routePath.match(/\[([^\]]+)\]/g);
  if (!params) return undefined;
  return params.map((p) => p.slice(1, -1));
}

/**
 * Extract Express routes from a file by fetching and parsing its content
 */
async function extractExpressRoutes(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string
): Promise<Route[]> {
  const routes: Route[] = [];

  try {
    // Fetch file content from GitHub
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

    if ('content' in data && data.content) {
      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      // Match Express route patterns:
      // app.get('/path', ...)
      // router.get('/path', ...)
      // app.post('/users/:id', ...)
      const routePattern = /(?:app|router)\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let match;

      while ((match = routePattern.exec(content)) !== null) {
        const method = match[1];
        const path = match[2];

        // Convert Express :param to [param] format
        const normalizedPath = path.replace(/:(\w+)/g, '[$1]');
        const params = extractRouteParams(normalizedPath);

        // Determine if it's an API or page route
        const isApi = method !== 'get' || path.startsWith('/api');

        routes.push({
          path: normalizedPath,
          type: isApi ? 'api' : 'page',
          file: filePath,
          params,
        });
      }
    }
  } catch (error) {
    console.error(`Failed to parse Express routes from ${filePath}:`, error);
  }

  return routes;
}
