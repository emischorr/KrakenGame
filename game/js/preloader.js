GameEngine.Preloader = function (game) {
	this.starfield = null;
	this.map = null;

	this.ready = false;
};

GameEngine.Preloader.prototype = {

	preload: function () {
		//	These are the assets we loaded in Boot.js
		//	A nice sparkly background and a loading progress bar
		// this.background = this.add.sprite(0, 0, 'preloaderBackground');
    this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'preloaderBackground');

		this.preloadBar = this.add.sprite(this.world.centerX, this.world.centerY + 100, 'preloaderBar');
    this.preloadBar.anchor.setTo(0.5);
		//	This sets the preloadBar sprite as a loader sprite.
		//	What that does is automatically crop the sprite from 0 to full-width
		//	as the files below are loaded in.
		this.load.setPreloadSprite(this.preloadBar);

		//	Here we load the rest of the assets our game needs.
		this.loadResources();
	},

	create: function () {
		//	Once the load has finished we disable the crop because we're going to sit in the update loop for a short while as the music decodes
		this.preloadBar.cropEnabled = false;

    this.addGameStates();
	},

	update: function () {
		//	You don't actually need to do this, but I find it gives a much smoother game experience.
		//	Basically it will wait for our audio file to be decoded before proceeding to the MainMenu.
		//	You can jump right into the menu if you want and still play the music, but you'll have a few
		//	seconds of delay while the mp3 decodes - so if you need your music to be in-sync with your menu
		//	it's best to wait for it to decode here first, then carry on.

		//	If you don't have any music in your game then put the game.state.start line into the create function and delete
		//	the update function completely.

		// if (this.cache.isSoundDecoded('titleMusic') && this.ready == false) {
    if (this.ready == false) {
			this.ready = true;
      var game = this;
      setTimeout(function () {
  			game.state.start('MainMenu');
      }, 1000);
		}
	},

  loadResources: function () {
    this.load.image('starfield', 'assets/starfield.png');
    this.load.image('bullet', 'assets/bullet.png');
    // this.load.spritesheet('ship', 'assets/ship.png', 50, 50);
    this.load.image('ship', 'assets/ship.png');

    this.load.tilemap('map', 'assets/maps/map.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.image('tiles', 'assets/maps/tileset.png');

    this.load.script('main-menu',  'js/main-menu.js');
    this.load.script('world',  'js/world.js');
  },

  addGameStates: function () {
    this.state.add("MainMenu", GameEngine.MainMenu);
    this.state.add("World", GameEngine.World);
    // this.state.add("GameOver",GameOver);
    // this.state.add("Credits",Credits);
    // this.state.add("Options",Options);
  }

};
