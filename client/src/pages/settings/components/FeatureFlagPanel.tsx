import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SYSTEM_CONFIG } from '../../../modules/settings/infrastructure/graphql/queries';
import { UPDATE_SYSTEM_CONFIG } from '../../../modules/settings/infrastructure/graphql/mutations';
import { Sliders, RefreshCw, AlertTriangle } from 'lucide-react';
import Spinkit from '../../../components/Spinkit.js';

export const FeatureFlagPanel: React.FC = () => {
  const { data, loading, error, refetch } = useQuery(GET_SYSTEM_CONFIG);
  const [updateSystemConfig, { loading: updating }] = useMutation(UPDATE_SYSTEM_CONFIG);

  const handleToggle = async () => {
    if (!data?.getSystemConfig) {
      return;
    }
    const currentStatus = data.getSystemConfig.rentalsEnabled;
    try {
      await updateSystemConfig({
        variables: {
          rentalsEnabled: !currentStatus,
        },
      });
    } catch (err) {
      console.error('Failed to update feature flags:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 flex items-center justify-center min-h-[120px]">
        <Spinkit />
        <span className="ml-3 text-sm text-stone-500">Loading system configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center justify-between text-red-600 dark:text-red-400">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold">Failed to load feature flags</p>
            <p className="text-xs mt-0.5">{error.message}</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-3 py-1.5 border border-red-500 text-xs font-medium rounded-lg hover:bg-red-500/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </button>
      </div>
    );
  }

  const rentalsEnabled = data?.getSystemConfig?.rentalsEnabled ?? true;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 shadow-sm">
      <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="space-y-1 pr-4">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            Rentals Module (Alquileres)
            {rentalsEnabled ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-400">
                Disabled
              </span>
            )}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xl leading-relaxed">
            Toggle the tool rental reservations system. Disabling this module removes it from sidebar/bottom navigation
            menus, blocks access to the `/rentals` page, and safeguards system performance.
          </p>
        </div>

        <div>
          <button
            onClick={handleToggle}
            disabled={updating}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              rentalsEnabled ? 'bg-indigo-600' : 'bg-stone-200 dark:bg-stone-700'
            } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Toggle rentals module"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                rentalsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Feature Flags & Modules
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
              Dynamically toggle application modules. Disabling a feature hides its navigations and strictly restricts
              module routes instantly for all users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagPanel;
