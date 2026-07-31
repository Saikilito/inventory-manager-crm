import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient, useLazyQuery } from "@apollo/client";
import { match } from "ts-pattern";
import { ArrowLeft, Brain, BookOpen } from "lucide-react";
import { KnowledgeStatus } from "@shared-domain/knowledge";
import { UserRole } from "@shared-domain/shared/value-objects/role.vo";
import { useAuthPloc } from "@contexts/auth-context";
import { usePlocState } from "@hooks/use-ploc-state";
import { AuthStateKind } from "@modules/auth/presentation/ploc/auth-state";
import {
  KNOWLEDGE_DETAIL_QUERY,
  KNOWLEDGE_GRAPH_QUERY_NAME,
} from "@modules/knowledge/application/queries/knowledge.queries";
import { KnowledgeForm, type KnowledgeFormInitialValues } from "@modules/knowledge/infrastructure/components/KnowledgeForm";
import { usePositionOverrides } from "@modules/knowledge/infrastructure/components/KnowledgeGraph/use-position-overrides";
import type {
  KnowledgeGraphInfo,
  KnowledgeNodeClickPayload,
} from "@modules/knowledge/infrastructure/components/KnowledgeGraph/KnowledgeGraph";
import type { GraphFilters, GraphStats } from "@modules/knowledge/infrastructure/components/KnowledgeGraph/graph-helpers";
import { isGraphUiEnabled } from "@modules/knowledge/infrastructure/utils/is-graph-ui-enabled";
import Alert from "@components/Alert";
import Spinkit from "../../components/Spinkit";
import { GraphStatsBar } from "./components/KnowledgeBrainPage/GraphStatsBar";
import { GraphSearchBar } from "./components/KnowledgeBrainPage/GraphSearchBar";
import { GraphLegend } from "./components/KnowledgeBrainPage/GraphLegend";
import { GraphToolbar } from "./components/KnowledgeBrainPage/GraphToolbar";
import { KnowledgeDetailDrawer } from "./components/KnowledgeBrainPage/KnowledgeDetailDrawer";

const KnowledgeGraph = React.lazy(() =>
  import("@modules/knowledge/infrastructure/components/KnowledgeGraph/KnowledgeGraph").then((m) => ({
    default: m.KnowledgeGraph,
  })),
);

const CHAT_WORKSPACE_ROUTE = "/chat";
const FEEDBACK_TIMEOUT_MS = 4000;

type ModalState = { kind: "closed" } | { kind: "create" } | { kind: "edit"; entry: KnowledgeFormInitialValues };

interface KnowledgeDetailResponse {
  knowledge: {
    _id: string;
    category: string;
    title: string;
    content: string;
    wikiLinks: Array<{ title: string; url?: string }>;
    metadata: { hierarchyLevel: string; tags: string[] };
  };
}

