import { createRequire } from 'node:module';
import addresses from '../deployments/arc-testnet/addresses.json' with { type: 'json' };
import marketFactoryAbi from '../deployments/arc-testnet/abis/MarketFactory.json' with { type: 'json' };
import predictionMarketAbi from '../deployments/arc-testnet/abis/PredictionMarket.json' with { type: 'json' };

const requireFromWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createPublicClient, getAddress, http } = requireFromWeb('viem');

const ARC_TESTNET_CHAIN_ID = 5042002;
const DEFAULT_RPC_URL = 'https://rpc.testnet.arc.network';
const EXPECTED_SETTLEMENT_TOKEN = '0x3600000000000000000000000000000000000000';

const rpcUrl = process.env.ARC_TESTNET_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || DEFAULT_RPC_URL;
const configuredFactory = process.env.MARKET_FACTORY_ADDRESS || process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || addresses.contracts.MarketFactory;
const configuredSettlementToken = process.env.SETTLEMENT_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS || addresses.contracts.SettlementToken || addresses.contracts.MockUSDC;

const chain = {
  id: ARC_TESTNET_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: [rpcUrl] } }
};

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

function normalizeAddress(value, label) {
  try {
    return getAddress(value);
  } catch {
    throw new Error(`${label} is not a valid address: ${value}`);
  }
}

function statusLine(ok, label, detail = '') {
  return `${ok ? 'OK ' : 'FAIL'} ${label}${detail ? `: ${detail}` : ''}`;
}

async function requireCode(address, label) {
  const code = await publicClient.getCode({ address });
  const hasCode = Boolean(code && code !== '0x');
  console.log(statusLine(hasCode, `${label} has bytecode`, address));
  if (!hasCode) {
    throw new Error(`${label} has no bytecode at ${address}`);
  }
}

async function main() {
  const factoryAddress = normalizeAddress(configuredFactory, 'MarketFactory');
  const settlementTokenAddress = normalizeAddress(configuredSettlementToken, 'SettlementToken');
  const expectedSettlementToken = normalizeAddress(EXPECTED_SETTLEMENT_TOKEN, 'Expected Arc Testnet settlement token');

  console.log('Probity Arc Testnet deployment verification');
  console.log(`RPC: ${rpcUrl}`);
  console.log(`MarketFactory: ${factoryAddress}`);
  console.log(`SettlementToken: ${settlementTokenAddress}`);

  const chainId = Number(await publicClient.getChainId());
  const isExpectedChain = chainId === ARC_TESTNET_CHAIN_ID;
  console.log(statusLine(isExpectedChain, 'chainId', String(chainId)));
  if (!isExpectedChain) {
    throw new Error(`Expected Arc Testnet chainId ${ARC_TESTNET_CHAIN_ID}, got ${chainId}`);
  }

  await requireCode(factoryAddress, 'MarketFactory');
  await requireCode(settlementTokenAddress, 'SettlementToken');

  const factorySettlementMatches = settlementTokenAddress.toLowerCase() === expectedSettlementToken.toLowerCase();
  console.log(statusLine(factorySettlementMatches, 'settlement token matches expected Arc Testnet token', settlementTokenAddress));
  if (!factorySettlementMatches) {
    throw new Error(`Expected settlement token ${expectedSettlementToken}, got ${settlementTokenAddress}`);
  }

  const marketCount = await publicClient.readContract({
    abi: marketFactoryAbi,
    address: factoryAddress,
    functionName: 'marketCount'
  });
  const marketCountNumber = Number(marketCount);
  console.log(statusLine(marketCountNumber > 0, 'marketCount', String(marketCountNumber)));
  if (marketCountNumber <= 0) {
    throw new Error('Factory has zero markets. Check the configured MarketFactory address.');
  }

  const sampleMarketAddress = await publicClient.readContract({
    abi: marketFactoryAbi,
    address: factoryAddress,
    args: [0n],
    functionName: 'marketAt'
  });
  const sampleSettlementToken = await publicClient.readContract({
    abi: predictionMarketAbi,
    address: sampleMarketAddress,
    functionName: 'settlementToken'
  });
  const marketTokenMatches = sampleSettlementToken.toLowerCase() === settlementTokenAddress.toLowerCase();
  console.log(statusLine(marketTokenMatches, 'sample market settlement token', `${sampleMarketAddress} -> ${sampleSettlementToken}`));
  if (!marketTokenMatches) {
    throw new Error(`Sample market token mismatch. Expected ${settlementTokenAddress}, got ${sampleSettlementToken}`);
  }

  console.log('Deployment verification passed.');
}

main().catch((error) => {
  console.error(`Deployment verification failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
