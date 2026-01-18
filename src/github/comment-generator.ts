import { FlowGuardResult, FLOWGUARD_COMMENT_MARKER } from './types.js';

export class CommentGenerator {
  generateComment(results: FlowGuardResult[]): string {
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const allPassed = passedCount === totalCount && totalCount > 0;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    const statusEmoji = allPassed ? '✅' : totalCount === 0 ? '⚪' : '❌';
    const statusText = allPassed 
      ? 'All Tests Passed' 
      : totalCount === 0 
        ? 'No Tests Run'
        : 'Tests Failed';

    let comment = `${FLOWGUARD_COMMENT_MARKER}\n`;
    comment += `## ${statusEmoji} FlowGuard: ${statusText}\n\n`;
    comment += `**Summary:** ${passedCount}/${totalCount} flows passed`;
    
    if (totalCount > 0) {
      comment += ` in ${this.formatDuration(totalDuration)}`;
    }
    comment += '\n\n';

    if (results.length > 0) {
      comment += '### Results\n\n';
      comment += '| Flow | Status | Duration | Report |\n';
      comment += '|------|--------|----------|--------|\n';

      for (const result of results) {
        const status = result.passed ? '✅ Passed' : '❌ Failed';
        const duration = this.formatDuration(result.duration);
        const report = result.reportUrl 
          ? `[View Report](${result.reportUrl})`
          : '-';
        
        comment += `| ${result.flowName} | ${status} | ${duration} | ${report} |\n`;
      }

      comment += '\n';
    }

    const failedResults = results.filter(r => !r.passed);
    if (failedResults.length > 0) {
      comment += '### Failures\n\n';

      for (const result of failedResults) {
        comment += `#### ${result.flowName}\n\n`;
        
        const failedSteps = result.steps.filter(s => !s.passed);
        for (const step of failedSteps) {
          comment += `- **${step.name}**`;
          if (step.error) {
            comment += `: ${step.error}`;
          }
          comment += '\n';
        }
        comment += '\n';
      }
    }

    comment += '---\n';
    comment += '*Powered by [FlowGuard](https://github.com/flowguard/flowguard) - AI-native UX testing*\n';

    return comment;
  }

  generateCheckRunSummary(results: FlowGuardResult[]): string {
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const allPassed = passedCount === totalCount && totalCount > 0;

    let summary = `# FlowGuard Test Results\n\n`;
    summary += `**Status:** ${allPassed ? '✅ All Passed' : '❌ Some Failed'}\n`;
    summary += `**Passed:** ${passedCount}/${totalCount}\n\n`;

    if (results.length > 0) {
      summary += '## Flows\n\n';
      
      for (const result of results) {
        const icon = result.passed ? '✅' : '❌';
        summary += `### ${icon} ${result.flowName}\n\n`;
        
        if (!result.passed) {
          const failedSteps = result.steps.filter(s => !s.passed);
          for (const step of failedSteps) {
            summary += `- ❌ **${step.name}**`;
            if (step.error) {
              summary += `\n  - Error: ${step.error}`;
            }
            summary += '\n';
          }
          summary += '\n';
        }
      }
    }

    return summary;
  }

  private formatDuration(ms: number): string {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}
