// ============================================================================
// Form types — shared shapes for form state and validation errors
// ============================================================================

/** Map of field name -> first validation message. Absent key = no error. */
export type FieldErrors<T> = Partial<Record<keyof T & string, string>>;
