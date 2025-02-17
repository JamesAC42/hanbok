'use client';
import styles from '@/styles/components/input.module.scss';

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  disabled = false,
  variant = 'default',
  maxLength = 120
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${styles.input} ${styles[variant]} ${className}`}
      maxLength={maxLength}
    />
  );
};

export default TextInput;
