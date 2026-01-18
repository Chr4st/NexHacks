import { Octokit } from "@octokit/rest";
import { getGitInfo } from "./git";

export interface UXRisk {
  flowName: string;
  stepIndex: number;
  risk: string;
  recommendation: string;
}

export class DevSwarm {
  private octokit: Octokit;

  constructor(authToken: string) {
    this.octokit = new Octokit({ auth: authToken });
  }

  async postComment(risk: UXRisk) {
    const gitInfo = await getGitInfo();
    if (!gitInfo.owner || !gitInfo.repo || !gitInfo.prNumber) {
      console.warn("Not in a PR, skipping DevSwarm comment.");
      return;
    }

    const body = `
      **FlowGuard AI E-2-E Test Agent A3 Found a Potential UX Risk**

      - **Flow**: ${risk.flowName}
      - **Step**: ${risk.stepIndex + 1}
      - **Risk**: ${risk.risk}
      - **Recommendation**: ${risk.recommendation}
    `;

    try {
      await this.octokit.issues.createComment({
        owner: gitInfo.owner,
        repo: gitInfo.repo,
        issue_number: gitInfo.prNumber,
        body,
      });
    } catch (error) {
      console.warn("Failed to post DevSwarm comment:", error);
    }
  }
}
