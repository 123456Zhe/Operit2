// Responsive editor chrome; no persistence or device rendering here.
const $ = selector => document.querySelector(selector);
const mobile = matchMedia('(max-width:760px)');
let activeTab = 'properties';
export function showPanel(name, scroll = false) {
  document.body.dataset.panel = name;
  if (['properties', 'layers', 'device'].includes(name)) activeTab = name;
  document.querySelectorAll('.inspector [data-pane]').forEach(pane => pane.hidden = pane.dataset.pane !== activeTab);
  document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === activeTab)));
  document.querySelectorAll('[data-mobile-panel]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mobilePanel === name)));
  if (scroll && mobile.matches) {
    const target = name === 'canvas' ? $('.preview') : $(`[data-pane="${name}"]`);
    target?.scrollIntoView({block: 'start', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth'});
  }
}
document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => showPanel(button.dataset.tab));
document.querySelectorAll('[data-mobile-panel]').forEach(button => button.onclick = () => showPanel(button.dataset.mobilePanel, true));
$('#inspect-node').onclick = () => showPanel('properties', true);
window.addEventListener('operit-component-added', () => { if (mobile.matches) showPanel('canvas', true); });
function fitCanvas() {
  const stage = $('.stage'), style = getComputedStyle(stage);
  const available = Math.max(100, stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 10);
  const value = $('#zoom').value;
  const fit = Math.min(available / 320, mobile.matches ? 2 : Math.max(0.3, (stage.clientHeight - 100) / 240), 3);
  $('.device').style.setProperty('--scale', value === 'auto' ? fit : Number(value));
}
$('#zoom').addEventListener('change', fitCanvas);
new ResizeObserver(fitCanvas).observe($('.stage'));
mobile.addEventListener('change', () => { showPanel(mobile.matches ? 'canvas' : activeTab); fitCanvas(); });
showPanel('canvas');
fitCanvas();
