import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface Token {
  token: string;
  bbRunUuid: string;
  baseUrl: string;
}

export function readTokenFromFile(tokenFilePath: string): { token: string; bbRunUuid: string; baseUrl: string } {
  if (!fs.existsSync(tokenFilePath)) {
    throw new Error(`Token file does not exist at ${tokenFilePath}`);
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));

  if (!tokenData.token || !tokenData.bbRunUuid || !tokenData.baseUrl) {
    throw new Error('Token file is missing required fields: token, bbRunUuid, or baseUrl');
  }

  return {
    token: tokenData.token,
    bbRunUuid: tokenData.bbRunUuid,
    baseUrl: tokenData.baseUrl
  };
}

export async function makeRequest(token: Token, data: any) {
  const response = await axios.patch(
    `${token.baseUrl}/api/meshobjects/meshbuildingblockruns/${token.bbRunUuid}/status/source/github`,
    data,
    {
      headers: {
        'Content-Type': 'application/vnd.meshcloud.api.meshbuildingblockrun.v1.hal+json',
        'Accept': 'application/vnd.meshcloud.api.meshbuildingblockrun.v1.hal+json',
        'Authorization': `Bearer ${token.token}`
      }
    }
  );

  return response.data;
}
