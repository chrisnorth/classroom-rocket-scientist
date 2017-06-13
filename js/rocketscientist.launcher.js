// Library of functions for the mission building interface
(function() {

	// Library of functions for the mission building interface
	RocketScientist.prototype.mode = "launch";

	RocketScientist.prototype.init_before = function(){
		this.level = this.query.level;
	}
	RocketScientist.prototype.init_after = function(){
		this.setupLaunch();
		return this;
	}
	
	// Get everything set up for the launch
	RocketScientist.prototype.setupLaunch = function(){

		// Define our choices
		this.choices['bussize'] = this.query['bus'];
		this.choices['bus'] = this.data.bus[this.query['bus']];
		this.choices['solar-panel'] = parseInt(this.query['solar-panel']);
		this.choices['solar-panel-surface'] = this.query['solar-panel-surface'];
		this.choices['type'] = this.query['type'];
		this.choices['orbit'] = this.query['orbit'];
		this.choices['goal'] = parseInt(this.query['goal']);
		this.choices['slots'] = {};

		// Construct a dictionary for filling slots
		for(var i in this.choices['bus'].slots) this.choices['slots'][i] = [];

		// Split the input string of slots into an array
		this.query['slots'] = this.query.slots.split(/;/)
		
		// Remove unnecessary busses
		var s = S('.satellite-holder .holder');
		for(var i = 0; i < s.length; i++){
			if(S(s.e[i]).attr('data-size') != this.choices['bussize']) S(s.e[i]).remove();
		}

		// Show the satellite
		//S('#satellite.not-at-start').removeClass('not-at-start')

		// Loop over the packages
		for(var i = 0; i < this.query.slots.length; i++){

			// Get the slot size
			var type = this.query.slots[i];

			// Get the package data
			var p = (this.data['power'][type] ? this.data['power'][type] : this.data.package[type]);

			// Use the first available slot of the correct size
			var free = S(S('#satellite .slot-empty.slot'+p.slot).e[0]);

			if(p.texture){
				if(p.texture.class) free.addClass(p.texture.class);
				if(p.texture.html){
					var html = p.texture.html;

					// Deal with directions of hemispheres
					if(html.indexOf('south')>=0){
						var dir = "north";
						// Find the required direction
						if(free.hasClass('upwards')) dir = "south";
						if(free.hasClass('downwards')) dir = "north";
						if(free.hasClass('down')) dir = "east";
						if(free.hasClass('up')) dir = "west";
						if(dir == "north") dir += " no-inside";
						html = html.replace('south',dir);
					}
					free.html(html);
				}
				this.log('Removing slot-empty from ',free)
				free.addClass('texture').addClass(type).removeClass('slot-empty');

				// Add this slot
				this.choices['slots'][p.slot].push(type);
			}
		}

		// Add the solar panels 
		var panels = S('#satellite .solar-panels');
		html = "";
		for(var p = 0; p < Math.floor(this.choices['solar-panel']/2); p++) html += '<li class="solar-panel"><\/li>';
		for(var i = 0; i < panels.length; i++) S(panels.e[i]).find('ol').html(html);

		// Add the fixed solar panels
		if(this.choices['solar-panel-surface']) S('#satellite .satellite').addClass('solar-fixed');

		// Get the rocket stages
		for(var i = 0 ; i < this.stages.length; i++){
			for(var j = 0; j < this.data[ this.stages[i] ].length; j++){
				if(this.data[ this.stages[i] ][j].key == this.query[this.stages[i]]){
					//this.choices[this.stages[i]] = this.data[this.stages[i]][j];
					this.setStage(this.stages[i],j);
				}
			}
		}
		this.updateBudgets();

		// Calculate the rocket equation
		if(this.choices.orbit){
			var stages = new Array();
			for(var k = 0; k < this.stages.length; k++) stages.push(this.choices[this.stages[k]]);
			this.eq = rocketEquation(this.choices.orbit,this.data,stages,this.totals.mass);
		}

		setTimeout(function(me){
			me.exhaust = new Exhaust();
			setTimeout(function(){ S('#vehicle').css({'bottom':(S('#launchpad-bg')[0].offsetHeight*1.5)+'px'}); },2000);
		},2000,this);
		
		return this;
	}

	// Make an animated exhaust for a rocket.
	// Requires:
	//   * #vehicle
	//   * #launchpadbg
	// Creates a <canvas> element (#rocketexhaust) where the exhaust is drawn
	function Exhaust(){

		var rocket = S('#vehicle');
		var pad = S('#launchpad-bg');
		if(S('#rocketexhaust').length==0) rocket.before('<canvas id="rocketexhaust"><\/canvas>');
		var canvas = document.getElementById("rocketexhaust");
		var ctx = canvas.getContext("2d");
		this.active = true;
		var c;
		
		// Make the canvas occupy the same space 
		var w = pad[0].offsetWidth, h = pad[0].offsetHeight;
		canvas.width = w;
		canvas.height = h;
		var particles = [];
		var mouse = {};
		
		// Create some particles
		var particle_count = 80;
		for(var i = 0; i < particle_count; i++) particles.push(new particle());
		
		console.log(w,h);
		// Particle class
		function particle(){
			// The speed in both the horizontal and vertical directions
			this.speed = {x: -1+Math.random()*2, y: -5+Math.random()*3};
			// Set the source location to the bottom of the rocket
			this.loc = { x: rocket[0].offsetLeft+(rocket[0].offsetWidth/2)-pad[0].offsetLeft, y: rocket[0].offsetTop + rocket[0].offsetHeight - pad[0].offsetTop - 30 };
			// Size of particle
			this.radius = 5+Math.random()*2;
			// How long it lasts
			this.life = 10+Math.random()*10;
			this.remaining_life = this.life;
			// Make it whitish grey
			this.r = Math.round(Math.random()*55 + 200);
			this.g = this.r;
			this.b = this.r;
		}
		// Keep a copy of ourselves to refer to within draw()
		var _obj = this;

		function draw(){

			// Set the canvas properties
			ctx.globalCompositeOperation = "source-over";
			ctx.fillStyle = "transparent";
			ctx.fillRect(0, 0, w, h);
			
			// Draw all the particles
			for(var i = 0; i < particles.length; i++){
				var p = particles[i];
				ctx.beginPath();
				// Changing opacity according to the life
				// i.e. opacity goes to 0 at the end of life
				p.opacity = Math.round(p.remaining_life/p.life*100)/100
				// Apply a gradient to make it darker around the edge
				var grad = ctx.createRadialGradient(p.loc.x, p.loc.y, 0, p.loc.x, p.loc.y, p.radius);
				c = "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")";
				grad.addColorStop(0, c);
				grad.addColorStop(0.5, c);
				grad.addColorStop(1, "rgba("+Math.round(p.r*0.9)+", "+Math.round(p.g*0.9)+", "+Math.round(p.b*0.9)+", 0)");
				ctx.fillStyle = grad;
				// Draw particle
				ctx.arc(p.loc.x, p.loc.y, p.radius, Math.PI*2, false);
				ctx.fill();
				
				// Move the particles
				p.remaining_life -= 0.5;
				p.radius += 0.5;
				p.loc.x += p.speed.x;
				p.loc.y -= p.speed.y;
				
				// Regenerate the particles
				if(p.remaining_life < 0 || p.radius < 0) particles[i] = new particle();
			}
			// Request a new animation frame if we are still active
			if(_obj.active) requestAnimationFrame(draw);	
		}

		// Start the animation
		draw();

		return this;
	}

	// Function to stop the exhaust animation
	Exhaust.prototype.stop = function(){ this.active = false; }

})();	// Self-closing function
