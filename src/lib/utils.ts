export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatScore(score: number): string {
  return score.toFixed(0);
}

export function formatConfidence(confidence: number): string {
  return confidence.toFixed(2);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function padIndex(index: number): string {
  return String(index).padStart(3, '0');
}

export function difficultyLabel(difficulty: string): string {
  return difficulty.toUpperCase();
}

export function gapColor(gap: number): string {
  if (gap >= 0) return 'var(--c-accent)';
  if (gap >= -10) return 'var(--c-mid)';
  if (gap >= -20) return '#D97706';
  return 'var(--c-danger)';
}

export function trendSymbol(trend: string): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}
