// --- Spieler-Definition ---
const player = {
  health: 100,
  maxHealth: 100,
  attack: 10,
  defense: 5,
  XP: 0,
  level: 1,
  xpToLevel: 100,
  totalXP: 0,
  gold: 0
};

let enemies = [];
let enemyIdCounter = 0;
let bossCount = 0;
const maxBossCount = 20;

let lastAttackTime = 0;

// --- DOM-Elemente ---
const gameLogEl = document.getElementById('gameLog');
const enemiesListEl = document.getElementById('enemiesList');

// Spieler-UI-Elemente
const healthTextEl = document.getElementById('healthText');
const healthBarEl = document.getElementById('healthBar');
const playerLevelEl = document.getElementById('playerLevel');
const playerGoldEl = document.getElementById('playerGold');
const xpBarEl = document.getElementById('xpBar');
const xpTextEl = document.getElementById('xpText');

// --- UI-Aktualisierung ---
function updatePlayerUI() {
  healthTextEl.textContent = `${player.health} / ${player.maxHealth}`;
  healthBarEl.max = player.maxHealth;
  healthBarEl.value = player.health;

  playerLevelEl.textContent = player.level;
  xpBarEl.max = player.xpToLevel;
  xpBarEl.value = player.XP;
  xpTextEl.textContent = `${player.XP} / ${player.xpToLevel}`;
  playerGoldEl.textContent = player.gold;

  document.getElementById('playerAttack').textContent = player.attack;
  document.getElementById('playerDefense').textContent = player.defense;
}

// --- Gegner-Typ zufällig wählen ---
function getRandomEnemyType() {
  return ['Orc', 'Mage', 'Dwarf', 'Human'][Math.floor(Math.random() * 4)];
}

let normalEnemyCount = 0;

// --- Gegner spawnen ---
function spawnEnemy() {
  const levelFactor = 1 + (player.level - 1) * 0.1;
  const enemyType = getRandomEnemyType();

  const enemyStats = {
    'Orc': { health: 50, attack: 8, xpBase: 20 },
    'Mage': { health: 40, attack: 12, xpBase: 25 },
    'Dwarf': { health: 60, attack: 10, xpBase: 30 },
    'Human': { health: 45, attack: 9, xpBase: 15 }
  };

  const stats = enemyStats[enemyType];
  const enemy = {
    id: Date.now(),
    type: enemyType,
    health: Math.floor((stats.health + Math.random() * 20) * levelFactor),
    attack: Math.floor((stats.attack + Math.random() * 5) * levelFactor),
    xpReward: Math.floor((stats.xpBase + stats.health + stats.attack) * levelFactor),
    timeLeft: 10,
    interval: null
  };

  enemy.interval = setInterval(() => handleEnemyTimeout(enemy), 1000);
  enemies.push(enemy);
  updateEnemiesUI();
  logMessage(`${enemy.type} erscheint! (HP: ${enemy.health}, Attack: ${enemy.attack})`);
  
  normalEnemyCount++;
  if (normalEnemyCount >= 5) {
    spawnBoss();
    normalEnemyCount = 0;
  }
}

// --- Boss spawnen ---
function spawnBoss() {
  const boss = {
    id: Date.now(),
    type: 'Boss',
    health: 500,
    attack: 50,
    xpReward: 500,
    timeLeft: 15,
    interval: null
  };

  boss.interval = setInterval(() => handleEnemyTimeout(boss), 1000);
  enemies.push(boss);
  updateEnemiesUI();
  logMessage('Der Boss erscheint!');

  bossCount++;
  if (bossCount >= maxBossCount) {
    logMessage('Herzlichen Glückwunsch! Du hast das Spiel gewonnen!');
    resetGame();
  }
}

