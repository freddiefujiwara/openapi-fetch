import { describe, it, expect } from 'vitest';
import { truncateString, truncateStringReplacer, buildUrl, parseResponse, MAX_STRING_LENGTH, formatResponseTime } from '../src/utils/apiUtils';

describe('apiUtils', () => {
  describe('truncateString', () => {
    it('should truncate strings longer than maxLength', () => {
      const longStr = 'a'.repeat(MAX_STRING_LENGTH + 10);
      const result = truncateString(longStr);
      expect(result).toBe('a'.repeat(MAX_STRING_LENGTH) + '...');
    });

    it('should not truncate strings shorter than or equal to maxLength', () => {
      const shortStr = 'abc';
      expect(truncateString(shortStr)).toBe('abc');
      const edgeStr = 'a'.repeat(MAX_STRING_LENGTH);
      expect(truncateString(edgeStr)).toBe(edgeStr);
    });

    it('should use custom maxLength', () => {
      expect(truncateString('abcdef', 3)).toBe('abc...');
    });

    it('should return non-string values as is', () => {
      expect(truncateString(123)).toBe(123);
      expect(truncateString(null)).toBe(null);
    });
  });

  describe('truncateStringReplacer', () => {
    it('should truncate string values', () => {
      const longStr = 'a'.repeat(MAX_STRING_LENGTH + 1);
      expect(truncateStringReplacer('key', longStr)).toBe('a'.repeat(MAX_STRING_LENGTH) + '...');
    });

    it('should return non-string values as is', () => {
      expect(truncateStringReplacer('key', 123)).toBe(123);
    });
  });

  describe('buildUrl', () => {
    it('should join baseUrl and path', () => {
      expect(buildUrl('http://example.com', 'test', [], {})).toBe('http://example.com/test');
      expect(buildUrl('http://example.com/', '/test', [], {})).toBe('http://example.com/test');
    });

    it('should append query parameters', () => {
      const queryParams = [{ name: 'q' }, { name: 'id' }];
      const values = { q: 'search', id: 123 };
      expect(buildUrl('http://api.com', 'test', queryParams, values)).toBe('http://api.com/test?q=search&id=123');
    });

    it('should handle existing query parameters in path (unlikely but safe)', () => {
       const queryParams = [{ name: 'q' }];
       const values = { q: 'v' };
       expect(buildUrl('http://api.com', 'test?a=1', queryParams, values)).toBe('http://api.com/test?a=1&q=v');
    });

    it('should ignore empty/null/undefined values', () => {
      const queryParams = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
      const values = { a: '', b: null };
      expect(buildUrl('http://api.com', 'test', queryParams, values)).toBe('http://api.com/test');
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON', () => {
      expect(parseResponse('{"a":1}')).toEqual({ a: 1 });
    });

    it('should return raw text for invalid JSON', () => {
      expect(parseResponse('invalid json')).toBe('invalid json');
    });
  });

  describe('formatResponseTime', () => {
    it('should format milliseconds correctly', () => {
      expect(formatResponseTime(123.456)).toBe('123 ms');
      expect(formatResponseTime(0)).toBe('0 ms');
      expect(formatResponseTime(1000)).toBe('1000 ms');
    });
  });
});
