const ARENA_LABELS: Record<string, string> = {
  'arena-business': 'business',
  'arena-coding': 'coding',
  'arena-conversations': 'conversations',
  'arena-creative-writing': 'creative writing',
  'arena-expert': 'expert questions',
  'arena-instructions': 'instruction following',
  'arena-legal': 'legal',
  'arena-long-requests': 'long requests',
  'arena-maths': 'maths',
  'arena-medicine': 'health',
  'arena-non-english': 'non-English',
  'arena-overall': 'overall',
  'arena-science': 'science',
  'arena-writing': 'writing',
};

interface TestMetadataInput {
  id: string;
  key: string;
  source: string;
  what: string;
}

export function benchmarkMetadata(test: TestMetadataInput, modelCount: number) {
  const name = test.source === 'lmarena'
    ? `LMArena ${ARENA_LABELS[test.id] ?? test.id.replace(/^arena-/, '')}`
    : test.key.replace(/-Tiers-1-3-v2-Private$/, '');
  return {
    title: `${name} AI benchmark`,
    description: `${test.what} Results for ${modelCount} AI model${modelCount === 1 ? '' : 's'}.`,
  };
}

export function modelMetadata(modelName: string, provider: string) {
  return {
    title: `${modelName}: tests, price & access`,
    description: `See where ${modelName} from ${provider} ranks across tasks and independent tests, what it costs developers, and which apps and plans include it.`,
  };
}

export function taskMetadata(label: string) {
  const task = label.replace(/^Best AI for /, '');
  const subject = /^(?:CVs?|Excel)\b/.test(task) ? task : task[0].toLowerCase() + task.slice(1);
  return {
    title: label,
    description: `Compare AI models for ${subject} using independent tests, prices and people's votes, with the evidence and limits shown.`,
  };
}
