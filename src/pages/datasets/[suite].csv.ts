import type { APIRoute, GetStaticPaths } from 'astro';
import { datasetVisible } from '../../lib/dataset-publication';
import { publicDatasetCsv } from '../../lib/public-dataset';

export const prerender = true;

export const getStaticPaths = (() => ['spreadsheet-questions']
  .filter(datasetVisible)
  .map((suite) => ({ params: { suite }, props: { suite } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ suite: string }> = ({ props }) => new Response(
  publicDatasetCsv(props.suite),
  { headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="normie-mode-${props.suite}-v1.csv"`,
  } },
);
