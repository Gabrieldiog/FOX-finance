// Service worker mínimo: habilita a instalação como app. Sem cache agressivo —
// o Fox é online; a presença do handler de fetch já satisfaz a instalação.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // passthrough: deixa o navegador tratar normalmente.
});
