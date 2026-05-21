import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const networks = ["local", "arc-testnet"];

const contracts = [
  {
    artifact: "contracts/out/MarketFactory.sol/MarketFactory.json",
    name: "MarketFactory"
  },
  {
    artifact: "contracts/out/PredictionMarket.sol/PredictionMarket.json",
    name: "PredictionMarket"
  },
  {
    artifact: "contracts/out/MockUSDC.sol/MockUSDC.json",
    name: "MockUSDC"
  }
];

async function exportAbi({ artifact, name }, network) {
  const artifactPath = resolve(repoRoot, artifact);
  const outputPath = resolve(repoRoot, `deployments/${network}/abis/${name}.json`);
  const artifactJson = JSON.parse(await readFile(artifactPath, "utf8"));

  if (!Array.isArray(artifactJson.abi)) {
    throw new Error(`Missing ABI array in ${artifact}`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(artifactJson.abi, null, 2)}\n`);
}

await Promise.all(networks.flatMap((network) => contracts.map((contract) => exportAbi(contract, network))));

console.log(`Exported contract ABIs to ${networks.map((network) => `deployments/${network}/abis`).join(", ")}`);
