// Optional trusted host adapter. Inject before app.js when embedding in Operit.
// request({path, method, body}) must return parsed JSON and reject on errors.
export async function request(path, {method = 'GET', body} = {}) {
  if (window.operitHost?.request) return window.operitHost.request({path, method, body});
  const response = await fetch('.' + path, {
    method, headers: body === undefined ? {} : {'Content-Type': 'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `请求失败 (${response.status})`);
  return result;
}
