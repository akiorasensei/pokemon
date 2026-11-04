/**
 * ============================================================================
 * 🎮 POKÉMON BATTLE SIMULATOR - JAVASCRIPT CONTROLLER (app.js)
 * ============================================================================
 * This script integrates with the public PokeAPI (https://pokeapi.co/)
 * to fetch live Pokémon stats, types, and sprites.
 * 
 * It manages the turn-based battle logic and coordinates CSS animation classes
 * so students can see their keyframe animations trigger in real-time!
 * ============================================================================
 */

// --- Global Battle State ---
const state = {
  player: null,
  enemy: null,
  isBusy: false,      // Prevents button spam during animation sequences
  isGameOver: false,
};

// --- In-Memory PokeAPI Cache ---
const pokeCache = new Map();

// --- DOM Element References ---
const elements = {
  // Arena & Stage
  battleStage: document.getElementById('battle-stage'),
  vfxStage: document.getElementById('vfx-stage'),
  specialProjectile: document.getElementById('special-projectile'),
  impactBurst: document.getElementById('impact-burst'),

  // Player Elements
  playerName: document.getElementById('player-name'),
  playerLevel: document.getElementById('player-level'),
  playerTypes: document.getElementById('player-types'),
  playerHpFill: document.getElementById('player-hp-fill'),
  playerHpNumeric: document.getElementById('player-hp-numeric'),
  playerSpriteWrapper: document.getElementById('player-sprite-wrapper'),
  playerSprite: document.getElementById('player-sprite'),
  playerInput: document.getElementById('player-input'),

  // Enemy Elements
  enemyName: document.getElementById('enemy-name'),
  enemyLevel: document.getElementById('enemy-level'),
  enemyTypes: document.getElementById('enemy-types'),
  enemyHpFill: document.getElementById('enemy-hp-fill'),
  enemyHpNumeric: document.getElementById('enemy-hp-numeric'),
  enemySpriteWrapper: document.getElementById('enemy-sprite-wrapper'),
  enemySprite: document.getElementById('enemy-sprite'),
  enemyInput: document.getElementById('enemy-input'),

  // Dialogue & Controls
  dialogueText: document.getElementById('dialogue-text'),
  btnPhysical: document.getElementById('btn-move-physical'),
  btnSpecial: document.getElementById('btn-move-special'),
  btnHeal: document.getElementById('btn-move-heal'),
  btnReset: document.getElementById('btn-reset-battle'),
  btnLoadMatchup: document.getElementById('btn-load-matchup'),
  btnRandomMatchup: document.getElementById('btn-random-matchup'),

  // Animation Lab Drawer
  btnToggleLab: document.getElementById('btn-toggle-lab'),
  btnCloseLab: document.getElementById('btn-close-lab'),
  labDrawer: document.getElementById('lab-drawer'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  labButtons: document.querySelectorAll('.lab-btn'),
};

// ============================================================================
// 1. POKEAPI INTEGRATION
// ============================================================================

/**
 * Cleans student text input into a valid PokeAPI identifier.
 * Handles formats like "Pikachu", "pikachu", "#25", "25", "Mr. Mime", "Tapu Koko", etc.
 */
function sanitizePokemonQuery(input) {
  if (!input) return '';
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')                 // Remove leading '#' (e.g. "#25" -> "25")
    .replace(/\s*\([^)]*\)$/, '')       // Strip autocomplete label "Pikachu (#25)" -> "pikachu"
    .trim()
    .replace(/[\s_.]+/g, '-');          // Convert spaces/dots to hyphens ("mr. mime" -> "mr-mime")
}

/**
 * Marks an input element with an error shake animation if a Pokémon isn't found.
 */
function flashInputError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('input-error');
  void inputEl.offsetWidth; // Force reflow
  inputEl.classList.add('input-error');
  setTimeout(() => inputEl.classList.remove('input-error'), 1200);
}

/**
 * Fetches Pokémon data from PokeAPI or returns cached result.
 * @param {string|number} identifier - Pokémon name or Pokédex number
 * @param {HTMLElement|null} inputEl - The input element to flag if an error occurs
 * @returns {Promise<Object>} Formatted Pokémon object
 */
