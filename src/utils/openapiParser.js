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

    for (const [path, methods] of Object.entries(paths)) {
      for (const method of Object.keys(methods)) {
        // Simple check to exclude non-HTTP methods like 'parameters' or 'summary'
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
          endpoints.push({
            path,
            method: method.toUpperCase()
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
