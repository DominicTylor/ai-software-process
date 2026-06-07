import matter from 'gray-matter';
import { Ajv, type Schema } from 'ajv';

export interface SpecValidation { valid: boolean; errors: string[]; }

export function validateUserSpec(markdown: string, schema: Schema): SpecValidation {
  const parsed = matter(markdown);
  if (parsed.matter.trim() === '') {
    return { valid: false, errors: ['no YAML frontmatter found'] };
  }
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
