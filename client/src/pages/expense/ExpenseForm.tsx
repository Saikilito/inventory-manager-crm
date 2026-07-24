import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useQuery } from "@apollo/client";
import {
  IExpense,
  ExpenseCategory,
  ExpenseReferenceType,
} from "@shared-domain/expense/expense.entity";
import { GET_ALL_CONTEXTS } from "@modules/context/infrastructure/graphql/queries";
import { PRODUCTS_QUERY } from "@modules/product/infrastructure/graphql/queries";
import { GET_USERS } from "@modules/auth/infrastructure/graphql/queries";

const expenseFormSchema = z.object({
  amount: z.number().gt(0, "Amount must be a positive number"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  contextId: z.string().optional().nullable(),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
});

interface ExpenseFormProps {
  expense?: IExpense;
  onSubmit: (data: {
    amount: number;
    description: string;
    category: string;
    contextId?: string;
    referenceId?: string;
    referenceType?: string;
  }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense,
  onSubmit,
  onCancel,
  isSaving = false,
}) => {
  const [amount, setAmount] = useState(expense ? Number(expense.amount) : "");
  const [description, setDescription] = useState(
    expense ? String(expense.description) : "",
  );
  const [category, setCategory] = useState(
    expense ? String(expense.category) : "",
  );
  const [contextId, setContextId] = useState(
    expense && expense.contextId ? String(expense.contextId) : "",
  );
  const [referenceType, setReferenceType] = useState(
    expense && expense.referenceType ? String(expense.referenceType) : "",
  );
  const [referenceId, setReferenceId] = useState(
    expense && expense.referenceId ? String(expense.referenceId) : "",
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Apollo Queries for relations
  const { data: contextsData, loading: loadingContexts } = useQuery(
    GET_ALL_CONTEXTS,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: productsData, loading: loadingProducts } = useQuery(
    PRODUCTS_QUERY,
    {
      variables: { limit: 100, offset: 0 },
    },
  );
  const { data: usersData } = useQuery(GET_USERS);

  useEffect(() => {
    if (!expense || String(expense.referenceType) !== referenceType) {
      setReferenceId("");
    }
  }, [referenceType, expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = expenseFormSchema.safeParse({
      amount: Number(amount),
      description,
      category,
      contextId: contextId || undefined,
      referenceType: referenceType || undefined,
      referenceId: referenceId || undefined,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit({
      amount: Number(amount),
      description,
      category,
      contextId: contextId || undefined,
      referenceType: referenceType || undefined,
      referenceId: referenceId || undefined,
    });
  };

  const categories = Object.values(ExpenseCategory);
  const refTypes = Object.values(ExpenseReferenceType);

  return (
    <form
      className="w-full max-w-2xl mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-md p-6"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Amount ($)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500 dark:text-stone-400 font-medium">
              $
            </span>
            <input
              name="amount"
              type="number"
              step="any"
              placeholder="0.00"
              className={`h-11 pl-8 pr-4 w-full rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
                errors.amount
                  ? "border-red-500 dark:border-red-500/80 focus:ring-red-500"
                  : "border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700"
              }`}
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>
          {errors.amount && (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.amount}
            </span>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Category
          </label>
          <select
            name="category"
            className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
              errors.category
                ? "border-red-500 dark:border-red-500/80 focus:ring-red-500"
                : "border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700"
            }`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.category}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Description
        </label>
        <input
          name="description"
          type="text"
          placeholder="E.g. Electricity bill, delivery van gasoline, etc."
          className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
            errors.description
              ? "border-red-500 dark:border-red-500/80 focus:ring-red-500"
              : "border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700"
          }`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium">
            {errors.description}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Context Association */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Context/Store (Optional)
          </label>
          <select
            name="contextId"
            className="h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100"
            value={contextId}
            onChange={(e) => setContextId(e.target.value)}
            disabled={loadingContexts}
          >
            <option value="">General (No Context)</option>
            {contextsData?.getAllContexts?.map(
              (ctx: { _id: string; name: string }) => (
                <option key={ctx._id} value={ctx._id}>
                  {ctx.name}
                </option>
              ),
            )}
          </select>
        </div>

        {/* Reference Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Link/Reference Type (Optional)
          </label>
          <select
            name="referenceType"
            className="h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100"
            value={referenceType}
            onChange={(e) => setReferenceType(e.target.value)}
          >
            <option value="">None</option>
            {refTypes
              .filter(t => t !== 'FIXED_EXPENSE') // Hide FIXED_EXPENSE from manual selection
              .map((t) => (
              <option key={t} value={t}>
                {t === "PRODUCT" ? "Product" : "Seller/User"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Polymorphic Link Selector */}
      {referenceType && (
        <div className="flex flex-col gap-1.5 mb-8">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            {referenceType === "PRODUCT"
              ? "Select Product"
              : "Select Seller/User"}
          </label>
          {referenceType === "PRODUCT" ? (
            <select
              name="referenceId"
              className="h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              disabled={loadingProducts}
            >
              <option value="">Choose Product...</option>
              {productsData?.getAllProducts?.map(
                (p: { _id: string; name: string; sellingPrice?: number }) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.sellingPrice !== undefined ? `($${p.sellingPrice})` : ''}
                  </option>
                ),
              )}
            </select>
          ) : (
            <select
              name="referenceId"
              className="h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              disabled={loadingUsers}
            >
              <option value="">Choose User...</option>
              {usersData?.getUsers?.map((u: { _id: string; name: string; role?: string }) => (
                <option key={u._id} value={u._id}>
                  {u.name} {u.role ? `(${u.role})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-5 border-t border-stone-100 dark:border-stone-800/80">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : expense ? "Save Changes" : "Create Expense"}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
