'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function FlowForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [intent, setIntent] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [steps, setSteps] = useState([
    { action: 'navigate', target: '', assert: '' },
  ]);

  const addStep = () => {
    setSteps([...steps, { action: 'navigate', target: '', assert: '' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          intent,
          url,
          steps,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create flow');
      }

      toast.success('Flow created successfully!', {
        description: `${name} has been added to your flows.`,
      });

      router.push('/flows');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error('Failed to create flow', {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Flow Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="e.g., Checkout Flow"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Starting URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="https://example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Intent</label>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Describe what this flow should validate..."
          rows={3}
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium">Steps</label>
          <Button type="button" onClick={addStep} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Step {index + 1}</span>
                {steps.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeStep(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Action
                  </label>
                  <select
                    value={step.action}
                    onChange={(e) => updateStep(index, 'action', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="navigate">Navigate</option>
                    <option value="click">Click</option>
                    <option value="type">Type</option>
                    <option value="screenshot">Screenshot</option>
                    <option value="wait">Wait</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Target
                  </label>
                  <input
                    type="text"
                    value={step.target}
                    onChange={(e) => updateStep(index, 'target', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="URL or selector"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Assertion
                  </label>
                  <input
                    type="text"
                    value={step.assert}
                    onChange={(e) => updateStep(index, 'assert', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="What to validate"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Flow'
          )}
        </Button>
      </div>
    </form>
  );
}

