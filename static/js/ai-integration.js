// ============================================
// FILE: static/js/ai-integration.js
// AI Integration for GooseGameWeb
// ============================================

class GooseAI {
  constructor(apiUrl) {
    // YOUR DEPLOYED WORKER URL
    this.apiUrl = apiUrl || 'https://goose-game-ai.el8403.workers.dev';
    
    this.playerId = this.getOrCreatePlayerId();
    this.updateInterval = null;
    this.isActive = true;
  }

  getOrCreatePlayerId() {
    let id = localStorage.getItem('goose_player_id');
    if (!id) {
      id = 'player_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('goose_player_id', id);
    }
    return id;
  }

  getGameState() {
    if (!window.game) {
      console.warn('Game not loaded yet');
      return null;
    }
    
    const geese = window.game.geese || [];
    const predators = window.game.predators || [];
    
    const adults = geese.filter(g => g.state === 'adult').length;
    const goslings = geese.filter(g => g.state === 'gosling').length;
    const eggs = geese.filter(g => g.state === 'egg').length;
    
    return {
      geese: geese.map(g => ({
        state: g.state,
        health: g.health,
        hiding: g.hiding
      })),
      stats: {
        total: geese.length,
        adults: adults,
        goslings: goslings,
        eggs: eggs
      },
      climate: {
        zone: 'Temperate',
        lat: 45,
        survivalModifier: 1.0
      },
      weather: 'sunny',
      predators: predators.length,
      day: Math.floor((window.game.gameTime || 0) / 60),
      score: window.game.score || 0,
      gameTime: window.game.gameTime || 0
    };
  }

  async getNarration() {
    const el = document.getElementById('narrator-text');
    if (!el || !this.isActive) return;
    
    try {
      const gameState = this.getGameState();
      if (!gameState) {
        el.textContent = 'Waiting for game to start...';
        return;
      }
      
      const response = await fetch(`${this.apiUrl}/api/narrator?playerId=${this.playerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const { narration } = await response.json();
      
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = narration;
        el.className = '';
        el.style.opacity = '1';
      }, 200);
      
    } catch (error) {
      console.error('AI Narration error:', error);
      el.textContent = 'The narrator is taking a break... 🤔';
      el.className = '';
    }
  }

  async getAdvice() {
    const el = document.getElementById('advice-text');
    if (!el || !this.isActive) return;
    
    try {
      const gameState = this.getGameState();
      if (!gameState) {
        el.textContent = 'Waiting for game data...';
        return;
      }
      
      const response = await fetch(`${this.apiUrl}/api/advice?playerId=${this.playerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const { advice } = await response.json();
      
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = advice;
        el.className = '';
        el.style.opacity = '1';
      }, 200);
      
    } catch (error) {
      console.error('AI Advice error:', error);
      el.textContent = 'Unable to provide advice right now.';
      el.className = '';
    }
  }

  async getAdviceNow() {
    const el = document.getElementById('advice-text');
    if (!el) return;
    
    el.className = 'ai-loading';
    el.textContent = 'Thinking...';
    await this.getAdvice();
  }

  async trackEvent(eventType, data) {
    if (!this.isActive) return;
    
    try {
      await fetch(`${this.apiUrl}/api/game-event?playerId=${this.playerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventType, 
          data,
          timestamp: Date.now()
        })
      });
      console.log(`Tracked event: ${eventType}`, data);
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  }

  toggleAI() {
    this.isActive = !this.isActive;
    const statusEl = document.getElementById('ai-status-text');
    
    if (this.isActive) {
      statusEl.textContent = 'Active';
      this.start();
      console.log('🤖 AI Enabled');
    } else {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      statusEl.textContent = 'Paused';
      
      document.getElementById('narrator-text').textContent = 'AI paused';
      document.getElementById('advice-text').textContent = 'AI paused';
      console.log('⏸️ AI Paused');
    }
  }

  start() {
    console.log('🚀 Starting Goose AI...');
    console.log('Worker URL:', this.apiUrl);
    
    setTimeout(() => this.getNarration(), 3000);
    setTimeout(() => this.getAdvice(), 8000);
    
    if (this.updateInterval) clearInterval(this.updateInterval);
    
    this.updateInterval = setInterval(() => {
      if (this.isActive) {
        this.getNarration();
        
        if (Math.random() > 0.5) {
          this.getAdvice();
        }
      }
    }, 45000);
  }
}

window.addEventListener('load', () => {
  console.log('🦢 Goose Game loading...');
  
  setTimeout(() => {
    if (window.game) {
      window.gooseAI = new GooseAI();
      window.gooseAI.start();
      console.log('✅ Goose AI Ready!');
    } else {
      console.warn('⚠️ Game not found, AI features disabled');
    }
  }, 3000);
});