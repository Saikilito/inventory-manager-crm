import { makePloc, Ploc, executePlocSave } from '@modules/shared/presentation/ploc/ploc';
import { expenseInitialState, ExpenseState, ExpenseStateKind } from './expense-state';
import { GetExpensesUseCase } from '../../application/use-cases/get-expenses';
import { CreateExpenseUseCase } from '../../application/use-cases/create-expense';
import { UpdateExpenseUseCase } from '../../application/use-cases/update-expense';
import { DeleteExpenseUseCase } from '../../application/use-cases/delete-expense';
import { IExpense } from '@shared-domain/expense/expense.entity';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo';
import { PositiveNumberVO } from '@shared-domain/shared/value-objects/positive-number.vo';
import { NonNegativeNumberVO } from '@shared-domain/shared/value-objects/non-negative-number.vo';

export interface ExpensePloc extends Ploc<ExpenseState> {
  load(page?: number, limit?: number, contextId?: string, category?: string): Promise<void>;
  openCreate(): void;
  openEdit(expense: IExpense): void;
  closeForm(): void;
  save(expenseData: {
    amount: number;
    description: string;
    category: string;
    contextId?: string;
    referenceId?: string;
    referenceType?: string;
    accountId?: string;
  }): Promise<boolean>;
  confirmDelete(id: string): Promise<void>;
}

export function makeExpensePloc(
  getExpenses: GetExpensesUseCase,
  createExpense: CreateExpenseUseCase,
  updateExpense: UpdateExpenseUseCase,
  deleteExpense: DeleteExpenseUseCase
): ExpensePloc {
  const ploc = makePloc<ExpenseState>(expenseInitialState);

  const load = async (
    page: number = 1,
    limit: number = 10,
    contextId: string = '',
    category: string = ''
  ) => {
    const current = ploc.state();

    if (current.kind === ExpenseStateKind.LOADED) {
      ploc.changeState({
        ...current,
        kind: ExpenseStateKind.RELOADING,
        currentPage: page,
        limit,
        contextId,
        category,
      });
    } else {
      ploc.changeState({
        ...current,
        kind: ExpenseStateKind.LOADING,
        currentPage: page,
        limit,
        contextId,
        category,
      });
    }

    const offsetVal = (page - 1) * limit;
    const limitVO = PositiveNumberVO.create(limit);
    const offsetVO = NonNegativeNumberVO.create(offsetVal);
    const contextIdVO = contextId ? IdVO.create(contextId) : undefined;

    const result = await getExpenses.execute(limitVO, offsetVO, contextIdVO, category || undefined);

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: ExpenseStateKind.ERROR,
        errorMessage: result.getError().message || 'Error loading expenses',
        total: 0,
      });
    } else {
      const data = result.getValue();
      ploc.changeState({
        ...ploc.state(),
        kind: ExpenseStateKind.LOADED,
        items: data.items,
        total: data.total,
        currentPage: page,
        limit,
        contextId,
        category,
      });
    }
  };

  const openCreate = () => {
    ploc.changeState({
      ...ploc.state(),
      selectedExpense: undefined,
      showFormModal: true,
      errorMessage: undefined,
    });
  };

  const openEdit = (expense: IExpense) => {
    ploc.changeState({
      ...ploc.state(),
      selectedExpense: expense,
      showFormModal: true,
      errorMessage: undefined,
    });
  };

  const closeForm = () => {
    ploc.changeState({
      ...ploc.state(),
      showFormModal: false,
      selectedExpense: undefined,
      errorMessage: undefined,
    });
  };

  const save = async (expenseData: {
    amount: number;
    description: string;
    category: string;
    contextId?: string;
    referenceId?: string;
    referenceType?: string;
    accountId?: string;
  }): Promise<boolean> => {
    const current = ploc.state();
    const isEdit = !!current.selectedExpense;
    const dto = {
      amount: expenseData.amount,
      description: expenseData.description,
      category: expenseData.category,
      contextId: expenseData.contextId || undefined,
      referenceId: expenseData.referenceId || undefined,
      referenceType: expenseData.referenceType || undefined,
      accountId: expenseData.accountId || undefined,
    };

    return executePlocSave({
      ploc,
      saveFn: () => isEdit
        ? updateExpense.execute({
            id: String(current.selectedExpense!.id),
            ...dto,
          })
        : createExpense.execute(dto),
      modalResetFields: {
        showFormModal: false,
        selectedExpense: undefined,
      },
      defaultErrorMessage: 'Error saving expense',
      onSuccess: async () => {
        await load(current.currentPage, current.limit, current.contextId, current.category);
      },
    });
  };

  const confirmDelete = async (id: string) => {
    const current = ploc.state();
    const idVO = IdVO.create(id);
    const result = await deleteExpense.execute(idVO);

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        errorMessage: result.getError().message || 'Error deleting expense',
      });
    } else {
      ploc.changeState({
        ...ploc.state(),
        selectedExpense: undefined,
        errorMessage: undefined,
      });
      await load(current.currentPage, current.limit, current.contextId, current.category);
    }
  };

  return {
    ...ploc,
    load,
    openCreate,
    openEdit,
    closeForm,
    save,
    confirmDelete,
  };
}