async function fetchPokemonData(identifier, inputEl = null) {
  const query = sanitizePokemonQuery(identifier);

  if (!query) {
    if (inputEl) flashInputError(inputEl);
    setDialogue(`⚠️ Please type a Pokémon name or Pokédex number!`);
    return createFallbackPokemon('pikachu');
  }

  if (pokeCache.has(query)) {
    return pokeCache.get(query);
  }

  setDialogue(`Searching PokeAPI for "${query}"...`);

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
    if (!response.ok) {
      if (response.status === 404) {
        if (inputEl) flashInputError(inputEl);
        throw new Error(`Pokémon "${query}" not found! Try another name or #ID.`);
      }
      throw new Error(`Failed to fetch ${query}: HTTP ${response.status}`);
    }

    const data = await response.json();

    // Select the best available sprite: Showdown animated gif > Gen 5 animated > Default
    const sprites = data.sprites || {};
    const other = sprites.other || {};
    const animatedSprites = other.showdown || {};
    const versions = sprites.versions || {};
    const gen5 = versions['generation-v'] || {};
    const gen5Sprites = (gen5['black-white'] && gen5['black-white'].animated) || {};
    
    // Choose front/back sprites
    const frontSprite =
      animatedSprites.front_default ||
      gen5Sprites.front_default ||
      sprites.front_default ||
      '';

    const backSprite =
      animatedSprites.back_default ||
      gen5Sprites.back_default ||
      sprites.back_default ||
      frontSprite; // Fallback if no back sprite

    // Extract Stats
    const getStat = (statName) => {
      const item = data.stats.find((s) => s.stat.name === statName);
      return item ? item.base_stat : 50;
    };

    const maxHp = getStat('hp') * 2 + 50; // Scaled for battle fun
    const attack = getStat('attack');
    const defense = getStat('defense');
    const specialAttack = getStat('special-attack');
    const speed = getStat('speed');

    // Extract Types
    const types = data.types.map((t) => t.type.name);

    // Audio Cry (if supported by modern PokeAPI)
    const cryUrl = (data.cries && data.cries.latest) || null;

    const pokemon = {
      id: data.id,
      name: data.name.toUpperCase(),
      types,
      stats: { maxHp, currentHp: maxHp, attack, defense, specialAttack, speed },
      sprites: { front: frontSprite, back: backSprite },
      cryUrl,
    };

    pokeCache.set(query, pokemon);
    return pokemon;
  } catch (error) {
    console.error('PokeAPI Error:', error);
    setDialogue(`⚠️ PokeAPI Error: Could not load "${query}". Check your internet connection.`);
    // Return a safe fallback object so battle continues gracefully
    return createFallbackPokemon(query);
  }
}

/**
 * Fallback generator in case the network fails or offline mode
 */
function createFallbackPokemon(name) {
  return {
    id: 0,
    name: name.toUpperCase(),
    types: ['normal'],
    stats: { maxHp: 120, currentHp: 120, attack: 55, defense: 50, specialAttack: 60, speed: 60 },
    sprites: {
      front: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      back: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
    },
    cryUrl: null,
  };
}

// ============================================================================
// 2. BATTLE INITIALIZATION & UI SYNC
// ============================================================================

/**
 * Initializes and starts a new matchup.
 */
async function loadMatchup(playerName, enemyName) {
  state.isBusy = true;
  state.isGameOver = false;
  setControlsEnabled(false);

  setDialogue('A wild Pokémon appeared! Loading battle data...');

  const [playerData, enemyData] = await Promise.all([
    fetchPokemonData(playerName, elements.playerInput),
    fetchPokemonData(enemyName, elements.enemyInput),
  ]);

  // Clone objects so HP changes don't mutate the cache
  state.player = {
    ...playerData,
    stats: { ...playerData.stats, currentHp: playerData.stats.maxHp },
  };

  state.enemy = {
    ...enemyData,
    stats: { ...enemyData.stats, currentHp: enemyData.stats.maxHp },
  };

  // Render Static Info & Sprites
  renderPokemonInfo();

  // Trigger Entrance Animations (Exercise 2)
  await playEntranceSequence();

  state.isBusy = false;
  setControlsEnabled(true);
  setDialogue(`What will ${state.player.name} do?`);
}

/**
 * Updates UI labels, health bars, and sprites.
 */
