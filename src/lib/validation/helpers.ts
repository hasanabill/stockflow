import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError(errorMessages);
    }
    throw error;
  }
}

export class ValidationError extends Error {
  constructor(public errors: Array<{ field: string; message: string }>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export function handleValidationError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { 
        error: "Validation failed", 
        details: error.errors 
      }, 
      { status: 400 }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: "Internal server error" }, 
    { status: 500 }
  );
}

export async function validateRequestBody<T>(schema: ZodSchema<T>, request: Request): Promise<T> {
  try {
    const body = await request.json();
    return validateRequest(schema, body);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError([{ field: "body", message: "Invalid JSON" }]);
  }
}

export function validateParams<T>(schema: ZodSchema<T>, params: unknown): T {
  return validateRequest(schema, params);
}
