import { describe, it, expect, vi } from 'vitest';
import { parseOpenAPI } from '../src/utils/openapiParser';

describe('openapiParser', () => {
  it('should parse valid OpenAPI YAML', () => {
    const yaml = `
openapi: 3.0.0
servers:
  - url: https://api.example.com
paths:
  /users:
    get:
      summary: Get users
    post:
      summary: Create user
`;
    const result = parseOpenAPI(yaml);
    expect(result.baseUrls).toContain('https://api.example.com');
    expect(result.endpoints).toHaveLength(2);
    expect(result.endpoints).toContainEqual({ path: '/users', method: 'GET' });
    expect(result.endpoints).toContainEqual({ path: '/users', method: 'POST' });
  });

  it('should handle missing servers and paths', () => {
    const yaml = 'openapi: 3.0.0';
    const result = parseOpenAPI(yaml);
    expect(result.baseUrls).toEqual(['']);
    expect(result.endpoints).toEqual([]);
  });

  it('should ignore non-HTTP methods and parameters', () => {
    const yaml = `
openapi: 3.0.0
paths:
  /users:
    get:
      summary: Get users
    parameters:
      - name: id
        in: query
    summary: User endpoints
`;
    const result = parseOpenAPI(yaml);
    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0]).toEqual({ path: '/users', method: 'GET' });
  });

  it('should handle all supported HTTP methods', () => {
    const yaml = `
openapi: 3.0.0
paths:
  /test:
    get: {}
    post: {}
    put: {}
    delete: {}
    patch: {}
    options: {}
    head: {}
`;
    const result = parseOpenAPI(yaml);
    const methods = result.endpoints.map(e => e.method);
    expect(methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']);
  });

  it('should return error for invalid YAML syntax', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const yaml = 'invalid: : yaml';
    const result = parseOpenAPI(yaml);
    expect(result.error).toBeDefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should return error for empty YAML', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = parseOpenAPI('');
    expect(result.error).toBe('Invalid YAML');
    spy.mockRestore();
  });

  it('should return error for null YAML', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = parseOpenAPI('null');
    expect(result.error).toBe('Invalid YAML');
    spy.mockRestore();
  });

  it('should return error for non-object YAML', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = parseOpenAPI('42');
    expect(result.error).toBe('Invalid YAML');
    spy.mockRestore();
  });
});
