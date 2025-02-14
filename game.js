/*

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

    // Gegner-Bild hinzufügen
    const enemyImage = document.createElement('img');
    enemyImage.src = `images/${enemy.type.toLowerCase()}.jpg`;
    enemyImage.alt = enemy.type;
    enemyImage.className = 'enemy-image'; // CSS-Klasse für Styling

    const enemyInfo = document.createElement('span');
    enemyInfo.textContent = `${enemy.type} (A: ${enemy.attack}, HP: ${enemy.health})`;

    const enemyTimer = document.createElement('span');
    enemyTimer.className = 'enemy-timer';
    enemyTimer.textContent = `Angriff in ${enemy.timeLeft}s`;

    const attackButton = document.createElement('button');
    attackButton.textContent = 'Angreifen';
    attackButton.addEventListener('click', () => attackEnemy(enemy.id));

    // Elemente dem Gegner-Div hinzufügen
    enemyDiv.appendChild(enemyImage);
    enemyDiv.appendChild(enemyInfo);
    enemyDiv.appendChild(enemyTimer);
    enemyDiv.appendChild(attackButton);

    enemiesListEl.appendChild(enemyDiv);
  });
}

// --- Gegner-Spawning ---
setInterval(spawnEnemy, 5000);
updatePlayerUI();


*/
document.addEventListener("DOMContentLoaded", function () {
  // === Spieler-Definition ===
  const player = {
      health: 100,
      maxHealth: 100,
      attack: 10,
      defense: 5,
      XP: 0,
      level: 1,
      xpToLevel: 100,
      gold: 100 // Startgold für Upgrades
  };

  // === Globale Variablen für das Level-/Wellen-System ===
  let currentGameLevel = 1;
  const maxGameLevel = 5;
  let enemyQueue = [];
  let currentEnemy = null;
  let lastAttackTime = 0;

  // === DOM-Elemente ===
  const gameLogEl = document.getElementById('gameLog');
  const enemyAreaEl = document.getElementById('enemyArea');
  const healthTextEl = document.getElementById('healthText');
  const healthBarEl = document.getElementById('healthBar');
  const playerLevelEl = document.getElementById('playerLevel');
  const playerGoldEl = document.getElementById('playerGold');
  const xpBarEl = document.getElementById('xpBar');
  const xpTextEl = document.getElementById('xpText');

  // === Buttons für Upgrades ===
  const upgradeAttackBtn = document.getElementById("upgradeAttack");
  const upgradeDefenseBtn = document.getElementById("upgradeDefense");
  const upgradeHealthBtn = document.getElementById("upgradeHealth");

  // === UI-Aktualisierung Spieler ===
  function updatePlayerUI() {
      healthTextEl.textContent = `${player.health} / ${player.maxHealth}`;
      healthBarEl.max = player.maxHealth;
      healthBarEl.value = player.health;
      playerLevelEl.textContent = player.level;
      xpBarEl.max = player.xpToLevel;
      xpBarEl.value = player.XP;
      xpTextEl.textContent = `${player.XP} / ${player.xpToLevel}`;
      playerGoldEl.textContent = player.gold;
  }

  // === Log-Meldungen (max. 5 Zeilen) ===
  function logMessage(message) {
      const logItem = document.createElement('div');
      logItem.textContent = message;
      gameLogEl.prepend(logItem);
      if (gameLogEl.children.length > 5) {
          gameLogEl.removeChild(gameLogEl.lastChild);
      }
  }

  // === Upgrade-Funktionen ===
  function upgradeStat(stat) {
      const cost = 50; // Upgrade-Kosten
      if (player.gold >= cost) {
          player.gold -= cost;
          switch (stat) {
              case "attack":
                  player.attack += 5;
                  logMessage(`Angriff erhöht! Neuer Angriff: ${player.attack}`);
                  break;
              case "defense":
                  player.defense += 3;
                  logMessage(`Verteidigung erhöht! Neue Verteidigung: ${player.defense}`);
                  break;
              case "health":
                  player.maxHealth += 20;
                  player.health = player.maxHealth; // Gesundheit auf Maximum zurücksetzen
                  logMessage(`Gesundheit erhöht! Neue Gesundheit: ${player.health}`);
                  break;
          }
          updatePlayerUI();
      } else {
          logMessage("Nicht genug Gold für das Upgrade!");
      }
  }

  // === Event-Listener für die Upgrade-Buttons ===
  upgradeAttackBtn.addEventListener("click", () => upgradeStat("attack"));
  upgradeDefenseBtn.addEventListener("click", () => upgradeStat("defense"));
  upgradeHealthBtn.addEventListener("click", () => upgradeStat("health"));

  // === Funktionen zum Erzeugen von Gegnern ===
  function createNormalEnemy(gameLevel) {
      const levelFactor = 1 + (gameLevel - 1) * 0.1;
      const enemyTypes = ['Orc', 'Mage', 'Dwarf', 'Human'];
      const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const enemyStats = {
          'Orc': { health: 50, attack: 8, xpBase: 20 },
          'Mage': { health: 40, attack: 12, xpBase: 25 },
          'Dwarf': { health: 60, attack: 10, xpBase: 30 },
          'Human': { health: 45, attack: 9, xpBase: 15 }
      };
      const stats = enemyStats[enemyType];
      return {
          id: Date.now() + Math.random(),
          type: enemyType,
          health: Math.floor((stats.health + Math.random() * 20) * levelFactor),
          attack: Math.floor((stats.attack + Math.random() * 5) * levelFactor),
          xpReward: Math.floor((stats.xpBase + stats.health + stats.attack) * levelFactor),
          timeLeft: 10,
          interval: null
      };
  }

  function createBoss(gameLevel) {
      const levelFactor = 1 + (gameLevel - 1) * 0.1;
      return {
          id: Date.now() + Math.random(),
          type: 'Boss',
          health: Math.floor(50 * levelFactor),
          attack: Math.floor(50 * levelFactor),
          xpReward: Math.floor(500 * levelFactor),
          timeLeft: 15,
          interval: null
      };
  }

  // === Level starten ===
  function startLevel(gameLevel) {
      currentGameLevel = gameLevel;
      enemyQueue = [];
      for (let i = 0; i < 4; i++) {
          enemyQueue.push(createNormalEnemy(gameLevel));
      }
      enemyQueue.push(createBoss(gameLevel));
      logMessage(`Level ${gameLevel} gestartet!`);
      nextEnemy();
      updatePlayerUI();
  }

  // === Nächsten Gegner aus der Queue laden ===
  function nextEnemy() {
    if (currentEnemy && currentEnemy.interval) {
        clearInterval(currentEnemy.interval);
    }
    if (enemyQueue.length > 0) {
        currentEnemy = enemyQueue.shift();
        updateCurrentEnemyUI();
        currentEnemy.interval = setInterval(handleCurrentEnemyTimeout, 1000);
    } else {
        levelComplete();
    }
  }

  function levelComplete() {
    if (currentGameLevel === 1) {
        alert("Level 1 geschafft! 🎉");
    }
    // Starte das nächste Level, wenn es noch verfügbar ist
    if (currentGameLevel < maxGameLevel) {
        currentGameLevel++;
        startLevel(currentGameLevel);
    } else {
        logMessage("Das Spiel ist abgeschlossen!");
    }
  }

  function handleCurrentEnemyTimeout() {
    if (currentEnemy.timeLeft > 0) {
        currentEnemy.timeLeft--;
        updateCurrentEnemyUI(); // Aktualisiert das UI für den Gegner, z.B. den Timer
    } else {
        clearInterval(currentEnemy.interval); // Stoppe den Intervall, wenn die Zeit abgelaufen ist
        logMessage(`${currentEnemy.type} ist bereit zum Angriff!`);
        attackCurrentEnemy(); // Der Gegner greift den Spieler an
    }
  }

  // === Aktuelle Gegner-UI aktualisieren ===
  function updateCurrentEnemyUI() {
      enemyAreaEl.innerHTML = '';
      if (!currentEnemy) return;
      const enemyDiv = document.createElement('div');
      enemyDiv.className = 'current-enemy';
      const enemyImage = document.createElement('img');
      enemyImage.src = `images/${currentEnemy.type.toLowerCase()}.jpg`;
      enemyImage.alt = currentEnemy.type;
      enemyImage.className = 'enemy-image-large';
      enemyImage.addEventListener('click', attackCurrentEnemy);
      const enemyInfo = document.createElement('div');
      enemyInfo.className = 'enemy-info';
      enemyInfo.textContent = `${currentEnemy.type} (Attack: ${currentEnemy.attack}, HP: ${currentEnemy.health})`;
      const enemyTimer = document.createElement('div');
      enemyTimer.className = 'enemy-timer';
      enemyTimer.textContent = `Angriff in ${currentEnemy.timeLeft}s`;
      enemyDiv.appendChild(enemyImage);
      enemyDiv.appendChild(enemyInfo);
      enemyDiv.appendChild(enemyTimer);
      enemyAreaEl.appendChild(enemyDiv);
  }

// === Angriff auf den aktuellen Gegner ===
function attackCurrentEnemy() {
  const now = Date.now();
  // Überprüft, ob der Spieler sich zwischen den Angriffen regenerieren muss
  if (now - lastAttackTime < 200) {
      logMessage("Du musst dich regenerieren, bevor du erneut angreifst!");
      return;
  }
  lastAttackTime = now;

  // Wenn kein Gegner vorhanden ist, kann der Spieler nicht angreifen
  if (!currentEnemy) return;

  // Spieler greift den Gegner an
  currentEnemy.health -= player.attack;
  logMessage(`Du greifst den ${currentEnemy.type} an und fügst ${player.attack} Schaden zu.`);

  // Wenn der Gegner besiegt wurde, wird der Gegner entfernt und der Spieler erhält Belohnungen
  if (currentEnemy.health <= 0) {
      logMessage(`${currentEnemy.type} besiegt! +${currentEnemy.xpReward} XP.`);
      player.XP += currentEnemy.xpReward;
      player.gold += currentEnemy.xpReward;
      clearInterval(currentEnemy.interval); // Stoppt den Gegner-Intervall
      updatePlayerUI(); // Spieler-UI aktualisieren
      checkLevelUp(); // Überprüft, ob der Spieler ein Level-Up erreicht hat
      nextEnemy(); // Nächster Gegner
  } else {
      // Gegner kontert den Angriff
      const damage = Math.max(currentEnemy.attack - player.defense, 0);
      player.health -= damage;
      logMessage(`${currentEnemy.type} kontert und fügt dir ${damage} Schaden zu.`);

      // Überprüft, ob der Spieler noch lebt
      updatePlayerUI(); // UI nach Schaden des Spielers aktualisieren
      if (player.health <= 0) {
          gameOver(); // Spiel endet, wenn der Spieler keine Gesundheit mehr hat
      } else {
          updateCurrentEnemyUI(); // UI für den Gegner nach Angriff aktualisieren
      }
  }
}


  function gameOver() {
    logMessage("Game Over! Du bist gestorben.");
    alert("Game Over! Du hast verloren. Das Spiel wird neu gestartet.");
    // Setze den Spieler zurück zum Anfang oder führe ein Reset durch.

  }

  // === Level-Up des Spielers ===
  function checkLevelUp() {
      if (player.XP >= player.xpToLevel) {
          player.XP -= player.xpToLevel;
          player.level++;
          player.xpToLevel = Math.floor(player.xpToLevel * 1.5);
          player.attack += 2;
          player.defense += 1;
          player.maxHealth += 10;
          player.health = player.maxHealth;
          logMessage(`🎉 Level Up! Du bist jetzt Charakter-Level ${player.level}.`);
      }
  }

  // === Spiel starten ===
  startLevel(1);
});
