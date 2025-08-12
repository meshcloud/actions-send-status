import * as core from '@actions/core';
import * as os from 'os';
import { makeRequest, readTokenFromFile } from './api';
import { ActionInputs, readInputs } from './inputs';

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

export async function run() {
  try {
    const inputs = readInputs();

    const tempDir = process.env.RUNNER_TEMP || os.tmpdir();
    const token = readTokenFromFile(tempDir);

    const data = constructRequestData(inputs);

    const response = makeRequest(token, data);
    core.setOutput('response', response);
  }
  catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
      const response = (error as any).response;
      if (response) {
        core.error(`API response status: ${response.status}`);
        core.error(`API response data: ${JSON.stringify(response.data)}`);
      }
    } else {
      core.setFailed('An unknown error occurred: ${error}');
    }
  }
}


// Only run if this file is executed directly (not imported for testing)
if (require.main === module) {
  run();
}

