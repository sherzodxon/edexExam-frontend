import { TestResult } from '@/types';

interface Props {
  best: TestResult;
  submitted: boolean;
  name: string;
}

export default function LockedState({ best, submitted, name }: Props) {
  return (
    <div className="animate-fade-in text-center space-y-8">
      <div className="space-y-2">
        <div className="text-4xl">✓</div>
        <h2 className="text-xl font-semibold text-text">Test complete, {name}!</h2>
        <p className="text-sub text-sm">
          {submitted ? 'Your best result has been submitted.' : 'All 3 attempts used.'}
        </p>
      </div>

      <div className="bg-surface border border-accent/20 rounded-2xl p-8 space-y-1">
        <p className="text-sub text-xs uppercase tracking-widest mb-4">Your best result</p>
        <div className="font-mono text-6xl font-light text-accent tabular-nums">{best.wpm}</div>
        <div className="text-sub text-sm font-mono">words per minute</div>
        <div className="text-text font-mono text-lg mt-3">{best.accuracy.toFixed(1)}% accuracy</div>
      </div>

      <p className="text-muted text-xs font-mono">
        This session is locked. No more attempts allowed.
      </p>
    </div>
  );
}
