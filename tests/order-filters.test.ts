import { describe, expect, it } from 'vitest';
import { buildOrderWhere } from '../src/lib/order-filters';

describe('Shared order-list and export filters', () => {
  it('includes the complete Jordanian calendar day rather than the UTC server day', () => {
    expect(buildOrderWhere(new URLSearchParams('startDate=2026-10-12&endDate=2026-10-12'))).toEqual({
      createdAt: { gte: new Date('2026-10-11T21:00:00Z'), lt: new Date('2026-10-12T21:00:00Z') },
    });
  });
  it.each(['startDate=2026-02-30', 'endDate=not-a-date', 'startDate=2026-10-13&endDate=2026-10-12', 'status=UNKNOWN'])('rejects invalid filters instead of silently returning unrelated orders (%s)', query => {
    expect(() => buildOrderWhere(new URLSearchParams(query))).toThrow();
  });
  it('combines search, status and dates for the same dataset in the table and export', () => {
    const result = buildOrderWhere(new URLSearchParams('search=  Amman  &status=NEW&startDate=2026-10-12'));
    expect(result.status).toBe('NEW');
    expect(result.OR).toHaveLength(4);
    expect(result.createdAt).toEqual({ gte: new Date('2026-10-11T21:00:00Z') });
  });
});
