import { describe, it, expect, vi } from 'vitest';
import { encodeMarkdownToPath, decodeMarkdownFromPath } from '../src/utils/compression';
import LZString from 'lz-string';

describe('compression utilities', () => {
  describe('encodeMarkdownToPath', () => {
    it('should return empty string for empty input', () => {
      expect(encodeMarkdownToPath('')).toBe('');
      expect(encodeMarkdownToPath(null)).toBe('');
      expect(encodeMarkdownToPath(undefined)).toBe('');
    });

    it('should encode string correctly', () => {
      const input = 'hello world';
      const encoded = encodeMarkdownToPath(input);
      expect(encoded).toBe(LZString.compressToEncodedURIComponent(input));
    });
  });

  describe('decodeMarkdownFromPath', () => {
    it('should return empty string for empty input', () => {
      expect(decodeMarkdownFromPath('')).toBe('');
      expect(decodeMarkdownFromPath(null)).toBe('');
      expect(decodeMarkdownFromPath(undefined)).toBe('');
    });

    it('should decode valid lz-string correctly', () => {
      const input = 'hello world';
      const encoded = LZString.compressToEncodedURIComponent(input);
      expect(decodeMarkdownFromPath(encoded)).toBe(input);
    });

    it('should handle complex YAML strings', () => {
        const yaml = 'openapi: 3.0.0\ninfo:\n  title: Test\n  version: 1.0.0';
        const encoded = encodeMarkdownToPath(yaml);
        expect(decodeMarkdownFromPath(encoded)).toBe(yaml);
    });

    it('should return decodeURIComponent result if decompressed is null', () => {
      const input = 'a';
      expect(decodeMarkdownFromPath(input)).toBe('a');
    });

    it('should fallback to decodeURIComponent if decompression throws', () => {
      const spy = vi.spyOn(LZString, 'decompressFromEncodedURIComponent').mockImplementation(() => {
        throw new Error('Decompression failed');
      });

      const input = 'some-string';
      expect(decodeMarkdownFromPath(input)).toBe('some-string');

      spy.mockRestore();
    });
  });
});
