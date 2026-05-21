import type { Abi, Address } from "viem";
import { isAddress, zeroAddress } from "viem";

export function toOptionalAddress(value: string | undefined): Address | undefined {
  if (!value || !isAddress(value)) {
    return undefined;
  }

  return value as Address;
}

export function createReadContractConfig({
  abi,
  address
}: {
  abi: Abi;
  address: Address | undefined;
}) {
  return {
    abi,
    address: address ?? zeroAddress,
    enabled: Boolean(address)
  } as const;
}
