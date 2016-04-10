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

    this.score = 0;
    this.bulletTime = 0;

};

GameEngine.World.prototype = {

    create: function () {
      this.physics.startSystem(Phaser.Physics.ARCADE);
      this.world.setBounds(0, 0, 800, 5000);

      // Background
      this.stage.backgroundColor = '#373d47';
      starfield = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'starfield');

      // Map
      map = this.add.tilemap('map');
      //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
      map.addTilesetImage('tileset', 'tiles');
      branchLayer = map.createLayer('branches');
      //  This resizes the game world to match the layer dimensions
      // branchLayer.resizeWorld();
      // branchLayer.fixedToCamera = false;
      // branchLayer.scrollFactorX = 0;branchLayer.scrollFactorY = 0;
      // branchLayer.anchor.set(0.5);
      branchLayer.position.x = this.world.width/2 - 225;

      // Player
      player = this.add.sprite(this.world.width/2, this.world.height - 150, 'ship');
      player.anchor.setTo(0.5, 0.5);
      this.physics.arcade.enable(player);
      player.body.collideWorldBounds = true;
      player.body.allowRotation = true;

      //the camera will follow the player in the world
      // this.game.camera.follow(player);
      // set camera to bottom
      this.game.camera.y = this.world.height;

      //  Player bullet group
      bullets = this.add.group();
      bullets.enableBody = true;
      bullets.physicsBodyType = Phaser.Physics.ARCADE;
      bullets.createMultiple(30, 'bullet');
      bullets.setAll('anchor.x', 0.5);
      bullets.setAll('anchor.y', 1);
      bullets.setAll('outOfBoundsKill', true);
      bullets.setAll('checkWorldBounds', true);

      // Enemies
      enemies = this.add.group();
      enemies.enableBody = true;
      enemies.physicsBodyType = Phaser.Physics.ARCADE;
      enemies.createMultiple(30, 'ship');
      enemies.setAll('anchor.x', 0.5);
      enemies.setAll('anchor.y', 1);
      enemies.setAll('outOfBoundsKill', true);
      enemies.setAll('checkWorldBounds', true);

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
    },

    update: function () {
      //  Scroll the background
      starfield.tilePosition.y += 2;
      // branchLayer.position.y -= 2;
      this.camera.y -= 1;

      this.playerMovement();
      if (this.input.activePointer.leftButton.isDown || this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        this.fireBullet();
      }

      // prevent player from leaving camera to the bottom
      if (player.position.y + player.height/2 >= this.camera.y+600) {
        player.position.y = this.camera.y+600 - player.height/2;
      }
      // prevent player from leaving camera to the top
      if (player.position.y - player.height/2 <= this.camera.y) {
        player.position.y = this.camera.y + player.height/2;
      }
    },

    render: function() {
      this.game.debug.cameraInfo(this.camera, 32, 32);
      // this.game.debug.spriteBounds(player);
      // this.game.debug.spriteInfo(player, 20, 32);
    },

    quitGame: function (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //  Then let's go back to the main menu.
        this.state.start('MainMenu');

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
      player.rotation = this.currentRotation();
    },

    fireBullet: function() {
      if (this.time.now > this.bulletTime) {
        bullet = bullets.getFirstExists(false);

        if (bullet) {
          bullet.reset(player.x, player.y + 8);
          bullet.rotation = this.currentRotation();
          // bullet.body.velocity.y = -400;
          this.physics.arcade.moveToPointer(bullet, 400);
          this.bulletTime = this.time.now + 200;
        }
      }
    },

    pause: function() {
      this.game.paused = !this.game.paused;
      this.game.paused ? console.log("Game paused") : console.log("Game continued");
    },

    currentRotation: function() {
      return this.physics.arcade.angleToPointer(player) + this.game.math.degToRad(90);
    }

};
