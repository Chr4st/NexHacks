import Anthropic from '@anthropic-ai/sdk';
import type {
  FlowExecutionData,
  DOMSnapshot,
  NetworkRequest,
  ConsoleLog,
  UXAnalysisResult,
  PerformanceAnalysisResult,
  ErrorAnalysisResult,
  FlowAnalysisResult,
  AnalysisIssue
} from '../tracing/types.js';

/**
 * AIAnalyzer provides AI-powered analysis of flow execution data.
 * Uses Claude to analyze DOM snapshots, network activity, console logs,
 * and performance metrics to identify UX issues and generate insights.
 */
export class AIAnalyzer {
  private anthropic: Anthropic;
  private model: string;

  constructor(anthropic?: Anthropic, model: string = 'claude-sonnet-4-5-20250929') {
    this.anthropic = anthropic || new Anthropic();
    this.model = model;
  }

  /**
   * Analyze DOM snapshot for UX/accessibility issues
   */
  async analyzeDOMForUXIssues(snapshot: DOMSnapshot): Promise<UXAnalysisResult> {
    const prompt = `Analyze this DOM snapshot for UX and accessibility issues.

DOM Summary:
${JSON.stringify(snapshot.serializedDOM, null, 2)}

Accessibility Tree:
${JSON.stringify(snapshot.accessibilityTree, null, 2)}

Identify issues in these categories:
1. Accessibility violations (WCAG AA compliance)
2. Layout problems (missing labels, poor structure)
3. Missing interactive states
4. Broken responsive design patterns

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "issues": [
    {"type": "accessibility", "severity": "high", "description": "Issue description here"},
    {"type": "layout", "severity": "medium", "description": "Issue description here"}
  ],
  "summary": "Brief summary of findings"
}

Severity levels: "low", "medium", "high"
Types: "accessibility", "layout", "performance", "security"`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseJSON<UXAnalysisResult>(text, { issues: [], summary: 'Analysis complete' });
    } catch (error) {
      console.error('Error analyzing DOM:', error);
      return {
        issues: [],
        summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Analyze network requests for performance issues
   */
  async analyzeNetworkForPerformance(requests: NetworkRequest[]): Promise<PerformanceAnalysisResult> {
    const slowRequests = requests.filter(r => r.timing.durationMs > 1000);
    const failedRequests = requests.filter(r => r.statusCode >= 400);
    const largeResources = requests.filter(r =>
      (r.responseBody?.length || 0) > 100000
    );

    // If no obvious issues, return simple result
    if (slowRequests.length === 0 && failedRequests.length === 0 && largeResources.length === 0) {
      return {
        issues: [],
        recommendations: [],
        summary: `Network analysis: ${requests.length} requests, all within acceptable parameters.`
      };
    }

    const prompt = `Analyze these network requests for performance issues:

Summary:
- Total Requests: ${requests.length}
- Slow Requests (>1s): ${slowRequests.length}
- Failed Requests (4xx/5xx): ${failedRequests.length}
- Large Resources (>100KB): ${largeResources.length}

Slow Requests:
${JSON.stringify(slowRequests.map(r => ({
  url: r.url,
  method: r.method,
  durationMs: r.timing.durationMs,
  statusCode: r.statusCode
})), null, 2)}

Failed Requests:
${JSON.stringify(failedRequests.map(r => ({
  url: r.url,
  method: r.method,
  statusCode: r.statusCode
})), null, 2)}

Large Resources:
${JSON.stringify(largeResources.map(r => ({
  url: r.url,
  resourceType: r.resourceType,
  sizeBytes: r.responseBody?.length || 0
})), null, 2)}

Provide actionable recommendations.

Return ONLY valid JSON in this exact format (no markdown):
{
  "issues": [
    {"type": "performance", "severity": "high", "description": "Issue description"}
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "summary": "Brief summary of network performance"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseJSON<PerformanceAnalysisResult>(text, {
        issues: [],
        recommendations: [],
        summary: 'Performance analysis complete'
      });
    } catch (error) {
      console.error('Error analyzing network:', error);
      return {
        issues: [],
        recommendations: [],
        summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Analyze console logs for errors and warnings
   */
  async analyzeConsoleForErrors(logs: ConsoleLog[]): Promise<ErrorAnalysisResult> {
    const errors = logs.filter(l => l.type === 'error');
    const warnings = logs.filter(l => l.type === 'warn');

    if (errors.length === 0 && warnings.length === 0) {
      return {
        issues: [],
        summary: 'No console errors or warnings detected.'
      };
    }

    const prompt = `Analyze these console logs for errors and their impact:

Errors (${errors.length}):
${JSON.stringify(errors.map(e => ({
  message: e.message,
  stackTrace: e.stackTrace?.substring(0, 500),
  stepIndex: e.stepIndex
})), null, 2)}

Warnings (${warnings.length}):
${JSON.stringify(warnings.map(w => ({
  message: w.message,
  stepIndex: w.stepIndex
})), null, 2)}

Identify:
1. Critical errors that affect functionality
2. Root causes if apparent
3. Impact on user experience

Return ONLY valid JSON in this exact format (no markdown):
{
  "issues": [
    {"type": "console", "severity": "high", "description": "Error description and impact"}
  ],
  "summary": "Brief summary of console issues"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseJSON<ErrorAnalysisResult>(text, {
        issues: [],
        summary: 'Console analysis complete'
      });
    } catch (error) {
      console.error('Error analyzing console:', error);
      return {
        issues: [],
        summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate comprehensive flow analysis by combining all analysis types
   */
  async analyzeFlowExecution(data: FlowExecutionData): Promise<FlowAnalysisResult> {
    // Run all analyses in parallel for efficiency
    const [uxAnalysis, perfAnalysis, errorAnalysis] = await Promise.all([
      // Analyze the last DOM snapshot (final state)
      data.domSnapshots.length > 0
        ? this.analyzeDOMForUXIssues(data.domSnapshots[data.domSnapshots.length - 1]!)
        : Promise.resolve({ issues: [], summary: 'No DOM snapshots available' }),
      this.analyzeNetworkForPerformance(data.networkRequests),
      this.analyzeConsoleForErrors(data.consoleLogs)
    ]);

    // Aggregate all issues
    const allIssues: AnalysisIssue[] = [
      ...uxAnalysis.issues,
      ...perfAnalysis.issues,
      ...errorAnalysis.issues
    ];

    // Count critical issues
    const criticalCount = allIssues.filter(i => i.severity === 'high').length;
    const warningCount = allIssues.filter(i => i.severity === 'medium').length;

    // Generate comprehensive summary
    const executionTime = new Date(data.endTime).getTime() - new Date(data.startTime).getTime();
    const failedSteps = data.steps.filter(s => !s.success).length;

    let summary = `Flow "${data.flowName}" completed with ${data.verdict.toUpperCase()} verdict in ${executionTime}ms.\n`;

    if (failedSteps > 0) {
      summary += `${failedSteps} of ${data.steps.length} steps failed.\n`;
    }

    if (criticalCount > 0 || warningCount > 0) {
      summary += `Found ${criticalCount} critical and ${warningCount} warning issues across UX, performance, and console analysis.`;
    } else {
      summary += 'No significant issues detected.';
    }

    return {
      flowId: data.flowId,
      flowName: data.flowName,
      verdict: data.verdict,
      summary,
      uxIssues: uxAnalysis.issues,
      performanceIssues: perfAnalysis.issues,
      consoleErrors: errorAnalysis.issues,
      recommendations: perfAnalysis.recommendations,
      executionTime
    };
  }

  /**
   * Generate a natural language report for end users
   */
  async generateUserReport(analysis: FlowAnalysisResult): Promise<string> {
    const sections: string[] = [];

    // Header
    sections.push(`# Flow Analysis: ${analysis.flowName}`);
    sections.push('');
    sections.push(analysis.summary);
    sections.push('');

    // UX Issues
    if (analysis.uxIssues.length > 0) {
      sections.push(`## UX Issues (${analysis.uxIssues.length})`);
      analysis.uxIssues.forEach(issue => {
        const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        sections.push(`${icon} **[${issue.severity.toUpperCase()}]** ${issue.description}`);
      });
      sections.push('');
    }

    // Performance Issues
    if (analysis.performanceIssues.length > 0) {
      sections.push(`## Performance Issues (${analysis.performanceIssues.length})`);
      analysis.performanceIssues.forEach(issue => {
        const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        sections.push(`${icon} **[${issue.severity.toUpperCase()}]** ${issue.description}`);
      });
      sections.push('');
    }

    // Console Errors
    if (analysis.consoleErrors.length > 0) {
      sections.push(`## Console Errors (${analysis.consoleErrors.length})`);
      analysis.consoleErrors.forEach(issue => {
        const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        sections.push(`${icon} **[${issue.severity.toUpperCase()}]** ${issue.description}`);
      });
      sections.push('');
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
      sections.push('## Recommendations');
      analysis.recommendations.forEach((rec, idx) => {
        sections.push(`${idx + 1}. ${rec}`);
      });
      sections.push('');
    }

    // Footer
    sections.push('---');
    sections.push(`*Analysis generated in ${analysis.executionTime}ms*`);

    return sections.join('\n');
  }

  /**
   * Safely parse JSON with fallback
   */
  private parseJSON<T>(text: string, fallback: T): T {
    try {
      // Try to extract JSON from the response (in case there's surrounding text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return fallback;
    } catch {
      console.error('Failed to parse JSON response:', text.substring(0, 200));
      return fallback;
    }
  }
}

/**
 * Quick analysis function for simple use cases
 */
export async function analyzeFlowQuick(data: FlowExecutionData): Promise<FlowAnalysisResult> {
  const analyzer = new AIAnalyzer();
  return analyzer.analyzeFlowExecution(data);
}

/**
 * Generate a formatted report from execution data
 */
export async function generateAnalysisReport(data: FlowExecutionData): Promise<string> {
  const analyzer = new AIAnalyzer();
  const analysis = await analyzer.analyzeFlowExecution(data);
  return analyzer.generateUserReport(analysis);
}
