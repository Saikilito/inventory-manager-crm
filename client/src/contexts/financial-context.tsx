import React, { createContext, useContext } from "react";
import { FinancialPloc } from "../modules/financial/presentation/ploc/financial-ploc";

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
