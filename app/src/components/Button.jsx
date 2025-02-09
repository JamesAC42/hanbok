'use client';
import styles from '@/styles/components/button.module.scss';

const Button = ({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${styles[variant]} ${className}`}

    >
      {children}
    </button>

  );
};

export default Button;
