import { describe, it, expect } from 'vitest';
import { validateUserSpec } from './spec';

const SCHEMA = {
  type: 'object',
  required: ['title', 'slug'],
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 3 },
    slug: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
    enforces: { type: 'array', items: { type: 'string' } },
    affects: { type: 'array', items: { type: 'string' } },
  },
};

describe('validateUserSpec', () => {
  it('accepts a well-formed user-spec', () => {
    const md = '---\ntitle: User signs in\nslug: login\n---\n# body';
    const r = validateUserSpec(md, SCHEMA);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('reports missing required fields', () => {
    const md = '---\ntitle: x\n---\n# body';
    const r = validateUserSpec(md, SCHEMA);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toContain('slug');
  });

  it('flags absent frontmatter', () => {
    const r = validateUserSpec('# no frontmatter', SCHEMA);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ').toLowerCase()).toContain('frontmatter');
  });
});
