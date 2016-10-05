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

		return this;
	}


})();	// Self-closing function
