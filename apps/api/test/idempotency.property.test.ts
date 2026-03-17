import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { getIdempotentResponse, setIdempotentResponse } from '../src/lib/idempotency.js';

describe('idempotency store', () => {
  it('returns same stored response for same key (property)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 40 }),
        fc.jsonValue(),
        async (key, json) => {
          await setIdempotentResponse(key, { createdAt: new Date(0).toISOString(), responseJson: json });
          const got = await getIdempotentResponse(key);
          expect(got).not.toBeNull();
          expect(got!.responseJson).toEqual(json);
        }
      ),
      { numRuns: 25 }
    );
  });
});

