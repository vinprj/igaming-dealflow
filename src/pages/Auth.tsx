
import React, { useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';

const Auth = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => setIsLoginMode(!isLoginMode);

  if (isLoginMode) {
    return (
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to your iGaming M&A account"
      >
        <LoginForm onToggleMode={toggleMode} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the premier iGaming M&A marketplace"
    >
      <SignUpForm onToggleMode={toggleMode} />
    </AuthLayout>
  );
};

export default Auth;
