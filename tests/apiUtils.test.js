/**
 * @vitest-environment jsdom
 */
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

    it('should parse simple XML', () => {
      const xml = '<root><child>value</child></root>';
      expect(parseResponse(xml)).toEqual({ root: { child: 'value' } });
    });

    it('should parse XML with attributes', () => {
      const xml = '<root id="1"><child type="text">value</child></root>';
      expect(parseResponse(xml)).toEqual({
        root: {
          '@attributes': { id: '1' },
          child: {
            '@attributes': { type: 'text' },
            '#text': 'value'
          }
        }
      });
    });

    it('should parse XML with multiple children of same name into an array', () => {
      const xml = '<root><item>1</item><item>2</item></root>';
      expect(parseResponse(xml)).toEqual({
        root: {
          item: ['1', '2']
        }
      });
    });

    it('should parse XML with nested structures', () => {
      const xml = '<root><a><b><c>val</c></b></a></root>';
      expect(parseResponse(xml)).toEqual({
        root: {
          a: { b: { c: 'val' } }
        }
      });
    });

    it('should handle empty elements', () => {
      const xml = '<root><empty/></root>';
      expect(parseResponse(xml)).toEqual({ root: { empty: '' } });
    });

    it('should return raw text for invalid XML starting with <', () => {
      const invalidXml = '<root><unclosed>';
      expect(parseResponse(invalidXml)).toBe(invalidXml);
    });

    it('should handle XML with mixed content', () => {
      const xml = '<root>text1<child>val</child>text2</root>';
      expect(parseResponse(xml)).toEqual({
        root: {
          '#text': 'text1text2',
          child: 'val'
        }
      });
    });

    it('should handle DOMParser throwing an error', () => {
      const originalDOMParser = global.DOMParser;
      global.DOMParser = class {
        parseFromString() { throw new Error('mock error'); }
      };
      const xml = '<root/>';
      expect(parseResponse(xml)).toBe(xml);
      global.DOMParser = originalDOMParser;
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
