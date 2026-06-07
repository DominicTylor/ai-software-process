import { describe, it, expect } from 'vitest';
import { parseCodeowners, ownersForPaths } from './codeowners';

const FILE = [
  '# comment',
  '/stories/                   @owner @qa',
  '/constitution.md            @arch',
  '/frameworks/                @qa',
].join('\n');

describe('codeowners', () => {
  it('parses rules in order', () => {
    const rules = parseCodeowners(FILE);
    expect(rules).toHaveLength(3);
    expect(rules[0]!.owners).toEqual(['@owner', '@qa']);
  });
  it('resolves owners by last matching rule per path, unioned across paths', () => {
    const rules = parseCodeowners(FILE);
    const owners = ownersForPaths(
      ['stories/auth/login/user-spec.md', 'constitution.md'],
      rules,
    );
    expect(owners.sort()).toEqual(['@arch', '@owner', '@qa'].sort());
  });
  it('returns empty when no rule matches', () => {
    const rules = parseCodeowners(FILE);
    expect(ownersForPaths(['README.md'], rules)).toEqual([]);
  });
});
