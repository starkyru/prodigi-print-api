export class ProdigiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProdigiError";
  }
}

export class ProdigiApiError extends ProdigiError {
  readonly statusCode: number;
  readonly traceParent: string | null;
  readonly data: unknown;

  constructor(
    message: string,
    statusCode: number,
    traceParent: string | null,
    data: unknown,
  ) {
    super(message);
    this.name = "ProdigiApiError";
    this.statusCode = statusCode;
    this.traceParent = traceParent;
    this.data = data;
  }
}
