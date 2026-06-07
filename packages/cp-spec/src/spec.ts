import matter from 'gray-matter';
import { Ajv, type Schema } from 'ajv';

export interface SpecValidation { valid: boolean; errors: string[]; }

export function validateUserSpec(markdown: string, schema: Schema): SpecValidation {
  // gray-matter.test() is cache-safe (unlike parsed.matter which is non-enumerable and
  // lost on cache-hit Object.assign copies). Check for front matter presence first.
  if (!matter.test(markdown)) {
    return { valid: false, errors: ['no YAML frontmatter found'] };
  }
  const parsed = matter(markdown);
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const ok = validate(parsed.data);
  if (ok) return { valid: true, errors: [] };
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? ''}`.trim() +
      (e.params && 'missingProperty' in e.params ? ` (${e.params.missingProperty})` : ''),
  );
  return { valid: false, errors };
}
