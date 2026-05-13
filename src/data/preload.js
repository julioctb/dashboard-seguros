(function() {
  const config = window.PORTAL_BACKEND_CONFIG || {};
  if (config.type === 'supabase' || config.seedFromPreload === false) return;
  const PRELOAD_KEY = 'bienestar_seguimiento_v5_2';
  try {
    if (!localStorage.getItem(PRELOAD_KEY) && typeof PRELOAD_STATE_SNAPSHOT === 'object') {
      localStorage.setItem(PRELOAD_KEY, JSON.stringify(PRELOAD_STATE_SNAPSHOT));
    }
  } catch (error) {
    console.error('Error al precargar datos:', error);
  }
})();
