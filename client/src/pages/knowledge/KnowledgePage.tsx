import React, { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useAuthPloc } from '@contexts/auth-context';
import { AuthStateKind } from '@modules/auth/presentation/ploc/auth-state';
import { UserRole } from '@shared-domain/shared/value-objects/role.vo';
import { KnowledgeStatus } from '@shared-domain/knowledge';
import Spinkit from '../../components/Spinkit';
import KnowledgeList from '../../modules/knowledge/infrastructure/components/KnowledgeList';
import PendingKnowledgeList from '../../modules/knowledge/infrastructure/components/PendingKnowledgeList';

const KnowledgeGraph = React.lazy(() =>
  import('../../modules/knowledge/infrastructure/components/KnowledgeGraph/KnowledgeGraph').then(
    (m) => ({ default: m.KnowledgeGraph }),
  ),
);

const isGraphUiEnabled = (): boolean => {
  try {
    const flag = (import.meta.env.VITE_GRAPH_UI_ENABLED as string | undefined) ?? 'true';
    return ['1', 'true', 'yes', 'on'].includes(String(flag).toLowerCase());
  } catch {
    return true;
  }
};

type KnowledgeTab = 'all' | 'pending' | 'graph';

const tabButtonClass = (active: boolean): string =>
  [
    'inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium transition-colors border',
    active
      ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800',
  ].join(' ');

export const KnowledgePage: React.FC = () => {
  const ploc = useAuthPloc();
  const state = usePlocState(ploc);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('all');
  const graphEnabled = isGraphUiEnabled();

  useEffect(() => {
    if (state.kind === AuthStateKind.AUTHENTICATED) {
      setAuthorized(state.user.role === UserRole.ADMIN);
    }
  }, [state]);

  return match({ state, authorized })
    .with({ state: { kind: AuthStateKind.INITIAL } }, () => (
      <div className="text-center p-5 my-5">
        <Spinkit />
        <p className="text-muted mt-3">Validating session...</p>
      </div>
    ))
    .with({ state: { kind: AuthStateKind.UNAUTHENTICATED } }, () => (
      <div className="text-center py-12">
        <p className="text-stone-600 dark:text-stone-400">
          You need to log in to access this page.
        </p>
      </div>
    ))
    .with({ authorized: false }, () => (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 font-semibold">
          Access denied — admin role required.
        </p>
      </div>
    ))
    .otherwise(() => (
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
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-stone-200 dark:border-stone-800 pb-3">
          <button
            type="button"
            className={tabButtonClass(activeTab === 'all')}
            onClick={() => setActiveTab('all')}
            data-testid="tab-all"
          >
            All entries
          </button>
          <button
            type="button"
            className={tabButtonClass(activeTab === 'pending')}
            onClick={() => setActiveTab('pending')}
            data-testid="tab-pending"
          >
            Pending drafts
          </button>
          {graphEnabled && (
            <button
              type="button"
              className={tabButtonClass(activeTab === 'graph')}
              onClick={() => setActiveTab('graph')}
              data-testid="tab-graph"
            >
              Graph
            </button>
          )}
        </div>

        {match(activeTab)
          .with('all', () => (
            <KnowledgeList session={{ _id: '', role: UserRole.ADMIN, name: '' }} />
          ))
          .with('pending', () => <PendingKnowledgeList />)
          .with('graph', () => (
            <React.Suspense
              fallback={
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Spinkit />
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Loading knowledge graph…
                  </p>
                </div>
              }
            >
              <KnowledgeGraph status={KnowledgeStatus.ACTIVE} />
            </React.Suspense>
          ))
          .exhaustive()}
      </div>
    ));
};

export default KnowledgePage;
