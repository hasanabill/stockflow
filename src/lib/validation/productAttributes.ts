import Ajv, { ValidateFunction, ErrorObject } from "ajv";

const ajv = new Ajv({ allErrors: true, coerceTypes: true, removeAdditional: false });

const compiledCache = new Map<string, ValidateFunction>();

export function validateAttributes(schema: Record<string, any>, attributes: unknown) {
    const key = JSON.stringify(schema);
    let validator = compiledCache.get(key);
    if (!validator) {
        validator = ajv.compile(schema);
        compiledCache.set(key, validator);
    }
    const valid = validator(attributes);
    if (!valid) {
        const message = (validator.errors as ErrorObject[] | null | undefined)?.map((e) => `${(e as any).instancePath || e.schemaPath} ${e.message}`).join("; ") || "Invalid attributes";
        throw new Error(message);
    }
}


