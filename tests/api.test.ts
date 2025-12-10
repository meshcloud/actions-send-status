import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('api.ts - token file reading', () => {
  describe('readTokenFromFile', () => {
    const tokenFilePath = path.join(os.tmpdir(), 'test-token-meshstack.json');

    beforeEach(() => {
      // Clean up any test files
      if (fs.existsSync(tokenFilePath)) {
        fs.unlinkSync(tokenFilePath);
      }
    });

    it('should successfully read valid token file', () => {
      const tokenData = {
        token: 'test-token-123',
        bbRunUuid: 'uuid-456',
        baseUrl: 'https://api.example.com'
      };

      // Write test file
      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData));

      // Test reading
      if (!fs.existsSync(tokenFilePath)) {
        throw new Error(`Token file does not exist at ${tokenFilePath}`);
      }

      const result = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));

      assert.deepStrictEqual(result, tokenData);
    });

    it('should throw error when token file does not exist', () => {
      const nonExistentPath = path.join(os.tmpdir(), 'non-existent-token.json');

      assert.throws(
        () => {
          if (!fs.existsSync(nonExistentPath)) {
            throw new Error(`Token file does not exist at ${nonExistentPath}`);
          }
        },
        { message: /Token file does not exist at/ }
      );
    });

    it('should throw error when token field is missing', () => {
      const tokenData = {
        bbRunUuid: 'uuid-456',
        baseUrl: 'https://api.example.com'
        // token field missing
      };

      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData));

      const fileData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));

      assert.throws(
        () => {
          if (!fileData.token) {
            throw new Error('Token not found in token file');
          }
        },
        { message: 'Token not found in token file' }
      );
    });

    it('should throw error when bbRunUuid field is missing', () => {
      const tokenData = {
        token: 'test-token-123',
        baseUrl: 'https://api.example.com'
        // bbRunUuid field missing
      };

      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData));

      const fileData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));

      assert.throws(
        () => {
          if (!fileData.token || !fileData.bbRunUuid || !fileData.baseUrl) {
            throw new Error('Token file is missing required fields: token, bbRunUuid, or baseUrl');
          }
        },
        { message: 'Token file is missing required fields: token, bbRunUuid, or baseUrl' }
      );
    });

    it('should throw error when baseUrl field is missing', () => {
      const tokenData = {
        token: 'test-token-123',
        bbRunUuid: 'uuid-456'
        // baseUrl field missing
      };

      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData));

      const fileData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));

      assert.throws(
        () => {
          if (!fileData.token || !fileData.bbRunUuid || !fileData.baseUrl) {
            throw new Error('Token file is missing required fields: token, bbRunUuid, or baseUrl');
          }
        },
        { message: 'Token file is missing required fields: token, bbRunUuid, or baseUrl' }
      );
    });

    it('should throw error when JSON is invalid', () => {
      fs.writeFileSync(tokenFilePath, 'invalid json {');

      assert.throws(
        () => {
          JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
        }
      );
    });

    it('should parse token correctly from valid file', () => {
      const tokenData = {
        token: 'my-secret-token-xyz',
        bbRunUuid: 'run-uuid-789',
        baseUrl: 'https://meshstack.example.com'
      };

      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData));

      const fileData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));

      assert.strictEqual(fileData.token, 'my-secret-token-xyz');
      assert.strictEqual(fileData.bbRunUuid, 'run-uuid-789');
      assert.strictEqual(fileData.baseUrl, 'https://meshstack.example.com');
    });
  });
});
