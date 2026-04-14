const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
};

const game = {
  score: 0,
  lives: 3,
  running: true,
  won: false,
  lastTime: 0,
  fireCooldown: 0,
};

const player = {
  width: 54,
  height: 28,
  x: canvas.width / 2 - 27,
  y: canvas.height - 74,
  speed: 420,
};

const bullets = [];
const enemyBullets = [];
const enemies = [];

const enemyConfig = {
  rows: 5,
  cols: 9,
  gapX: 16,
  gapY: 14,
  width: 48,
  height: 30,
  offsetX: 74,
  offsetY: 100,
};

let enemyDirection = 1;
let enemySpeed = 34;
let enemyDropDistance = 22;
let enemyShotTimer = 0;

function initEnemies() {
  enemies.length = 0;

  for (let row = 0; row < enemyConfig.rows; row += 1) {
    for (let col = 0; col < enemyConfig.cols; col += 1) {
      enemies.push({
        x: enemyConfig.offsetX + col * (enemyConfig.width + enemyConfig.gapX),
        y: enemyConfig.offsetY + row * (enemyConfig.height + enemyConfig.gapY),
        width: enemyConfig.width,
        height: enemyConfig.height,
        alive: true,
        row,
      });
    }
  }
}

function resetGame() {
  game.score = 0;
  game.lives = 3;
  game.running = true;
  game.won = false;
  game.fireCooldown = 0;
  player.x = canvas.width / 2 - player.width / 2;
  bullets.length = 0;
  enemyBullets.length = 0;
  enemyDirection = 1;
  enemySpeed = 34;
  enemyShotTimer = 0;
  initEnemies();
  updateHud();
}

function updateHud() {
  scoreEl.textContent = game.score;
  livesEl.textContent = game.lives;
}

function firePlayerBullet() {
  bullets.push({
    x: player.x + player.width / 2 - 3,
    y: player.y - 16,
    width: 6,
    height: 18,
    speed: 560,
  });
}

function fireEnemyBullet() {
  const livingEnemies = enemies.filter((enemy) => enemy.alive);
  if (livingEnemies.length === 0) return;

  const shooter = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
  enemyBullets.push({
    x: shooter.x + shooter.width / 2 - 3,
    y: shooter.y + shooter.height + 8,
    width: 6,
    height: 18,
    speed: 240 + Math.random() * 60,
  });
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update(dt) {
  if (!game.running) {
    return;
  }

  if (keys.ArrowLeft) {
    player.x -= player.speed * dt;
  }
  if (keys.ArrowRight) {
    player.x += player.speed * dt;
  }

  player.x = Math.max(18, Math.min(canvas.width - player.width - 18, player.x));

  if (game.fireCooldown > 0) {
    game.fireCooldown -= dt;
  }

  if (keys.Space && game.fireCooldown <= 0) {
    firePlayerBullet();
    game.fireCooldown = 0.24;
  }

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.y -= bullet.speed * dt;

    if (bullet.y + bullet.height < 0) {
      bullets.splice(i, 1);
      continue;
    }

    for (const enemy of enemies) {
      if (enemy.alive && intersects(bullet, enemy)) {
        enemy.alive = false;
        bullets.splice(i, 1);
        game.score += 10;
        enemySpeed += 2;
        updateHud();
        break;
      }
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = enemyBullets[i];
    bullet.y += bullet.speed * dt;

    if (bullet.y > canvas.height) {
      enemyBullets.splice(i, 1);
      continue;
    }

    if (intersects(bullet, player)) {
      enemyBullets.splice(i, 1);
      game.lives -= 1;
      updateHud();

      if (game.lives <= 0) {
        game.running = false;
      }
    }
  }

  let hitEdge = false;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemyDirection * enemySpeed * dt;

    if (enemy.x <= 18 || enemy.x + enemy.width >= canvas.width - 18) {
      hitEdge = true;
    }
  }

  if (hitEdge) {
    enemyDirection *= -1;
    for (const enemy of enemies) {
      enemy.y += enemyDropDistance;
    }
  }

  enemyShotTimer -= dt;
  if (enemyShotTimer <= 0) {
    fireEnemyBullet();
    enemyShotTimer = Math.max(0.25, 1.1 - game.score / 180);
  }

  const livingEnemies = enemies.filter((enemy) => enemy.alive);
  if (livingEnemies.length === 0) {
    game.running = false;
    game.won = true;
  }

  for (const enemy of livingEnemies) {
    if (enemy.y + enemy.height >= player.y) {
      game.running = false;
      game.won = false;
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#08111f");
  gradient.addColorStop(1, "#02050d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 0; i < 80; i += 1) {
    const x = (i * 137) % canvas.width;
    const y = (i * 89) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(113, 240, 194, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 80; y < canvas.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "#71f0c2";
  ctx.shadowColor = "rgba(113, 240, 194, 0.5)";
  ctx.shadowBlur = 18;

  ctx.beginPath();
  ctx.moveTo(player.width / 2, 0);
  ctx.lineTo(player.width, player.height);
  ctx.lineTo(player.width * 0.72, player.height);
  ctx.lineTo(player.width * 0.58, player.height * 0.6);
  ctx.lineTo(player.width * 0.42, player.height * 0.6);
  ctx.lineTo(player.width * 0.28, player.height);
  ctx.lineTo(0, player.height);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    const colors = ["#ff7c7c", "#ffb36b", "#ffd66b", "#8ae3ff", "#d08dff"];
    ctx.fillStyle = colors[enemy.row % colors.length];

    ctx.fillRect(8, 0, enemy.width - 16, 10);
    ctx.fillRect(0, 10, enemy.width, 12);
    ctx.fillRect(8, 22, 8, 8);
    ctx.fillRect(enemy.width - 16, 22, 8, 8);
    ctx.clearRect(12, 12, 6, 6);
    ctx.clearRect(enemy.width - 18, 12, 6, 6);

    ctx.restore();
  }
}

function drawBullets() {
  ctx.fillStyle = "#eaf4ff";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  ctx.fillStyle = "#ff7c7c";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawStatus() {
  if (game.running) return;

  ctx.save();
  ctx.fillStyle = "rgba(2, 5, 13, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#eaf4ff";
  ctx.font = "bold 54px Trebuchet MS";
  ctx.fillText(game.won ? "You Win!" : "Game Over", canvas.width / 2, canvas.height / 2 - 18);

  ctx.font = "24px Trebuchet MS";
  ctx.fillStyle = "#71f0c2";
  ctx.fillText("Press Enter to restart", canvas.width / 2, canvas.height / 2 + 32);
  ctx.restore();
}

function draw() {
  drawBackground();
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawStatus();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000 || 0, 0.032);
  game.lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.code in keys) {
    keys[event.code] = true;
    event.preventDefault();
  }

  if (event.code === "Enter" && !game.running) {
    resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code in keys) {
    keys[event.code] = false;
    event.preventDefault();
  }
});

resetGame();
requestAnimationFrame(loop);
