import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

// ============================================================================
// Input / Label / Field — form control primitives
// ============================================================================
// Standardizes the input styling that the ExportDialog repeated five times
// and gives every form consistent label linkage, error display, and focus
// rings. Field composes Label + Input + error message with correct ids and
// aria wiring so individual forms cannot forget accessibility.

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Renders the destructive border state and wires aria-invalid */
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error = false, className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={`w-full px-3 py-2 rounded-lg border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        error ? "border-error focus:ring-error" : "border-border"
      } ${className}`}
      {...rest}
    />
  );
});

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ error = false, className = "", ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={error || undefined}
        className={`w-full px-3 py-2 rounded-lg border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-error focus:ring-error" : "border-border"
        } ${className}`}
        {...rest}
      />
    );
  }
);

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Marks the label text with the conventional required asterisk */
  required?: boolean;
}

export function Label({ className = "", children, required, ...rest }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-text-secondary ${className}`}
      {...rest}
    >
      {children}
      {required && (
        <span className="text-error ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export interface FieldProps {
  /** Accessible label text */
  label: string;
  /** Show the required asterisk next to the label */
  required?: boolean;
  /** Error message rendered below the input; sets invalid state */
  error?: string;
  /** Hint text rendered below the input when there is no error */
  hint?: string;
  /** Render a textarea instead of an input */
  multiline?: boolean;
  className?: string;
  /** Props forwarded to the underlying input/textarea */
  inputProps?: InputHTMLAttributes<HTMLInputElement> &
    TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export function Field({
  label,
  required = false,
  error,
  hint,
  multiline = false,
  className = "",
  inputProps = {},
}: FieldProps) {
  const autoId = useId();
  const id = inputProps.id ?? `field-${autoId}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {multiline ? (
        <TextArea id={id} error={Boolean(error)} aria-describedby={describedBy} {...(inputProps as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <Input id={id} error={Boolean(error)} aria-describedby={describedBy} {...(inputProps as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
