import simpleGit from "simple-git";

export interface GitInfo {
  owner?: string;
  repo?: string;
  prNumber?: number;
}

export async function getGitInfo(): Promise<GitInfo> {
  try {
    const git = simpleGit();
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r: { name: string }) => r.name === "origin");
    if (!origin) {
      return {};
    }

    const match = origin.refs.fetch.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)(\.git)?$/);
    if (!match) {
      return {};
    }

    const [, owner, repo] = match;

    // This is a simplistic way to get the PR number, assuming the CI environment sets it.
    // A more robust solution would check for specific CI environment variables.
    const prNumber = process.env.GITHUB_PULL_REQUEST_NUMBER
      ? parseInt(process.env.GITHUB_PULL_REQUEST_NUMBER, 10)
      : undefined;

    return { owner, repo, prNumber };
  } catch (error) {
    console.error("Error getting git info:", error);
    return {};
  }
}
