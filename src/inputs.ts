import * as core from '@actions/core';

export interface ActionInputs {
  stepId?: string;
  stepStatus?: string;
  userMessage?: string;
  systemMessage?: string;
  runStatus?: string;
  outputs?: object
}

export interface CoreAdapter {
  getInput: (name: string) => string;
}

export function readInputs(coreAdapter: CoreAdapter = core): ActionInputs {
  const outputsJsonInput = coreAdapter.getInput('outputs_json');
  const outputs = parseAndValidateOutputsJson(outputsJsonInput);

  const inputs: ActionInputs = {
    stepId: coreAdapter.getInput('step_id'),
    stepStatus: coreAdapter.getInput('step_status'),
    userMessage: coreAdapter.getInput('user_message'),
    systemMessage: coreAdapter.getInput('system_message'),
    runStatus: coreAdapter.getInput('run_status'),
    outputs: outputs
  };

  validateInputs(inputs);

  return inputs;
}

export function parseAndValidateOutputsJson(input: string): object {
  const parsed = JSON.parse(input);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('outputs_json must be a valid JSON object');
  }

  return parsed;
}

export function validateInputs(inputs: ActionInputs): void {
  // outputs default to {}, only if an actual output is set we need to make sure we have a stepId
  const hasOutputs = inputs.outputs && Object.keys(inputs.outputs).length > 0;

  // when the user attempts to only resolve the run, provide a failure message
  if ((inputs.stepStatus || inputs.userMessage || inputs.systemMessage || hasOutputs) && !inputs.stepId) {
    throw new Error('step_id must be provided when setting step_status, user_message, system_message, or outputs_json');
  }
}
