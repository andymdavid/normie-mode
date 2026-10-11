import { graph } from './graph';

// D-035: these exact-version pages stay public for provenance and navigation, but are
// temporarily excluded from search until they contain useful version-specific evidence.
export const TEMPORARILY_NOINDEXED_MODEL_IDS = new Set([
  'claude-fable-5',
  'claude-opus-4-6',
  'claude-opus-4-8',
  'claude-opus-5',
  'deepseek-v3-2',
  'gemini-3-7-flash',
  'gpt-5-2',
  'gpt-5-5',
  'kimi-k2-5',
]);

export function isTemporarilyNoindexedRoute(pathname: string) {
  const path = pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const model = path.match(/^\/models\/([^/]+)$/)?.[1];
  if (model) return TEMPORARILY_NOINDEXED_MODEL_IDS.has(model);

  const task = path.match(/^\/best-ai-for\/([^/]+)$/)?.[1];
  return task ? Boolean(graph().intents.get(task)?.parent) : false;
}
