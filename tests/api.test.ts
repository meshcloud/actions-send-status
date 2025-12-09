import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { readTokenFromFile, makeRequest } from '../src/api';

// Mock fs module
const mockExistsSync = mock.fn();
const mockReadFileSync = mock.fn();
mock.module('fs', {
  namedExports: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync
  }
});

// Mock axios module
const mockPatch = mock.fn();
mock.module('axios', {
  defaultExport: {
    patch: mockPatch
  }
});

describe('api.ts', () => {
  beforeEach(() => {
    mockExistsSync.mock.resetCalls();
    mockReadFileSync.mock.resetCalls();
    mockPatch.mock.resetCalls();
  });

  describe('readTokenFromFile', () => {
    const tempDir = '/tmp/test';
    const expectedTokenPath = '/tmp/test/meshstack_token.json';

    it('should successfully read valid token file', () => {
      const tokenData = {
        token: 'test-token-123',
        bbRunUuid: 'uuid-456',
        baseUrl: 'https://api.example.com'
      };

      mockExistsSync.mock.mockImplementation(() => true);
      mockReadFileSync.mock.mockImplementation(() => JSON.stringify(tokenData));

      const result = readTokenFromFile(tempDir);

      assert.deepStrictEqual(result, tokenData);
      assert.strictEqual(mockExistsSync.mock.calls.length, 1);
      assert.strictEqual(mockReadFileSync.mock.calls.length, 1);
    });

    it('should throw error when token file does not exist', () => {
      mockExistsSync.mock.mockImplementation(() => false);

      assert.throws(
        () => readTokenFromFile(tempDir),
        { message: 'Token file does not exist' }
      );
      assert.strictEqual(mockExistsSync.mock.calls.length, 1);
      assert.strictEqual(mockReadFileSync.mock.calls.length, 0);
    });

    it('should throw error when token field is missing', () => {
      const tokenData = {
        bbRunUuid: 'uuid-456',
        baseUrl: 'https://api.example.com'
        // token field missing
      };

      mockExistsSync.mock.mockImplementation(() => true);
      mockReadFileSync.mock.mockImplementation(() => JSON.stringify(tokenData));

      assert.throws(
        () => readTokenFromFile(tempDir),
        { message: 'Token file is missing required fields: token, bbRunUuid, or baseUrl' }
      );
    });

    it('should throw error when bbRunUuid field is missing', () => {
      const tokenData = {
        token: 'test-token-123',
        baseUrl: 'https://api.example.com'
        // bbRunUuid field missing
      };

      mockExistsSync.mock.mockImplementation(() => true);
      mockReadFileSync.mock.mockImplementation(() => JSON.stringify(tokenData));

      assert.throws(
        () => readTokenFromFile(tempDir),
        { message: 'Token file is missing required fields: token, bbRunUuid, or baseUrl' }
      );
    });

    it('should throw error when baseUrl field is missing', () => {
      const tokenData = {
        token: 'test-token-123',
        bbRunUuid: 'uuid-456'
        // baseUrl field missing
      };

      mockExistsSync.mock.mockImplementation(() => true);
      mockReadFileSync.mock.mockImplementation(() => JSON.stringify(tokenData));

      assert.throws(
        () => readTokenFromFile(tempDir),
        { message: 'Token file is missing required fields: token, bbRunUuid, or baseUrl' }
      );
    });

    it('should throw error when JSON is invalid', () => {
      mockExistsSync.mock.mockImplementation(() => true);
      mockReadFileSync.mock.mockImplementation(() => 'invalid json {');

      assert.throws(() => readTokenFromFile(tempDir));
    });
  });

  describe('makeRequest', () => {
    const mockToken = {
      token: 'test-token-123',
      bbRunUuid: 'uuid-456',
      baseUrl: 'https://api.example.com'
    };

    const mockData = {
      status: 'COMPLETED',
      steps: [{
        id: 'step-1',
        status: 'SUCCESS',
        userMessage: 'Done',
        systemMessage: 'System message',
        outputs: { result: 'success' }
      }]
    };

    it('should make successful API request', async () => {
      const mockResponse = {
        data: { status: 'updated', id: 'run-123' }
      };

      mockPatch.mock.mockImplementation(async () => mockResponse);

      const result = await makeRequest(mockToken, mockData);

      assert.deepStrictEqual(result, mockResponse.data);
      assert.strictEqual(mockPatch.mock.calls.length, 1);
      assert.strictEqual(
        mockPatch.mock.calls[0].arguments[0],
        'https://api.example.com/api/meshobjects/meshbuildingblockruns/uuid-456/status/source/github'
      );
    });

    it('should propagate axios errors', async () => {
      const axiosError = new Error('Network error');
      mockPatch.mock.mockImplementation(async () => { throw axiosError; });

      await assert.rejects(
        async () => makeRequest(mockToken, mockData),
        { message: 'Network error' }
      );
    });

    it('should handle API error responses', async () => {
      const apiError = {
        response: {
          status: 400,
          data: { error: 'Bad request' }
        }
      };
      mockPatch.mock.mockImplementation(async () => { throw apiError; });

      await assert.rejects(
        async () => makeRequest(mockToken, mockData),
        apiError
      );
    });
  });
});
