import type { ButtonHTMLAttributes, ComponentProps, CSSProperties, ReactNode } from 'react';
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';

export function Button({
  variant = 'secondary',
  size = 'default',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'sm';
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      className={`button button-${variant} button-${size} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      {...props}
      aria-label={label}
      title={label}
      className={`icon-button ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}
export function Avatar({ name = 'Alex Morgan' }: { name?: string }) {
  return (
    <span className="avatar" aria-label={name}>
      {name
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}
export const Separator = () => <span className="separator" aria-hidden="true" />;
export function Card({ children, className = '', ...props }: ComponentProps<'section'>) {
  return (
    <section {...props} className={`card ${className}`}>
      {children}
    </section>
  );
}
export function Surface({ children, className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div {...props} className={`surface ${className}`}>
      {children}
    </div>
  );
}
export function Typography({
  as: Tag = 'p',
  children,
  ...props
}: {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  children: ReactNode;
  className?: string;
}) {
  return <Tag {...props}>{children}</Tag>;
}
export function Skeleton({ style }: { style?: CSSProperties }) {
  return <div className="skeleton" style={style} aria-label="Loading" />;
}
export function Spinner() {
  return <span className="spinner" role="status" aria-label="Loading" />;
}
export function Progress({ value, label = 'Progress' }: { value: number; label?: string }) {
  return <progress className="progress" value={value} max={100} aria-label={label} />;
}
export function Alert({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'error';
}) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`alert alert-${tone}`}>
      <AlertCircle size={16} />
      <div>{children}</div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={30} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Toast({ message }: { message: string }) {
  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}
export const LoadingIcon = LoaderCircle;
