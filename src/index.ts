import * as core from '@actions/core';
import * as os from 'os';
import * as path from 'path';
import * as github from '@actions/github';
import { makeRequest, readTokenFromFile } from './api';
import { ActionInputs, readInputs, CoreAdapter as InputsCoreAdapter } from './inputs';

// allows stubbing @actions/core in tests
export interface CoreAdapter extends InputsCoreAdapter {
  setOutput: (name: string, value: any) => void;
  setFailed: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
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

export interface GithubContextAdapter {
  context: {
    runId: number;
    repo: {
      owner: string;
      repo: string;
    };
    payload: any;
  };
}

export async function runSendStatus(coreAdapter: CoreAdapter = core, githubContext: GithubContextAdapter = github): Promise<void> {
  try {
    // Read inputs using the adapter
    const inputs = readInputs(coreAdapter);

    // Use the well-known token file location
    const tempDir = process.env.RUNNER_TEMP || os.tmpdir();
    const tokenFilePath = path.join(tempDir, 'meshstack_token.json');

    const token = readTokenFromFile(tokenFilePath);

    // Extract buildingBlockRunUrl and buildingBlockRun from GitHub event payload
    const buildingBlockRunUrl = githubContext.context.payload.inputs?.buildingBlockRunUrl;
    const buildingBlockRun = githubContext.context.payload.inputs?.buildingBlockRun;

    // Determine the building block run URL
    let runUrl: string;

    if (buildingBlockRunUrl) {
      runUrl = buildingBlockRunUrl;
    } else if (buildingBlockRun) {
      // Decode base64 and extract the self link from the building block run object
      const decodedRun = Buffer.from(buildingBlockRun, 'base64').toString('utf-8');
      const runObject = JSON.parse(decodedRun);
      
      // Get the self link from the building block run
      runUrl = runObject._links.self.href;
    } else {
      throw new Error('Neither buildingBlockRunUrl nor buildingBlockRun provided in GitHub event payload');
    }

    coreAdapter.debug(`Building Block Run URL: ${runUrl}`);

    const data = constructRequestData(inputs);

    const response = await makeRequest(token, runUrl, data, coreAdapter);
    coreAdapter.setOutput('response', response);
  } catch (error) {
    // Exception handler of last resort
    if (error instanceof Error) {
      coreAdapter.setFailed(error.message);
    } else {
      coreAdapter.setFailed(`An unknown error occurred: ${error}`);
    }
    throw error;
  }
}

export async function run() {
  try {
    await runSendStatus(core);
  } catch (error) {
    // Last-resort exception handler: prevent unhandled rejections
    // The error has already been logged and setFailed has been called
    process.exit(1);
  }
}

// Only run if this file is executed directly (not imported for testing)
if (require.main === module) {
  run();
}

