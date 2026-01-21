import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 401 }
      );
    }

    const octokit = new Octokit({ auth: githubToken });

    // Fetch authenticated user info
    const { data: user } = await octokit.users.getAuthenticated();

    // Fetch user's repositories
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      affiliation: 'owner',
    });

    // Transform repos to match our interface
    const transformedRepos = repos.map((repo) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      htmlUrl: repo.html_url,
    }));

    return NextResponse.json({
      user: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        email: user.email,
      },
      repos: transformedRepos,
    });
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch GitHub repositories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
