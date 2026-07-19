import React, { createContext, useContext, useEffect, useState } from "react";
import { FinancialPloc } from "../modules/financial/presentation/ploc/financial-ploc";
import { usePlocState } from "../hooks/use-ploc-state";
import { FinancialState } from "../modules/financial/presentation/ploc/financial-state";

const FinancialContext = createContext<FinancialPloc | null>(null);

export const FinancialProvider: React.FC<{ ploc: FinancialPloc; children: React.ReactNode }> = ({ ploc, children }) => {
  return (
    <FinancialContext.Provider value={ploc}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancialPloc = () => {
  const ploc = useContext(FinancialContext);
  if (!ploc) {
    throw new Error("useFinancialPloc must be used within a FinancialProvider");
  }
  return ploc;
};
