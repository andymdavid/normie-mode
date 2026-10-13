import { graph } from './graph';

// D-039 restored the original D-035 historical-model set after enrichment.
// Keep the explicit set so any future temporary exclusion remains reviewed and testable.
export const TEMPORARILY_NOINDEXED_MODEL_IDS = new Set<string>();

export function isTemporarilyNoindexedRoute(pathname: string) {
  const path = pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const model = path.match(/^\/models\/([^/]+)$/)?.[1];
  if (model) return TEMPORARILY_NOINDEXED_MODEL_IDS.has(model);

  const task = path.match(/^\/best-ai-for\/([^/]+)$/)?.[1];
  return task ? Boolean(graph().intents.get(task)?.parent) : false;
}
