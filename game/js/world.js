GameEngine.World = function (game) {

    //  When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

    this.game;      //  a reference to the currently running game (Phaser.Game)
    this.add;       //  used to add sprites, text, groups, etc (Phaser.GameObjectFactory)
    this.camera;    //  a reference to the game camera (Phaser.Camera)
    this.cache;     //  the game cache (Phaser.Cache)
    this.input;     //  the global input manager. You can access this.input.keyboard, this.input.mouse, as well from it. (Phaser.Input)
    this.load;      //  for preloading assets (Phaser.Loader)
    this.math;      //  lots of useful common math operations (Phaser.Math)
    this.sound;     //  the sound manager - add a sound, play one, set-up markers, etc (Phaser.SoundManager)
    this.stage;     //  the game stage (Phaser.Stage)
    this.time;      //  the clock (Phaser.Time)
    this.tweens;    //  the tween manager (Phaser.TweenManager)
    this.state;     //  the state manager (Phaser.StateManager)
    this.world;     //  the game world (Phaser.World)
    this.particles; //  the particle manager (Phaser.Particles)
    this.physics;   //  the physics manager (Phaser.Physics)
    this.rnd;       //  the repeatable random number generator (Phaser.RandomDataGenerator)

    //  You can use any of these from any function within this State.
    //  But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

    this.mapOffsetX = 0;

    this.score = 0;
    this.bulletTime = 0;
    this.invincibleTime = 0;

    this.leftOffsetPoint = new Phaser.Point();
    this.rightOffsetPoint = new Phaser.Point();

};

