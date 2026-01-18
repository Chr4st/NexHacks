import { describe, it, expect, vi, afterEach } from "vitest";
import { DevSwarm } from "./devswarm";
import * as git from "./git";

vi.mock("@octokit/rest", () => {
  const mockOctokit = {
    issues: {
      createComment: vi.fn(),
    },
  };
  return {
    Octokit: vi.fn(() => mockOctokit),
  };
});

vi.mock("./git", () => ({
  getGitInfo: vi.fn(),
}));

describe("DevSwarm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should post a comment to a PR", async () => {
    const gitInfo = {
      owner: "test-owner",
      repo: "test-repo",
      prNumber: 123,
    };
    vi.mocked(git.getGitInfo).mockResolvedValue(gitInfo);

    const devswarm = new DevSwarm("fake-token");
    const risk = {
      flowName: "test-flow",
      stepIndex: 1,
      risk: "Low contrast",
      recommendation: "Increase button contrast",
    };
    await devswarm.postComment(risk);

    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit();

    expect(octokit.issues.createComment).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 123,
      body: `
      **FlowGuard AI E-2-E Test Agent A3 Found a Potential UX Risk**

      - **Flow**: test-flow
      - **Step**: 2
      - **Risk**: Low contrast
      - **Recommendation**: Increase button contrast
    `,
    });
  });

  it("should not post a comment if not in a PR", async () => {
    vi.mocked(git.getGitInfo).mockResolvedValue({});

    const devswarm = new DevSwarm("fake-token");
    const risk = {
      flowName: "test-flow",
      stepIndex: 1,
      risk: "Low contrast",
      recommendation: "Increase button contrast",
    };
    await devswarm.postComment(risk);

    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit();

    expect(octokit.issues.createComment).not.toHaveBeenCalled();
  });
});
