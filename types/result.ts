/** 后端 Result<T> 外层；成功无 message，失败无 data，因此均为可选字段。 */
export interface ResultEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}
