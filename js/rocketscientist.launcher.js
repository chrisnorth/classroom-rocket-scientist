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
		this.choices['mission'] = this.data.scenarios[this.choices['type']].missions[this.choices['goal']];
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

		//console.log(this.eq)

		l = new Launch(this);
		return this;
	}

	function Launch(rocket){

		this.rs = rocket;
		this.terminal = Terminal('#terminal');
		this.step = 1;

		/* Here we need to step through the elements of the launch process */

		// First step is to display the introduction
		this.terminal.append(rocket.data.scenarios[rocket.choices.type].missions[rocket.choices.goal].launch || "");

		//S('#barmenu').append('<div class="baritem"><button id="speedy"><img class="icon options" alt="" src="images/cleardot.gif" /><span>Test</span></button></div>');
		//this.rs.eq.stages[1].cost.toString({'units':this.rs.defaults.currency});

		this.countdown = function(i){

			this.rs.log('countdown');

			var _obj = this;
			if(i > 0){
				this.terminal.append(i.toFixed(0));
				i--;
				// Have we got a spurious timeout set? If so, cancel it.
				if(this.outtatime) clearTimeout(this.outtatime);
				// Create a timeout for the next second of the launch countdown
				this.outtatime = setTimeout(function(){ _obj.countdown(i); },1000);
			}else{
				this.terminal.append(this.rs.data.launch["liftoff"]);
				if(this.outtatime) clearTimeout(this.outtatime);
				this.nextStep();
			}
		}

		this.nextStep = function(){
			console.log(this.step)

			var delay = 1;
			var fn;

			if(this.step==1){

				this.countdown(3);

			}else if(this.step == 2){

				delay = 2.5;
				this.exhaust = new Exhaust();
				fn = function(){
					var dur = 12;
					var h = S('#launchpad-bg')[0].offsetHeight*1.5;
					S('#vehicle').css({'bottom':h+'px','transition':'bottom '+dur+'s ease-in'});
					this.nextStep();
				}

			}else if(this.step == 3){
			
				// Stage separation
			
			}
			this.step++;

			if(typeof fn==="function") setTimeout(function(me){ fn.call(me); },delay*1000,this);
			return this;
		}

		this.nextStep();
		return this;
	}

	function Terminal(selector){
		var el = S(selector);

		function updateScroll(){
			el[0].scrollTop = el[0].scrollHeight;
		}

		this.append = function(txt){
			if(txt){
				el.append(txt+'<br />');
				updateScroll();
			}
			return this;
		}
		return this;	
	}

	// Make an animated exhaust for a rocket.
	// Requires:
	//   * #vehicle
	//   * #launchpadbg
	// Creates a <canvas> element (#rocketexhaust) where the exhaust is drawn
	function Exhaust(){

		var rocket = S('#vehicle');
		var pad = S('#launchpad-mg');
		if(S('#rocketexhaust').length==0) rocket.before('<canvas id="rocketexhaust"><\/canvas>');
		var exhaust = S('#rocketexhaust').css({'bottom':'0px','position':'absolute','left':'0px','width':'100%'});

		var canvas = document.getElementById("rocketexhaust");
		var ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "copy";
		this.active = true;
		var c;
		
		// Make the canvas occupy the same space 
		var w = pad[0].offsetWidth;
		var h = pad[0].offsetHeight*4;
		canvas.width = w;
		canvas.height = h;
		var particles = [];
		var mouse = {};
		var ground = h;
		var tstep = 0;

		// Make an off-screen canvas to draw a single frame to
		// It needs to be the same size as our visible canvas
		var off_canvas = document.createElement('canvas');
		off_canvas.width = w;
		off_canvas.height = h;
		var off_ctx = off_canvas.getContext('2d');
		
		// Create some particles
		var particle_count = 60;
		for(var i = 0; i < particle_count; i++) particles.push(new particle());

		// Particle class
		function particle(){
			// The speed in both the horizontal and vertical directions
			this.speed = {x: -1+Math.random()*2, y: -5+Math.random()*3};
			// Set the source location to the bottom of the rocket
			var bottomofrocket_screen = (rocket[0].offsetTop + rocket[0].offsetHeight);
			var ground_screen = exhaust[0].offsetTop + exhaust[0].offsetHeight;
			this.loc = { x: rocket[0].offsetLeft+(rocket[0].offsetWidth/2), y: exhaust[0].offsetHeight - (ground_screen - bottomofrocket_screen) - 30 };
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
			// Make it transparent
			off_ctx.clearRect(0, 0, w, h);
			off_ctx.globalCompositeOperation = "source-over";

			// Draw all the particles
			for(var i = 0; i < particles.length; i++){
				var p = particles[i];
				off_ctx.beginPath();
				// Changing opacity according to the life
				// i.e. opacity goes to 0 at the end of life
				p.opacity = Math.round(p.remaining_life/p.life*100)/100;
				// Apply a gradient to make it darker around the edge
				var grad = off_ctx.createRadialGradient(p.loc.x, p.loc.y, 0, p.loc.x, p.loc.y, p.radius);
				c = "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")";
				grad.addColorStop(0, c);
				grad.addColorStop(0.5, c);
				grad.addColorStop(1, "rgba("+Math.round(p.r*0.9)+", "+Math.round(p.g*0.9)+", "+Math.round(p.b*0.9)+", 0)");
				off_ctx.fillStyle = grad;
				// Draw particle
				off_ctx.arc(p.loc.x, p.loc.y, p.radius, Math.PI*2, false);
				off_ctx.fill();
				
				// Move the particles
				p.remaining_life -= 0.5;
				p.radius += 0.5;
				p.loc.x += p.speed.x;
				p.loc.y -= p.speed.y;
				if(p.loc.y > h - Math.random()*80) p.loc.x += (Math.random()-0.5)*100*Math.min(1,tstep/120);
				
				// Regenerate the particles
				if(p.remaining_life < 0 || p.radius < 0) particles[i] = new particle();
			}
			tstep++;

			// Draw this frame to the visible canvas
			ctx.drawImage(off_canvas, 0, 0);

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