function renderPokemonInfo() {
  const { player, enemy } = state;

  // Player UI
  elements.playerName.textContent = player.name;
  elements.playerSprite.src = player.sprites.back || player.sprites.front;
  renderTypeBadges(elements.playerTypes, player.types);
  updateHpBar('player', player.stats.currentHp, player.stats.maxHp);
  if (elements.playerInput) elements.playerInput.value = player.name.toLowerCase();

  // Enemy UI
  elements.enemyName.textContent = enemy.name;
  elements.enemySprite.src = enemy.sprites.front;
  renderTypeBadges(elements.enemyTypes, enemy.types);
  updateHpBar('enemy', enemy.stats.currentHp, enemy.stats.maxHp);
  if (elements.enemyInput) elements.enemyInput.value = enemy.name.toLowerCase();
}

/**
 * Creates colored badges for Pokémon types.
 */
function renderTypeBadges(container, types) {
  container.innerHTML = '';
  types.forEach((type) => {
    const pill = document.createElement('span');
    pill.className = `type-pill type-${type.toLowerCase()}`;
    pill.textContent = type;
    container.appendChild(pill);
  });
}

/**
 * Updates health bar width and dynamic color (green -> yellow -> red).
 */
function updateHpBar(target, current, max) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  const fill = target === 'player' ? elements.playerHpFill : elements.enemyHpFill;
  const numeric = target === 'player' ? elements.playerHpNumeric : elements.enemyHpNumeric;

  fill.style.width = `${percent}%`;
  numeric.textContent = `${Math.ceil(current)} / ${max} HP`;

  // Dynamic CSS classes for color transitions
  fill.classList.remove('warning', 'danger');
  if (percent <= 20) {
    fill.classList.add('danger');
  } else if (percent <= 50) {
    fill.classList.add('warning');
  }
}

/**
 * Updates dialogue text box with retro typewriter feel.
 */
function setDialogue(text) {
  elements.dialogueText.textContent = text;
}

/**
 * Enables or disables action buttons.
 */
function setControlsEnabled(enabled) {
  const isEnabled = enabled && !state.isGameOver;
  elements.btnPhysical.disabled = !isEnabled;
  elements.btnSpecial.disabled = !isEnabled;
  elements.btnHeal.disabled = !isEnabled;
}

// ============================================================================
// 3. CSS ANIMATION CONTROLLER HELPERS
// ============================================================================

/**
 * Helper to safely trigger a CSS animation by adding a class and
 * removing it once the animation completes.
 * @param {HTMLElement} element - The target DOM element
 * @param {string} animationClass - CSS class defined in animations.css
 * @param {number} fallbackDurationMs - Safety timeout if animationend does not fire
 * @returns {Promise<void>} Resolves when animation completes
 */
function triggerAnimation(element, animationClass, fallbackDurationMs = 800) {
  return new Promise((resolve) => {
    element.classList.remove(animationClass);
    // Force DOM reflow to re-trigger keyframes if already applied
    void element.offsetWidth;
    element.classList.add(animationClass);

    let resolved = false;
    const cleanUp = () => {
      if (resolved) return;
      resolved = true;
      element.removeEventListener('animationend', cleanUp);
      clearTimeout(safetyTimer);
      resolve();
    };

    element.addEventListener('animationend', cleanUp, { once: true });
    const safetyTimer = setTimeout(cleanUp, fallbackDurationMs);
  });
}

/**
 * Plays Pokémon Cry sound if available
 */
function playCry(pokemon) {
  if (pokemon && pokemon.cryUrl) {
    try {
      const audio = new Audio(pokemon.cryUrl);
      audio.volume = 0.4;
      audio.play().catch(() => {
        // Autoplay policy fallback
      });
    } catch (e) {
      // Audio playback failed silently
    }
  }
}

/**
 * Plays Entrance Sequence (Exercise 2) and transitions into Idle (Exercise 1)
 */
async function playEntranceSequence() {
  const playerWrapper = elements.playerSpriteWrapper;
  const enemyWrapper = elements.enemySpriteWrapper;

  // Remove any lingering idle animation
  playerWrapper.classList.remove('animate-idle', 'animate-faint', 'animate-victory');
  enemyWrapper.classList.remove('animate-idle', 'animate-faint', 'animate-victory');

  // Trigger entrance keyframes simultaneously
  const p1 = triggerAnimation(playerWrapper, 'animate-entrance', 900);
  const p2 = triggerAnimation(enemyWrapper, 'animate-entrance', 900);

  playCry(state.enemy);

  await Promise.all([p1, p2]);

  // Clean up entrance and switch to continuous idle loop
  playerWrapper.classList.remove('animate-entrance');
  enemyWrapper.classList.remove('animate-entrance');

  playerWrapper.classList.add('animate-idle');
  enemyWrapper.classList.add('animate-idle');
}

