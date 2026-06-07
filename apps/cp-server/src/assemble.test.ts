import { describe, it, expect } from 'vitest';
import { storySlugFromPath } from './assemble';

describe('storySlugFromPath', () => {
  it('handles flat layout stories/<slug>/...', () => {
    expect(storySlugFromPath('stories/login/user-spec.md')).toEqual({ slug: 'login', dir: 'stories/login' });
    expect(storySlugFromPath('stories/login/e2e/s.spec.ts')).toEqual({ slug: 'login', dir: 'stories/login' });
  });
  it('handles grouped layout stories/<group>/<slug>/...', () => {
    expect(storySlugFromPath('stories/auth/login/e2e/s.spec.ts')).toEqual({ slug: 'login', dir: 'stories/auth/login' });
  });
  it('returns null for non-story paths', () => {
    expect(storySlugFromPath('frameworks/e2e/index.ts')).toBeNull();
    expect(storySlugFromPath('README.md')).toBeNull();
  });
});
