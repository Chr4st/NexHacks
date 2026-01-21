import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import { getOrAnalyzeRepo, type RepoAnalysis } from '@/lib/repo-analyzer';
import Anthropic from '@anthropic-ai/sdk';
import type { FlowDefinition } from '@/db/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repoUrl, forceRefresh = false } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Missing required field: repoUrl' },
        { status: 400 }
      );
    }

    // Step 1: Analyze repository (use cache if available)
    console.log('Step 1: Analyzing repository...');
    const analysis = await getOrAnalyzeRepo(repoUrl, forceRefresh);
    console.log(`✅ Found ${analysis.routes.length} routes, ${analysis.components.length} components`);

    // Step 2: Generate flows for each route using AI
    console.log('Step 2: Generating flows for all routes...');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const allFlows: any[] = [];

    // Generate flows in batches to show progress
    const BATCH_SIZE = 5;
    const routeBatches = chunkArray(analysis.routes, BATCH_SIZE);

    for (let i = 0; i < routeBatches.length; i++) {
      const batch = routeBatches[i];
      console.log(`Generating flows for batch ${i + 1}/${routeBatches.length} (${batch.length} routes)...`);

      const prompt = buildRoutesFlowPrompt(analysis, batch);
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      // Extract JSON from AI response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const flows = JSON.parse(jsonMatch[0]);
          allFlows.push(...flows);
          console.log(`✅ Generated ${flows.length} flows for batch ${i + 1}`);
        } catch (error) {
          console.error(`Failed to parse batch ${i + 1}:`, error);
        }
      }
    }

    console.log(`✅ Total flows generated: ${allFlows.length}`);

    // Step 3: Try to save flows to MongoDB
    let savedFlows = allFlows.map((flow: any, index: number) => ({
      _id: `generated-${Date.now()}-${index}`,
      ...flow,
    }));

    try {
      // Get authenticated user or use demo user for testing
      const { userId } = await auth();
      const effectiveUserId = userId || 'demo-user';

      console.log(`💾 Attempting to save ${allFlows.length} flows to MongoDB for user ${effectiveUserId}...`);
      const repository = await getRepository();
      savedFlows = [];

      for (const flow of allFlows) {
        const flowId = await repository.saveFlowForTenant(effectiveUserId, {
          name: flow.name,
          intent: flow.intent,
          url: flow.url || analysis.repository.homepage || 'http://localhost:3000',
          viewport: flow.viewport || { width: 1920, height: 1080 },
          steps: flow.steps,
          tags: [...(flow.tags || []), 'auto-generated', `repo:${analysis.repository.fullName}`],
          critical: flow.critical || false,
          tenantId: effectiveUserId,
        });

        savedFlows.push({
          _id: flowId,
          ...flow,
        });
      }
      console.log(`✅ Successfully saved ${savedFlows.length} flows to MongoDB`);
    } catch (dbError) {
      console.error('❌ MongoDB save failed:', dbError instanceof Error ? dbError.message : dbError);
      console.log('📦 Falling back to temporary IDs for demo purposes');
    }

    return NextResponse.json({
      success: true,
      flows: savedFlows,
      repository: analysis.repository,
      analysis: {
        routes: analysis.routes.length,
        components: analysis.components.length,
        apiEndpoints: analysis.apiEndpoints.length,
        cached: !forceRefresh,
      },
    });
  } catch (error) {
    console.error('Error generating flows:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate flows',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function buildRoutesFlowPrompt(analysis: RepoAnalysis, routes: any[]): string {
  const routesList = routes
    .map((r) => `- ${r.path} (${r.type})${r.params ? ` [params: ${r.params.join(', ')}]` : ''}`)
    .join('\n');

  const baseUrl = analysis.repository.homepage || 'http://localhost:3000';

  return `
You are a QA engineer creating comprehensive browser automation tests for a ${analysis.repository.language} application.

Repository: ${analysis.repository.fullName}
Description: ${analysis.repository.description}
Homepage: ${baseUrl}

Routes to test (this batch):
${routesList}

Generate test flows for these routes. Each flow should:
- Test a complete user journey for that route
- Use realistic selectors (data-testid, ARIA labels, semantic HTML)
- Include proper navigation and assertions
- Handle dynamic routes with example values

IMPORTANT: Output ONLY a JSON array, no other text:

[
  {
    "name": "Test homepage loading",
    "intent": "Verify the homepage loads and displays key content",
    "url": "${baseUrl}",
    "viewport": { "width": 1920, "height": 1080 },
    "steps": [
      { "action": "navigate", "target": "${baseUrl}" },
      { "action": "wait", "value": "2000" },
      { "action": "screenshot" }
    ],
    "tags": ["homepage"],
    "critical": true
  }
]

Generate flows for ALL ${routes.length} routes in this batch now:
`.trim();
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
