import yaml from 'js-yaml';

export function parseOpenAPI(yamlString) {
  try {
    const doc = yaml.load(yamlString);
    if (!doc || typeof doc !== 'object') {
      throw new Error('Invalid YAML');
    }

    const servers = doc.servers || [];
    const baseUrls = servers.map(s => s.url) || [];

    // Fallback if no servers defined
    if (baseUrls.length === 0) {
      baseUrls.push('');
    }

    const paths = doc.paths || {};
    const endpoints = [];

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      const pathParameters = pathItem.parameters || [];

      for (const [method, operation] of Object.entries(pathItem)) {
        // Simple check to exclude non-HTTP methods like 'parameters' or 'summary'
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
          const operationParameters = operation.parameters || [];

          // Combine parameters, operation level takes precedence
          const combinedParams = new Map();
          pathParameters.forEach(p => {
            if (p && p.name && p.in) {
              combinedParams.set(`${p.name}-${p.in}`, p);
            }
          });
          operationParameters.forEach(p => {
            if (p && p.name && p.in) {
              combinedParams.set(`${p.name}-${p.in}`, p);
            }
          });

          const queryParams = Array.from(combinedParams.values())
            .filter(p => p.in === 'query')
            .map(p => ({
              name: p.name,
              description: p.description,
              schema: p.schema,
              required: p.required
            }));

          endpoints.push({
            path,
            method: method.toUpperCase(),
            queryParams
          });
        }
      }
    }

    return {
      baseUrls,
      endpoints
    };
  } catch (e) {
    console.error('Failed to parse OpenAPI:', e);
    return {
      baseUrls: [],
      endpoints: [],
      error: e.message
    };
  }
}
