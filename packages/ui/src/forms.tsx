import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ComponentProps,
  type ReactNode,
} from 'react';

export function Input(props: ComponentProps<'input'>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />;
}
export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea {...props} className={`textarea ${props.className ?? ''}`} />;
}
export function Select(props: ComponentProps<'select'>) {
  return <select {...props} className={`select ${props.className ?? ''}`} />;
}
export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const generated = useId();
  const child = isValidElement(children)
    ? (children as ReactElement<{
        id?: string;
        'aria-describedby'?: string;
        'aria-invalid'?: boolean;
      }>)
    : undefined;
  const id = child?.props.id ?? generated;
  const describedBy = [
    hint ? `${id}-hint` : '',
    error ? `${id}-error` : '',
    child?.props['aria-describedby'] ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {child
        ? cloneElement(child, {
            id,
            'aria-describedby': describedBy || undefined,
            'aria-invalid': error ? true : child.props['aria-invalid'],
          })
        : children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <span id={`${id}-error`}>
          <ValidationMessage>{error}</ValidationMessage>
        </span>
      )}
    </div>
  );
}
export function ValidationMessage({ children }: { children: ReactNode }) {
  return (
    <span className="validation" role="alert">
      {children}
    </span>
  );
}
export function Checkbox({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="checkbox-label">
      <input {...props} type="checkbox" className="checkbox" />
      {label}
    </label>
  );
}
export function Switch({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="switch-label">
      <input {...props} type="checkbox" role="switch" className="switch" />
      {label}
    </label>
  );
}
export function Slider({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input {...props} id={id} type="range" />
    </div>
  );
}
export function RadioGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <fieldset style={{ border: 0, padding: 0 }}>
      <legend className="field-label">{label}</legend>
      {options.map((o) => (
        <label className="checkbox-label" key={o.value}>
          <input
            type="radio"
            name={id}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}
