GameEngine.MainMenu = function (game) {
	this.music = null;
	this.playButton = null;
};

GameEngine.MainMenu.prototype = {

	create: function () {
		//	We've already preloaded our assets, so let's kick right into the Main Menu itself.
		//	Here all we're doing is playing some music and adding a picture and button
		//	Naturally I expect you to do something significantly better :)

    this.stage.backgroundColor = '#242728';

		// this.music = this.add.audio('titleMusic');
		// this.music.play();
		// this.add.sprite(0, 0, 'titlepage');
		// this.playButton = this.add.button(600, 400, 'playButton', this.startGame, this, 2, 1, 0);

    var header = this.add.sprite(this.game.width/2, 150, 'gitkraken');
    header.anchor.set(0.5);
    header.alpha = 0.1;
    this.add.tween(header).to( { alpha: 1 }, 2000, "Linear", true);

    // intro text
    var intro = "Welcome Git Commander, \n\n We have good and bad news for you.\n";
    intro += "Bad news: Some alien guys trying to steal our last commits.\n"
    intro += "Good news: This newly developed GitKraken spaceship left our science lab just last week.\n";
    intro += "So release your Kraken and do your job...";
    var i = this.game.add.text(this.game.width/2, this.game.height/2, intro, { font: "15px Arial", fill: "#fff", align: "center" });
    i.anchor.set(0.5);

    // start game text
    var text = "Click to clone repo...";
    var style = { font: "25px Arial", fill: "#fff", align: "center" };
    var t = this.game.add.text(this.game.width/2, this.game.height/2 + 150, text, style);
    t.anchor.set(0.5);
    t.alpha = 0.1;
    this.add.tween(t).to( { alpha: 1 }, 500, "Linear", true).yoyo(true, 1000).loop(true);
	},

	update: function () {
		//	Do some nice funky main menu effect here
    if(this.input.activePointer.justPressed()) {
      this.state.start('World');
    }
	},

	startGame: function (pointer) {
		//	Ok, the Play Button has been clicked or touched, so let's stop the music (otherwise it'll carry on playing)
		// this.music.stop();

		//	And start the actual game
		this.state.start('World');
	}

};
