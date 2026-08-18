const APP_VERSION = '2.3.0';

const versionTargets = document.querySelectorAll('[data-app-version]');
versionTargets.forEach(el => { el.textContent = `v${APP_VERSION}`; });

let fatalShown = false;
function showFatalError(error) {
  if (fatalShown) return;
  fatalShown = true;
  console.error('Prismfall failed to start:', error);
  const overlay = document.getElementById('errorOverlay');
  if (!overlay) return;
  const detail = overlay.querySelector('[data-error-detail]');
  if (detail) detail.textContent = 'The game hit an unexpected browser error. Your saved progress is stored separately and should remain intact.';
  overlay.classList.add('visible');
}

window.addEventListener('error', event => showFatalError(event.error || event.message));
window.addEventListener('unhandledrejection', event => showFatalError(event.reason));

document.getElementById('reloadGameBtn')?.addEventListener('click', () => location.reload());

try {
  await import('./game.js');
} catch (error) {
  showFatalError(error);
}
