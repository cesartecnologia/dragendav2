import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

export const converter = <T extends object>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => data as DocumentData,
  fromFirestore: (
    snap: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions,
  ): T => snap.data(options) as T,
});

export const stripUndefined = <T extends Record<string, unknown>>(
  data: T,
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
};

