// Singleton store for the WebSocket server instance.
// Allows notifier.js and other utilities to broadcast WS events
// without creating circular import dependencies with server.js.

let _wss = null;

export const setWss = (wss) => {
  _wss = wss;
};

export const getWss = () => _wss;