export const KnowledgeBrainPage: React.FC = () => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);
  const isAdmin = authState.kind === AuthStateKind.AUTHENTICATED && authState.user.role === UserRole.ADMIN;

  const [filters, setFilters] = useState<GraphFilters>({});
  const [graphInfo, setGraphInfo] = useState<KnowledgeGraphInfo | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeNodeClickPayload | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const { positionOverrides, setPositionOverride, resetPositionOverrides } = usePositionOverrides();
  const [fetchDetail] = useLazyQuery<KnowledgeDetailResponse>(KNOWLEDGE_DETAIL_QUERY);

  useEffect(() => {
    if (isAdmin) setIncludeDrafts(true);
  }, [isAdmin]);

  const handleInfoChange = useCallback((info: KnowledgeGraphInfo) => setGraphInfo(info), []);
  const handleNodeClick = useCallback((entry: KnowledgeNodeClickPayload) => setSelectedEntry(entry), []);
  const stats: GraphStats | null = graphInfo?.stats ?? null;
  const matchCount = graphInfo?.matchCount ?? null;

  const refetchGraph = useCallback(() => {
    void apolloClient.refetchQueries({ include: [KNOWLEDGE_GRAPH_QUERY_NAME] });
  }, [apolloClient]);

  const showFeedback = useCallback((kind: "success" | "error", message: string) => {
    setFeedback({ kind, message });
    setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
  }, []);

  const handleEditRequest = useCallback(
    async (id: string) => {
      setSelectedEntry(null);
      const { data } = await fetchDetail({ variables: { _id: id } });
      const knowledge = data?.knowledge;
      if (!knowledge) {
        showFeedback("error", "Could not load the entry to edit");
        return;
      }
      setModal({
        kind: "edit",
        entry: {
          _id: knowledge._id,
          category: knowledge.category,
          title: knowledge.title,
          content: knowledge.content,
          hierarchyLevel: knowledge.metadata.hierarchyLevel,
          tags: knowledge.metadata.tags,
          wikiLinks: knowledge.wikiLinks,
        },
      });
    },
    [fetchDetail, showFeedback],
  );

  const initialFormValues: KnowledgeFormInitialValues | undefined = match(modal)
    .with({ kind: "edit" }, ({ entry }) => entry)
    .otherwise(() => undefined);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full animate-[fadeIn_0.3s_ease-out] bg-stone-50 dark:bg-stone-950">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 p-4 lg:p-6 pb-0 lg:pb-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(CHAT_WORKSPACE_ROUTE)}
            className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-sm"
            aria-label="Back to AI Copilot workspace"
            title="Back to AI Copilot workspace"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight flex items-center gap-3">
              <Brain className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              Knowledge Brain
            </h1>
            <p className="text-xs lg:text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
              How your sales agent reads the company brain: indices (hubs) lead to the documents they connect to.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <GraphToolbar
              includeDrafts={includeDrafts}
              onToggleIncludeDrafts={() => setIncludeDrafts((value) => !value)}
              onCreateClick={() => setModal({ kind: "create" })}
              onResetPositions={resetPositionOverrides}
              hasPositionOverrides={Object.keys(positionOverrides).length > 0}
            />
          )}

          <button
            type="button"
            onClick={() => setShowLegend((value) => !value)}
            className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold border transition-colors shadow-xs shrink-0 ${
              showLegend
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                : "bg-white text-stone-700 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-800 hover:bg-stone-50"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Legend
          </button>
        </div>
      </div>

      {feedback && (
        <div className="px-4 lg:px-6 mt-4 shrink-0">
          <Alert message={feedback.message} type={feedback.kind === "success" ? "success" : "error"} />
        </div>
      )}

      <div className="px-4 lg:px-6 mt-4 shrink-0">
        <GraphStatsBar stats={stats} />
      </div>

      <div className="px-4 lg:px-6 mt-4 shrink-0">
        <GraphSearchBar filters={filters} onChange={setFilters} matchCount={matchCount} />
      </div>

      <div className="flex-1 min-h-0 px-4 lg:px-6 py-4">
        <div className="relative w-full h-full">
          {isGraphUiEnabled() ? (
            <React.Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-full min-h-[640px] gap-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl">
                  <Spinkit />
                  <p className="text-sm text-stone-500 dark:text-stone-400">Loading knowledge graph…</p>
                </div>
              }
            >
              <KnowledgeGraph
                status={KnowledgeStatus.ACTIVE}
                includeDrafts={isAdmin ? includeDrafts : false}
                onNodeClick={handleNodeClick}
                filters={filters}
                onInfoChange={handleInfoChange}
                positionOverrides={positionOverrides}
                onNodePositionChange={setPositionOverride}
              />
            </React.Suspense>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[640px] gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-center px-6">
              <Brain className="w-10 h-10 text-stone-300 dark:text-stone-700" aria-hidden="true" />
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                The graph visualization is currently disabled.
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Ask an administrator to enable VITE_GRAPH_UI_ENABLED.
              </p>
            </div>
          )}

          {isGraphUiEnabled() && showLegend && (
            <div className="absolute bottom-4 left-4 z-10 w-64 hidden md:block">
              <GraphLegend />
            </div>
          )}

          <KnowledgeDetailDrawer
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
            isAdmin={isAdmin}
            onChanged={refetchGraph}
            onEditRequest={(id) => void handleEditRequest(id)}
          />
        </div>
      </div>

      {isAdmin && modal.kind !== "closed" && (
        <KnowledgeForm
          mode={modal.kind === "create" ? "create" : "edit"}
          initialValues={initialFormValues}
          onClose={() => setModal({ kind: "closed" })}
          onSaved={(message) => {
            setModal({ kind: "closed" });
            showFeedback("success", message);
            refetchGraph();
          }}
          onError={(message) => showFeedback("error", message)}
        />
      )}
    </div>
  );
};

export default KnowledgeBrainPage;
