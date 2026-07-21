import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  KnowledgeCategory,
  HierarchyLevel,
  KNOWN_KNOWLEDGE_CATEGORIES,
  KNOWN_HIERARCHY_LEVELS,
} from '@shared-domain/knowledge';
import {
  CREATE_KNOWLEDGE,
  UPDATE_KNOWLEDGE,
} from '@modules/knowledge/application/queries/knowledge.queries';

export interface KnowledgeFormInitialValues {
  _id: string;
  category: string;
  title: string;
  content: string;
  hierarchyLevel: string;
  tags: string[];
  wikiLinks: Array<{ title: string; url?: string }>;
}

interface KnowledgeFormProps {
  mode: 'create' | 'edit';
  initialValues?: KnowledgeFormInitialValues;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

interface FormState {
  category: KnowledgeCategory;
  title: string;
  content: string;
  hierarchyLevel: HierarchyLevel;
  tagsInput: string;
  wikiLinks: Array<{ title: string; url?: string }>;
}

const buildInitialState = (initialValues?: KnowledgeFormInitialValues): FormState => {
  if (!initialValues) {
    return {
      category: KnowledgeCategory.SALES,
      title: '',
      content: '',
      hierarchyLevel: HierarchyLevel.TOPIC,
      tagsInput: '',
      wikiLinks: [],
    };
  }

  return {
    category: (KNOWN_KNOWLEDGE_CATEGORIES.includes(initialValues.category as KnowledgeCategory)
      ? initialValues.category
      : KnowledgeCategory.SALES) as KnowledgeCategory,
    title: initialValues.title,
    content: initialValues.content,
    hierarchyLevel: (KNOWN_HIERARCHY_LEVELS.includes(initialValues.hierarchyLevel as HierarchyLevel)
      ? initialValues.hierarchyLevel
      : HierarchyLevel.TOPIC) as HierarchyLevel,
    tagsInput: (initialValues.tags || []).join(', '),
    wikiLinks: [...(initialValues.wikiLinks || [])],
  };
};

const parseTags = (raw: string): string[] => {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

export const KnowledgeForm: React.FC<KnowledgeFormProps> = ({
  mode,
  initialValues,
  onClose,
  onSaved,
  onError,
}) => {
  const [state, setState] = useState<FormState>(() => buildInitialState(initialValues));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createKnowledge, { loading: creating }] = useMutation(CREATE_KNOWLEDGE);
  const [updateKnowledge, { loading: updating }] = useMutation(UPDATE_KNOWLEDGE);

  useEffect(() => {
    setState(buildInitialState(initialValues));
  }, [initialValues]);

  const busy = creating || updating;

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const addWikiLink = () => {
    setState((prev) => ({
      ...prev,
      wikiLinks: [...prev.wikiLinks, { title: '', url: '' }],
    }));
  };

  const updateWikiLink = (index: number, patch: Partial<{ title: string; url: string }>) => {
    setState((prev) => ({
      ...prev,
      wikiLinks: prev.wikiLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }));
  };

  const removeWikiLink = (index: number) => {
    setState((prev) => ({
      ...prev,
      wikiLinks: prev.wikiLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (state.title.trim().length === 0) {
      setValidationError('Title is required');
      return;
    }
    if (state.content.trim().length === 0) {
      setValidationError('Content is required');
      return;
    }
    setValidationError(null);

    const tags = parseTags(state.tagsInput);
    const wikiLinks = state.wikiLinks
      .filter((link) => link.title.trim().length > 0)
      .map((link) => {
        const cleanedUrl = link.url?.trim();
        return cleanedUrl ? { title: link.title.trim(), url: cleanedUrl } : { title: link.title.trim() };
      });

    try {
      if (mode === 'create') {
        const result = await createKnowledge({
          variables: {
            input: {
              category: state.category,
              title: state.title.trim(),
              content: state.content,
              metadata: {
                hierarchyLevel: state.hierarchyLevel,
                tags,
              },
            },
          },
        });
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0]?.message ?? 'Create failed');
        }
        onSaved(`Created "${state.title.trim()}"`);
      } else if (initialValues) {
        const result = await updateKnowledge({
          variables: {
            input: {
              _id: initialValues._id,
              category: state.category,
              title: state.title.trim(),
              content: state.content,
              metadata: {
                hierarchyLevel: state.hierarchyLevel,
                tags,
              },
            },
          },
        });
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0]?.message ?? 'Update failed');
        }
        onSaved(`Updated "${state.title.trim()}"`);
        void wikiLinks;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setValidationError(message);
      onError(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {mode === 'create' ? 'New Knowledge Entry' : 'Edit Knowledge Entry'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {validationError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 px-4 py-3 rounded-xl text-sm text-red-800 dark:text-red-300">
              {validationError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Category *
              </label>
              <select
                value={state.category}
                onChange={(e) => updateField('category', e.target.value as KnowledgeCategory)}
                disabled={busy}
                className="block w-full h-11 px-3 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {KNOWN_KNOWLEDGE_CATEGORIES.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Hierarchy
              </label>
              <select
                value={state.hierarchyLevel}
                onChange={(e) => updateField('hierarchyLevel', e.target.value as HierarchyLevel)}
                disabled={busy}
                className="block w-full h-11 px-3 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {KNOWN_HIERARCHY_LEVELS.map((level: string) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={state.title}
              onChange={(e) => updateField('title', e.target.value)}
              disabled={busy}
              placeholder="Short, descriptive title"
              className="block w-full h-11 px-3 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Content * <span className="text-stone-400 font-normal">(markdown supported, use [[Wiki Links]] to cross-reference)</span>
            </label>
            <textarea
              value={state.content}
              onChange={(e) => updateField('content', e.target.value)}
              disabled={busy}
              rows={8}
              placeholder="Write the knowledge content here..."
              className="block w-full px-3 py-2.5 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Tags <span className="text-stone-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={state.tagsInput}
              onChange={(e) => updateField('tagsInput', e.target.value)}
              disabled={busy}
              placeholder="e.g. warranty, products, returns"
              className="block w-full h-11 px-3 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                Wiki Links
              </label>
              <button
                type="button"
                onClick={addWikiLink}
                disabled={busy}
                className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Link
              </button>
            </div>
            {state.wikiLinks.length === 0 && (
              <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                No external wiki links added. You can still embed [[links]] directly in the content.
              </p>
            )}
            <div className="space-y-2">
              {state.wikiLinks.map((link, index) => (
                <div
                  key={`link-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-center"
                >
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => updateWikiLink(index, { title: e.target.value })}
                    placeholder="Title"
                    disabled={busy}
                    className="h-10 px-3 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="url"
                    value={link.url ?? ''}
                    onChange={(e) => updateWikiLink(index, { url: e.target.value })}
                    placeholder="https://example.com (optional)"
                    disabled={busy}
                    className="h-10 px-3 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeWikiLink(index)}
                    disabled={busy}
                    className="inline-flex items-center justify-center h-10 w-10 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    aria-label="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-11 px-5 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-11 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 disabled:opacity-50"
            >
              {busy ? 'Saving...' : mode === 'create' ? 'Create Entry' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KnowledgeForm;
