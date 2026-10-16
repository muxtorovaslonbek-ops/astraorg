import { describe, expect, it } from 'vitest';
import { computeTelegramHash, verifyTelegramAuth } from '@/lib/telegram-verify';

describe('Telegram signature verification', () => {
  const token = 'test-only-not-a-real-bot-token';
  const now = 1800000000000;
  const base = { id: 123, first_name: 'Test', auth_date: now / 1000 };
  it('accepts a valid signed identity and rejects a changed identity', async () => {
    const hash = await computeTelegramHash(base, token);
    expect(await verifyTelegramAuth({ ...base, hash }, token, 86400, now)).toBe(true);
    expect(await verifyTelegramAuth({ ...base, id: 456, hash }, token, 86400, now)).toBe(false);
  });
  it('rejects expired or future identities', async () => {
    const hash = await computeTelegramHash(base, token);
    expect(await verifyTelegramAuth({ ...base, hash }, token, 86400, now + 86401000)).toBe(false);
    expect(await verifyTelegramAuth({ ...base, hash }, token, 86400, now - 301000)).toBe(false);
  });
});