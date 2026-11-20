import { createServer } from 'vite';
const server = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' });
try {
  const { tasksByDemand, taskScores } = await server.ssrLoadModule('/src/lib/tasks.ts');
  const { verdict } = await server.ssrLoadModule('/src/lib/verdict.ts');
  console.log(JSON.stringify(tasksByDemand().map(({task}: any) => ({
    task: task.id,
    scores: taskScores(task).rows.map((r: any) => ({ model:r.id, score:Number(r.value.toFixed(3)) })),
    picks: verdict(task)?.picks.map((p: any) => ({ kinds:p.kinds, options:p.options.map((o: any) => ({model:o.modelId,plan:o.plan?.plan.id,app:o.plan?.app.id,price:o.plan?.plan.price_usd})) })) ?? [],
  }))));
} finally { await server.close(); }
