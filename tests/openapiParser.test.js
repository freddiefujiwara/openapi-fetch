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
    expect(result.endpoints).toContainEqual({ path: '/users', method: 'GET', queryParams: [] });
    expect(result.endpoints).toContainEqual({ path: '/users', method: 'POST', queryParams: [] });
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
    expect(result.endpoints[0].path).toBe('/users');
    expect(result.endpoints[0].method).toBe('GET');
    expect(result.endpoints[0].queryParams).toHaveLength(1);
    expect(result.endpoints[0].queryParams[0].name).toBe('id');
  });

  it('should extract query parameters from operation level', () => {
    const yaml = `
openapi: 3.0.0
paths:
  /test:
    get:
      parameters:
        - in: query
          name: t
          schema:
            type: number
          description: Temperature
`;
    const result = parseOpenAPI(yaml);
    expect(result.endpoints[0].queryParams).toHaveLength(1);
    expect(result.endpoints[0].queryParams[0]).toEqual({
      name: 't',
      schema: { type: 'number' },
      description: 'Temperature',
      required: undefined
    });
  });

  it('should extract query parameters from path level', () => {
    const yaml = `
openapi: 3.0.0
paths:
  /test:
    parameters:
      - in: query
        name: p
    get: {}
`;
    const result = parseOpenAPI(yaml);
    expect(result.endpoints[0].queryParams).toHaveLength(1);
    expect(result.endpoints[0].queryParams[0].name).toBe('p');
  });

  it('should override path level parameters with operation level parameters', () => {
    const yaml = `
openapi: 3.0.0
paths:
  /test:
    parameters:
      - in: query
        name: t
        description: Path level
    get:
      parameters:
        - in: query
          name: t
          description: Operation level
`;
    const result = parseOpenAPI(yaml);
    expect(result.endpoints[0].queryParams).toHaveLength(1);
    expect(result.endpoints[0].queryParams[0].description).toBe('Operation level');
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
