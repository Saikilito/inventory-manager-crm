import React, { useState, Fragment } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { match } from 'ts-pattern';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Tag,
  Layers,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react';
import { GET_ALL_CONTEXTS } from '@modules/context/infrastructure/graphql/queries';
import { CREATE_CONTEXT, UPDATE_CONTEXT, DELETE_CONTEXT } from '@modules/context/infrastructure/graphql/mutations';
import Spinkit from '@components/Spinkit';
import Alert from '@components/Alert';

// Types
interface ContextAttribute {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface Context {
  _id: string;
  name: string;
  attributes: ContextAttribute[];
}

interface ContextsData {
  getAllContexts: Context[];
}

// Attribute type badges
const ATTRIBUTE_TYPES: Record<string, { label: string; color: string }> = {
  STRING: { label: 'Text', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  NUMBER: { label: 'Number', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  BOOLEAN: { label: 'Boolean', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  MULTIPLE: { label: 'Multiple', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

export const ContextsPage: React.FC = () => {
  const { loading, error, data, refetch } = useQuery<ContextsData>(GET_ALL_CONTEXTS);
  const [createContext] = useMutation(CREATE_CONTEXT);
  const [updateContext] = useMutation(UPDATE_CONTEXT);
  const [deleteContext] = useMutation(DELETE_CONTEXT);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);
  const [formName, setFormName] = useState('');
  const [formAttributes, setFormAttributes] = useState<ContextAttribute[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handlers
  const openCreateModal = () => {
    setEditingContext(null);
    setFormName('');
    setFormAttributes([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ctx: Context) => {
    setEditingContext(ctx);
    setFormName(ctx.name);
    setFormAttributes([...ctx.attributes]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContext(null);
    setFormName('');
    setFormAttributes([]);
    setFormError(null);
    setIsSaving(false);
  };

  const addAttribute = () => {
    setFormAttributes([
      ...formAttributes,
      { name: '', label: '', type: 'STRING', required: false },
    ]);
  };

  const updateAttribute = (index: number, field: keyof ContextAttribute, value: string | boolean) => {
    const updated = [...formAttributes];
    updated[index] = { ...updated[index], [field]: value };
    setFormAttributes(updated);
  };

  const removeAttribute = (index: number) => {
    setFormAttributes(formAttributes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formName.trim()) {
      setFormError('Context name is required');
      return;
    }

    const invalidAttrs = formAttributes.filter(a => !a.name.trim());
    if (invalidAttrs.length > 0) {
      setFormError('All attributes must have a name');
      return;
    }

    const input = {
      name: formName.trim(),
      attributes: formAttributes.map(attr => ({
        name: attr.name.trim(),
        label: (attr.label || attr.name).trim(),
        type: attr.type,
        required: attr.required,
      })),
    };

    setIsSaving(true);
    try {
      if (editingContext) {
        await updateContext({
          variables: {
            input: { _id: editingContext._id, ...input },
          },
        });
        setSuccessMessage(`Context "${formName}" updated successfully`);
      } else {
        await createContext({
          variables: { input },
        });
        setSuccessMessage(`Context "${formName}" created successfully`);
      }
      closeModal();
      refetch();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error saving context:', err);
      setFormError('Failed to save context. Please try again.');
    } finally {
      setIsSaving(false);
    }
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

  // Render
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
                <article
                  key={ctx._id}
                  className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden hover:border-stone-300 dark:hover:border-stone-700 transition-all shadow-sm hover:shadow-md"
                >
                  {/* Context Header */}
                  <div className="p-5 border-b border-stone-100 dark:border-stone-800/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                            {ctx.name}
                          </h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {ctx.attributes.length} attribute{ctx.attributes.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(ctx)}
                          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          aria-label={`Edit ${ctx.name}`}
                        >
                          <Edit3 className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(ctx._id, ctx.name)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          aria-label={`Delete ${ctx.name}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attributes */}
                  {ctx.attributes.length > 0 ? (
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2">
                        {ctx.attributes.slice(0, 5).map((attr, i) => {
                          const typeInfo = ATTRIBUTE_TYPES[attr.type] || ATTRIBUTE_TYPES.STRING;
                          return (
                            <div
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/60 text-xs font-medium text-stone-700 dark:text-stone-300"
                            >
                              <span className="truncate max-w-[100px]">{attr.label || attr.name}</span>
                              {attr.required && (
                                <span className="text-red-500">*</span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          );
                        })}
                        {ctx.attributes.length > 5 && (
                          <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/60 text-xs font-medium text-stone-500 dark:text-stone-400">
                            +{ctx.attributes.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                        No attributes defined
                      </p>
                    </div>
                  )}
                </article>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {editingContext ? 'Edit Context' : 'New Context'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Error Alert */}
              {formError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-3 rounded-xl text-sm text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              {/* Context Name */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Context Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Electronics, Clothing, Food & Beverage"
                  required
                />
              </div>

              {/* Attributes Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    Custom Attributes
                  </label>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>

                {formAttributes.length === 0 ? (
                  <div className="py-8 text-center bg-stone-50 dark:bg-stone-800/30 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700">
                    <p className="text-sm text-stone-400 dark:text-stone-500">
                      No custom attributes yet. Click "Add Field" to define product-specific fields.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formAttributes.map((attr, index) => {
                      const typeInfo = ATTRIBUTE_TYPES[attr.type] || ATTRIBUTE_TYPES.STRING;
                      return (
                        <div
                          key={index}
                          className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl space-y-3 border border-stone-200 dark:border-stone-700/50"
                        >
                          {/* Row 1: Name + Delete */}
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={attr.name}
                              onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400"
                              placeholder="Field name (e.g., brand, size, color)"
                            />
                            <button
                              type="button"
                              onClick={() => removeAttribute(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Row 2: Label + Type + Required */}
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={attr.label}
                              onChange={(e) => updateAttribute(index, 'label', e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400"
                              placeholder="Display label"
                            />
                            <select
                              value={attr.type}
                              onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                              className="px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                            >
                              <option value="STRING">Text</option>
                              <option value="NUMBER">Number</option>
                              <option value="BOOLEAN">Boolean</option>
                              <option value="MULTIPLE">Multiple</option>
                            </select>
                            <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={attr.required}
                                onChange={(e) => updateAttribute(index, 'required', e.target.checked)}
                                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-emerald-600 focus:ring-emerald-500"
                              />
                              Required
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3 bg-stone-50 dark:bg-stone-900/50">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingContext ? 'Update Context' : 'Create Context'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextsPage;
