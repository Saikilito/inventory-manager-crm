import React, { useState } from 'react';
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';
import { Database, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';
import Spinkit from '../../components/Spinkit';
import { SEED_DATABASE, WIPE_DATABASE } from '../../lib/graphql/mutations';

// Modular Sub-components
import { DatabaseInventoryGrid } from './components/DatabaseInventoryGrid.js';
import { SandboxOperationsPanel } from './components/SandboxOperationsPanel.js';
import { WipeConfirmationModal } from './components/WipeConfirmationModal.js';
import { FeatureFlagPanel } from './components/FeatureFlagPanel';

const GET_DATABASE_STATUS = gql`
  query GetDatabaseStatus {
    getDatabaseStatus {
      clientsCount
      testingClientsCount
      productsCount
      testingProductsCount
      ordersCount
      testingOrdersCount
      usersCount
      testingUsersCount
    }
  }
`;

export const SettingsPage: React.FC = () => {
  const apolloClient = useApolloClient();
  const { data, loading, error, refetch } = useQuery(GET_DATABASE_STATUS, {
    fetchPolicy: 'network-only',
  });

  const [seedDatabase, { loading: seedLoading }] = useMutation(SEED_DATABASE);
  const [wipeDatabase, { loading: wipeLoading }] = useMutation(WIPE_DATABASE);

  // Success, error, and modal states
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSeed = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const response = await seedDatabase();
      if (response.data?.seedDatabase) {
        await apolloClient.clearStore();
        await refetch();
        setSuccessMessage('Database sandbox successfully seeded with realistic testing data.');
      } else {
        setErrorMessage('Failed to seed database sandbox.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while seeding the database sandbox.');
    }
  };

  const handleOpenWipeModal = () => {
    setWipeError(null);
    setIsWipeModalOpen(true);
  };

  const handleWipeConfirm = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const response = await wipeDatabase();
      if (response.data?.wipeDatabase) {
        setIsWipeModalOpen(false);
        await apolloClient.clearStore();
        await refetch();
        setSuccessMessage('All sandbox testing data was successfully wiped from the database.');
      } else {
        setWipeError('Failed to wipe database sandbox.');
      }
    } catch (err: any) {
      setWipeError(err.message || 'An error occurred while wiping the database sandbox.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinkit />
        <p className="text-sm text-stone-500 mt-4">Loading system status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-600 dark:text-red-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-lg font-bold">Failed to load system status</h2>
          <p className="text-sm mt-1">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-red-500 text-sm font-medium rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.getDatabaseStatus || {
    clientsCount: 0,
    testingClientsCount: 0,
    productsCount: 0,
    testingProductsCount: 0,
    ordersCount: 0,
    testingOrdersCount: 0,
    usersCount: 0,
    testingUsersCount: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 dark:border-stone-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight flex items-center gap-2">
            <Database className="w-8 h-8 text-amber-500" />
            Sandbox & Settings Manager
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
            Manage your sandbox environment, database seeds, and testing data isolation.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="self-start md:self-auto inline-flex items-center justify-center px-4 py-2.5 border border-stone-300 dark:border-stone-700 text-sm font-medium rounded-lg text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Stats
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Action Completed</h3>
            <p className="text-xs mt-1">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/15 border border-red-500/20 text-red-800 dark:text-red-400 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Error Occurred</h3>
            <p className="text-xs mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Database Statistics Bento Grid */}
      <DatabaseInventoryGrid stats={stats} />

      {/* Sandbox Operations Section */}
      <SandboxOperationsPanel
        onSeed={handleSeed}
        onWipe={handleOpenWipeModal}
        seedLoading={seedLoading}
        wipeLoading={wipeLoading}
      />

      {/* Feature Flags Section */}
      <FeatureFlagPanel />

      {/* Double-Confirmation Modal */}
      <WipeConfirmationModal
        isOpen={isWipeModalOpen}
        onClose={() => setIsWipeModalOpen(false)}
        onConfirm={handleWipeConfirm}
        loading={wipeLoading}
        error={wipeError}
        setError={setWipeError}
      />
    </div>
  );
};

export default SettingsPage;
