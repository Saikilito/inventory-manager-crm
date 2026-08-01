import { useCallback, useMemo, useState } from "react";

export interface PanelFeedback {
  successMsg: string | null;
  errorMsg: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  clearFeedback: () => void;
}

export const usePanelFeedback = (): PanelFeedback => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setErrorMsg(null);
    setSuccessMsg(msg);
  }, []);

  const showError = useCallback((msg: string) => {
    setSuccessMsg(null);
    setErrorMsg(msg);
  }, []);

  const clearFeedback = useCallback(() => {
    setSuccessMsg(null);
    setErrorMsg(null);
  }, []);

  return useMemo(
    () => ({ successMsg, errorMsg, showSuccess, showError, clearFeedback }),
    [successMsg, errorMsg, showSuccess, showError, clearFeedback]
  );
};
