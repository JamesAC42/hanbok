'use client';
import styles from '@/styles/components/input.module.scss';

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  disabled = false,
  variant = 'default'
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${styles.input} ${styles[variant]} ${className}`}
    />
  );
};

export default TextInput;
