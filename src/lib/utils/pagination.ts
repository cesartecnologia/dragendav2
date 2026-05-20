import type { QueryDocumentSnapshot } from "firebase/firestore";

export const DEFAULT_PAGE_SIZE = 15;

export type CursorState<T> = {
  lastDoc: QueryDocumentSnapshot<T> | null;
  hasMore: boolean;
};

export const initialCursorState = <T>(): CursorState<T> => ({
  lastDoc: null,
  hasMore: true,
});