// ============================================================================
// 4. BATTLE ACTIONS (PHYSICAL, SPECIAL, HEAL, ENEMY TURN)
// ============================================================================

/**
 * PHYSICAL ATTACK (Tackle / Dash)
 * Demonstrates: .animate-tackle, .animate-damage, and .arena-shake
 */
async function executePlayerPhysicalAttack() {
  if (state.isBusy || state.isGameOver) return;
  state.isBusy = true;
  setControlsEnabled(false);

  setDialogue(`${state.player.name} used Tackle!`);

  // Temporarily suspend idle loop for smooth attack animation
  elements.playerSpriteWrapper.classList.remove('animate-idle');

  // 1. Player Tackles Forward (Exercise 3)
  await triggerAnimation(elements.playerSpriteWrapper, 'animate-tackle', 700);
  elements.playerSpriteWrapper.classList.remove('animate-tackle');
  elements.playerSpriteWrapper.classList.add('animate-idle');

  // 2. Enemy takes hit reaction & Screen Shakes (Exercise 5 & 8)
  const shakePromise = triggerAnimation(elements.battleStage, 'arena-shake', 500);
  const damagePromise = triggerAnimation(elements.enemySpriteWrapper, 'animate-damage', 600);

  // Calculate damage
  const damage = Math.max(15, Math.floor(state.player.stats.attack * 0.4));
  state.enemy.stats.currentHp = Math.max(0, state.enemy.stats.currentHp - damage);
  updateHpBar('enemy', state.enemy.stats.currentHp, state.enemy.stats.maxHp);

  await Promise.all([shakePromise, damagePromise]);
  elements.battleStage.classList.remove('arena-shake');
  elements.enemySpriteWrapper.classList.remove('animate-damage');

  // Check for Enemy KO
  if (state.enemy.stats.currentHp <= 0) {
    await handleEnemyFaint();
    return;
  }

  // Enemy Counter-Attack
  await sleep(600);
  await executeEnemyTurn();
}

/**
 * SPECIAL ATTACK (Elemental Blast / Projectile)
 * Demonstrates: .animate-special, .projectile-shoot, .impact-explode
 */
async function executePlayerSpecialAttack() {
  if (state.isBusy || state.isGameOver) return;
  state.isBusy = true;
  setControlsEnabled(false);

  setDialogue(`${state.player.name} is charging energy for a Special Attack!`);

  // 1. Pokémon charges up energy (Exercise 4)
  elements.playerSpriteWrapper.classList.remove('animate-idle');
  await triggerAnimation(elements.playerSpriteWrapper, 'animate-special', 850);
  elements.playerSpriteWrapper.classList.remove('animate-special');
  elements.playerSpriteWrapper.classList.add('animate-idle');

  setDialogue(`${state.player.name} launched a powerful blast!`);

  // 2. Projectile flies across the stage (Exercise 9)
  await triggerAnimation(elements.specialProjectile, 'projectile-shoot', 750);
  elements.specialProjectile.classList.remove('projectile-shoot');

  // 3. Impact Explosion + White Flash + Screen Shake
  const burstPromise = triggerAnimation(elements.impactBurst, 'impact-explode', 550);
  const critFlashPromise = triggerAnimation(elements.battleStage, 'crit-flash', 350);
  const shakePromise = triggerAnimation(elements.battleStage, 'arena-shake', 500);
  const enemyDamagePromise = triggerAnimation(elements.enemySpriteWrapper, 'animate-damage', 600);

  // Calculate damage (Special attack deals slightly higher damage)
  const damage = Math.max(22, Math.floor(state.player.stats.specialAttack * 0.5));
  state.enemy.stats.currentHp = Math.max(0, state.enemy.stats.currentHp - damage);
  updateHpBar('enemy', state.enemy.stats.currentHp, state.enemy.stats.maxHp);

  await Promise.all([burstPromise, critFlashPromise, shakePromise, enemyDamagePromise]);

  elements.impactBurst.classList.remove('impact-explode');
  elements.battleStage.classList.remove('crit-flash', 'arena-shake');
  elements.enemySpriteWrapper.classList.remove('animate-damage');

  // Check for Enemy KO
  if (state.enemy.stats.currentHp <= 0) {
    await handleEnemyFaint();
    return;
  }

  // Enemy Counter-Attack
  await sleep(600);
  await executeEnemyTurn();
}

