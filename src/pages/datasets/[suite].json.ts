import type { APIRoute, GetStaticPaths } from 'astro';
import { datasetVisible } from '../../lib/dataset-publication';
import { publicDataset } from '../../lib/public-dataset';

export const prerender = true;

export const getStaticPaths = (() => ['spreadsheet-questions']
  .filter(datasetVisible)
  .map((suite) => ({ params: { suite }, props: { suite } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ suite: string }> = ({ props }) => new Response(
  JSON.stringify(publicDataset(props.suite), null, 2) + '\n',
  { headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="normie-mode-${props.suite}-v1.json"`,
  } },
);
