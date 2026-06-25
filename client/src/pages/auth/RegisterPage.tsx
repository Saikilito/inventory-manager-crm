import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePlocState } from '@hooks/use-ploc-state';
import { useAuthPloc } from '@contexts/auth-context';
import { UserRole } from '@shared-domain/shared/value-objects/role.vo';
import { UserPlus, ChevronDown } from 'lucide-react';

import ErrorAlert from '../../components/Error';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const ploc = useAuthPloc();
  const state = usePlocState(ploc);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SELLER); // Default role 'SELLER'

  const [localError, setLocalError] = useState<string | null>(null);

  // Guard: only 'ADMIN' can access this page
  if (state.kind === 'auth:authenticated' && state.user.role !== UserRole.ADMIN) {
    return <Navigate to="/clients" replace />;
  }

  const validateForm = () => {
    return !username || !email || !name || !password || password !== repeatPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== repeatPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (/\s/.test(username)) {
      setLocalError('Username cannot contain spaces');
      return;
    }

    await ploc.register(name, username, email, password, role);

    // If registration succeeds without throwing, redirect to login or clear
    if (state.kind !== 'auth:error') {
      setUsername('');
      setEmail('');
      setName('');
      setPassword('');
      setRepeatPassword('');
      navigate('/login');
    }
  };

  const errorMessage = localError || (state.kind === 'auth:error' ? state.errorMessage : undefined);
  const isButtonDisabled = validateForm() || state.kind === 'auth:registering';

  return (
    <div className="flex justify-center py-4 lg:py-8">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-xl p-8 transition-colors duration-300">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 transition-colors duration-300">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            New User
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
            Register a new user on the platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && <ErrorAlert error={errorMessage} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Username
              </label>
              <input
                type="text"
                name="user"
                className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-xs text-stone-400 dark:text-stone-500">
                No spaces or special characters
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Unique user email
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Full user name
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Repeat Password
              </label>
              <input
                type="password"
                name="repeatPassword"
                className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
                placeholder="Repeat password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Role
            </label>
            <div className="relative">
              <select
                name="role"
                className="w-full h-11 pl-3 pr-10 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all appearance-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value={UserRole.SELLER}>Seller</option>
                <option value={UserRole.ADMIN}>Administrator</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-500 dark:text-stone-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <button
            disabled={isButtonDisabled}
            type="submit"
            className="w-full h-11 bg-stone-950 hover:bg-stone-900 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {state.kind === 'auth:registering' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.14 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              'Create User'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
