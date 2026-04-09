export interface FieldError {
  field: string;
  message: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: FieldError[];
}