/**
 * HEAL ACTION (Potion / Recover)
 * Demonstrates: .animate-heal (Bonus Exercise 10)
 */
async function executePlayerHeal() {
  if (state.isBusy || state.isGameOver) return;
  state.isBusy = true;
  setControlsEnabled(false);

  setDialogue(`${state.player.name} used a Potion to restore HP!`);

  // Healing glow animation
  elements.playerSpriteWrapper.classList.remove('animate-idle');
  const healAnim = triggerAnimation(elements.playerSpriteWrapper, 'animate-heal', 900);

  // Restore 40% of max HP
  const healAmount = Math.floor(state.player.stats.maxHp * 0.4);
  state.player.stats.currentHp = Math.min(state.player.stats.maxHp, state.player.stats.currentHp + healAmount);
  updateHpBar('player', state.player.stats.currentHp, state.player.stats.maxHp);

  await healAnim;
  elements.playerSpriteWrapper.classList.remove('animate-heal');
  elements.playerSpriteWrapper.classList.add('animate-idle');

  // Enemy takes their turn
  await sleep(500);
  await executeEnemyTurn();
}

/**
 * ENEMY AI TURN
 * Enemy chooses an action and retaliates against player!
 */
async function executeEnemyTurn() {
  if (state.isGameOver) return;

  setDialogue(`Enemy ${state.enemy.name} retaliates!`);
  await sleep(400);

  // Randomly choose Tackle or Special Attack
  const isSpecial = Math.random() > 0.5;

  elements.enemySpriteWrapper.classList.remove('animate-idle');

  if (isSpecial) {
    setDialogue(`Enemy ${state.enemy.name} used a Special Strike!`);
    await triggerAnimation(elements.enemySpriteWrapper, 'animate-special', 800);
  } else {
    setDialogue(`Enemy ${state.enemy.name} used Tackle!`);
    await triggerAnimation(elements.enemySpriteWrapper, 'animate-tackle', 700);
  }

  elements.enemySpriteWrapper.classList.remove('animate-tackle', 'animate-special');
  elements.enemySpriteWrapper.classList.add('animate-idle');

  // Player gets hit!
  const playerDamagePromise = triggerAnimation(elements.playerSpriteWrapper, 'animate-damage', 600);
  const shakePromise = triggerAnimation(elements.battleStage, 'arena-shake', 450);

  const incomingDamage = Math.max(12, Math.floor(state.enemy.stats.attack * 0.35));
  state.player.stats.currentHp = Math.max(0, state.player.stats.currentHp - incomingDamage);
  updateHpBar('player', state.player.stats.currentHp, state.player.stats.maxHp);

  await Promise.all([playerDamagePromise, shakePromise]);
  elements.playerSpriteWrapper.classList.remove('animate-damage');
  elements.battleStage.classList.remove('arena-shake');

  // Check for Player KO
  if (state.player.stats.currentHp <= 0) {
    await handlePlayerFaint();
    return;
  }

  state.isBusy = false;
  setControlsEnabled(true);
  setDialogue(`What will ${state.player.name} do?`);
}

/**
 * Handles Enemy Faint (Exercise 6) and Player Victory Jump (Exercise 7)
 */
async function handleEnemyFaint() {
  state.isGameOver = true;
  setControlsEnabled(false);

  setDialogue(`Enemy ${state.enemy.name} fainted!`);

  // Enemy collapses down (Exercise 6)
  elements.enemySpriteWrapper.classList.remove('animate-idle');
  await triggerAnimation(elements.enemySpriteWrapper, 'animate-faint', 1200);

  setDialogue(`${state.player.name} won the battle! 🎉`);

  // Player begins victory celebration bounce (Exercise 7)
  elements.playerSpriteWrapper.classList.remove('animate-idle');
  elements.playerSpriteWrapper.classList.add('animate-victory');
}

/**
 * Handles Player Faint (Exercise 6)
 */
