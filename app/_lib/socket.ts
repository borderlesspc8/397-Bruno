// Sistema de eventos para atualizações em tempo real
// Usa eventos DOM personalizados em vez de WebSockets

// Cliente é um singleton para compartilhar o mesmo sistema de eventos
class EventsClient {
  private static instance: EventsClient;
  private listeners: Record<string, Function[]> = {};
  private connected: boolean = true;

  // Singleton pattern
  static getInstance(): EventsClient {
    if (!EventsClient.instance) {
      EventsClient.instance = new EventsClient();
    }
    return EventsClient.instance;
  }

  // Simular conexão
  isConnected(): boolean {
    return this.connected;
  }

  // Registrar ouvinte para um evento
  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Também registrar ouvinte DOM para eventos externos
    if (typeof window !== 'undefined') {
      window.addEventListener(`custom-${event}`, ((e: CustomEvent) => {
        callback(e.detail);
      }) as EventListener);
    }
  }

  // Remover ouvinte de um evento
  off(event: string, callback: Function): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      listener => listener !== callback
    );

    // Também remover ouvinte DOM
    if (typeof window !== 'undefined') {
      window.removeEventListener(`custom-${event}`, ((e: CustomEvent) => {
        callback(e.detail);
      }) as EventListener);
    }
  }

  // Emitir evento
  emit(event: string, data: any): void {
    // Emitir para ouvintes registrados internamente
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }

    // Emitir evento DOM para outros componentes
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent(`custom-${event}`, {
        detail: data
      });
      window.dispatchEvent(customEvent);
    }
  }
}

// Exportar funções para usar o cliente de eventos
export const getEventsClient = () => {
  if (typeof window === 'undefined') return null;
  return EventsClient.getInstance();
}; 
