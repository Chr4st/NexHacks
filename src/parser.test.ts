import { describe, it, expect } from 'vitest';
import { parseFlow, validateYamlSafety } from './parser.js';

describe('validateYamlSafety', () => {
  it('accepts safe YAML content', () => {
    const content = `
name: test-flow
intent: "User can complete signup"
url: https://example.com
steps:
  - action: screenshot
`;
    expect(() => validateYamlSafety(content)).not.toThrow();
  });

  it('rejects YAML with Python tags', () => {
    const content = `
name: !!python/object:dangerous.Class {}
`;
    expect(() => validateYamlSafety(content)).toThrow('Unsafe YAML');
  });

  it('rejects YAML with JavaScript tags', () => {
    const content = `
name: !!js/function "function() { evil() }"
`;
    expect(() => validateYamlSafety(content)).toThrow('Unsafe YAML');
  });

  it('rejects YAML with custom tags', () => {
    const content = `
name: !<tag:malicious.com,2024:evil> data
`;
    expect(() => validateYamlSafety(content)).toThrow('Unsafe YAML');
  });
});

describe('parseFlow', () => {
  it('parses a valid flow definition', () => {
    const yaml = `
name: signup-flow
intent: "User can successfully sign up and see confirmation"
url: https://example.com/signup
viewport:
  width: 1280
  height: 720
steps:
  - action: navigate
    target: https://example.com/signup
  - action: type
    target: "#email"
    value: "test@example.com"
  - action: click
    target: "#submit"
  - action: screenshot
    assert: "Confirmation message is clearly visible"
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('signup-flow');
      expect(result.data.intent).toBe('User can successfully sign up and see confirmation');
      expect(result.data.url).toBe('https://example.com/signup');
      expect(result.data.viewport).toEqual({ width: 1280, height: 720 });
      expect(result.data.steps).toHaveLength(4);
      expect(result.data.steps[0]?.action).toBe('navigate');
      expect(result.data.steps[3]?.action).toBe('screenshot');
      expect(result.data.steps[3]?.assert).toBe('Confirmation message is clearly visible');
    }
  });

  it('uses default viewport when not specified', () => {
    const yaml = `
name: minimal-flow
intent: "User can view the homepage without issues"
url: https://example.com
steps:
  - action: screenshot
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.viewport).toBeUndefined();
    }
  });

  it('fails on missing required fields', () => {
    const yaml = `
name: incomplete
steps:
  - action: screenshot
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('intent');
    }
  });

  it('fails on empty name', () => {
    const yaml = `
name: ""
intent: "Valid intent here"
url: https://example.com
steps:
  - action: screenshot
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('name');
    }
  });

  it('fails on intent too short', () => {
    const yaml = `
name: test
intent: "Short"
url: https://example.com
steps:
  - action: screenshot
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('intent');
    }
  });

  it('fails on invalid URL', () => {
    const yaml = `
name: test
intent: "Valid intent that is long enough"
url: not-a-valid-url
steps:
  - action: screenshot
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.toLowerCase()).toContain('url');
    }
  });

  it('fails on empty steps array', () => {
    const yaml = `
name: test
intent: "Valid intent that is long enough"
url: https://example.com
steps: []
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('step');
    }
  });

  it('fails on invalid step action', () => {
    const yaml = `
name: test
intent: "Valid intent that is long enough"
url: https://example.com
steps:
  - action: invalid_action
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('action');
    }
  });

  it('fails on invalid viewport dimensions', () => {
    const yaml = `
name: test
intent: "Valid intent that is long enough"
url: https://example.com
viewport:
  width: 100
  height: 200
steps:
  - action: screenshot
`;
    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.toLowerCase()).toContain('width');
    }
  });

  it('parses all valid step actions', () => {
    const actions = ['navigate', 'click', 'type', 'screenshot', 'wait', 'scroll'];

    for (const action of actions) {
      const yaml = `
name: test-${action}
intent: "Testing the ${action} action works correctly"
url: https://example.com
steps:
  - action: ${action}
    target: "#element"
    value: "test value"
`;
      const result = parseFlow(yaml);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.steps[0]?.action).toBe(action);
      }
    }
  });
});