async function handlePlayerFaint() {
  state.isGameOver = true;
  setControlsEnabled(false);

  setDialogue(`${state.player.name} fainted! You lost the battle...`);

  // Player collapses down (Exercise 6)
  elements.playerSpriteWrapper.classList.remove('animate-idle');
  await triggerAnimation(elements.playerSpriteWrapper, 'animate-faint', 1200);

  setDialogue(`Click "Restart Match" to challenge again!`);
}

/**
 * Resets HP, status, and restarts idle animations without re-fetching API.
 */
function restartMatch() {
  if (!state.player || !state.enemy) return;

  state.isGameOver = false;
  state.isBusy = false;

  state.player.stats.currentHp = state.player.stats.maxHp;
  state.enemy.stats.currentHp = state.enemy.stats.maxHp;

  updateHpBar('player', state.player.stats.currentHp, state.player.stats.maxHp);
  updateHpBar('enemy', state.enemy.stats.currentHp, state.enemy.stats.maxHp);

  // Clean all animation classes
  const classesToClear = [
    'animate-faint',
    'animate-victory',
    'animate-tackle',
    'animate-special',
    'animate-damage',
    'animate-heal',
    'animate-entrance',
  ];

  elements.playerSpriteWrapper.classList.remove(...classesToClear);
  elements.enemySpriteWrapper.classList.remove(...classesToClear);

  // Restore idle breathing
  elements.playerSpriteWrapper.classList.add('animate-idle');
  elements.enemySpriteWrapper.classList.add('animate-idle');

  setControlsEnabled(true);
  setDialogue(`Match reset! What will ${state.player.name} do?`);
}

// ============================================================================
// 5. ANIMATION LAB SANDBOX CONTROLLER
// ============================================================================

/**
 * Guided Hints Dictionary for Students
 */
