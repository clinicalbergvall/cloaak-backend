// This file provides proper type definitions for React when using default import syntax
// It allows the project to use "import React from 'react'" and access React members via React.useState, etc.

import * as ReactNamespace from 'react';

// Re-export everything from React to satisfy TypeScript
declare global {
  const React: typeof ReactNamespace;
  namespace React {
    export type { 
      ReactNode,
      ReactElement,
      Component,
      ComponentType,
      FC,
      FunctionComponent,
      PropsWithChildren,
      ReactPortal,
      ErrorInfo,
      ButtonHTMLAttributes
    } from 'react';

    // Export hooks as properties of React for default import usage
    export const useState: typeof ReactNamespace.useState;
    export const useEffect: typeof ReactNamespace.useEffect;
    export const useLayoutEffect: typeof ReactNamespace.useLayoutEffect;
    export const useContext: typeof ReactNamespace.useContext;
    export const useReducer: typeof ReactNamespace.useReducer;
    export const useCallback: typeof ReactNamespace.useCallback;
    export const useMemo: typeof ReactNamespace.useMemo;
    export const useRef: typeof ReactNamespace.useRef;
    export const useImperativeHandle: typeof ReactNamespace.useImperativeHandle;
    export const useDebugValue: typeof ReactNamespace.useDebugValue;
    export const useTransition: typeof ReactNamespace.useTransition;
    export const useDeferredValue: typeof ReactNamespace.useDeferredValue;
    export const useId: typeof ReactNamespace.useId;
    export const useSyncExternalStore: typeof ReactNamespace.useSyncExternalStore;
    export const useInsertionEffect: typeof ReactNamespace.useInsertionEffect;
    export const Suspense: typeof ReactNamespace.Suspense;
    export const forwardRef: typeof ReactNamespace.forwardRef;
  }
}

export {};