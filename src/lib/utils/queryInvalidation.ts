import type {
  InvalidateQueryFilters,
  QueryClient,
} from "@tanstack/react-query";

export const invalidateQueriesInBackground = (
  queryClient: QueryClient,
  filters: InvalidateQueryFilters,
): void => {
  void queryClient.invalidateQueries(filters).catch(() => undefined);
};

export const invalidateManyInBackground = (
  queryClient: QueryClient,
  filtersList: InvalidateQueryFilters[],
): void => {
  for (const filters of filtersList) {
    invalidateQueriesInBackground(queryClient, filters);
  }
};
