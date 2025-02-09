'use client';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/login.module.scss';
import Button from '@/components/Button';
import GoogleSignInButton from './GoogleSignInButton';

const Login = () => {
  const { login } = useAuth();

  return (
    <div className={styles.login}>
      <h1>Welcome to Hanbok</h1>
      <p>Please sign in to continue</p>
      <GoogleSignInButton/>
    </div>
  );
};

export default Login; 