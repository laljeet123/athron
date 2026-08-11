import assert from 'node:assert/strict';
import { fetchExerciseRules } from '../src/services/exerciseRules.js';
import { analyzeExercisePose } from '../src/ai/exerciseAnalyzer.js';

const validExercises = ['push-up', 'sit-up', 'pull-up'];

const sampleLandmarks = {
  left_shoulder: { x: 0.4, y: 0.2, visibility: 0.9 },
  right_shoulder: { x: 0.6, y: 0.2, visibility: 0.9 },
  left_elbow: { x: 0.35, y: 0.35, visibility: 0.9 },
  right_elbow: { x: 0.65, y: 0.35, visibility: 0.9 },
  left_wrist: { x: 0.3, y: 0.5, visibility: 0.9 },
  right_wrist: { x: 0.7, y: 0.5, visibility: 0.9 },
  left_hip: { x: 0.42, y: 0.55, visibility: 0.9 },
  right_hip: { x: 0.58, y: 0.55, visibility: 0.9 },
  left_knee: { x: 0.45, y: 0.72, visibility: 0.9 },
  right_knee: { x: 0.55, y: 0.72, visibility: 0.9 },
  left_ankle: { x: 0.47, y: 0.9, visibility: 0.9 },
  right_ankle: { x: 0.53, y: 0.9, visibility: 0.9 },
};

for (const exerciseId of validExercises) {
  const rules = await fetchExerciseRules(exerciseId);
  assert.ok(rules, `${exerciseId} rules should exist`);
  assert.ok(rules.analyzer || rules.length, `${exerciseId} rules should include analyzer config`);

  const result = analyzeExercisePose(exerciseId, sampleLandmarks, rules, null);
  assert.ok(result && typeof result.score === 'number', `${exerciseId} should return a numeric score`);
  assert.ok(Array.isArray(result.feedback), `${exerciseId} should return feedback`);
}

assert.equal((await fetchExerciseRules('bench-press')).analyzer, undefined);
console.log('form checker support test passed');
