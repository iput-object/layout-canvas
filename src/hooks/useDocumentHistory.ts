import { useCallback, useReducer, useRef } from 'react';
import { cloneDocument } from '../canvas/document';
import type { CanvasDocument } from '../types';

const MAX_HISTORY_LENGTH = 100;

const documentsMatch = (first: CanvasDocument, second: CanvasDocument) =>
  JSON.stringify(first) === JSON.stringify(second);

export function useDocumentHistory(
  document: CanvasDocument,
  applyDocument: (document: CanvasDocument) => void,
) {
  const documentRef = useRef(document);
  const pastRef = useRef<CanvasDocument[]>([]);
  const futureRef = useRef<CanvasDocument[]>([]);
  const transactionRef = useRef<CanvasDocument | null>(null);
  const [, refreshAvailability] = useReducer((value: number) => value + 1, 0);
  documentRef.current = document;

  const pushPast = useCallback((snapshot: CanvasDocument) => {
    pastRef.current = [...pastRef.current, cloneDocument(snapshot)].slice(
      -MAX_HISTORY_LENGTH,
    );
    futureRef.current = [];
    refreshAvailability();
  }, []);

  const recordChange = useCallback(() => {
    pushPast(documentRef.current);
  }, [pushPast]);

  const beginTransaction = useCallback(() => {
    if (!transactionRef.current) {
      transactionRef.current = cloneDocument(documentRef.current);
    }
  }, []);

  const commitTransaction = useCallback(() => {
    const start = transactionRef.current;
    transactionRef.current = null;
    if (start && !documentsMatch(start, documentRef.current)) pushPast(start);
  }, [pushPast]);

  const cancelTransaction = useCallback(() => {
    transactionRef.current = null;
  }, []);

  const undo = useCallback(() => {
    const previous = pastRef.current.at(-1);
    if (!previous) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [cloneDocument(documentRef.current), ...futureRef.current];
    transactionRef.current = null;
    applyDocument(cloneDocument(previous));
    refreshAvailability();
  }, [applyDocument]);

  const redo = useCallback(() => {
    const next = futureRef.current[0];
    if (!next) return;
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, cloneDocument(documentRef.current)];
    transactionRef.current = null;
    applyDocument(cloneDocument(next));
    refreshAvailability();
  }, [applyDocument]);

  return {
    beginTransaction,
    canRedo: futureRef.current.length > 0,
    canUndo: pastRef.current.length > 0,
    cancelTransaction,
    commitTransaction,
    recordChange,
    redo,
    undo,
  };
}
