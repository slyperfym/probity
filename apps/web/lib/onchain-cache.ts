import type { QueryClient } from "@tanstack/react-query";

export async function refreshOnchainQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    predicate: (query) => shouldRefreshAfterOnchainWrite(query.queryKey)
  });
  await queryClient.refetchQueries({
    predicate: (query) => shouldRefreshAfterOnchainWrite(query.queryKey),
    type: "active"
  });
}

function shouldRefreshAfterOnchainWrite(queryKey: unknown) {
  if (!Array.isArray(queryKey)) {
    return true;
  }

  return queryKey[1] !== "external-signals";
}