const guideHints = {
  'animate-idle': {
    badge: 'LEVEL 1: IDLE LOOP',
    title: 'Idle Breathing & Floating',
    desc: 'Make the Pokémon look alive with subtle vertical motion and scaling.',
    code: '/* animations.css (Level 1) */\n@keyframes idle-player {\n  0%   { transform: translateY(0px) scale(1, 1); }\n  100% { transform: translateY(-10px) scale(0.98, 1.02); }\n}\n.player-sprite-wrapper.animate-idle {\n  animation: idle-player 2s ease-in-out infinite alternate;\n}'
  },
  'animate-entrance': {
    badge: 'LEVEL 2: ENTRANCE',
    title: 'Pokéball Entrance Slide',
    desc: 'Start tiny and off-screen, then pop in with high brightness flash.',
    code: '/* animations.css (Level 2) */\n@keyframes entrance-player {\n  0%   { opacity: 0; transform: translateX(-120px) scale(0.3); filter: brightness(3); }\n  70%  { opacity: 1; transform: translateX(10px) scale(1.08); }\n  100% { opacity: 1; transform: translateX(0) scale(1); filter: brightness(1); }\n}\n.player-sprite-wrapper.animate-entrance {\n  animation: entrance-player 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;\n}'
  },
  'animate-tackle': {
    badge: 'LEVEL 3: TACKLE ATTACK',
    title: 'Physical Attack Lunge',
    desc: 'Wind up backward (anticipation), dash forward, impact, and recoil.',
    code: '/* animations.css (Level 3) */\n@keyframes tackle-player {\n  0%   { transform: translate(0, 0); }\n  25%  { transform: translate(-25px, 8px) rotate(-6deg); } /* Wind-up */\n  50%  { transform: translate(90px, -40px) rotate(10deg); } /* Lunge */\n  70%  { transform: translate(40px, -15px); } /* Recoil */\n  100% { transform: translate(0, 0); }\n}\n.player-sprite-wrapper.animate-tackle {\n  animation: tackle-player 0.65s cubic-bezier(0.25, 1, 0.5, 1);\n}'
  },
  'animate-special': {
    badge: 'LEVEL 4: SPECIAL CHARGE',
    title: 'Elemental Power Charge',
    desc: 'Make the Pokémon crouch, vibrate, and pulse with a glowing filter.',
    code: '/* animations.css (Level 4) */\n@keyframes special-charge-player {\n  0%   { transform: scale(1); filter: brightness(1); }\n  50%  { transform: scale(1.1); filter: brightness(1.5) drop-shadow(0 0 20px #ffcc00); }\n  100% { transform: scale(1); filter: brightness(1); }\n}\n.player-sprite-wrapper.animate-special {\n  animation: special-charge-player 0.8s ease-in-out;\n}'
  },
  'animate-damage': {
    badge: 'LEVEL 5: TAKE DAMAGE',
    title: 'Hurt Flicker & Red Flash',
    desc: 'Rapidly flicker opacity and tint the sprite red with sepia/saturate.',
    code: '/* animations.css (Level 5) */\n@keyframes damage-hit {\n  0%   { transform: translate(0, 0); opacity: 1; }\n  15%  { transform: translate(-12px, 3px); opacity: 0.3; filter: sepia(1) saturate(5) hue-rotate(-50deg); }\n  30%  { transform: translate(12px, -3px); opacity: 0.9; }\n  60%  { transform: translate(4px, 0); opacity: 1; filter: none; }\n  100% { transform: translate(0, 0); opacity: 1; }\n}\n.pokemon-sprite-wrapper.animate-damage {\n  animation: damage-hit 0.6s ease-in-out;\n}'
  },
  'animate-faint': {
    badge: 'LEVEL 6: FAINT / KO',
    title: 'Defeat Collapse & Sink',
    desc: 'Wobble in dizziness and sink down through platform. Remember "forwards"!',
    code: '/* animations.css (Level 6) */\n@keyframes faint-collapse {\n  0%   { transform: translateY(0); opacity: 1; }\n  25%  { transform: translateY(-5px) rotate(-10deg); }\n  50%  { transform: translateY(15px) rotate(15deg); opacity: 0.7; }\n  100% { transform: translateY(120px) scale(0.6) rotate(-20deg); opacity: 0; }\n}\n.pokemon-sprite-wrapper.animate-faint {\n  animation: faint-collapse 1s ease-in-out forwards;\n}'
  },
  'animate-victory': {
    badge: 'LEVEL 7: VICTORY',
    title: 'Squash & Stretch Jump',
    desc: 'Squash flat when hitting ground, stretch tall at peak of jump!',
    code: '/* animations.css (Level 7) */\n@keyframes victory-jump {\n  0%   { transform: translateY(0px) scale(1.15, 0.85); }\n  100% { transform: translateY(-30px) scale(0.88, 1.12); }\n}\n.pokemon-sprite-wrapper.animate-victory {\n  animation: victory-jump 0.45s ease-out infinite alternate;\n}'
  },
  'arena-shake': {
    badge: 'LEVEL 8: SCREEN SHAKE',
    title: 'Camera Rumble Shockwave',
    desc: 'Apply rapid translate offsets in random directions on #battle-stage.',
    code: '/* animations.css (Level 8) */\n@keyframes screen-shake {\n  0%, 100% { transform: translate(0, 0); }\n  15% { transform: translate(-5px, 3px); }\n  30% { transform: translate(6px, -4px); }\n  50% { transform: translate(-6px, 4px); }\n  70% { transform: translate(4px, -2px); }\n}\n.battle-stage.arena-shake {\n  animation: screen-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;\n}'
  },
  'projectile-shoot': {
    badge: 'LEVEL 9: PROJECTILE VFX',
    title: 'Flying Energy Blast',
    desc: 'Travel diagonally across stage from player coordinates to enemy.',
    code: '/* animations.css (Level 9) */\n@keyframes projectile-travel {\n  0%   { top: 65%; left: 30%; transform: scale(0.2); opacity: 0; }\n  20%  { opacity: 1; transform: scale(1.2) rotate(90deg); }\n  100% { top: 32%; left: 72%; transform: scale(1.8) rotate(360deg); opacity: 0; }\n}\n.special-projectile.projectile-shoot {\n  animation: projectile-travel 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;\n}'
  }
};

/**
 * Handles individual animation preview triggers from the drawer.
 * This lets students test their CSS keyframes in isolation!
 */
