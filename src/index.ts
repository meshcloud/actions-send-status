import * as core from '@actions/core';
import * as os from 'os';
import * as path from 'path';
import { makeRequest, readTokenFromFile } from './api';
import { ActionInputs, readInputs, CoreAdapter as InputsCoreAdapter } from './inputs';

// allows stubbing @actions/core in tests
export interface CoreAdapter extends InputsCoreAdapter {
  setOutput: (name: string, value: any) => void;
  setFailed: (message: string) => void;
  error: (message: string) => void;
}

export function constructRequestData(inputs: ActionInputs): any {
  const data: any = {
    status: inputs.runStatus ? inputs.runStatus : "IN_PROGRESS",
  };

  if (inputs.stepId) {
    data.steps = [{
      id: inputs.stepId,
      status: inputs.stepStatus,
      userMessage: inputs.userMessage,
      systemMessage: inputs.systemMessage,
      outputs: inputs.outputs
    }];
  }

  return data;
}

export async function runSendStatus(coreAdapter: CoreAdapter = core): Promise<void> {
  try {
    // Read inputs using the adapter
    const inputs = readInputs(coreAdapter);

    // Use the well-known token file location
    const tempDir = process.env.RUNNER_TEMP || os.tmpdir();
    const tokenFilePath = path.join(tempDir, 'meshstack_token.json');

    const token = readTokenFromFile(tokenFilePath);

    const data = constructRequestData(inputs);

    const response = await makeRequest(token, data);
    coreAdapter.setOutput('response', response);
  }
  catch (error) {
    if (error instanceof Error) {
      coreAdapter.setFailed(error.message);
      const response = (error as any).response;
      if (response) {
        coreAdapter.error(`API response status: ${response.status}`);
        coreAdapter.error(`API response data: ${JSON.stringify(response.data)}`);
      }
      throw error;
    } else {
      coreAdapter.setFailed('An unknown error occurred: ${error}');
      throw error;
    }
  }
}

export async function run() {
  await runSendStatus(core);
}

// Only run if this file is executed directly (not imported for testing)
if (require.main === module) {
  run();
}

