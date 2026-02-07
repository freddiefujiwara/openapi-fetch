export const MAX_STRING_LENGTH = 100;

export const truncateString = (data, maxLength = MAX_STRING_LENGTH) => {
  if (typeof data === 'string' && data.length > maxLength) {
    return data.substring(0, maxLength) + '...';
  }
  return data;
};

export const truncateStringReplacer = (key, value, maxLength = MAX_STRING_LENGTH) => {
  return truncateString(value, maxLength);
};

export const buildUrl = (baseUrl, path, queryParams, queryParamsValues) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${normalizedBaseUrl}${normalizedPath}`;

  const searchParams = new URLSearchParams();
  queryParams.forEach(param => {
    const value = queryParamsValues[param.name];
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(param.name, value);
    }
  });

  const queryString = searchParams.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }
  return url;
};

export const parseResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
};