GameEngine.World.prototype = {

    create: function () {
      this.physics.startSystem(Phaser.Physics.ARCADE);
      this.world.setBounds(0, 0, 800, 6000); //TODO: set to map size

      // Background
      this.stage.backgroundColor = '#373d47';
      starfield = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'starfield');

      // Map
      map = this.add.tilemap('map');
      //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
      map.addTilesetImage('tileset', 'tiles');
      branch1Layer = map.createLayer('branches1');
      branch2Layer = map.createLayer('branches2');
      //  This resizes the game world to match the layer dimensions
      // branchLayer.resizeWorld();
      // branchLayer.fixedToCamera = false;
      // branchLayer.scrollFactorX = 0;branchLayer.scrollFactorY = 0;
      // branchLayer.anchor.set(0.5);
      // branchLayer.scale.set(0.8, 0.8);
      this.mapOffsetX = this.world.width/2 - 225
      branch1Layer.cameraOffset.x = this.mapOffsetX;
      branch2Layer.cameraOffset.x = this.mapOffsetX;
      branch1Layer.tint = 0xdddddd;
      branch2Layer.tint = 0xdddddd;

      // Player
      player = this.add.sprite(this.world.width/2, this.world.height - 150, 'ship');
      player.anchor.setTo(0.5, 0.5);
      this.physics.arcade.enable(player);
      player.body.collideWorldBounds = true;
      player.body.allowRotation = true;
      player.lives = 1;
      player.hasDoubleShot = false;

      //the camera will follow the player in the world
      // this.game.camera.follow(player);
      // set camera to bottom
      this.game.camera.y = this.world.height;

      //  Player bullet group
      bullets = this.add.group();
      bullets.enableBody = true;
      bullets.physicsBodyType = Phaser.Physics.ARCADE;
      bullets.createMultiple(60, 'bullet');
      bullets.setAll('anchor.x', 0.5);
      bullets.setAll('anchor.y', 1);
      bullets.setAll('outOfBoundsKill', true);
      bullets.setAll('checkWorldBounds', true);

      // Powerups
      powerups = this.add.group();
      powerups.enableBody = true;
      powerups.physicsBodyType = Phaser.Physics.ARCADE;

      // Enemies
      enemies = this.add.group();
      enemies.enableBody = true;
      enemies.physicsBodyType = Phaser.Physics.ARCADE;
      // map.createFromObjects('objects', 74, 'enemy', 0, true, false, enemies);
      // enemies.position.x += mapOffsetX;

      this.setupMapObjects();

      //  An explosion pool
      explosions = this.add.group();
      explosions.createMultiple(30, 'explosion');
      explosions.forEach(this.setupExplosion, this);

      //  Score
      scoreString = 'Score : ';
      scoreText = this.add.text(10, 10, scoreString + this.score, { font: '34px Arial', fill: '#fff' });
      scoreText.fixedToCamera = true;

      // Controls
      cursors = this.input.keyboard.createCursorKeys();
      // fireButton = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
      // fireButton.onDown.add(this.fireBullet, this);
      pauseKey = this.input.keyboard.addKey(Phaser.Keyboard.P);
      pauseKey.onDown.add(this.pause, this);

      // Sounds
      laserSound = this.add.audio('laser');
      explosionSound = this.add.audio('explosion');
      powerupSound = this.add.audio('powerup');
    },

    update: function () {
      //  Scroll the background
      starfield.tilePosition.y += 0.8;
      // branchLayer.position.y -= 2;
      this.camera.y -= 1;

      this.resetInvincible();
      this.checkPowerUps();

      this.moveEnemies();

      this.playerMovement();
      if (this.input.activePointer.leftButton.isDown || this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        this.shoot();
      }

      // prevent player from leaving camera to the bottom
      if (player.position.y + player.height/2 >= this.camera.y+600) {
        player.position.y = this.camera.y+600 - player.height/2;
      }
      // prevent player from leaving camera to the top
      if (player.position.y - player.height/2 <= this.camera.y) {
        player.position.y = this.camera.y + player.height/2;
      }

      //  Run collision
      this.physics.arcade.overlap(bullets, enemies, this.bulletHitsEnemy, null, this);
      this.physics.arcade.overlap(player, enemies, this.playerHitsEnemy, null, this);
      this.physics.arcade.overlap(player, powerups, this.playerCollectsPowerUp, null, this);

      this.updateScoreText();
    },

    render: function() {
      // this.game.debug.cameraInfo(this.camera, 32, 32);
      // this.game.debug.spriteBounds(player);
      // this.game.debug.spriteInfo(player, 20, 32);
    },

    quitGame: function (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //  Then let's go back to the main menu.
        this.state.start('MainMenu');

    },



    setupExplosion: function(explosion) {
      explosion.anchor.x = 0.5;
      explosion.anchor.y = 0.5;
      explosion.animations.add('explosion');
      explosion.scale.setTo(0.5, 0.5);
    },

    setupMapObjects: function() {
      var self = this;
      map.objects['objects'].forEach(function(element){
        // console.log(element);
        if(element.type === "powerup") {
          self.setupPowerUps(element);
        } else if (element.type === "commit") {
          self.setupEnemies(element);
        }
      });
    },

    setupPowerUps: function(element) {
      p = powerups.create(element.x + 175, element.y, element.properties.powerup);
      p.powerup = element.properties.powerup;
    },

    setupEnemies: function(element) {
      var rnd = this.game.rnd;

      for (var i = 0; i < 3; i++) {
        // TODO: replace '175' with this.mapOffsetX. Workaround!
        e = enemies.create(element.x + 175 + rnd.integerInRange(-2, 2), element.y - 15 + i*10 + rnd.integerInRange(-2, 2), 'enemy');
        e.hp = 5;
      };
    },

    moveEnemies: function() {
      var rnd = this.game.rnd;
      enemies.forEach(function(enemy) {
        enemy.position.x += rnd.integerInRange(-1, 1);
        enemy.position.y += rnd.integerInRange(-1, 1);
      });
      // enemies.position.x += this.game.rnd.integerInRange(-1, 1);
      // enemies.position.y += this.game.rnd.integerInRange(-1, 1);
    },

    playerMovement: function() {
      player.body.velocity.setTo(0, 0);
      player.body.angularVelocity = 0;

      if (cursors.left.isDown || this.input.keyboard.isDown(Phaser.Keyboard.A)) {
        player.body.velocity.x = -150;
      }
      else if (cursors.right.isDown || this.input.keyboard.isDown(Phaser.Keyboard.D)) {
        player.body.velocity.x = 150;
      }
      if (cursors.up.isDown || this.input.keyboard.isDown(Phaser.Keyboard.W)) {
        player.body.velocity.y = -150;
      }
      else if (cursors.down.isDown || this.input.keyboard.isDown(Phaser.Keyboard.S)) {
        player.body.velocity.y = 150;
      }

      // player.body.velocity.copyFrom(this.physics.arcade.velocityFromAngle(player.angle, 300));

      // player.body.angularVelocity = -200;
      player.rotation = this.currentRotation() + this.game.math.degToRad(90);
    },

    shoot: function() {
      if (!player.invincible && this.time.now > this.bulletTime) {
        rotation = this.currentRotation();

        if (player.hasDoubleShot) {
          leftPoint = this.leftOffsetPoint.copyFrom(player).add(0,10).rotate(player.x, player.y, rotation-this.game.math.degToRad(180), false);
          rightPoint = this.rightOffsetPoint.copyFrom(player).add(0,10).rotate(player.x, player.y, rotation, false);
          this.createBullet(leftPoint.x, leftPoint.y, rotation);
          this.createBullet(rightPoint.x, rightPoint.y, rotation);
        } else {
          this.createBullet(player.x, player.y + 8, rotation);
        }
        if (player.hasSideShot) {

        }
        laserSound.play();
      }
    },

    createBullet: function(x, y, rotation) {
      bullet = bullets.getFirstExists(false);

      if (bullet) {
        bullet.reset(x, y);
        bullet.rotation = rotation + this.game.math.degToRad(90);
        // bullet.body.velocity.y = -400;
        // this.physics.arcade.moveToPointer(bullet, 400);
        this.physics.arcade.velocityFromRotation(rotation, 400, bullet.body.velocity);
        this.bulletTime = this.time.now + 200;
      }
    },

    bulletHitsEnemy: function(bullet, enemy) {
      bullet.kill();
      if (enemy.hp <= 1) {
        enemy.kill();

        this.score += 10;

        // TODO: add explosion
        var explosion = explosions.getFirstExists(false);
        explosion.reset(enemy.body.x, enemy.body.y);
        explosion.play('explosion', 30, false, true);
        explosionSound.play();
      } else {
        enemy.hp -= 1;
      }
    },

    playerHitsEnemy: function(player, enemy) {
      if (player.hasRagePowerUp) { // TODO: powerup that destroys enemy
        enemy.kill();
      } else {
        this.hitPlayer();
      }
    },

    playerCollectsPowerUp: function(player, powerup) {
      if (!player.invincible) {
        switch (powerup.powerup) {
          case "extralive":
            player.lives += 1;
            break;
          case "duallaser":
            player.hasDoubleShot = true;
            break;
          case "rage":
            player.hasRagePowerUp = true;
            player.ragePowerUptTime = this.time.now + 200;
            break;
          default:
            console.log("WARNING: Powerup '"+powerup.powerup+"' not supported!");
        }
        powerup.kill();
        powerupSound.play();
        this.score += 20;
        // TODO: show powerup text e.g. "Extra Live"
      }
    },

    checkPowerUps: function() {
      if (player.ragePowerUptTime <= this.time.now) {
        player.hasRagePowerUp = false;
      }
    },

    resetPowerUps: function() {
      player.hasRagePowerUp = false;
      player.ragePowerUptTime = 0;
      player.hasDoubleShot = false;
      player.hasSideShot = false;
    },

    hitPlayer: function() {
      if (!player.invincible) {
        console.log('player hit: lives: '+player.lives);
        if (player.lives <= 1) {
          this.resetPowerUps();
          this.killPlayer();
        } else {
          player.lives -= 1;
          this.resetPowerUps();
          player.invincible = true;
          this.invincibleTime = this.time.now + 3000;
          // TODO: remove player from enemy/object
          player.position.y += 50;
          // player hit animation; pulse; change alpha
          player.alpha = 0.5;
          var tween = this.game.add.tween(player).to( { alpha: 1 }, 200, "Linear", true);
          tween.repeat(10, 200);
        }
      }
    },

    resetInvincible: function() {
      if (player.invincible && this.invincibleTime <= this.time.now) {
        player.invincible = false;
      }
    },

    killPlayer: function() {
      player.kill();
      // TODO: GAME OVER Screen
    },

    updateScoreText: function() {
      scoreText.text = scoreString + this.score;
    },

    pause: function() {
      this.game.paused = !this.game.paused;
      this.game.paused ? console.log("Game paused") : console.log("Game continued");
    },

    currentRotation: function() {
      return this.physics.arcade.angleToPointer(player);
    }

};
