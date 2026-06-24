import { useEffect, useState } from 'react';
import { Ploc } from '@modules/shared/presentation/ploc/ploc';

export function usePlocState<S>(ploc: Ploc<S>): S {
  const [currentState, setCurrentState] = useState<S>(ploc.state());

  useEffect(() => {
    const stateSubscription = (state: S) => {
      setCurrentState(state);
    };

    ploc.subscribe(stateSubscription);
    // Ensure we are synchronized with the most up-to-date state
    setCurrentState(ploc.state());

    return () => {
      ploc.unsubscribe(stateSubscription);
    };
  }, [ploc]);

  return currentState;
}
