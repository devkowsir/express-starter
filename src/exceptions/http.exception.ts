export class HttpException extends Error {
  public status: number;
  public message: string;
  public details?: Record<string, any>;

  constructor(status: number, message: string, details?: Record<string, any>) {
    super(message);
    this.status = status;
    this.message = message;
    this.details = details;
  }
}
