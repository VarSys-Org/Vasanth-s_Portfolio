import { makeParticleModel } from './particle-model.js';
const viewer = document.querySelector('three-live');
const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const labels = ['Core sphere', 'Orbit rings', 'Year dial', 'Perspective floor', 'Speedometer'];
let stage = 0;
let renderedStage = 0;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let initialized = false;
const count = matchMedia('(min-width: 1024px)').matches ? 6000 : 4200;
let request = 0;
const motion = document.querySelector('#motion');
function updateMotion() { motion.textContent = paused ? 'Enable transitions' : 'Disable transitions'; }
async function render() {
  const current = ++request;
  status.textContent = 'Preparing ' + labels[stage] + '...';
  retry.hidden = true;
  document.querySelectorAll('nav button, #motion').forEach(b => b.disabled = true);
  try {
    const model = makeParticleModel(count, renderedStage, stage, paused);
    const aspect = viewer.clientWidth / viewer.clientHeight;
    const horizontal = [1.9, 3.4, 2.8, 6.2, 2.6][stage];
    const vertical = [1.9, 2.6, 2.8, 2.2, 2.6][stage];
    const distance = Math.max(6.5, 1.1 * Math.max(vertical, horizontal / aspect) / Math.tan(Math.PI / 8));
    viewer.setAttribute('camera-target', '0m 0m 0m');
    viewer.setAttribute('camera-orbit', '0deg 0deg ' + distance + 'm');
    viewer.setAttribute('autoplay', '');
    await viewer.loadModel(model);
    viewer.resetCamera();
    // CDN loader initializes animations to [], preventing its animation plugin
    // from parsing weight tracks. Use the bundle's parser until upstream fixes it.
    const runtime = viewer.viewer;
    if (!runtime.animations.length && runtime.gltf.animations?.length) {
      const view = new DataView(model);
      const binaryHeader = 20 + view.getUint32(12, true);
      const binary = model.slice(binaryHeader + 8);
      runtime.animations = window.ThreeLiveBundle.parseAnimations(runtime.gltf, binary);
    }
    if (paused) viewer.pause();
    else viewer.play();
    if (request !== current) return;
    status.textContent = labels[stage] + ' ready. ' + count.toLocaleString() + ' GPU particles.';
    viewer.dataset.stage = String(stage);
    viewer.dataset.ready = 'true';
    renderedStage = stage;
  } catch (error) {
    status.textContent = 'Scene failed: ' + error.message;
    retry.hidden = false;
    viewer.dataset.ready = 'false';
  } finally {
    document.querySelectorAll('nav button, #motion').forEach(b => b.disabled = false);
  }
}
labels.forEach((label, index) => {
  const button = document.createElement('button');
  button.textContent = label;
  button.setAttribute('aria-pressed', String(index === stage));
  button.addEventListener('click', () => {
    stage = index;
    document.querySelectorAll('nav button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === stage)));
    render();
  });
  document.querySelector('nav').append(button);
});
motion.addEventListener('click', () => { paused = !paused; updateMotion(); render(); });
retry.addEventListener('click', () => initialized ? render() : location.reload());
updateMotion();
try {
  await import('./vendor/three-live.min.js');
  customElements.get('three-live').sandboxEngineSrc = new URL('./vendor/three-live.min.js', import.meta.url).href;
  await customElements.whenDefined('three-live');
  initialized = true;
  await render();
} catch (error) { status.textContent = 'Loading failed: ' + error.message; retry.hidden = false; }

