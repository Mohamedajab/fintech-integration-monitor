const services = document.querySelector('#services');
const refreshButton = document.querySelector('#refresh');
const totalCount = document.querySelector('#total-count');
const healthyCount = document.querySelector('#healthy-count');
const attentionCount = document.querySelector('#attention-count');
const lastChecked = document.querySelector('#last-checked');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderCard(result, history) {
  const card = element('article', 'service-card');
  const top = element('div', 'card-top');
  const identity = element('div');
  identity.append(element('h3', 'service-name', result.name), element('p', 'service-id', result.id));
  top.append(identity, element('span', `badge ${result.status}`, result.status));

  const metric = element('div', 'metric');
  metric.append(element('strong', '', String(result.latencyMs)), element('span', '', 'ms response'));

  const sparkline = element('div', 'sparkline');
  sparkline.setAttribute('aria-label', `Recent latency for ${result.name}`);
  [...history].reverse().forEach((point) => {
    const bar = element('i', point.status);
    const height = Math.min(100, Math.max(14, point.latencyMs / 12));
    bar.style.setProperty('--height', `${height}%`);
    bar.title = `${point.latencyMs} ms — ${point.status}`;
    sparkline.append(bar);
  });

  card.append(top, metric, sparkline);
  if (result.error) card.append(element('p', 'error', result.error));
  return card;
}

async function loadStatus() {
  refreshButton.disabled = true;
  refreshButton.classList.add('running');
  try {
    const response = await fetch('/api/status', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Status request failed with HTTP ${response.status}`);
    const payload = await response.json();
    services.replaceChildren(...payload.data.map((item) => renderCard(item, payload.history[item.id] || [item])));
    const healthy = payload.data.filter((item) => item.status === 'healthy').length;
    totalCount.textContent = String(payload.data.length);
    healthyCount.textContent = String(healthy);
    attentionCount.textContent = String(payload.data.length - healthy);
    lastChecked.textContent = `Last checked ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  } catch (error) {
    services.replaceChildren(element('p', 'error', `Unable to load integration status: ${error.message}`));
    lastChecked.textContent = 'Check failed';
  } finally {
    refreshButton.disabled = false;
    refreshButton.classList.remove('running');
  }
}

refreshButton.addEventListener('click', loadStatus);
loadStatus();

