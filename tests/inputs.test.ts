import * as core from '@actions/core';
import { readInputs, parseAndValidateOutputsJson, validateInputs, ActionInputs } from '../src/inputs';

// Mock the @actions/core module
jest.mock('@actions/core');
const mockedCore = jest.mocked(core);

describe('inputs.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseAndValidateOutputsJson', () => {
    it('should parse valid JSON object', () => {
      const validJson = '{"key": "value", "number": 42}';
      const result = parseAndValidateOutputsJson(validJson);
      expect(result).toEqual({ key: "value", number: 42 });
    });

    it('should parse empty JSON object', () => {
      const emptyJson = '{}';
      const result = parseAndValidateOutputsJson(emptyJson);
      expect(result).toEqual({});
    });

    it('should throw error for non-object JSON (array)', () => {
      const arrayJson = '[1, 2, 3]';
      expect(() => parseAndValidateOutputsJson(arrayJson)).toThrow(
        'outputs_json must be a valid JSON object'
      );
    });

    it('should throw error for non-object JSON (string)', () => {
      const stringJson = '"hello"';
      expect(() => parseAndValidateOutputsJson(stringJson)).toThrow(
        'outputs_json must be a valid JSON object'
      );
    });

    it('should throw error for non-object JSON (number)', () => {
      const numberJson = '42';
      expect(() => parseAndValidateOutputsJson(numberJson)).toThrow(
        'outputs_json must be a valid JSON object'
      );
    });

    it('should throw error for null JSON', () => {
      const nullJson = 'null';
      expect(() => parseAndValidateOutputsJson(nullJson)).toThrow(
        'outputs_json must be a valid JSON object'
      );
    });

    it('should throw error for invalid JSON syntax', () => {
      const invalidJson = '{"key": value}';
      expect(() => parseAndValidateOutputsJson(invalidJson)).toThrow();
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

      expect(() => validateInputs(inputs)).not.toThrow();
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

      expect(() => validateInputs(inputs)).not.toThrow();
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

      expect(() => validateInputs(inputs)).not.toThrow();
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

      expect(() => validateInputs(inputs)).toThrow(
        'step_id must be provided when setting step_status, user_message, system_message, or outputs_json'
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

      expect(() => validateInputs(inputs)).toThrow(
        'step_id must be provided when setting step_status, user_message, system_message, or outputs_json'
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

      expect(() => validateInputs(inputs)).toThrow(
        'step_id must be provided when setting step_status, user_message, system_message, or outputs_json'
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

      expect(() => validateInputs(inputs)).toThrow(
        'step_id must be provided when setting step_status, user_message, system_message, or outputs_json'
      );
    });
  });

  describe('readInputs', () => {
    it('should read all inputs correctly', () => {
      mockedCore.getInput.mockImplementation((name: string) => {
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

      expect(result).toEqual({
        stepId: 'step-123',
        stepStatus: 'COMPLETED',
        userMessage: 'Task completed successfully',
        systemMessage: 'System processed the task',
        runStatus: 'SUCCESS',
        outputs: { result: 'success', count: 5 }
      });

      expect(mockedCore.getInput).toHaveBeenCalledWith('step_id');
      expect(mockedCore.getInput).toHaveBeenCalledWith('step_status');
      expect(mockedCore.getInput).toHaveBeenCalledWith('user_message');
      expect(mockedCore.getInput).toHaveBeenCalledWith('system_message');
      expect(mockedCore.getInput).toHaveBeenCalledWith('run_status');
      expect(mockedCore.getInput).toHaveBeenCalledWith('outputs_json');
    });

    it('should read inputs with empty outputs_json', () => {
      mockedCore.getInput.mockImplementation((name: string) => {
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

      expect(result).toEqual({
        stepId: '',
        stepStatus: '',
        userMessage: '',
        systemMessage: '',
        runStatus: 'IN_PROGRESS',
        outputs: {}
      });
    });

    it('should throw error when validation fails', () => {
      mockedCore.getInput.mockImplementation((name: string) => {
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

      expect(() => readInputs()).toThrow(
        'step_id must be provided when setting step_status, user_message, system_message, or outputs_json'
      );
    });

    it('should throw error when outputs_json is invalid', () => {
      mockedCore.getInput.mockImplementation((name: string) => {
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

      expect(() => readInputs()).toThrow('outputs_json must be a valid JSON object');
    });
  });
});