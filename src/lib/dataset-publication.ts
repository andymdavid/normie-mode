export const DATASET_PREVIEW = process.env.NORMIE_DATASET_PREVIEW === '1';

export interface DatasetPublication {
  status: 'draft' | 'published';
  licence?: {
    name: string;
    url: string;
    scope: string;
  };
}

export const DATASET_PUBLICATIONS: Record<string, DatasetPublication> = {
  'spreadsheet-questions': { status: 'draft' },
};

export function datasetVisible(suite: string) {
  return DATASET_PUBLICATIONS[suite]?.status === 'published' || DATASET_PREVIEW;
}
