export interface EmailResult {
  recipient: string;
  status: 'success' | 'failed';
  message: string;
}
