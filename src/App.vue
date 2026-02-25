<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { parseOpenAPI } from './utils/openapiParser';
import { truncateString, truncateStringReplacer, buildUrl, parseResponse, MAX_STRING_LENGTH, formatResponseTime } from './utils/apiUtils';
import { decodeMarkdownFromPath, encodeMarkdownToPath } from './utils/compression';

const route = useRoute();
const router = useRouter();

const DEFAULT_YAML = `openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
servers:
  - url: https://jsonplaceholder.typicode.com
paths:
  /posts:
    get:
      summary: Get posts
    post:
      summary: Create post
  /posts/1:
    get:
      summary: Get post 1
`;

const yamlContent = ref(DEFAULT_YAML);

const parsedData = ref({ baseUrls: [], endpoints: [] });
const selectedBaseUrl = ref('');
const selectedPath = ref('');
const selectedMethod = ref('');
const queryParamsValues = ref({});
const responseData = ref('');
const responseTime = ref(null);
const isLoading = ref(false);

const currentQueryParams = computed(() => {
  const endpoint = parsedData.value.endpoints.find(
    ep => ep.path === selectedPath.value && ep.method === selectedMethod.value
  );
  return endpoint ? endpoint.queryParams : [];
});

const uniquePaths = computed(() => {
  return [...new Set(parsedData.value.endpoints.map(ep => ep.path))];
});

const availableMethods = computed(() => {
  return parsedData.value.endpoints
    .filter(ep => ep.path === selectedPath.value)
    .map(ep => ep.method);
});

const updateParsedData = () => {
  const result = parseOpenAPI(yamlContent.value);
  parsedData.value = result;

  if (result.baseUrls.length > 0 && !result.baseUrls.includes(selectedBaseUrl.value)) {
    selectedBaseUrl.value = result.baseUrls[0];
  }

  const paths = [...new Set(result.endpoints.map(ep => ep.path))];
  if (paths.length > 0 && !paths.includes(selectedPath.value)) {
    selectedPath.value = paths[0];
  } else if (paths.length === 0) {
    selectedPath.value = '';
  }
};

// Initial parse
updateParsedData();

watch(yamlContent, (newValue) => {
  updateParsedData();
  const compressed = encodeMarkdownToPath(newValue);
  if (route.params.compressedData !== compressed) {
    router.replace({ params: { compressedData: compressed } });
  }
});

watch(() => route.params.compressedData, (newVal) => {
  const decoded = newVal ? decodeMarkdownFromPath(newVal) : DEFAULT_YAML;
  if (decoded && decoded !== yamlContent.value) {
    yamlContent.value = decoded;
  }
}, { immediate: true });

watch(selectedPath, (newPath) => {
  const methods = parsedData.value.endpoints
    .filter(ep => ep.path === newPath)
    .map(ep => ep.method);
  if (methods.length > 0 && !methods.includes(selectedMethod.value)) {
    selectedMethod.value = methods[0];
  } else if (methods.length === 0) {
    selectedMethod.value = '';
  }
}, { immediate: true });

