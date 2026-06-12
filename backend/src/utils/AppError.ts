export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.name = 'AppError';
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static badRequest(message = 'Invalid request') {
    return new AppError(400, message, 'BAD_REQUEST');
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }
}
