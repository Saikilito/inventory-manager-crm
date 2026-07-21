import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Search, Plus, FileText } from 'lucide-react';
import { match } from 'ts-pattern';
import {
  KNOWLEDGE_LIST_QUERY,
  DELETE_KNOWLEDGE,
} from '@modules/knowledge/application/queries/knowledge.queries';
import { CategoryFilter } from './CategoryFilter';
import { KnowledgeItem, type KnowledgeListItem } from './KnowledgeItem';
import { KnowledgeForm, type KnowledgeFormInitialValues } from './KnowledgeForm';
import Alert from '../../../../components/Alert';
import Spinkit from '../../../../components/Spinkit';

interface KnowledgeListProps {
  session: { _id: string; role: string; name: string };
}

interface KnowledgeListResponse {
  knowledgeList: {
    items: KnowledgeListItem[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const PAGE_SIZE = 12;

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; entry: KnowledgeListItem };

const KnowledgeList: React.FC<KnowledgeListProps> = () => {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const { data, loading, error, refetch } = useQuery<KnowledgeListResponse>(KNOWLEDGE_LIST_QUERY, {
    variables: {
      page,
      limit: PAGE_SIZE,
      ...(category ? { category } : { isActive: true }),
    },
    fetchPolicy: 'cache-and-network',
  });

  const [deleteKnowledge, { loading: deleting }] = useMutation(DELETE_KNOWLEDGE);

  useEffect(() => {
    if (searchInput.trim().length === 0 && activeSearch.length > 0) {
      setActiveSearch('');
    }
  }, [searchInput, activeSearch]);

  const items = useMemo(() => data?.knowledgeList.items ?? [], [data?.knowledgeList.items]);
  const total = data?.knowledgeList.total ?? 0;
  const pages = data?.knowledgeList.pages ?? 1;

  const filteredItems = useMemo(() => {
    if (!activeSearch) return items;
    const term = activeSearch.toLowerCase();
    return items.filter((entry) => {
      return (
        entry.title.toLowerCase().includes(term) ||
        entry.content.toLowerCase().includes(term) ||
        entry.metadata.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [items, activeSearch]);

  const handleSubmitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setActiveSearch(searchInput.trim());
    setPage(1);
  };

  const handleCategoryChange = (next: string) => {
    setCategory(next);
    setPage(1);
  };

  const handleDelete = async (entry: KnowledgeListItem) => {
    if (!window.confirm(`Delete knowledge entry "${entry.title}"?`)) return;
    try {
      const result = await deleteKnowledge({ variables: { _id: entry._id } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0]?.message ?? 'Delete failed');
      }
      setFeedback({ kind: 'success', message: `Deleted "${entry.title}"` });
      await refetch();
    } catch (err) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete',
      });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const initialFormValues: KnowledgeFormInitialValues | undefined = match(modal)
    .with({ kind: 'edit' }, ({ entry }) => ({
      _id: entry._id,
      category: entry.category,
      title: entry.title,
      content: entry.content,
      hierarchyLevel: entry.metadata.hierarchyLevel,
      tags: entry.metadata.tags,
      wikiLinks: entry.wikiLinks,
    }))
    .otherwise(() => undefined);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Knowledge Base
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Manage company knowledge injected into AI responses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ kind: 'create' })}
          className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </button>
      </div>

      {feedback && (
        <div className="mb-6">
          <Alert
            message={feedback.message}
            type={feedback.kind === 'success' ? 'success' : 'error'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <CategoryFilter value={category} onChange={handleCategoryChange} />

        <form onSubmit={handleSubmitSearch}>
          <label
            htmlFor="knowledge-search"
            className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400 dark:text-stone-500" />
            </div>
            <input
              id="knowledge-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, content, or tag..."
              className="block w-full pl-10 pr-4 py-2.5 h-11 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 shadow-sm transition-all duration-150"
            />
          </div>
        </form>
      </div>

      {match({ loading, error: !!error })
        .with({ loading: true }, () => (
          <div className="flex justify-center py-12">
            <Spinkit />
          </div>
        ))
        .with({ error: true }, () => (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center text-sm font-medium text-red-800 dark:text-red-300 mb-6">
            <b>Error:</b> {error?.message}
          </div>
        ))
        .otherwise(() => {
          if (filteredItems.length === 0) {
            return (
              <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
                <FileText className="w-8 h-8 text-stone-400 mx-auto mb-3" />
                <p className="text-stone-500 dark:text-stone-400">
                  {activeSearch
                    ? `No matches for "${activeSearch}".`
                    : category
                      ? `No entries in ${category}.`
                      : 'No knowledge entries yet. Create your first one.'}
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((entry) => (
                <KnowledgeItem
                  key={entry._id}
                  entry={entry}
                  onEdit={(e) => setModal({ kind: 'edit', entry: e })}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          );
        })}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center h-10 px-4 rounded-lg text-sm font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            Page {page} of {pages} · {total} entries
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="inline-flex items-center h-10 px-4 rounded-lg text-sm font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {modal.kind !== 'closed' && (
        <KnowledgeForm
          mode={modal.kind === 'create' ? 'create' : 'edit'}
          initialValues={initialFormValues}
          onClose={() => setModal({ kind: 'closed' })}
          onSaved={async (message) => {
            setModal({ kind: 'closed' });
            setFeedback({ kind: 'success', message });
            await refetch();
            setTimeout(() => setFeedback(null), 4000);
          }}
          onError={(message) => {
            setFeedback({ kind: 'error', message });
            setTimeout(() => setFeedback(null), 4000);
          }}
        />
      )}

      {deleting && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg px-4 py-2 text-sm text-stone-600 dark:text-stone-300">
          Deleting...
        </div>
      )}
    </div>
  );
};

export default KnowledgeList;
