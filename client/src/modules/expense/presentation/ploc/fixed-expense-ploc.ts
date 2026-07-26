import { makePloc, Ploc, executePlocSave } from '@modules/shared/presentation/ploc/ploc';
import { fixedExpenseInitialState, FixedExpenseState, FixedExpenseStateKind } from './fixed-expense-state.js';
import { FixedExpenseRepository } from '../../domain/fixed-expense.repository.js';
import { makeFixedExpense, IFixedExpense } from '@shared-domain/expense/fixed-expense.entity.js';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo.js';

export interface FixedExpensePloc extends Ploc<FixedExpenseState> {
  load(billingMonth?: string, contextId?: string): Promise<void>;
  changeBillingMonth(billingMonth: string): Promise<void>;
  openCreate(): void;
  openEdit(template: IFixedExpense): void;
  closeTemplateModal(): void;
  saveTemplate(templateData: {
    name: string;
    category: string;
    amount: number;
    isActive: boolean;
    contextId?: string;
  }): Promise<boolean>;
  confirmDelete(id: string): Promise<boolean>;
  payFixedExpense(fixedExpenseId: string, amountPaid: number, accountId?: string): Promise<void>;
  unpayFixedExpense(fixedExpenseId: string): Promise<void>;
}

export function makeFixedExpensePloc(
  fixedExpenseRepository: FixedExpenseRepository
): FixedExpensePloc {
  const ploc = makePloc<FixedExpenseState>(fixedExpenseInitialState);

  const load = async (
    billingMonth?: string,
    contextId?: string
  ) => {
    const current = ploc.state();
    const activeBillingMonth = billingMonth ?? current.selectedBillingMonth;
    const activeContextId = contextId ?? current.contextId;

    ploc.changeState({
      ...current,
      kind: FixedExpenseStateKind.LOADING,
      selectedBillingMonth: activeBillingMonth,
      contextId: activeContextId,
      errorMessage: undefined,
    });

    const contextIdVO = activeContextId ? IdVO.create(activeContextId) : undefined;

    const [templatesResult, checklistResult] = await Promise.all([
      fixedExpenseRepository.getTemplates(contextIdVO),
      fixedExpenseRepository.getChecklist(activeBillingMonth, contextIdVO),
    ]);

    if (templatesResult.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FixedExpenseStateKind.ERROR,
        errorMessage: templatesResult.getError().message || 'Error loading fixed expense templates',
      });
      return;
    }

    if (checklistResult.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FixedExpenseStateKind.ERROR,
        errorMessage: checklistResult.getError().message || 'Error loading checklist',
      });
      return;
    }

    ploc.changeState({
      ...ploc.state(),
      kind: FixedExpenseStateKind.LOADED,
      templates: templatesResult.getValue(),
      checklist: checklistResult.getValue(),
      selectedBillingMonth: activeBillingMonth,
      contextId: activeContextId,
    });
  };

  const changeBillingMonth = async (billingMonth: string) => {
    const current = ploc.state();
    await load(billingMonth, current.contextId);
  };

  const openCreate = () => {
    ploc.changeState({
      ...ploc.state(),
      selectedTemplate: undefined,
      showTemplateModal: true,
      errorMessage: undefined,
    });
  };

  const openEdit = (template: IFixedExpense) => {
    ploc.changeState({
      ...ploc.state(),
      selectedTemplate: template,
      showTemplateModal: true,
      errorMessage: undefined,
    });
  };

  const closeTemplateModal = () => {
    ploc.changeState({
      ...ploc.state(),
      showTemplateModal: false,
      selectedTemplate: undefined,
      errorMessage: undefined,
    });
  };

  const saveTemplate = async (templateData: {
    name: string;
    category: string;
    amount: number;
    isActive: boolean;
    contextId?: string;
  }): Promise<boolean> => {
    const current = ploc.state();
    const isEdit = !!current.selectedTemplate;
    const templateToSave = makeFixedExpense({
      id: current.selectedTemplate?.id ? String(current.selectedTemplate.id) : undefined,
      name: templateData.name,
      category: templateData.category,
      amount: templateData.amount,
      isActive: templateData.isActive,
      contextId: templateData.contextId || undefined,
    });

    return executePlocSave({
      ploc,
      saveFn: () => isEdit
        ? fixedExpenseRepository.updateTemplate(templateToSave)
        : fixedExpenseRepository.createTemplate(templateToSave),
      modalResetFields: {
        showTemplateModal: false,
        selectedTemplate: undefined,
      },
      defaultErrorMessage: 'Error saving template',
      onSuccess: async () => {
        await load(current.selectedBillingMonth, current.contextId);
      },
    });
  };

  const confirmDelete = async (id: string): Promise<boolean> => {
    const current = ploc.state();
    const idVO = IdVO.create(id);
    const result = await fixedExpenseRepository.deleteTemplate(idVO);

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        errorMessage: result.getError().message || 'Error deleting template',
      });
      return false;
    } else {
      ploc.changeState({
        ...ploc.state(),
        selectedTemplate: undefined,
        errorMessage: undefined,
      });
      await load(current.selectedBillingMonth, current.contextId);
      return true;
    }
  };

  const payFixedExpense = async (fixedExpenseId: string, amountPaid: number, accountId?: string) => {
    const current = ploc.state();
    const fixedExpenseIdVO = IdVO.create(fixedExpenseId);
    const contextIdVO = current.contextId ? IdVO.create(current.contextId) : undefined;
    const accountIdVO = accountId ? IdVO.create(accountId) : undefined;

    const result = await fixedExpenseRepository.payFixedExpense(
      fixedExpenseIdVO,
      current.selectedBillingMonth,
      amountPaid,
      contextIdVO,
      accountIdVO
    );

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        errorMessage: result.getError().message || 'Error paying fixed expense',
      });
    } else {
      await load(current.selectedBillingMonth, current.contextId);
    }
  };

  const unpayFixedExpense = async (fixedExpenseId: string) => {
    const current = ploc.state();
    const fixedExpenseIdVO = IdVO.create(fixedExpenseId);

    const result = await fixedExpenseRepository.unpayFixedExpense(
      fixedExpenseIdVO,
      current.selectedBillingMonth
    );

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        errorMessage: result.getError().message || 'Error unpaying fixed expense',
      });
    } else {
      await load(current.selectedBillingMonth, current.contextId);
    }
  };

  return {
    ...ploc,
    load,
    changeBillingMonth,
    openCreate,
    openEdit,
    closeTemplateModal,
    saveTemplate,
    confirmDelete,
    payFixedExpense,
    unpayFixedExpense,
  };
}
