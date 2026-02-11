export const MAX_STRING_LENGTH = 50;

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
    if (typeof text === 'string' && text.trim().startsWith('<') && typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length === 0) {
          const result = {};
          result[xmlDoc.documentElement.nodeName] = xmlToJson(xmlDoc.documentElement);
          return result;
        }
      } catch (xmlError) {
        // Fallback to raw text
      }
    }
    return text;
  }
};

export const formatResponseTime = (ms) => {
  return `${Math.round(ms)} ms`;
};

const xmlToJson = (node) => {
  const obj = {};

  // Attributes
  if (node.attributes && node.attributes.length > 0) {
    obj["@attributes"] = {};
    for (let j = 0; j < node.attributes.length; j++) {
      const attr = node.attributes.item(j);
      obj["@attributes"][attr.nodeName] = attr.nodeValue;
    }
  }

  // Children
  if (node.hasChildNodes()) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes.item(i);
      const nodeName = child.nodeName;

      if (child.nodeType === 3) { // Text node
        const text = child.nodeValue.trim();
        if (text) {
          // If this is the only child and no attributes, just return the text
          if (node.childNodes.length === 1 && (!node.attributes || node.attributes.length === 0)) {
            return text;
          }
          if (typeof obj["#text"] === "undefined") {
            obj["#text"] = text;
          } else {
            obj["#text"] += text;
          }
        }
      } else if (child.nodeType === 1) { // Element node
        const childValue = xmlToJson(child);
        if (typeof obj[nodeName] === "undefined") {
          obj[nodeName] = childValue;
        } else {
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]];
          }
          obj[nodeName].push(childValue);
        }
      }
    }
  }

  return Object.keys(obj).length === 0 ? "" : obj;
};
