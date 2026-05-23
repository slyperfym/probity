import type { QueryClient } from "@tanstack/react-query";

export async function refreshOnchainQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries();
  await queryClient.refetchQueries({ type: "active" });
}
