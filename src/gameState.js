export class GameState {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/update' && request.method === 'POST') {
      const { gameState } = await request.json();
      
      // Store current state
      await this.state.storage.put('currentState', gameState);
      await this.state.storage.put('lastUpdate', Date.now());
      
      return new Response(JSON.stringify({ success: true }));
    }

    if (url.pathname === '/event' && request.method === 'POST') {
      const event = await request.json();
      
      // Add to history
      const history = await this.state.storage.get('history') || [];
      history.push(event);
      
      // Keep last 100 events
      if (history.length > 100) history.shift();
      await this.state.storage.put('history', history);
      
      // Track decisions separately
      if (['migration', 'breeding', 'hiding'].includes(event.eventType)) {
        const decisions = await this.state.storage.get('decisions') || [];
        decisions.push({ type: event.eventType, timestamp: event.timestamp, data: event.data });
        if (decisions.length > 50) decisions.shift();
        await this.state.storage.put('decisions', decisions);
      }
      
      return new Response(JSON.stringify({ success: true }));
    }

    if (url.pathname === '/memory') {
      const history = await this.state.storage.get('history') || [];
      const decisions = await this.state.storage.get('decisions') || [];
      
      return new Response(JSON.stringify({ history, decisions }));
    }

    if (url.pathname === '/state') {
      const currentState = await this.state.storage.get('currentState');
      const history = await this.state.storage.get('history') || [];
      const decisions = await this.state.storage.get('decisions') || [];
      const lastUpdate = await this.state.storage.get('lastUpdate');
      
      return new Response(JSON.stringify({
        currentState,
        history,
        decisions,
        lastUpdate
      }));
    }

    return new Response('Not found', { status: 404 });
  }
}