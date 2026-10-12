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
  'spreadsheet-questions': {
    status: 'published',
    licence: {
      name: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      url: 'https://creativecommons.org/licenses/by/4.0/',
      scope: 'Applies to Normie Mode-authored synthetic cases, prompts, questions, answer keys, scores, annotations and the compiled dataset structure. Raw model-generated responses are included for auditability but are excluded from this licence grant and may be subject to provider terms.',
    },
  },
};

export function datasetVisible(suite: string) {
  return DATASET_PUBLICATIONS[suite]?.status === 'published' || DATASET_PREVIEW;
}
