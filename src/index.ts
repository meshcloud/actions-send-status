import * as core from '@actions/core';
import axios from 'axios';

async function run() {
  try {
    const baseUrl = core.getInput('base_url');
    const bbRunUuid = core.getInput('bb_run_uuid');
    const stepId = core.getInput('step_id');
    const status = core.getInput('status');
    const userMessage = core.getInput('user_message');
    const systemMessage = core.getInput('system_message');
    const token = core.getInput('token');
    const isFinal = core.getInput('is_final') === 'true';
    const summary = core.getInput('summary');

    const data: any = {
      status: isFinal ? status : "IN_PROGRESS",
      steps: [{
        id: stepId,
        status: status
      }]
    };

    if (status === 'FAILED') {
      data.steps[0].userMessage = userMessage;
      data.steps[0].systemMessage = systemMessage;
    }

    if (isFinal) {
      data.summary = summary;
      data.steps = [];
    }

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

