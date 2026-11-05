// Real-time client: opens an SSE stream to the backend and dispatches a global
// "moai:live-change" event whenever a v2 collection changes, so components can
// re-fetch and render live without polling or manual refresh.
let es = null;

export function initLiveStream() {
  if (typeof window === 'undefined') return;
  if (es) return;
  try {
    es = new EventSource('/api/stream');
    es.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data || '{}');
        window.dispatchEvent(new CustomEvent('moai:live-change', {
          detail: { collection: payload.collection || null, at: payload.at || Date.now() }
        }));
      } catch {
        window.dispatchEvent(new CustomEvent('moai:live-change', { detail: { collection: null } }));
      }
    };
    es.onerror = () => { /* EventSource reconnects automatically */ };
  } catch (err) {
    console.debug('[live] unable to open stream', err);
  }
}

export function closeLiveStream() {
  if (es) { es.close(); es = null; }
}