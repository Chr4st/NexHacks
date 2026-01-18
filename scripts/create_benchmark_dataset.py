#!/usr/bin/env python3
"""
Generate benchmark dataset for FlowGuard vision testing.

Usage:
  python scripts/create_benchmark_dataset.py --output benchmarks/dataset.json --count 50
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import anthropic
import os

def generate_synthetic_examples(count: int) -> List[Dict[str, Any]]:
    """Generate synthetic UX issue examples using Claude."""
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("Warning: ANTHROPIC_API_KEY not set, using mock data")
        return generate_mock_examples(count)

    client = anthropic.Anthropic(api_key=api_key)

    examples = []
    categories = ["accessibility", "layout", "responsiveness", "ux-dark-patterns", "security"]

    for i in range(count):
        category = categories[i % len(categories)]

        try:
            # Use Claude to generate realistic assertions and expected issues
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                messages=[{
                    "role": "user",
                    "content": f"""Generate a realistic UX testing scenario for category: {category}.

Provide:
1. An assertion statement (what should be true)
2. Expected issues if the assertion fails
3. Difficulty rating (easy/medium/hard)

Return JSON format:
{{
  "assertion": "...",
  "expected_issues": ["...", "..."],
  "difficulty": "medium"
}}"""
                }]
            )

            text = response.content[0].text
            data = json.loads(text)

            examples.append({
                "id": f"example_{i+1:03d}",
                "screenshot_path": f"benchmarks/screenshots/{category}_{i+1}.png",
                "assertion": data["assertion"],
                "ground_truth": {
                    "verdict": False,  # We'll manually label these
                    "expected_issues": data["expected_issues"]
                },
                "metadata": {
                    "category": category,
                    "difficulty": data["difficulty"],
                    "created_at": datetime.now().isoformat()
                }
            })
        except Exception as e:
            print(f"Warning: Failed to generate example {i+1}: {e}")
            # Add mock example as fallback
            examples.append(generate_mock_example(i+1, category))

    return examples

def generate_mock_examples(count: int) -> List[Dict[str, Any]]:
    """Generate mock examples when API is unavailable."""
    examples = []
    categories = ["accessibility", "layout", "responsiveness", "ux-dark-patterns", "security"]

    mock_data = {
        "accessibility": {
            "assertion": "The checkout button has sufficient color contrast (WCAG AA)",
            "issues": ["Button contrast ratio is 2.1:1, below WCAG AA requirement of 4.5:1"],
            "difficulty": "medium"
        },
        "layout": {
            "assertion": "The navigation menu is visible without scrolling",
            "issues": ["Navigation menu is pushed below fold due to large hero image"],
            "difficulty": "easy"
        },
        "responsiveness": {
            "assertion": "The form fields are fully visible on mobile (375px width)",
            "issues": ["Input labels are cut off by parent container overflow"],
            "difficulty": "medium"
        },
        "ux-dark-patterns": {
            "assertion": "The unsubscribe button is as prominent as the subscribe button",
            "issues": ["Unsubscribe button is hidden in footer with 8px font size"],
            "difficulty": "hard"
        },
        "security": {
            "assertion": "The password input field obscures entered characters",
            "issues": ["Password field shows plain text characters"],
            "difficulty": "easy"
        }
    }

    for i in range(count):
        category = categories[i % len(categories)]
        data = mock_data[category]

        examples.append({
            "id": f"example_{i+1:03d}",
            "screenshot_path": f"benchmarks/screenshots/{category}_{i+1}.png",
            "assertion": data["assertion"],
            "ground_truth": {
                "verdict": False,
                "expected_issues": data["issues"]
            },
            "metadata": {
                "category": category,
                "difficulty": data["difficulty"],
                "created_at": datetime.now().isoformat()
            }
        })

    return examples

def generate_mock_example(index: int, category: str) -> Dict[str, Any]:
    """Generate a single mock example."""
    mock_data = generate_mock_examples(1)
    return mock_data[0] if mock_data else {}

def save_dataset(examples: List[Dict[str, Any]], output_path: Path):
    """Save dataset to JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    dataset = {
        "version": "1.0",
        "created_at": datetime.now().isoformat(),
        "total_examples": len(examples),
        "examples": examples
    }

    with open(output_path, 'w') as f:
        json.dump(dataset, f, indent=2)

    print(f"✅ Generated {len(examples)} examples → {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Generate benchmark dataset")
    parser.add_argument("--output", type=Path, default=Path("benchmarks/dataset.json"))
    parser.add_argument("--count", type=int, default=50)

    args = parser.parse_args()

    examples = generate_synthetic_examples(args.count)
    save_dataset(examples, args.output)

if __name__ == "__main__":
    main()
