import styles from './pulse-dot.module.css';

export function PulseDot({ className }: { readonly className?: string }) {
  return <span className={className ? `${styles.dot} ${className}` : styles.dot} data-pulse="" aria-hidden="true" />;
}
