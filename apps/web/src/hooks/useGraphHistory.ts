import { useCallback, useReducer, useRef } from 'react';
import type { Workflow } from '@atlas/contracts';
type History = { present: Workflow; past: Workflow[]; future: Workflow[] };
type Action =
  | { type: 'commit'; next: Workflow; previous?: Workflow }
  | { type: 'transient'; next: Workflow }
  | { type: 'undo' | 'redo' };
function reducer(state: History, action: Action): History {
  if (action.type === 'commit') {
    const previous = action.previous ?? state.present;
    if (JSON.stringify(previous) === JSON.stringify(action.next)) return state;
    return {
      present: action.next,
      past: [...state.past.slice(-49), structuredClone(previous)],
      future: [],
    };
  }
  if (action.type === 'transient') return { ...state, present: action.next };
  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    return previous
      ? {
          present: previous,
          past: state.past.slice(0, -1),
          future: [state.present, ...state.future],
        }
      : state;
  }
  if (action.type === 'redo') {
    const next = state.future[0];
    return next
      ? { present: next, past: [...state.past, state.present], future: state.future.slice(1) }
      : state;
  }
  return state;
}
export function useGraphHistory(initial: Workflow) {
  const [history, dispatch] = useReducer(reducer, {
    present: structuredClone(initial),
    past: [],
    future: [],
  });
  const current = useRef(history.present);
  current.current = history.present;
  const commit = useCallback((next: Workflow, previous?: Workflow) => {
    current.current = next;
    dispatch({ type: 'commit', next, previous });
  }, []);
  const transient = useCallback((next: Workflow) => {
    current.current = next;
    dispatch({ type: 'transient', next });
  }, []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  return {
    graph: history.present,
    commit,
    transient,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    current,
  };
}