// --- Gegner läuft ab ---
function handleEnemyTimeout(enemy) {
  enemy.timeLeft--;
  updateEnemiesUI();

  if (enemy.timeLeft <= 0) {
    clearInterval(enemy.interval);
    player.health -= enemy.attack;
    logMessage(`Der ${enemy.type} ist nicht besiegt worden und fügt dir ${enemy.attack} Schaden zu.`);
    enemies = enemies.filter(e => e.id !== enemy.id);
    updateEnemiesUI();
    updatePlayerUI();

    if (player.health <= 0) gameOver();
  }
}

// --- Angriff auf Gegner (mit Cooldown) ---
function attackEnemy(enemyId) {
  const now = Date.now();
  if (now - lastAttackTime < 200) {
    logMessage("Du musst dich regenerieren, bevor du erneut angreifst!");
    return;
  }
  lastAttackTime = now;

  const enemy = enemies.find(e => e.id === enemyId);
  if (!enemy) return;

  enemy.health -= player.attack;
  logMessage(`Du greifst den ${enemy.type} an und fügst ${player.attack} Schaden zu.`);

  if (enemy.health <= 0) {
    logMessage(`${enemy.type} besiegt! +${enemy.xpReward} XP.`);
    player.XP += enemy.xpReward;
    player.gold += enemy.xpReward;

    clearInterval(enemy.interval);
    enemies = enemies.filter(e => e.id !== enemyId);
    updateEnemiesUI();
    checkLevelUp();
  } else {
    const damage = Math.max(enemy.attack - player.defense, 0);
    player.health -= damage;
    logMessage(`${enemy.type} kontert und fügt dir ${damage} Schaden zu.`);
    if (player.health <= 0) gameOver();
  }
  updatePlayerUI();
}

// --- Level-Up ---
function checkLevelUp() {
  if (player.XP >= player.xpToLevel) {
    player.XP -= player.xpToLevel;
    player.level++;
    player.xpToLevel = Math.floor(player.xpToLevel * 1.5);
    player.attack += 2;
    player.defense += 1;
    player.maxHealth += 10;
    player.health = player.maxHealth;
    logMessage(`🎉 Level Up! Du bist jetzt Level ${player.level}.`);
  }
}

// --- Log-Meldungen ---
function logMessage(message) {
  const logItem = document.createElement('div');
  logItem.textContent = message;
  gameLogEl.prepend(logItem);
  if (gameLogEl.children.length > 5) gameLogEl.removeChild(gameLogEl.lastChild);
}

// --- Spiel beenden ---
function gameOver() {
  logMessage('❌ Game Over! Du bist gestorben.');
  resetGame();
}

// --- Spiel zurücksetzen ---
function resetGame() {
  Object.assign(player, { health: 100, maxHealth: 100, attack: 10, defense: 5, XP: 0, level: 1, xpToLevel: 100, gold: 0 });
  bossCount = 0;
  enemies.forEach(e => clearInterval(e.interval));
  enemies = [];
  updatePlayerUI();
  updateEnemiesUI();
}

// --- UI für Gegner aktualisieren ---
function updateEnemiesUI() {
  enemiesListEl.innerHTML = '';
  enemies.slice(0, 4).forEach(enemy => {
    const enemyDiv = document.createElement('div');
    enemyDiv.className = 'enemy';

    const enemyInfo = document.createElement('span');
    enemyInfo.textContent = `${enemy.type} (A: ${enemy.attack}, HP: ${enemy.health})`;

    const enemyTimer = document.createElement('span');
    enemyTimer.className = 'enemy-timer';
    enemyTimer.textContent = `Angriff in ${enemy.timeLeft}s`;

    const attackButton = document.createElement('button');
    attackButton.textContent = 'Angreifen';
    attackButton.addEventListener('click', () => attackEnemy(enemy.id));

    enemyDiv.appendChild(enemyInfo);
    enemyDiv.appendChild(enemyTimer);
    enemyDiv.appendChild(attackButton);

    enemiesListEl.appendChild(enemyDiv);
  });
}

// --- Gegner-Spawning ---
setInterval(spawnEnemy, 5000);
updatePlayerUI();
