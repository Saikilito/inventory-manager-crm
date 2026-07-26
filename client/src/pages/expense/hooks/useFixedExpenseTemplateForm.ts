import { useEffect, useState, FormEvent } from 'react';
import { FixedExpenseState } from '@modules/expense/presentation/ploc/fixed-expense-state';
import { FixedExpensePloc } from '@modules/expense/presentation/ploc/fixed-expense-ploc';

export const useFixedExpenseTemplateForm = (
  fixedState: FixedExpenseState,
  fixedPloc: FixedExpensePloc,
  selectedContextId: string,
  onNotifySuccess: (msg: string) => void,
) => {
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState('UTILITIES');
  const [tplAmount, setTplAmount] = useState('');
  const [tplIsActive, setTplCategoryIsActive] = useState(true);

  useEffect(() => {
    if (fixedState && 'selectedTemplate' in fixedState && fixedState.selectedTemplate) {
      setTplName(fixedState.selectedTemplate.name.toString());
      setTplCategory(fixedState.selectedTemplate.category);
      setTplAmount(fixedState.selectedTemplate.amount.toString());
      setTplCategoryIsActive(fixedState.selectedTemplate.isActive);
    } else {
      setTplName('');
      setTplCategory('UTILITIES');
      setTplAmount('');
      setTplCategoryIsActive(true);
    }
  }, [fixedState?.selectedTemplate, fixedState?.showTemplateModal]);

  const handleSaveFixedTemplate = async (e: FormEvent) => {
    e.preventDefault();
    if (!tplName || !tplAmount) {
      alert('Please fill out all required fields');
      return;
    }

    const success = await fixedPloc.saveTemplate({
      name: tplName,
      category: tplCategory,
      amount: Number(tplAmount),
      isActive: tplIsActive,
      contextId: selectedContextId || undefined,
    });

    if (success) {
      const isEdit = fixedState && 'selectedTemplate' in fixedState && fixedState.selectedTemplate;
      onNotifySuccess(isEdit ? 'Fixed expense template updated.' : 'Fixed expense template created.');
    }
  };

  const handleDeleteFixedTemplate = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the fixed template "${name}"?`)) {
      const success = await fixedPloc.confirmDelete(id);
      if (success) {
        onNotifySuccess('Fixed expense template deleted.');
      } else {
        const errorMsg = fixedState.errorMessage || 'Failed to delete template. Please try again.';
        alert(errorMsg);
      }
    }
  };

  return {
    tplName,
    setTplName,
    tplCategory,
    setTplCategory,
    tplAmount,
    setTplAmount,
    tplIsActive,
    setTplCategoryIsActive,
    handleSaveFixedTemplate,
    handleDeleteFixedTemplate,
  };
};
