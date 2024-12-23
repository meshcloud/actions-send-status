import * as core from '@actions/core';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function run() {
  try {
    let baseUrl: string;
    let bbRunUuid: string;

    const stepId = core.getInput('step_id');
    const status = core.getInput('status');
    const userMessage = core.getInput('user_message');
    const systemMessage = core.getInput('system_message');
    const summary = core.getInput('summary');
    const finalStatus = core.getInput('final_status');

    const tempDir = process.env.RUNNER_TEMP || os.tmpdir();
    core.debug(`Temporary directory: ${tempDir}`);
    console.log(`Temporary directory: ${tempDir}`); // This will also print the path to the console

    // Set the temporary directory path as an output
    core.setOutput('temp_directory', tempDir);

    let token;
    try {
      const tokenFilePath = path.join(tempDir, 'meshstack_token.json');
      core.debug(`Token file path: ${tokenFilePath}`);
      console.log(`Token file path: ${tokenFilePath}`);

      if (!fs.existsSync(tokenFilePath)) {
        throw new Error('Token file does not exist');
      }

      const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      token = tokenData.token;
      bbRunUuid = tokenData.bbRunUuid;
      baseUrl = tokenData.baseUrl;
      core.debug(`Token successfully read from file: ${tokenFilePath}`);
      console.log(`Token successfully read from file: ${tokenFilePath}`);
    } catch (error) {
      if (error instanceof Error) {
        core.setFailed(`Failed to read token from file at ${path.join(tempDir, 'meshstack_token.json')}: ${error.message}`);
      } else {
        core.setFailed('Failed to read token from file: An unknown error occurred');
      }
      return;
    }

    const data: any = {
      status: finalStatus ? finalStatus : "IN_PROGRESS",
      summary: summary
    };

    if (stepId) {
      data.steps = [{
        id: stepId,
        status: status,
        userMessage: userMessage,
        systemMessage: systemMessage
      }]
    };

    core.debug(`Constructed data object: ${JSON.stringify(data)}`);
    console.log(`Constructed data object: ${JSON.stringify(data)}`);

    const response = await axios.patch(
      `${baseUrl}/api/meshobjects/meshbuildingblockruns/${bbRunUuid}/status/source/github`,
      data,
      {
        headers: {
          'Content-Type': 'application/vnd.meshcloud.api.meshbuildingblockrun.v1.hal+json',
          'Accept': 'application/vnd.meshcloud.api.meshbuildingblockrun.v1.hal+json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    core.setOutput('response', response.data);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();

