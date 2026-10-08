import axios from 'axios';
import * as fs from 'fs';
import { REQUEST_TIMEOUT_MS, RetryOptions, withRetry } from './retry';

interface Token {
  token: string;
}

export function readTokenFromFile(tokenFilePath: string): { token: string } {
  if (!fs.existsSync(tokenFilePath)) {
    throw new Error(`Token file does not exist at ${tokenFilePath}`);
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));

  if (!tokenData.token) {
    throw new Error('Token file is missing required field: token');
  }

  return {
    token: tokenData.token
  };
}

export async function makeRequest(token: Token, buildingBlockRunUrl: string, data: any, retryOptions: RetryOptions) {
  const response = await withRetry(() => axios.patch(
    `${buildingBlockRunUrl}/status/source/github`,
    data,
    {
      headers: {
        'Content-Type': 'application/vnd.meshcloud.api.meshbuildingblockrun.v1.hal+json',
        'Accept': 'application/vnd.meshcloud.api.meshbuildingblockrun.v1.hal+json',
        'Authorization': `Bearer ${token.token}`
      },
      timeout: REQUEST_TIMEOUT_MS
    }
  ), retryOptions);

  return response.data;
}
