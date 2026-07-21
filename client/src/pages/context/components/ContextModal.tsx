import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Settings2, X, Plus, Trash2 } from 'lucide-react';
import { CREATE_CONTEXT, UPDATE_CONTEXT } from '@modules/context/infrastructure/graphql/mutations';
import type { GQLContext, GQLContextAttribute } from '@modules/context/infrastructure/graphql/types';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContext: GQLContext | null;
  onSaveSuccess: (message: string) => void;
}

export const ContextModal: React.FC<ContextModalProps> = ({
  isOpen,
  onClose,
  editingContext,
  onSaveSuccess,
}) => {
  const [createContext] = useMutation(CREATE_CONTEXT);
  const [updateContext] = useMutation(UPDATE_CONTEXT);

  const [formName, setFormName] = useState('');
  const [formAttributes, setFormAttributes] = useState<GQLContextAttribute[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingContext) {
        setFormName(editingContext.name);
        setFormAttributes([...editingContext.attributes]);
      } else {
        setFormName('');
        setFormAttributes([]);
      }
      setFormError(null);
      setIsSaving(false);
    }
  }, [isOpen, editingContext]);

  if (!isOpen) return null;

  const addAttribute = () => {
    setFormAttributes([
      ...formAttributes,
      { name: '', label: '', type: 'STRING', required: false },
    ]);
  };

  const updateAttribute = (
    index: number,
    field: keyof GQLContextAttribute,
    value: string | boolean
  ) => {
    const updated = [...formAttributes];
    updated[index] = { ...updated[index], [field]: value } as GQLContextAttribute;
    setFormAttributes(updated);
  };

  const removeAttribute = (index: number) => {
    setFormAttributes(formAttributes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Context name is required');
      return;
    }

    const invalidAttrs = formAttributes.filter((a) => !a.name.trim());
    if (invalidAttrs.length > 0) {
      setFormError('All attributes must have a name');
      return;
    }

    const input = {
      name: formName.trim(),
      attributes: formAttributes.map((attr) => ({
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
        onSaveSuccess(`Context "${formName}" updated successfully`);
      } else {
        await createContext({
          variables: { input },
        });
        onSaveSuccess(`Context "${formName}" created successfully`);
      }
      onClose();
    } catch (err) {
      console.error('Error saving context:', err);
      setFormError('Failed to save context. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
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
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
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
  );
};
