export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T;
  public readonly statusCode: number;
  public readonly timestamp: string;

  constructor(statusCode: number, data: T, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}
