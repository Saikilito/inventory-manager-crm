import { makeExpenseMongooseRepository } from '../../modules/expense/infrastructure/repositories/expense-mongoose.repository.js';
import { makeFixedExpenseMongooseRepository, makeFixedExpensePaymentMongooseRepository } from '../../modules/expense/infrastructure/repositories/fixed-expense-mongoose.repository.js';
import { GetExpense, makeGetExpense } from '../../modules/expense/application/use-cases/get-expense.js';
import { GetAllExpenses, makeGetAllExpenses } from '../../modules/expense/application/use-cases/get-all-expenses.js';
import { CreateExpense, makeCreateExpense } from '../../modules/expense/application/use-cases/create-expense.js';
import { UpdateExpense, makeUpdateExpense } from '../../modules/expense/application/use-cases/update-expense.js';
import { DeleteExpense, makeDeleteExpense } from '../../modules/expense/application/use-cases/delete-expense.js';
import { IExpenseRepository } from '../../modules/expense/application/repositories/expense.repository.js';
import { IFixedExpenseRepository, IFixedExpensePaymentRepository } from '../../modules/expense/application/repositories/fixed-expense.repository.js';
import { GetAllFixedExpenses, makeGetAllFixedExpenses } from '../../modules/expense/application/use-cases/get-all-fixed-expenses.js';
import { GetFixedExpensePayments, makeGetFixedExpensePayments } from '../../modules/expense/application/use-cases/get-fixed-expense-payments.js';
import { CreateFixedExpense, makeCreateFixedExpense } from '../../modules/expense/application/use-cases/create-fixed-expense.js';
import { UpdateFixedExpense, makeUpdateFixedExpense } from '../../modules/expense/application/use-cases/update-fixed-expense.js';
import { DeleteFixedExpense, makeDeleteFixedExpense } from '../../modules/expense/application/use-cases/delete-fixed-expense.js';
import { PayFixedExpense, makePayFixedExpense } from '../../modules/expense/application/use-cases/pay-fixed-expense.js';
import { UnpayFixedExpense, makeUnpayFixedExpense } from '../../modules/expense/application/use-cases/unpay-fixed-expense.js';

export interface ExpenseSubContainer {
  getExpense: GetExpense;
  getAllExpenses: GetAllExpenses;
  createExpense: CreateExpense;
  updateExpense: UpdateExpense;
  deleteExpense: DeleteExpense;
  getAllFixedExpenses: GetAllFixedExpenses;
  getFixedExpensePayments: GetFixedExpensePayments;
  createFixedExpense: CreateFixedExpense;
  updateFixedExpense: UpdateFixedExpense;
  deleteFixedExpense: DeleteFixedExpense;
  payFixedExpense: PayFixedExpense;
  unpayFixedExpense: UnpayFixedExpense;
}

export const buildExpenseModule = (deps: {
  expenseRepository?: IExpenseRepository;
  fixedExpenseRepository?: IFixedExpenseRepository;
  fixedExpensePaymentRepository?: IFixedExpensePaymentRepository;
}): ExpenseSubContainer => {
  const expenseRepository = deps.expenseRepository ?? makeExpenseMongooseRepository();
  const fixedExpenseRepository = deps.fixedExpenseRepository ?? makeFixedExpenseMongooseRepository();
  const fixedExpensePaymentRepository =
    deps.fixedExpensePaymentRepository ?? makeFixedExpensePaymentMongooseRepository();

  return {
    getExpense: makeGetExpense(expenseRepository),
    getAllExpenses: makeGetAllExpenses(expenseRepository),
    createExpense: makeCreateExpense(expenseRepository),
    updateExpense: makeUpdateExpense(expenseRepository),
    deleteExpense: makeDeleteExpense(expenseRepository),
    getAllFixedExpenses: makeGetAllFixedExpenses(fixedExpenseRepository),
    getFixedExpensePayments: makeGetFixedExpensePayments(fixedExpenseRepository, fixedExpensePaymentRepository),
    createFixedExpense: makeCreateFixedExpense(fixedExpenseRepository),
    updateFixedExpense: makeUpdateFixedExpense(fixedExpenseRepository),
    deleteFixedExpense: makeDeleteFixedExpense(fixedExpenseRepository),
    payFixedExpense: makePayFixedExpense(fixedExpenseRepository, fixedExpensePaymentRepository, expenseRepository),
    unpayFixedExpense: makeUnpayFixedExpense(fixedExpensePaymentRepository, expenseRepository),
  };
};
