import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlocState } from '@hooks/use-ploc-state';
import { useAuthPloc } from '@contexts/auth-context';
import { KeyRound } from 'lucide-react';

import ErrorAlert from '../../components/Error';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const ploc = useAuthPloc();
  const state = usePlocState(ploc);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // If the user becomes authenticated, redirect them to the panel
  useEffect(() => {
    if (state.kind === 'auth:authenticated') {
      navigate('/clients', { replace: true });
    }
  }, [state.kind, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await ploc.login(email, password);
  };

  const isButtonDisabled = !email || !password || state.kind === 'auth:authenticating';
  const errorMessage = state.kind === 'auth:error' ? state.errorMessage : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-xl p-8 transition-colors duration-300">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 transition-colors duration-300">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
            Ingresá tus credenciales para acceder al CRM
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && <ErrorAlert error={errorMessage} />}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Usuario / Email
            </label>
            <input
              type="text"
              name="user"
              className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
              placeholder="Nombre Usuario o Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all"
              placeholder="Ingresá tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            disabled={isButtonDisabled}
            type="submit"
            className="w-full h-11 bg-stone-950 hover:bg-stone-900 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {state.kind === 'auth:authenticating' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.14 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Iniciando...</span>
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