function setupAnimationLab() {
  const guideBadge = document.getElementById('guide-badge');
  const guideTitle = document.getElementById('guide-title');
  const guideDesc = document.getElementById('guide-desc');
  const guideCode = document.getElementById('guide-code');

  // Drawer open / close handlers
  elements.btnToggleLab.addEventListener('click', () => {
    elements.labDrawer.classList.toggle('open');
    elements.drawerBackdrop.classList.toggle('active');
  });

  elements.btnCloseLab.addEventListener('click', closeLabDrawer);
  elements.drawerBackdrop.addEventListener('click', closeLabDrawer);

  function closeLabDrawer() {
    elements.labDrawer.classList.remove('open');
    elements.drawerBackdrop.classList.remove('active');
  }

  // Setup click triggers on all test buttons
  elements.labButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const target = button.dataset.target;
      const animClass = button.dataset.anim;

      let targetEl = null;

      if (target === 'player') targetEl = elements.playerSpriteWrapper;
      else if (target === 'enemy') targetEl = elements.enemySpriteWrapper;
      else if (target === 'stage') targetEl = elements.battleStage;
      else if (target === 'vfx') targetEl = elements.specialProjectile;

      if (!targetEl) return;

      // Update guided task hint if available
      if (guideHints[animClass] && guideBadge && guideTitle && guideDesc && guideCode) {
        const hint = guideHints[animClass];
        guideBadge.textContent = hint.badge;
        guideTitle.textContent = hint.title;
        guideDesc.textContent = hint.desc;
        guideCode.textContent = hint.code;
      }

      // Flash button border to indicate trigger
      button.style.borderColor = '#48bb78';
      setTimeout(() => (button.style.borderColor = ''), 400);

      // If triggering looping animations (like idle or victory), just toggle class
      if (animClass === 'animate-idle' || animClass === 'animate-victory') {
        targetEl.classList.remove('animate-faint', 'animate-idle', 'animate-victory');
        targetEl.classList.add(animClass);
        return;
      }

      // If triggering faint, don't auto-remove
      if (animClass === 'animate-faint') {
        targetEl.classList.remove('animate-idle', 'animate-victory');
        targetEl.classList.add(animClass);
        return;
      }

      // For one-shot animations: remove idle, trigger anim, then restore idle
      const wasIdle = targetEl.classList.contains('animate-idle');
      targetEl.classList.remove('animate-idle');

      await triggerAnimation(targetEl, animClass, 1000);
      targetEl.classList.remove(animClass);

      if (wasIdle && !state.isGameOver) {
        targetEl.classList.add('animate-idle');
      }
    });
  });
}

// ============================================================================
// 6. EVENT LISTENERS & BOOTSTRAP
// ============================================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomPokemon() {
  const popular = [
    'pikachu', 'charizard', 'blastoise', 'venusaur', 'gengar',
    'lucario', 'eevee', 'mewtwo', 'gyarados', 'snorlax',
    'dragonite', 'rayquaza', 'greninja', 'scizor', 'tyranitar',
    'umbreon', 'garchomp', 'mimikyu', 'cinderace', 'tinkaton',
    'gardevoir', 'blaziken', 'swampert', 'sceptile', 'infernape',
    'dialga', 'zoroark', 'hydreigon', 'sylveon', 'decidueye',
    'dragapult', 'meowscarada', 'ceruledge', 'mew', 'lapras',
    'arcanine', 'lugia', 'ho-oh', 'kyogre', 'groudon'
  ];
  return popular[Math.floor(Math.random() * popular.length)];
}

function handleSearchMatchup() {
  const playerQuery = elements.playerInput.value.trim() || 'pikachu';
  const enemyQuery = elements.enemyInput.value.trim() || 'charizard';
  loadMatchup(playerQuery, enemyQuery);
}

function initEventListeners() {
  // Battle Controls
  elements.btnPhysical.addEventListener('click', executePlayerPhysicalAttack);
  elements.btnSpecial.addEventListener('click', executePlayerSpecialAttack);
  elements.btnHeal.addEventListener('click', executePlayerHeal);
  elements.btnReset.addEventListener('click', restartMatch);

  // Search & Matchup Controls
  elements.btnLoadMatchup.addEventListener('click', handleSearchMatchup);

  // Support pressing Enter key in either input field
  elements.playerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSearchMatchup();
    }
  });

  elements.enemyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSearchMatchup();
    }
  });

  // Random Matchup Button
  elements.btnRandomMatchup.addEventListener('click', () => {
    const p = getRandomPokemon();
    let e = getRandomPokemon();
    while (e === p) {
      e = getRandomPokemon();
    }
    elements.playerInput.value = p;
    elements.enemyInput.value = e;
    loadMatchup(p, e);
  });

  setupAnimationLab();
}

// Boot the application on page load
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  // Default matchup: Pikachu vs Charizard
  loadMatchup('pikachu', 'charizard');
});
