import * as fs from "fs";
import * as path from "path";
import { Configuration, OpenAIApi } from "openai";
import * as dotenv from "dotenv";

dotenv.config({path: '.env'});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export function findFileInDirectory(fileName: string, directory: string): string | undefined {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        if (file === fileName) {
            return path.join(directory, file);
        }
    }
    return undefined;
}

export async function getBestFitApisForRequestedInfo(requestedInfo: { [key: string]: string }) {
    // get API info, get the embeddings for current input, then determine which API is the best fit
    const apiInfo = getApiInfoFromJsonFile("src/client/api-keys-and-info.json");
    const bestFitApis: any = {};

    for (const [key, value] of Object.entries(requestedInfo)) {
        var embeddings = await generateEmbedding(key);
        var bestFitApiInfo: any = getBestFitApiInfo(embeddings, apiInfo);
        bestFitApis[value] = bestFitApiInfo["api-key"];
    }

    return bestFitApis;
}

function getApiInfoFromJsonFile(jsonFilePath: string) {
    const fileContent = fs.readFileSync(jsonFilePath, "utf8");
    const jsonContent = JSON.parse(fileContent);
    return jsonContent;
}

async function generateEmbedding(text) {
    const response = await openai.createEmbedding({
      input: text,
      model: 'text-embedding-ada-002',
    });
  
    return response.data.data[0].embedding;
}

function getBestFitApiInfo(embeddings, apiInfo) {
    let bestFitApiInfo = {};
    let bestFitDistance = Infinity;
    for (const apiInfoEntry of apiInfo) {
        const distance = getDistance(embeddings, apiInfoEntry["embedding"]);
        if (distance < bestFitDistance) {
            bestFitDistance = distance;
            bestFitApiInfo = apiInfoEntry;
        }
    }
    return bestFitApiInfo;
}

function getDistance(embeddings1: [], embeddings2: []) {
    let distance = 0;
    for (let i = 0; i < embeddings1.length; i++) {
        distance += Math.pow(embeddings1[i] - embeddings2[i], 2);
    }
    return Math.sqrt(distance);
}
