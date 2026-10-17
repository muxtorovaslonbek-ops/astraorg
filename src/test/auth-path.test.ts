import { describe, expect, it } from 'vitest';
import { safeAuthPath } from '@/lib/auth-path';

describe('Sign-in return destination', () => {
  it('preserves the requested subject page', () => {
    expect(safeAuthPath('/fan/hasharotlar')).toBe('/fan/hasharotlar');
  });
  it('never navigates to another origin after sign-in', () => {
    for (const path of ['https://example.org', '//example.org', '/\\example.org', '/\n/example.org']) expect(safeAuthPath(path)).toBe('/');
  });
});