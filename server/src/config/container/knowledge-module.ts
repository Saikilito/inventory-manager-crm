import { makeKnowledgeMongooseRepository } from '../../modules/knowledge/infrastructure/repositories/knowledge-mongoose.repository.js';
import { IKnowledgeRepository } from '../../modules/knowledge/application/repositories/knowledge.repository.js';
import { makeCognitiveRouter } from '../../modules/knowledge/domain/services/cognitive-router.js';
import { CreateKnowledge, makeCreateKnowledge } from '../../modules/knowledge/application/use-cases/create-knowledge.js';
import { UpdateKnowledge, makeUpdateKnowledge } from '../../modules/knowledge/application/use-cases/update-knowledge.js';
import { DeleteKnowledge, makeDeleteKnowledge } from '../../modules/knowledge/application/use-cases/delete-knowledge.js';
import { GetKnowledge, makeGetKnowledge } from '../../modules/knowledge/application/use-cases/get-knowledge.js';
import { GetKnowledgeList, makeGetKnowledgeList } from '../../modules/knowledge/application/use-cases/get-knowledge-list.js';
import { SearchKnowledge, makeSearchKnowledge } from '../../modules/knowledge/application/use-cases/search-knowledge.js';
import { GetPendingKnowledge, makeGetPendingKnowledge } from '../../modules/knowledge/application/use-cases/get-pending-knowledge.js';
import { GetKnowledgeGraph, makeGetKnowledgeGraph } from '../../modules/knowledge/application/use-cases/get-knowledge-graph.js';
import { ApproveKnowledge, makeApproveKnowledge } from '../../modules/knowledge/application/use-cases/approve-knowledge.js';
import { RejectKnowledge, makeRejectKnowledge } from '../../modules/knowledge/application/use-cases/reject-knowledge.js';
import { EnrichKnowledge, makeEnrichKnowledge } from '../../modules/knowledge/application/use-cases/enrich-knowledge.js';
import { makeProductExtractor } from '../../modules/knowledge/application/services/product-extractor.js';
import { makeWebEnricher } from '../../modules/knowledge/application/services/web-enricher.js';
import { makeLibrarianService, LibrarianService, isLibrarianEnabled } from '../../modules/knowledge/application/services/librarian.service.js';

export interface KnowledgeSubContainer {
  createKnowledge: CreateKnowledge;
  updateKnowledge: UpdateKnowledge;
  deleteKnowledge: DeleteKnowledge;
  getKnowledge: GetKnowledge;
  getKnowledgeList: GetKnowledgeList;
  searchKnowledge: SearchKnowledge;
  getPendingKnowledge: GetPendingKnowledge;
  getKnowledgeGraph: GetKnowledgeGraph;
  approveKnowledge: ApproveKnowledge;
  rejectKnowledge: RejectKnowledge;
  enrichKnowledge: EnrichKnowledge;
  librarian: LibrarianService;
  knowledgeRepository: IKnowledgeRepository;
}

export const buildKnowledgeModule = (deps: {
  knowledgeRepository?: IKnowledgeRepository;
  librarianEnabled?: boolean;
}): KnowledgeSubContainer => {
  const knowledgeRepository = deps.knowledgeRepository ?? makeKnowledgeMongooseRepository();
  const cognitiveRouter = makeCognitiveRouter({
    textSearch: (query, category) => knowledgeRepository.textSearch(query, category),
  });

  const productExtractor = makeProductExtractor();
  const webEnricher = makeWebEnricher();
  const librarian = makeLibrarianService({
    knowledgeRepository,
    productExtractor,
    enabled: deps.librarianEnabled ?? isLibrarianEnabled(process.env.LIBRARIAN_ENABLED),
  });

  return {
    createKnowledge: makeCreateKnowledge(knowledgeRepository),
    updateKnowledge: makeUpdateKnowledge(knowledgeRepository),
    deleteKnowledge: makeDeleteKnowledge(knowledgeRepository),
    getKnowledge: makeGetKnowledge(knowledgeRepository),
    getKnowledgeList: makeGetKnowledgeList(knowledgeRepository),
    searchKnowledge: makeSearchKnowledge({ cognitiveRouter }),
    getPendingKnowledge: makeGetPendingKnowledge(knowledgeRepository),
    getKnowledgeGraph: makeGetKnowledgeGraph(knowledgeRepository),
    approveKnowledge: makeApproveKnowledge(knowledgeRepository),
    rejectKnowledge: makeRejectKnowledge(knowledgeRepository),
    enrichKnowledge: makeEnrichKnowledge({ knowledgeRepository, webEnricher }),
    librarian,
    knowledgeRepository,
  };
};
