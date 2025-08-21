// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { login, register, isAuthenticated } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }
    if (!isLogin) {
      if (!formData.name) return setError('Name is required');
      if (formData.password.length < 6) return setError('Password must be at least 6 characters long');
      if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
      const result = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.name, formData.email, formData.password);

      if (!result.success) {
        setError(result.errors ? result.errors.map(err => err.msg).join(', ') : result.message);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md transition-colors">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          {isLogin ? 'Welcome Back 👋' : 'Create an Account'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 
                         bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
              required
            />
          )}

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 
                       bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
            required
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 
                       bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
            required
          />

          {!isLogin && (
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm Password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 
                         bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 
                       disabled:bg-gray-400 transition-colors flex justify-center items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"></path>
                </svg>
                {isLogin ? 'Logging in...' : 'Registering...'}
              </>
            ) : (
              isLogin ? 'Login' : 'Register'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-700 dark:text-gray-300">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={switchMode}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            disabled={loading}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
