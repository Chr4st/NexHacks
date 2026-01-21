/**
 * GitHub API helper functions
 */

import { Octokit } from '@octokit/rest';

export interface RepoFile {
  path: string;
  content: string;
  type: string;
}

/**
 * Parse owner and repo from GitHub URL or owner/repo string
 */
export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  // Handle full GitHub URLs
  if (repoUrl.includes('github.com')) {
    const parts = repoUrl.split('/');
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1].replace('.git', '');
    return { owner, repo };
  }

  // Handle owner/repo format
  const [owner, repo] = repoUrl.split('/');
  return { owner, repo };
}

/**
 * Fetch repository structure and key files
 */
export async function fetchRepoStructure(
  repoUrl: string,
  githubToken?: string
): Promise<{ repoData: any; keyFiles: RepoFile[] }> {
  const { owner, repo } = parseRepoUrl(repoUrl);

  const octokit = new Octokit({
    auth: githubToken || process.env.GITHUB_TOKEN,
  });

  // Get repository metadata
  const { data: repoData } = await octokit.repos.get({ owner, repo });

  // Get repository contents (root directory)
  const { data: contents } = await octokit.repos.getContent({
    owner,
    repo,
    path: '',
  });

  // Fetch key files (package.json, README, and main source files)
  const keyFiles = await fetchKeyFiles(octokit, owner, repo, Array.isArray(contents) ? contents : []);

  return { repoData, keyFiles };
}

/**
 * Fetch important files from the repository
 */
async function fetchKeyFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  contents: any[]
): Promise<RepoFile[]> {
  const files: RepoFile[] = [];

  // Priority files to fetch
  const priorityFiles = ['package.json', 'README.md', 'tsconfig.json', 'next.config.js'];

  // Fetch priority files from root
  for (const item of contents) {
    if (item.type === 'file' && priorityFiles.includes(item.name)) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: item.path,
        });

        if ('content' in data) {
          files.push({
            path: item.path,
            content: Buffer.from(data.content, 'base64').toString('utf-8'),
            type: item.type,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch ${item.path}:`, error);
      }
    }
  }

  // Try to fetch some source files (src/, app/, pages/ directories)
  const sourceDirs = ['src', 'app', 'pages', 'components'];

  for (const dir of sourceDirs) {
    const dirItem = contents.find((item) => item.name === dir && item.type === 'dir');
    if (dirItem) {
      try {
        const { data: dirContents } = await octokit.repos.getContent({
          owner,
          repo,
          path: dir,
        });

        // Fetch first few files from source directory
        const sourceFiles = Array.isArray(dirContents) ? dirContents.slice(0, 3) : [];

        for (const file of sourceFiles) {
          if (file.type === 'file' && (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.jsx') || file.name.endsWith('.js'))) {
            try {
              const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: file.path,
              });

              if ('content' in data) {
                files.push({
                  path: file.path,
                  content: Buffer.from(data.content, 'base64').toString('utf-8').substring(0, 1000), // First 1000 chars
                  type: file.type,
                });
              }
            } catch (error) {
              console.error(`Failed to fetch ${file.path}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${dir} directory:`, error);
      }
    }
  }

  return files;
}