const executeRequest = async () => {
  if (!selectedPath.value || !selectedMethod.value || !selectedBaseUrl.value) return;

  isLoading.value = true;
  responseData.value = 'Loading...';
  responseTime.value = null;

  const method = selectedMethod.value;
  const url = buildUrl(selectedBaseUrl.value, selectedPath.value, currentQueryParams.value, queryParamsValues.value);

  console.log(`Executing ${method} request to: ${url}`);

  const startTime = performance.now();

  // JSONP support
  const callbackName = queryParamsValues.value['callback'];
  if (callbackName && callbackName.trim().length > 0 && method === 'GET') {
    const name = callbackName.trim();
    const script = document.createElement('script');

    window[name] = (data) => {
      const endTime = performance.now();
      responseTime.value = formatResponseTime(endTime - startTime);
      responseData.value = JSON.stringify(data, truncateStringReplacer, 2);
      isLoading.value = false;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[name];
    };

    script.src = url;
    script.onerror = () => {
      const endTime = performance.now();
      responseTime.value = formatResponseTime(endTime - startTime);
      responseData.value = 'JSONP Error: Failed to load script.';
      isLoading.value = false;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[name];
    };
    document.body.appendChild(script);
    return;
  }

  try {
    let res;
    if (method === 'GET') {
      // Simplest possible fetch for GET to avoid CORS preflight
      res = await fetch(url);
    } else {
      res = await fetch(url, { method });
    }

    const responseText = await res.text();
    const endTime = performance.now();
    responseTime.value = formatResponseTime(endTime - startTime);

    const data = parseResponse(responseText);

    if (!res.ok) {
      responseData.value = JSON.stringify({
        status: res.status,
        statusText: res.statusText,
        data: data,
      }, truncateStringReplacer, 2);
    } else {
      if (typeof data === 'object') {
        responseData.value = JSON.stringify(data, truncateStringReplacer, 2);
      } else {
        responseData.value = truncateString(data);
      }
    }
  } catch (error) {
    const endTime = performance.now();
    responseTime.value = formatResponseTime(endTime - startTime);
    console.error('Fetch Error:', error);
    responseData.value = `Fetch Error: ${error.message}\nCheck console for details.`;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="layout">
    <header class="header">
      <h1>openapi-fetch</h1>
    </header>

    <div class="main-content">
      <div class="pane left-pane">
        <div class="table-wrap">
          <h3>OpenAPI YAML Editor</h3>
          <textarea
            v-model="yamlContent"
            placeholder="Paste your OpenAPI YAML here..."
          ></textarea>
        </div>
      </div>

      <div class="pane right-pane">
        <div class="table-wrap">
          <h3>Control Panel</h3>

          <div class="form-group">
            <label>Base URL:</label>
            <select v-model="selectedBaseUrl">
              <option v-for="url in parsedData.baseUrls" :key="url" :value="url">
                {{ url }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Path:</label>
            <select v-model="selectedPath">
              <option v-for="path in uniquePaths" :key="path" :value="path">
                {{ path }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Method:</label>
            <select v-model="selectedMethod">
              <option v-for="method in availableMethods" :key="method" :value="method">
                {{ method }}
              </option>
            </select>
          </div>

          <div v-for="param in currentQueryParams" :key="param.name" class="form-group">
            <label>{{ param.name }} <span v-if="param.required" class="required">*</span> ({{ param.schema?.type || 'string' }}):</label>
            <div v-if="param.description" class="param-desc">{{ param.description }}</div>

            <select v-if="param.schema?.enum" v-model="queryParamsValues[param.name]">
              <option value="">-- Select --</option>
              <option v-for="val in param.schema.enum" :key="val" :value="val">
                {{ val }}
              </option>
            </select>

            <input v-else
              :type="param.schema?.type === 'number' || param.schema?.type === 'integer' ? 'number' : 'text'"
              v-model="queryParamsValues[param.name]"
              :placeholder="param.required ? 'Required' : ''"
            />
          </div>

          <button @click="executeRequest" :disabled="!selectedPath || !selectedMethod || isLoading">
            {{ isLoading ? 'Executing...' : 'Execute' }}
          </button>

          <div v-if="parsedData.error" class="error-msg">
            YAML Parse Error: {{ parsedData.error }}
          </div>
        </div>

        <div class="table-wrap response-area">
          <h3>
            Response Area
            <span v-if="responseTime" class="response-time">({{ responseTime }})</span>
          </h3>
          <pre>{{ responseData }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.pane {
  flex: 1;
  min-width: 0;
}

h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: var(--text);
  font-size: 1.1rem;
}

textarea {
  width: 100%;
  min-height: 500px;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--muted);
}

.form-group select,
.form-group input {
  width: 100%;
}

.param-desc {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 4px;
}

.required {
  color: var(--error);
}

button {
  width: 100%;
}

.response-area {
  background-color: var(--surface-elevated);
}

.response-time {
  font-size: 14px;
  font-weight: normal;
  color: var(--muted);
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 13px;
  color: var(--text);
}

.error-msg {
  color: var(--error);
  margin-top: 10px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .pane {
    width: 100%;
  }

  textarea {
    min-height: 200px;
  }
}
</style>
