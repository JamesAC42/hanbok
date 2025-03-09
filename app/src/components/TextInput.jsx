'use client';
import styles from '@/styles/components/input.module.scss';
import getFontClass from '@/lib/fontClass';
const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  disabled = false,
  variant = 'default',
  maxLength = 120,
  onPaste,
  language,
  ...props
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${styles.input} ${getFontClass(language)}`}
      maxLength={maxLength}
      onPaste={onPaste}
      {...props}
    />
  );
};

export default TextInput;
