var game = new Phaser.Game(800, 600, Phaser.AUTO, 'kraken-game', { preload: preload, create: create, update: update });

function preload() {
  game.load.image('starfield', 'assets/starfield.png');
  game.load.image('bullet', 'assets/bullet.png');
  game.load.spritesheet('ship', 'assets/player.png', 32, 48);
}

var cursors;
var score = 0;
var scoreString = '';
var scoreText;
var bulletTime = 0;

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  game.stage.backgroundColor = '#373d47';
  starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

  // Player
  player = game.add.sprite(game.world.width/2, game.world.height - 150, 'ship');
  player.anchor.setTo(0.5, 0.5);
  game.physics.arcade.enable(player);
  player.body.collideWorldBounds = true;
  player.body.allowRotation = true;

  //  Player bullet group
  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(30, 'bullet');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 1);
  bullets.setAll('outOfBoundsKill', true);
  bullets.setAll('checkWorldBounds', true);

  //  Score
  scoreString = 'Score : ';
  scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Arial', fill: '#fff' });

  cursors = game.input.keyboard.createCursorKeys();
  fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  fireButton.onDown.add(fireBullet, game);
  pauseKey = game.input.keyboard.addKey(Phaser.Keyboard.P);
  pauseKey.onDown.add(pause, game);
}

function update() {
  //  Scroll the background
  starfield.tilePosition.y += 2;

  playerMovement();
}

function playerMovement() {
  player.body.velocity.setTo(0, 0);
  player.body.angularVelocity = 0;

  if (cursors.left.isDown) { player.body.velocity.x = -150; }
  else if (cursors.right.isDown) { player.body.velocity.x = 150; }
  if (cursors.up.isDown) { player.body.velocity.y = -150; }
  else if (cursors.down.isDown) { player.body.velocity.y = 150; }

  // player.body.velocity.copyFrom(game.physics.arcade.velocityFromAngle(player.angle, 300));

  // player.body.angularVelocity = -200;
  player.rotation = game.physics.arcade.angleToPointer(player) + 90;
}

function fireBullet() {
  if (game.time.now > bulletTime) {
    bullet = bullets.getFirstExists(false);

    if (bullet) {
      bullet.reset(player.x, player.y + 8);
      // bullet.body.velocity.y = -400;
      game.physics.arcade.moveToPointer(bullet, 400);
      bulletTime = game.time.now + 200;
    }
  }
}

function pause() {
  game.paused = !game.paused;
  game.paused ? console.log("Game paused") : console.log("Game continued");
}
