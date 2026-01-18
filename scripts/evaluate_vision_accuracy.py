#!/usr/bin/env python3
"""
Evaluate vision model accuracy against ground truth dataset.

Usage:
  python scripts/evaluate_vision_accuracy.py \
    --dataset benchmarks/dataset.json \
    --results experiments/run_001/results.json
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict, Any
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def load_json(path: Path) -> Dict[str, Any]:
    """Load JSON file."""
    with open(path) as f:
        return json.load(f)

def evaluate_results(dataset: Dict, results: Dict) -> Dict[str, float]:
    """Calculate accuracy metrics."""

    # Extract ground truth and predictions
    y_true = []
    y_pred = []

    for example in dataset['examples']:
        example_id = example['id']
        ground_truth = example['ground_truth']['verdict']

        # Find corresponding result
        result = next((r for r in results['predictions'] if r['example_id'] == example_id), None)
        if not result:
            continue

        y_true.append(ground_truth)
        y_pred.append(result['predicted_verdict'])

    if len(y_true) == 0:
        return {
            'accuracy': 0.0,
            'precision': 0.0,
            'recall': 0.0,
            'f1_score': 0.0,
            'true_positives': 0,
            'false_positives': 0,
            'true_negatives': 0,
            'false_negatives': 0,
            'total_examples': 0
        }

    # Calculate metrics
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    return {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'true_positives': int(tp),
        'false_positives': int(fp),
        'true_negatives': int(tn),
        'false_negatives': int(fn),
        'total_examples': len(y_true)
    }

def main():
    parser = argparse.ArgumentParser(description='Evaluate vision accuracy')
    parser.add_argument('--dataset', type=Path, required=True)
    parser.add_argument('--results', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('evaluation_report.json'))

    args = parser.parse_args()

    dataset = load_json(args.dataset)
    results = load_json(args.results)

    metrics = evaluate_results(dataset, results)

    # Save report
    with open(args.output, 'w') as f:
        json.dump(metrics, f, indent=2)

    # Print summary
    print("📊 Evaluation Results")
    print(f"  Accuracy:  {metrics['accuracy']:.2%}")
    print(f"  Precision: {metrics['precision']:.2%}")
    print(f"  Recall:    {metrics['recall']:.2%}")
    print(f"  F1 Score:  {metrics['f1_score']:.2%}")
    print(f"\n  TP: {metrics['true_positives']} | FP: {metrics['false_positives']}")
    print(f"  TN: {metrics['true_negatives']} | FN: {metrics['false_negatives']}")

if __name__ == "__main__":
    main()
