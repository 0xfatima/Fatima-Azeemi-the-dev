import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(err) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : "Something went wrong";
  if (status === 500) console.error(err);
  return NextResponse.json({ error: message }, { status });
}
