export { GameState } from './gameState.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Get or create durable object for this player
      const playerId = url.searchParams.get('playerId') || 'default';
      const id = env.GAME_STATE.idFromName(playerId);
      const stub = env.GAME_STATE.get(id);

      // Route to appropriate endpoint
      if (url.pathname === '/api/narrator') {
        return await handleNarrator(request, env, stub, corsHeaders);
      } else if (url.pathname === '/api/advice') {
        return await handleAdvice(request, env, stub, corsHeaders);
      } else if (url.pathname === '/api/game-event') {
        return await handleGameEvent(request, stub, corsHeaders);
      } else if (url.pathname === '/api/state') {
        return await handleGetState(stub, corsHeaders);
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Replace the handleNarrator function in src/worker.js
async function handleNarrator(request, env, stub, corsHeaders) {
  const { gameState } = await request.json();
  
  await stub.fetch(new Request('http://internal/update', {
    method: 'POST',
    body: JSON.stringify({ gameState })
  }));

  const memoryResponse = await stub.fetch('http://internal/memory');
  const { history } = await memoryResponse.json();

  // Build detailed context
  const { stats, climate, predators, day, score } = gameState;
  
  // Check for dramatic events
  const recentDeaths = history.filter(e => 
    e.eventType === 'death' && Date.now() - e.timestamp < 30000
  ).length;
  
  const recentBreeding = history.filter(e => 
    e.eventType === 'breeding' && Date.now() - e.timestamp < 30000
  ).length;

  let situation = `Day ${day}, Score ${score}. Flock: ${stats.adults} adults, ${stats.goslings} goslings, ${stats.eggs} eggs. `;
  situation += `Climate: ${climate.zone} (${climate.lat.toFixed(1)}°N). `;
  
  if (predators > 0) situation += `${predators} predators hunting! `;
  if (recentDeaths > 0) situation += `${recentDeaths} casualties just occurred! `;
  if (recentBreeding > 0) situation += `${recentBreeding} eggs just laid! `;
  if (stats.total === 0) situation += `FLOCK EXTINCT! `;
  else if (stats.total > 20) situation += `Flock thriving! `;
  else if (stats.total < 5) situation += `Flock struggling! `;

  const messages = [
    {
      role: "system",
      content: "You are David Attenborough narrating a nature documentary about migrating geese. Be dramatic, witty, and brief (under 40 words). Focus on what's ACTUALLY happening right now - predators, deaths, births, migration, survival. Make it exciting and specific to the current situation. Use vivid imagery."
    },
    {
      role: "user",
      content: situation
    }
  ];

  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages,
    max_tokens: 80,
    temperature: 0.9
  });

  return new Response(JSON.stringify({ narration: response.response || "The geese continue their journey..." }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Replace the handleAdvice function in src/worker.js
async function handleAdvice(request, env, stub, corsHeaders) {
  const { gameState } = await request.json();

  const memoryResponse = await stub.fetch('http://internal/memory');
  const { history, decisions } = await memoryResponse.json();

  const { stats, climate, predators, day } = gameState;
  
  // Analyze what's actually needed
  let problems = [];
  let context = `Current State:\n`;
  context += `- Flock: ${stats.adults} adults, ${stats.goslings} goslings, ${stats.eggs} eggs (${stats.total} total)\n`;
  context += `- Location: ${climate.zone} at ${climate.lat.toFixed(1)}°N (survival modifier: ${climate.survivalModifier}x)\n`;
  context += `- Predators: ${predators}\n`;
  context += `- Day: ${day}\n\n`;
  
  // Identify real problems
  if (predators > stats.total) problems.push("predators outnumber flock");
  if (stats.total < 3) problems.push("flock near extinction");
  if (climate.survivalModifier < 0.8) problems.push("harsh climate reducing survival");
  if (climate.survivalModifier === 1.0 && climate.lat !== 45) problems.push("already in optimal climate");
  if (stats.adults < 2) problems.push("not enough adults to breed");
  if (stats.adults > 10 && stats.eggs === 0) problems.push("should breed more");
  
  const recentMigrations = decisions.filter(d => 
    d.type === 'migration' && Date.now() - d.timestamp < 120000
  ).length;
  
  if (recentMigrations > 2) problems.push("migrating too frequently");
  
  context += `Problems detected: ${problems.join(", ") || "none"}\n\n`;
  context += `TASK: Give ONE specific, actionable tip for the player's current situation. Be direct and explain WHY. Under 50 words.`;

  const messages = [
    {
      role: "system",
      content: "You are an expert ecologist advising on goose migration strategy. Analyze the ACTUAL situation and give ONE specific tip that addresses the REAL problem. Optimal latitude is 35-50°N (100% survival). Consider: population size, climate zone, predator count, breeding needs. Be direct and tactical."
    },
    {
      role: "user",
      content: context
    }
  ];

  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages,
    max_tokens: 100,
    temperature: 0.7
  });

  return new Response(JSON.stringify({ advice: response.response || "Monitor your flock's survival rate." }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Track game events
async function handleGameEvent(request, stub, corsHeaders) {
  const { eventType, data } = await request.json();
  
  await stub.fetch(new Request('http://internal/event', {
    method: 'POST',
    body: JSON.stringify({ eventType, data, timestamp: Date.now() })
  }));

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Get current state
async function handleGetState(stub, corsHeaders) {
  const response = await stub.fetch('http://internal/state');
  const state = await response.json();
  
  return new Response(JSON.stringify(state), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Build narrator context
function buildNarratorContext(gameState, history) {
  const { geese, climate, weather, predators, day } = gameState;
  
  const adults = geese.filter(g => g.stage === 'adult').length;
  const goslings = geese.filter(g => g.stage === 'gosling').length;
  const eggs = geese.filter(g => g.stage === 'egg').length;
  
  const recentDeaths = history.filter(e => 
    e.eventType === 'death' && Date.now() - e.timestamp < 60000
  ).length;

  let context = `Day ${day}. Flock: ${adults} adults, ${goslings} goslings, ${eggs} eggs. `;
  context += `Climate: ${climate.zone} (${climate.lat.toFixed(1)}°N). `;
  context += `Weather: ${weather}. `;
  
  if (predators > 0) context += `${predators} predators nearby! `;
  if (recentDeaths > 0) context += `${recentDeaths} recent casualties. `;
  
  const avgEnergy = geese.reduce((sum, g) => sum + (g.energy || 100), 0) / geese.length;
  context += `Average energy: ${avgEnergy.toFixed(0)}%.`;
  
  return context;
}

// Build advice context
function buildAdviceContext(gameState, history, decisions) {
  const { geese, climate, weather, predators, day } = gameState;
  
  const adults = geese.filter(g => g.stage === 'adult').length;
  const avgEnergy = geese.reduce((sum, g) => sum + (g.energy || 100), 0) / geese.length;
  
  const recentMigrations = decisions.filter(d => 
    d.type === 'migration' && Date.now() - d.timestamp < 300000
  ).length;

  let context = `ANALYSIS REQUEST:\n`;
  context += `Current State: ${adults} adults, ${geese.length} total geese\n`;
  context += `Location: ${climate.zone} at ${climate.lat.toFixed(1)}°N\n`;
  context += `Survival modifier: ${climate.survivalModifier}x\n`;
  context += `Average energy: ${avgEnergy.toFixed(0)}%\n`;
  context += `Weather: ${weather}\n`;
  context += `Predators: ${predators}\n`;
  context += `Day: ${day}\n`;
  context += `Recent migrations: ${recentMigrations}\n\n`;
  context += `What should the player do next? Give ONE specific tip.`;
  
  return context;
}