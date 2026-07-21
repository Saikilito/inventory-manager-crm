import React, { useState, Fragment } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';
import { GET_ALL_CONTEXTS } from '@modules/context/infrastructure/graphql/queries';
import { DELETE_CONTEXT } from '@modules/context/infrastructure/graphql/mutations';
import type { GQLContext, GQLGetAllContextsResponse } from '@modules/context/infrastructure/graphql/types';
import Spinkit from '@components/Spinkit';
import Alert from '@components/Alert';
import { ContextCard } from './components/ContextCard';
import { ContextModal } from './components/ContextModal';

export const ContextsPage: React.FC = () => {
  const { loading, error, data, refetch } = useQuery<GQLGetAllContextsResponse>(GET_ALL_CONTEXTS);
  const [deleteContext] = useMutation(DELETE_CONTEXT);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<GQLContext | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingContext(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ctx: GQLContext) => {
    setEditingContext(ctx);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = (message: string) => {
    setSuccessMessage(message);
    refetch();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete context "${name}"? This action cannot be undone.`)) return;
    
    try {
      await deleteContext({ variables: { _id: id } });
      setSuccessMessage(`Context "${name}" deleted successfully`);
      refetch();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error deleting context:', err);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-stone-150 dark:border-stone-850 pb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/products"
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Back to products"
          >
            <ArrowLeft className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Layers className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              Product Contexts
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Define product categories with custom attributes and field configurations.
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Context
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-6">
          <Alert message={successMessage} type="success" />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Spinkit />
          <p className="text-sm text-stone-500 dark:text-stone-400">Loading contexts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center text-sm font-medium text-red-800 dark:text-red-300 mb-6">
          <b>Error:</b> {error.message}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <Fragment>
          {data?.getAllContexts && data.getAllContexts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.getAllContexts.map((ctx) => (
                <ContextCard
                  key={ctx._id}
                  ctx={ctx}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5">
                <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
                No contexts yet
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-md mx-auto">
                Contexts let you categorize products with custom attributes. Create your first context to start organizing your catalog.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Context
              </button>
            </div>
          )}
        </Fragment>
      )}

      <ContextModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingContext={editingContext}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
};

export default ContextsPage;
