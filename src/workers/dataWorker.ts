/// <reference lib="webworker" />
import datasetUrl from '../data/dataset.json?url';
import { datasetSchema } from '../schema';

(async () => {
    try {
        const response = await fetch(datasetUrl);
        const json = await response.json();
        const data = await datasetSchema.parseAsync(json);
        postMessage({ data });
    } catch (error) {
        postMessage({ error: error instanceof Error ? error.message : String(error) });
    }
})();
