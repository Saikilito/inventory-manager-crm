import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { match } from 'ts-pattern';
import { Check, X, Sparkles, AlertCircle, FileText } from 'lucide-react';
import {
  KNOWLEDGE_PENDING_QUERY,
  KNOWLEDGE_APPROVE,
  KNOWLEDGE_REJECT,
  KNOWLEDGE_ENRICH,
} from '@modules/knowledge/application/queries/knowledge.queries';
import Alert from '../../../../components/Alert';
import Spinkit from '../../../../components/Spinkit';

export interface PendingEntry {
  _id: string;
  title: string;
  content: string;
  category: string;
  metadata: {
    hierarchyLevel: string;
    tags: string[];
    createdBy: string;
    productId?: string;
  };
  wikiLinks: Array<{ title: string; url?: string }>;
  status: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PendingResponse {
  knowledgePending: PendingEntry[];
}

type Feedback =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }
  | null;

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max).trimEnd()}...`;

const isLibrarianEnabled = (): boolean => {
  try {
    const flag = (import.meta.env.VITE_LIBRARIAN_ENABLED as string | undefined) ?? 'true';
    return ['1', 'true', 'yes', 'on'].includes(String(flag).toLowerCase());
  } catch {
    return true;
  }
};

export const PendingKnowledgeList: React.FC = () => {
  const { data, loading, error, refetch } = useQuery<PendingResponse>(KNOWLEDGE_PENDING_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const [approveKnowledge, { loading: approving }] = useMutation(KNOWLEDGE_APPROVE);
  const [rejectKnowledge, { loading: rejecting }] = useMutation(KNOWLEDGE_REJECT);
  const [enrichKnowledge, { loading: enriching }] = useMutation(KNOWLEDGE_ENRICH);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pendingAction, setPendingAction] = useState<{ id: string; kind: 'approve' | 'reject' | 'enrich' } | null>(null);
  const librarianEnabled = isLibrarianEnabled();

  const items = data?.knowledgePending ?? [];
  const busy = approving || rejecting || enriching;

  const handleApprove = async (entry: PendingEntry) => {
    if (!window.confirm(`Approve "${entry.title}" and make it visible in the knowledge base?`)) return;
    setPendingAction({ id: entry._id, kind: 'approve' });
    try {
      const result = await approveKnowledge({ variables: { _id: entry._id } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0]?.message ?? 'Approve failed');
      }
      setFeedback({ kind: 'success', message: `Approved "${entry.title}"` });
      await refetch();
    } catch (err) {
      setFeedback({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to approve' });
    } finally {
      setPendingAction(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleReject = async (entry: PendingEntry) => {
    if (!window.confirm(`Reject "${entry.title}"? It will be marked as REJECTED and hidden from the knowledge base.`)) return;
    setPendingAction({ id: entry._id, kind: 'reject' });
    try {
      const result = await rejectKnowledge({ variables: { _id: entry._id } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0]?.message ?? 'Reject failed');
      }
      setFeedback({ kind: 'success', message: `Rejected "${entry.title}"` });
      await refetch();
    } catch (err) {
      setFeedback({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to reject' });
    } finally {
      setPendingAction(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleEnrich = async (entry: PendingEntry) => {
    setPendingAction({ id: entry._id, kind: 'enrich' });
    try {
      const result = await enrichKnowledge({ variables: { _id: entry._id } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0]?.message ?? 'Enrich failed');
      }
      setFeedback({
        kind: 'success',
        message: `Enriched "${entry.title}" with external references`,
      });
      await refetch();
    } catch (err) {
      setFeedback({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to enrich' });
    } finally {
      setPendingAction(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="w-full">
      {feedback && (
        <div className="mb-6">
          <Alert message={feedback.message} type={feedback.kind === 'success' ? 'success' : 'error'} />
        </div>
      )}

      {match({ loading, error })
        .with({ loading: true }, () => (
          <div className="flex justify-center py-12">
            <Spinkit />
          </div>
        ))
        .with({ error: { message: 'string' } }, ({ error: err }) => (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center text-sm font-medium text-red-800 dark:text-red-300 mb-6">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            <b>Error:</b> {err.message}
          </div>
        ))
        .otherwise(() => {
          if (items.length === 0) {
            return (
              <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
                <FileText className="w-8 h-8 text-stone-400 mx-auto mb-3" />
                <p className="text-stone-500 dark:text-stone-400">
                  No pending drafts. Auto-extracted knowledge will appear here for review.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {items.map((entry) => {
                const isApproving = pendingAction?.id === entry._id && pendingAction.kind === 'approve';
                const isRejecting = pendingAction?.id === entry._id && pendingAction.kind === 'reject';
                const isEnriching = pendingAction?.id === entry._id && pendingAction.kind === 'enrich';
                const canEnrich = librarianEnabled && entry.wikiLinks.some((link) => !!link.url);

                return (
                  <div
                    key={entry._id}
                    className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5"
                    data-testid={`pending-entry-${entry._id}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800/50">
                        DRAFT
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700/60">
                        {entry.category}
                      </span>
                      {entry.metadata.productId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">
                          Product: {entry.metadata.productId}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400 whitespace-pre-line">
                      {truncate(entry.content, 320)}
                    </p>

                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/60 flex flex-wrap items-center justify-end gap-2">
                      {canEnrich && (
                        <button
                          type="button"
                          onClick={() => handleEnrich(entry)}
                          disabled={busy}
                          className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-900/40 transition-colors disabled:opacity-50"
                          data-testid={`enrich-${entry._id}`}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          {isEnriching ? 'Enriching…' : 'Enrich from web'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleReject(entry)}
                        disabled={busy}
                        className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/40 transition-colors disabled:opacity-50"
                        data-testid={`reject-${entry._id}`}
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        {isRejecting ? 'Rejecting…' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(entry)}
                        disabled={busy}
                        className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50"
                        data-testid={`approve-${entry._id}`}
                      >
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        {isApproving ? 'Approving…' : 'Approve'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );
};

export default PendingKnowledgeList;
