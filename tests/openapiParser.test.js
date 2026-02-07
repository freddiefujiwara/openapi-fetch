import { describe, it, expect } from 'vitest';
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

  it('should return error for invalid YAML', () => {
    const yaml = 'invalid: : yaml';
    const result = parseOpenAPI(yaml);
    expect(result.error).toBeDefined();
  });
});
