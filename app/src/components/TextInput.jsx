'use client';
import { useEffect, useRef } from 'react';
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
  const textareaRef = useRef(null);

  // Auto-resize function
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Auto-resize on value change
  useEffect(() => {
    autoResize();
  }, [value]);

  // Auto-resize on initial mount
  useEffect(() => {
    autoResize();
  }, []);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    // Trigger auto-resize after the state update
    setTimeout(autoResize, 0);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${styles.input} ${styles.textarea} ${getFontClass(language)}`}
      maxLength={maxLength}
      onPaste={onPaste}
      rows={1}
      style={{
        resize: 'none',
        overflow: 'hidden',
        minHeight: '1.2rem',
        lineHeight: '1.4'
      }}
      {...props}
    />
  );
};

export default TextInput;
