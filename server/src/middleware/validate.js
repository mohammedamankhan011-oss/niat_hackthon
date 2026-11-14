import { AppError } from '../utils/AppError.js';

/**
 * Validates request parts with Zod schemas and stores the parsed values on
 * req.valid.{body,params,query}. Unknown fields are stripped.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid ??= {};
    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const issue = result.error.issues[0];
        const field = issue.path.join('.');
        throw AppError.badRequest(
          field ? `${field}: ${issue.message}` : issue.message,
          'VALIDATION_ERROR',
          result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        );
      }
      req.valid[part] = result.data;
    }
    next();
  };
}
