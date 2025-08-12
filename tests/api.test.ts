import * as fs from 'fs';
import axios from 'axios';
import { readTokenFromFile, makeRequest } from '../src/api';

// Mock dependencies
jest.mock('fs');
jest.mock('axios');

const mockedFs = jest.mocked(fs);
const mockedAxios = jest.mocked(axios);

describe('api.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(tokenData));

      const result = readTokenFromFile(tempDir);

      expect(result).toEqual(tokenData);
      expect(mockedFs.existsSync).toHaveBeenCalledWith(expectedTokenPath);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(expectedTokenPath, 'utf8');
    });

    it('should throw error when token file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => readTokenFromFile(tempDir)).toThrow('Token file does not exist');
      expect(mockedFs.existsSync).toHaveBeenCalledWith(expectedTokenPath);
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
    });

    it('should throw error when token field is missing', () => {
      const tokenData = {
        bbRunUuid: 'uuid-456',
        baseUrl: 'https://api.example.com'
        // token field missing
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(tokenData));

      expect(() => readTokenFromFile(tempDir)).toThrow(
        'Token file is missing required fields: token, bbRunUuid, or baseUrl'
      );
    });

    it('should throw error when bbRunUuid field is missing', () => {
      const tokenData = {
        token: 'test-token-123',
        baseUrl: 'https://api.example.com'
        // bbRunUuid field missing
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(tokenData));

      expect(() => readTokenFromFile(tempDir)).toThrow(
        'Token file is missing required fields: token, bbRunUuid, or baseUrl'
      );
    });

    it('should throw error when baseUrl field is missing', () => {
      const tokenData = {
        token: 'test-token-123',
        bbRunUuid: 'uuid-456'
        // baseUrl field missing
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(tokenData));

      expect(() => readTokenFromFile(tempDir)).toThrow(
        'Token file is missing required fields: token, bbRunUuid, or baseUrl'
      );
    });

    it('should throw error when JSON is invalid', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json {');

      expect(() => readTokenFromFile(tempDir)).toThrow();
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

      mockedAxios.patch.mockResolvedValue(mockResponse);

      const result = await makeRequest(mockToken, mockData);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        'https://api.example.com/api/meshobjects/meshbuildingblockruns/uuid-456/status/source/github',
        mockData,
        {
          headers: {
            'Content-Type': 'application/vnd.meshcloud.api.meshbuildingblockrun.v1.hal+json',
            'Accept': 'application/vnd.meshcloud.api.meshbuildingblockrun.v1.hal+json',
            'Authorization': 'Bearer test-token-123'
          }
        }
      );
    });

    it('should propagate axios errors', async () => {
      const axiosError = new Error('Network error');
      mockedAxios.patch.mockRejectedValue(axiosError);

      await expect(makeRequest(mockToken, mockData)).rejects.toThrow('Network error');
    });

    it('should handle API error responses', async () => {
      const apiError = {
        response: {
          status: 400,
          data: { error: 'Bad request' }
        }
      };
      mockedAxios.patch.mockRejectedValue(apiError);

      await expect(makeRequest(mockToken, mockData)).rejects.toEqual(apiError);
    });
  });
});
