import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { readInputs, parseAndValidateOutputsJson, validateInputs, ActionInputs } from '../src/inputs';

// Mock @actions/core
const mockGetInput = mock.fn();
const core = {
  getInput: mockGetInput
};

// Replace the module
mock.module('@actions/core', {
  namedExports: {
    getInput: mockGetInput
  }
});

describe('inputs.ts', () => {
  beforeEach(() => {
    mockGetInput.mock.resetCalls();
  });

  describe('parseAndValidateOutputsJson', () => {
    it('should parse valid JSON object', () => {
      const validJson = '{"key": "value", "number": 42}';
      const result = parseAndValidateOutputsJson(validJson);
      assert.deepStrictEqual(result, { key: "value", number: 42 });
    });

    it('should parse empty JSON object', () => {
      const emptyJson = '{}';
      const result = parseAndValidateOutputsJson(emptyJson);
      assert.deepStrictEqual(result, {});
    });

    it('should throw error for non-object JSON (array)', () => {
      const arrayJson = '[1, 2, 3]';
      assert.throws(
        () => parseAndValidateOutputsJson(arrayJson),
        { message: 'outputs_json must be a valid JSON object' }
      );
    });

    it('should throw error for non-object JSON (string)', () => {
      const stringJson = '"hello"';
      assert.throws(
        () => parseAndValidateOutputsJson(stringJson),
        { message: 'outputs_json must be a valid JSON object' }
      );
    });

    it('should throw error for non-object JSON (number)', () => {
      const numberJson = '42';
      assert.throws(
        () => parseAndValidateOutputsJson(numberJson),
        { message: 'outputs_json must be a valid JSON object' }
      );
    });

    it('should throw error for null JSON', () => {
      const nullJson = 'null';
      assert.throws(
        () => parseAndValidateOutputsJson(nullJson),
        { message: 'outputs_json must be a valid JSON object' }
      );
    });

    it('should throw error for invalid JSON syntax', () => {
      const invalidJson = '{"key": value}';
      assert.throws(() => parseAndValidateOutputsJson(invalidJson));
    });
  });

  describe('validateInputs', () => {
    it('should pass validation when step_id is provided with step data', () => {
      const inputs: ActionInputs = {
        stepId: 'step-123',
        stepStatus: 'COMPLETED',
        userMessage: 'Done',
        systemMessage: 'System message',
        runStatus: 'SUCCESS',
        outputs: { result: 'success' }
      };

      assert.doesNotThrow(() => validateInputs(inputs));
    });

    it('should pass validation when only run status is provided (no step data)', () => {
      const inputs: ActionInputs = {
        stepId: '',
        stepStatus: '',
        userMessage: '',
        systemMessage: '',
        runStatus: 'SUCCESS',
        outputs: {}
      };

      assert.doesNotThrow(() => validateInputs(inputs));
    });

    it('should fail validation when step_id is provided but no step status', () => {
      const inputs: ActionInputs = {
        stepId: 'step-123',
        stepStatus: '',
        userMessage: '',
        systemMessage: '',
        runStatus: 'SUCCESS',
        outputs: {}
      };

      assert.doesNotThrow(() => validateInputs(inputs));
    });

    it('should throw error when step_status is provided without step_id', () => {
      const inputs: ActionInputs = {
        stepId: '',
        stepStatus: 'COMPLETED',
        userMessage: '',
        systemMessage: '',
        runStatus: 'SUCCESS',
        outputs: {}
      };

      assert.throws(
        () => validateInputs(inputs),
        { message: 'step_id must be provided when setting step_status, user_message, system_message, or outputs_json' }
      );
    });

    it('should throw error when user_message is provided without step_id', () => {
      const inputs: ActionInputs = {
        stepId: '',
        stepStatus: '',
        userMessage: 'User message',
        systemMessage: '',
        runStatus: 'SUCCESS',
        outputs: {}
      };

      assert.throws(
        () => validateInputs(inputs),
        { message: 'step_id must be provided when setting step_status, user_message, system_message, or outputs_json' }
      );
    });

    it('should throw error when system_message is provided without step_id', () => {
      const inputs: ActionInputs = {
        stepId: '',
        stepStatus: '',
        userMessage: '',
        systemMessage: 'System message',
        runStatus: 'SUCCESS',
        outputs: {}
      };

      assert.throws(
        () => validateInputs(inputs),
        { message: 'step_id must be provided when setting step_status, user_message, system_message, or outputs_json' }
      );
    });

    it('should throw error when outputs are provided without step_id', () => {
      const inputs: ActionInputs = {
        stepId: '',
        stepStatus: '',
        userMessage: '',
        systemMessage: '',
        runStatus: 'SUCCESS',
        outputs: { result: 'value' }
      };

      assert.throws(
        () => validateInputs(inputs),
        { message: 'step_id must be provided when setting step_status, user_message, system_message, or outputs_json' }
      );
    });
  });

  describe('readInputs', () => {
    it('should read all inputs correctly', () => {
      mockGetInput.mock.mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = {
          'step_id': 'step-123',
          'step_status': 'COMPLETED',
          'user_message': 'Task completed successfully',
          'system_message': 'System processed the task',
          'run_status': 'SUCCESS',
          'outputs_json': '{"result": "success", "count": 5}'
        };
        return inputs[name] || '';
      });

      const result = readInputs();

      assert.deepStrictEqual(result, {
        stepId: 'step-123',
        stepStatus: 'COMPLETED',
        userMessage: 'Task completed successfully',
        systemMessage: 'System processed the task',
        runStatus: 'SUCCESS',
        outputs: { result: 'success', count: 5 }
      });

      assert.strictEqual(mockGetInput.mock.calls.length, 6);
    });

    it('should read inputs with empty outputs_json', () => {
      mockGetInput.mock.mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = {
          'step_id': '',
          'step_status': '',
          'user_message': '',
          'system_message': '',
          'run_status': 'IN_PROGRESS',
          'outputs_json': '{}'
        };
        return inputs[name] || '';
      });

      const result = readInputs();

      assert.deepStrictEqual(result, {
        stepId: '',
        stepStatus: '',
        userMessage: '',
        systemMessage: '',
        runStatus: 'IN_PROGRESS',
        outputs: {}
      });
    });

    it('should throw error when validation fails', () => {
      mockGetInput.mock.mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = {
          'step_id': '',
          'step_status': 'COMPLETED',
          'user_message': '',
          'system_message': '',
          'run_status': 'SUCCESS',
          'outputs_json': '{}'
        };
        return inputs[name] || '';
      });

      assert.throws(
        () => readInputs(),
        { message: 'step_id must be provided when setting step_status, user_message, system_message, or outputs_json' }
      );
    });

    it('should throw error when outputs_json is invalid', () => {
      mockGetInput.mock.mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = {
          'step_id': 'step-123',
          'step_status': '',
          'user_message': '',
          'system_message': '',
          'run_status': 'SUCCESS',
          'outputs_json': '[1, 2, 3]'
        };
        return inputs[name] || '';
      });

      assert.throws(
        () => readInputs(),
        { message: 'outputs_json must be a valid JSON object' }
      );
    });
  });
});