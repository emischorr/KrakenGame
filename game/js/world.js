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

    this.commitGroupIndex = 0;
    this.commitsLostList = [];

    this.mapOffsetX = 0;
    this.goalline = 0;

    this.score = 0;
    this.commitsLost = 0;
    this.bulletTime = 0;
    this.invincibleTime = 0;

    this.leftOffsetPoint = new Phaser.Point();
    this.rightOffsetPoint = new Phaser.Point();

    this.stateText = null;
    this.infoText = null;
    this.infoTextTimer = 0;

    this.engineEmitter = null;
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

      // Particles
      // this.setupParticles();

      // Player
      player = this.add.sprite(this.world.centerX, this.world.height - 150, 'ship');
      player.anchor.setTo(0.5, 0.5);
      this.physics.arcade.enable(player);
      player.body.collideWorldBounds = true;
      player.body.allowRotation = true;

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

      transparentBg = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'bg_trans');
      transparentBg.visible = false;

      //  Score
      scoreString = 'Score : ';
      scoreText = this.add.text(10, 10, scoreString + this.score, { font: '24px Arial', fill: '#fff' });
      scoreText.fixedToCamera = true;

      commitsString = 'Commits lost : ';
      commitsText = this.add.text(10, 40, commitsString + this.commitsLost, { font: '24px Arial', fill: '#fff' });
      commitsText.fixedToCamera = true;

      this.stateText = this.add.text(this.camera.width/2, this.camera.height/2, ' ', { font: '44px Arial', fill: '#a33', align: "center" });
      this.stateText.anchor.setTo(0.5, 0.5);
      this.stateText.visible = false;
      this.stateText.fixedToCamera = true;

      this.infoText = this.add.text(this.camera.width/2, 50, 'TEST', { font: '24px Arial', fill: '#fff', align: "center" });
      this.infoText.anchor.setTo(0.5, 0.5);
      this.infoText.visible = false;
      this.infoText.fixedToCamera = true;

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

      this.startGame();
    },

    update: function () {
      //  Scroll the background
      starfield.tilePosition.y += 0.8;
      // branchLayer.position.y -= 2;
      if (player.lives >= 1) {
        this.camera.y -= 1;
      }

      this.checkGoal();
      this.resetInvincible();
      this.checkPowerUps();

      this.moveEnemies();

      this.playerControl();

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

      this.checkEnemiesMissed();

      this.updateHUDText();
      this.checkInfoText();

      if(player.lives == 0 && this.input.activePointer.justPressed()) {
        // this.startGame();
        this.state.start('MainMenu');
      }

      // update particles
      // this.engineEmitter.minParticleSpeed.set(px, py);
      // this.engineEmitter.maxParticleSpeed.set(px, py);
      //
      // this.engineEmitter.emitX = player.x;
      // this.engineEmitter.emitY = player.y;
    },

    render: function() {
      // this.game.debug.cameraInfo(this.camera, 32, 32);
      // this.game.debug.spriteBounds(player);
      // this.game.debug.spriteInfo(player, this.camera.width-400, 32);
    },

    startGame: function () {
      this.game.camera.y = this.world.height;

      player.lives = 1;
      player.hasDoubleShot = false;
    },

    quitGame: function (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //  Then let's go back to the main menu.
        this.state.start('MainMenu');

    },



    setupParticles: function() {
      this.engineEmitter = this.add.emitter(this.world.centerX, this.world.centerY, 400);
      this.engineEmitter.makeParticles( [ 'fire1', 'fire2', 'fire3', 'smoke' ] );

      this.engineEmitter.gravity = 200;
      this.engineEmitter.setAlpha(1, 0, 3000);
      this.engineEmitter.setScale(0.8, 0, 0.8, 0, 3000);

      this.engineEmitter.start(false, 3000, 5);
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
        } else if (element.name === "goal") {
          self.goalline = element.y;
          console.log("set goal to: "+this.goalline);
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
        e.commitGroup = this.commitGroupIndex;
        e.originX = e.x;
        e.originY = e.y;
        e.autoCull = true;
      };

      this.commitGroupIndex += 1;
    },

    checkGoal: function() {
      if ((this.camera.y + this.camera.height/2) <= this.goalline) {
        this.gameWin();
      }
    },

    checkEnemiesMissed: function() {
      var self = this
      enemies.forEach(function(e) {
        // seems kill() does not remove the sprite
        if (e.alive && e.y >= self.game.camera.y + self.game.camera.height) {
          self.enemyOut(e);
        }
      })
    },

    enemyOut: function(enemy) {
      if (!this.commitsLostList.includes(enemy.commitGroup)) {
        this.commitsLostList += enemy.commitGroup;
        console.log("commit missed");
        // this.showInfoText("Commit lost");
        this.commitsLost += 1;
        this.score -= 50;
        enemy.kill();
      }
    },

    moveEnemies: function() {
      var self = this;
      var rnd = this.game.rnd;
      enemies.forEach(function(enemy) {
        //TODO: add tween
        rndX = rnd.integerInRange(-1, 1);
        rndY = rnd.integerInRange(-1, 1);
        if ( self.math.difference(enemy.originX, enemy.position.x + rndX) < 20 ) {
          enemy.position.x += rndX;
        }
        if ( self.math.difference(enemy.originY, enemy.position.y + rndY) < 20 ) {
          enemy.position.y += rndY;
        }
      });
    },

    playerControl: function() {
      player.body.velocity.setTo(0, 0);
      player.body.angularVelocity = 0;

      if (player.lives >= 1) {
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

        if (this.input.activePointer.leftButton.isDown || this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
          this.shoot();
        }
      }
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

        // explosion
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
            this.showInfoText("Extra Live");
            break;
          case "duallaser":
            player.hasDoubleShot = true;
            this.showInfoText("Laser Upgrade");
            break;
          case "rage":
            player.hasRagePowerUp = true;
            player.ragePowerUptTime = this.time.now + 3000;
            this.showInfoText("RAGE!");
            break;
          case "cherrypick":
            this.score += 100;
            this.showInfoText("Cherry Pick");
            break;
          default:
            console.log("WARNING: Powerup '"+powerup.powerup+"' not supported!");
        }
        powerup.kill();
        powerupSound.play();
        this.score += 20;
      }
    },

    checkPowerUps: function() {
      if (player.hasRagePowerUp && player.ragePowerUptTime <= this.time.now) {
        player.hasRagePowerUp = false;
        this.showInfoText("RAGE is over");
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
          this.gameOver();
        } else {
          player.lives -= 1;
          this.resetPowerUps();
          player.invincible = true;
          this.invincibleTime = this.time.now + 3000;
          // remove player from enemy/object
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

    gameOver: function() {
      console.log("game over");
      this.resetPowerUps();
      player.lives = 0;
      player.kill();
      this.stateText.text=" GAME OVER \n Click to 'git reset --hard'";
      this.stateText.visible = true;
      transparentBg.visible = true;
      // this.game.paused = true;
    },

    gameWin: function() {
      console.log("You win");
      this.score += player.lives*100;
      this.resetPowerUps();
      player.lives = 0;
      this.stateText.text=" YOU WIN! \n Click to 'git commit' your score";
      //TODO: set text style ?!
      this.stateText.visible = true;
      transparentBg.visible = true;
    },

    updateHUDText: function() {
      scoreText.text = scoreString + this.score;
      commitsText.text = commitsString + this.commitsLost;
    },

    pause: function() {
      this.game.paused = !this.game.paused;
      this.game.paused ? console.log("Game paused") : console.log("Game continued");
    },

    currentRotation: function() {
      return this.physics.arcade.angleToPointer(player);
    },

    showInfoText: function(text) {
      this.infoText.text = text;
      this.infoText.visible = true;
      this.infoTextTimer = this.time.now + 2000;
    },

    checkInfoText: function() {
      if (this.infoText.visible && this.infoTextTimer <= this.time.now) {
        this.infoText.visible = false;
      }
    }

};
