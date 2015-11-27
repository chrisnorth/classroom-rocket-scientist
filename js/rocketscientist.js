var rs;

(function(E) {

	// Full Screen API - http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/
	var fullScreenApi = { 
			supportsFullScreen: false,
			isFullScreen: function() { return false; }, 
			requestFullScreen: function() {}, 
			cancelFullScreen: function() {},
			fullScreenEventName: '',
			prefix: ''
		},
		browserPrefixes = 'webkit moz o ms khtml'.split(' ');
	
	// check for native support
	if (typeof document.cancelFullScreen != 'undefined') {
		fullScreenApi.supportsFullScreen = true;
	} else {	 
		// check for fullscreen support by vendor prefix
		for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
			fullScreenApi.prefix = browserPrefixes[i];
			
			if (typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
				fullScreenApi.supportsFullScreen = true;
				
				break;
			}
		}
	}
	
	// update methods to do something useful
	if (fullScreenApi.supportsFullScreen) {
		fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';
		
		fullScreenApi.isFullScreen = function() {
			switch (this.prefix) {	
				case '':
					return document.fullScreen;
				case 'webkit':
					return document.webkitIsFullScreen;
				default:
					return document[this.prefix + 'FullScreen'];
			}
		}
		fullScreenApi.requestFullScreen = function(el) {
			return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
		}
		fullScreenApi.cancelFullScreen = function(el) {
			return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
		}		
	}

	// export api
	window.fullScreenApi = fullScreenApi;
	// End of Full Screen API


	function RocketScientist(data){
		this.maxpanels = 1;
		this.wide = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		this.tall = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		this.defaults = {'currency':'credits', 'length':'m', 'area': 'mxm', 'mass': 'kg', 'power':'watts' };
		this.z = {};
		this.totals = { 'cost': new Convertable(0,this.defaults.currency), 'power': new Convertable(0,this.defaults.power), 'mass':new Convertable(0,this.defaults.mass) };
		this.choices = { 'type':'', 'goal':'', 'mission':'', 'orbit':'', 'bus':'', 'slots':{}, 'solar-panel':0, 'solar-panel-fixed':false };

		this.getSections();
		this.parseQueryString();
		if(data){
			this.data = data;
			this.init();
		}else E().loadJSON('config/en_advanced_options.json',this.init,{'this':this});

		return this;
	}
	RocketScientist.prototype.parseQueryString = function(){
		var r = {};
		var q = location.search;
		if(q && q != '#'){
			// remove the leading ? and trailing &
			q = q.replace(/^\?/,'').replace(/\&$/,'');
			var qs = q.split('&');
			for(var i = 0; i < qs.length; i++){
				var key = qs[i].split('=')[0];
				var val = qs[i].split('=')[1];
				if(/^[0-9\.]+$/.test(val)) val = parseFloat(val);	// convert floats
				r[key] = val;
			}
		}
		// Check if the user-supplied units are allowed
		var c = new Convertable();
		this.testmode = (r['debug']) ? true : false;
		for(u in this.defaults){
			if(r[u] && c.hasUnit(r[u])) this.defaults[u] = r[u];
		}
		return r;
	}
	RocketScientist.prototype.getSections = function(){
		var s = E('section');
		this.sections = [];
		this.navigable = {};
		for(var i = 0 ;i < s.e.length; i++){
			var el = E(s.e[i]);
			if(el.hasClass('view')){
				var id = el.attr('id');
				this.sections.push(id);
				this.navigable[id] = true;
			}
		}
		this.has = {};
		this.has['vw'] = (E('#progressbar').css({'width':'100vw'}).e[0].offsetWidth==this.wide);

		return this;
	}
	// Initiate the Rocket Scientist
	RocketScientist.prototype.init = function(data){

		var _obj = this;

		// Remove classes from script only elements
		E('.scriptonly').toggleClass('scriptonly');

		// Remove elements that show noscript messages
		E('.noscriptmsg').remove();

		// For testing - we add it here before attaching events otherwise they don't fire
		if(this.testmode && !E('body').hasClass('front')){
			E('#menu').append('<li class="baritem"><button id="speedy"><img class="icon options" alt="" src="images/cleardot.gif" /><span>Test</span></button></li>');
			E('#speedy').on('click',function(e){ test(); E('#speedy').parent().remove(); });
		}

		// Set up main menu events
		E('#bar .togglemenu').on('click',{me:this},function(e){ E('#menu').toggleClass('not-at-start'); })
		E('#menu').on('mouseleave',{me:this},function(e){ E('#menu').toggleClass('not-at-start'); })
		E('#menu .restart').on('click',{me:this},function(e){ location.href = location.href.replace(/[\/]+$/,'') + (location.protocol==="file:") ? "index.html" : ""; })

		// If we are on the front page we can update the links for local use
		if(E('body').hasClass('front')){
			if(location.protocol==="file:"){
				var el = E('#start a');
				for(var i = 0; i < el.e.length; i++) el.e[i].href = el.e[i].href+".html";
			}
			return this;
		}

		// Set the data
		if(data) this.data = data;
		if(!this.data) return;
	
		// Add fullscreen to menu if the browser supports it
		if(fullScreenApi.supportsFullScreen) E('#menu .fullscreen').removeClass('not-at-start').find('button').on('click', {me:this}, function(e){ e.data.me.toggleFullScreen(); });

	
		// The maximum number of solar panels is 1 unless set in the input data
		if(this.data.power && this.data.power['solar-panel'] && typeof this.data.power['solar-panel'].max==="number") this.maxpanels = this.data.power['solar-panel'].max;

		// A function that creates Convertable types for any well-defined data structures
		function updateConvertables(o){
			for (var i in o){
				if(typeof o[i]=="object"){
					if(typeof o[i].value!=="undefined" && typeof o[i].units==="string" && typeof o[i].dimension==="string") o[i] = new Convertable(o[i]);
					else o[i] = updateConvertables(o[i]);
				}
			}
			return o;
		} 
		// Loop over the data and update Convertables
		this.data = updateConvertables(this.data);

		this.currentsection = 0;

		// We hide elements that shouldn't be visible (but we are leaving visible
		// in the plain HTML so there is something if Javascript doesn't work.
		for(var s = 0; s < this.sections.length; s++) E('#'+this.sections[s]).addClass('js').addClass('slide').css((s > 0 ? {'visibility':'hidden','left':'-100%'} : {}));

		// Deal with button presses in the type section
		E('#type button').on('click',{me:this},function(e){ _obj.setType(E(e.currentTarget).attr('data-type')); });
	
		// Deal with button presses in the goal section
		E('#goal button').on('click',{me:this},function(e){ _obj.setGoal(E(e.currentTarget).attr('data-goal')); });
	
		// Add events to size selection buttons
		E('#bus .satellite').on('click',{me:this},function(e){
			E(e.currentTarget).parent().find('button').trigger('click');
		});
		E('#bus button').on('click',{me:this},function(e){
			e.data.me.setBus(E(e.currentTarget).attr('data-size'));
		});
	
		// Replace the default behaviour of the navigation links
		E('.prev a').on('click',{me:this},function(e){ if(!E(e.currentTarget).hasClass('disabled')) e.data.me.navigate(e); });
		E('.next a').on('click',{me:this},function(e){ if(!E(e.currentTarget).hasClass('disabled')) e.data.me.navigate(e); }).addClass('disabled');

		// Update all the convertable values
		this.updateConvertables();
	
		// Add events to add/remove buttons
		var _obj;
	
		this.makeSatelliteControls('#satellite');
		this.makeSatelliteControls('#satellite-power');
		this.makeSatelliteControls('#vehicle');

		// Add events to buttons in orbit section
		E('#orbit_list button').on('click',{me:'test'},function(e){ _obj.setOrbit(E(e.currentTarget).attr('data-orbit')); });


		// Add button events for instrument list
		E('#instrument_list button').on('click',{me:'test'},function(e){ _obj.addPackage(e,'instrument'); });
	
		// Add button events for power list
		E('#power_list button').on('click',{me:'test'},function(e){ _obj.addPackage(e,'power'); });

		E('#instrument').on('load',{me:this},function(e){
			e.data.me.log('Loading instrument panel')
			// Reset button states
			//E('#instrument button.add').prop('disabled',false);
			//E('#instrument button.remove').prop('disabled',true);
		})

		// Update rocket stages
		this.sliders = new Array();
		this.stages = ['firststage','secondstage','thirdstage','payloadbay'];
		for(var s = 0; s < this.stages.length; s++){
			var l = this.stages[s];
			this.sliders.push(new Slider(E('.rocket-builder .'+l),{stage:l},function(e){ _obj.setStage(e.data.stage,e.i); }));
			for(var i = 0; i < this.data[l].length; i++) E('.rocket-builder .'+l+' .stage-'+this.data[l][i].key).find('.part').css({'width':(this.data[l][i].diameter.value*10).toFixed(1)+'%'});
		}

		// Reset button states
		this.updateButtons();

		// Quickly set and unset the type to reset the vertical scroll
		this.setType('EO').setType('');
	
		// Deal with orbit selection
		for(var i in this.data.orbit) E('.orrery .'+i).on('click',{'me':this,'orbit':i},function(e){ e.data.me.setOrbit(e.data.orbit); });

		// We'll need to change the sizes when the window changes size
		window.addEventListener('resize', function(event){ _obj.resize(); });
		this.resize();

		// Remove the overlay we've added inline
		E('#overlay').remove();

		return this;
	}
	RocketScientist.prototype.updateConvertables = function(){
		var el,c,i;
		el = E('.convertable');
		for(i = 0; i < el.e.length; i++){
			c = new Convertable(el.e[i]);
			if(this.defaults[c.dimension]) el.e[i].innerHTML = c.toString({'units':this.defaults[c.dimension],'unitdisplayed':(el.e[i].getAttribute('nounits')=="true" ? false : true)});
		};
		return this;
	}
	// Escape HTML characters
	RocketScientist.prototype.htmlDecode = function(input){ var d = document.createElement('div'); d.innerHTML = input; return d.innerHTML; }

	RocketScientist.prototype.setNavigable = function(section,i,state){
		this.navigable[section] = state;
		if(state) this.navs[i].removeClass('disabled');
		else this.navs[i].addClass('disabled');
		return this;
	}
	RocketScientist.prototype.updateNavigation = function(){
		if(!this.navs){
			var navs = E('section nav li a');
			if(navs && navs.e.length > 0){
				this.navs = new Array(navs.e.length);
				for(var i = 0; i < navs.e.length; i++) this.navs[i] = E(navs.e[i]);
			}
		}
		for(var i = 0; i < this.navs.length; i++){
			var href = this.navs[i].attr('href').substr(1);
			if(href=="goal") this.setNavigable(href,i,this.choices.type); // To get to goal we require the type to be set
			else if(href=="bus") this.setNavigable(href,i,typeof this.choices.goal==="number"); // To get to bus we need the goal to be set
			else if(href=="instrument") this.setNavigable(href,i,this.choices.bus);	// To get to the instruments section we need a bus
			else if(href=="power") this.setNavigable(href,i,this.choices.bus);	// To get to the power section we need a bus
			else if(href=="rocket") this.setNavigable(href,i,this.choices.bus);	// To get to the rocket section we need a bus
			else this.navs[i].removeClass('disabled')
		}
		return this;
	}
	RocketScientist.prototype.setBudget = function(){
		this.log('setBudget')
		if(this.choices.type && typeof this.choices.goal==="number") this.choices.mission = this.data.scenarios[this.choices.type].missions[this.choices.goal];
		var d = (!this.choices.mission || this.choices.mission.budget.value==0) ? 'none':'';
		E('#bar .togglecost').css({'display':d});
		E('#bar .togglemass').css({'display':d});
		E('#bar .togglepower').css({'display':d});
		this.updateBudgets();
		this.updateTotals();
		return this;
	}
	RocketScientist.prototype.updateBudgets = function(p,sign){

		var total = { 'cost': new Convertable(0,this.defaults.currency), 'power': new Convertable(0,this.defaults.power), 'mass':new Convertable(0,this.defaults.mass) };
		var power = new Convertable(0,this.defaults.power);

		// Function to add a Convertable to another (applying multiplying factors first)
		function add(tot,p,m){
			if(!m) m = {'cost':1,'mass':1,'power':1};
			for(var i in tot){
				if(p[i] && p[i].typeof=="convertable"){
					var c = p[i].copy();
					c.value *= m[i];
					tot[i].add(c);
				}
			}
			return tot;
		}

		if(this.choices['bus']) total = add(total,this.choices['bus'],{'cost':1,'mass':0,'power':1});	// We don't include mass
		if(this.choices['slots']){
			for(var i in this.choices['slots']){
				for(var j = 0; j < this.choices['slots'][i].length; j++){
					var key = this.choices['slots'][i][j];
					if(this.data.package[key]) total = add(total,this.data.package[key]);
					if(this.data.power[key]){
						total = add(total,this.data.power[key],{'cost':1,'mass':1,'power':0});	// We don't include power
						power.value += this.data.power[key].power.value;	// Store the power here
					}
				}
			}
		}
		if(this.choices['solar-panel']){
			var n = this.choices['solar-panel'];
			total = add(total,this.data.power['solar-panel'],{'cost':n,'mass':n,'power':0});
			power.value += this.data.power['solar-panel'].power.value*n;
		}
		if(this.choices['solar-panel-fixed']){
			var n = this.choices['bus'].area.value;
			total = add(total,this.data.power['solar-panel-surface'],{'cost':n,'mass':n,'power':0});
			power.value += this.data.power['solar-panel-surface'].power.value*n;
		}

		this.totals = total;
		this.power = power;

		this.log('updateBudgets',this.data,this.choices,total,power)
		this.updateTotals();
	}
	RocketScientist.prototype.updateTotals = function(){
		E('#bar .togglecost .cost').html(this.totals.cost.toString({'units':this.defaults.currency}));
		E('#bar .togglemass .mass').html(this.totals.mass.toString({'units':this.defaults.mass}));
		E('#bar .togglepower .power').html(this.totals.power.toString({'units':this.defaults.power}));

		// Update battery-style indicator
		var pc = (this.totals.power.value > 0) ? 100*this.power.value/this.totals.power.value : 0;
		var p = E('#power_indicator');
		p.children('.level').css({'width':Math.min(pc,100)+'%'});
		p.children('.value').html((pc >= 100 ? '&#9889;':'')+Math.round(pc)+'%');
	
		return this;
	}
	RocketScientist.prototype.setType = function(t){
		this.choices['type'] = t;

		// Reset any existing selection
		E('#type button').removeClass('selected');

		if(t){
			// Select this button
			E('#type .'+t+' button').addClass('selected');

			// Update what is displayed in the goals section
			for(s in this.data.scenarios){
				if(t==s) E('#goal .'+s).css({'display':''});
				else E('#goal .'+s).css({'display':'none'});
			}
			// Reset any goals
			this.choices['goal'] = "";
			this.choices['mission'] = "";
			E('#goal button').removeClass('selected');
			this.setBudget();

		}
		this.updateNavigation();
		return this;
	}
	RocketScientist.prototype.setGoal = function(g){
		this.choices['goal'] = parseInt(g);

		// Reset any existing selection
		E('#goal button').removeClass('selected');

		// Select this button
		E(E('#goal .'+this.choices.type+' button').e[this.choices.goal]).addClass('selected');

		// Update the budget
		this.setBudget();

		// Update what is displayed in the instrument requirements
		this.log('Should update the instrument requirements');

		// If this goal comes with a size, we set that
		if(this.data.scenarios[this.choices['type']].missions[this.choices['goal']].size) this.setBus(this.data.scenarios[this.choices['type']].missions[this.choices['goal']].size)

		this.updateNavigation();

		return this;
	}
	// Choose the bus size
	RocketScientist.prototype.setBus = function(size){
		this.log('setBus',size);
		this.choices['bus'] = this.data.bus[size];

		// Reset any previous choices regarding instruments, power options, or rockets
		this.choices['solar-panel'] = 0;
		this.choices['solar-panel-fixed'] = false;
		this.choices['slots'] = "";
		this.updateButtons();
		this.choices['slots'] = {};
		// Construct a dictionary for filling slots
		for(var i in this.choices['bus'].slots) this.choices['slots'][i] = [];

		// Get the selected satellite
		var sat = E('#bus .satellite-'+size[0]);

		// Reset all to black and white
		E('#bus .holder').addClass('blackandwhite');
		// Remove existing selections
		E('#bus .selected').removeClass('selected');

		// Update satellite section with choice
		var html = sat.clone();
		E('#satellite .satellite').replaceWith(html)
		E('#satellite-power .satellite').replaceWith(html)

		// Hide list items that aren't selectable
		var li = E('.list li');
		var s,el;
		// Re-enable all list items
		E('.slot-unavailable').removeClass('slot-unavailable');

		var _obj = this;
		function scaleConvertableByArea(el){
			var props = ['cost','mass','power'];
			var v,j,nv;
			for(j = 0 ; j < props.length; j++){
				if(_obj.data.power['solar-panel-surface'][props[j]].typeof=="convertable"){
					v = el.find('.package_'+props[j]).find('.value');
					console.log('scaleConvertableByArea',_obj.data.power['solar-panel-surface'][props[j]],v.attr('data-dimension'))
					nv = _obj.data.power['solar-panel-surface'][props[j]].convertTo(v.attr('data-dimension'));
					v.attr('data-value',nv.value*_obj.data.bus[size].area.value);
				}
			}
			return;
		}
		for(var i = 0; i < li.e.length; i++){
			el = E(li.e[i]);
			s = el.find('.add').attr('data-size');
			if(s){
				var available = false;
				for(var j in this.data.bus[size].slots){
					if(this.data.bus[size].slots[j] > 0 && j==s) available = true;
				}
				// Hide list items that have a specified slot size that doesn't fit
				if(!available) el.addClass('slot-unavailable');

				// Update values for solar-panel-surface given the surface area
				if(el.attr('data-package') == "solar-panel-surface"){
					if(this.data.bus[size].area.typeof=="convertable") scaleConvertableByArea(el);
				}
			}
		}
		// Update any changed convertables
		this.updateConvertables();

		// Reset the selected DOM elements
		sat.addClass("selected").parent().removeClass("blackandwhite").find('button').addClass('selected');

		this.updateBudgets();
		this.updateNavigation();
		return this;
	}
	RocketScientist.prototype.setOrbit = function(orbit){
		this.choices['orbit'] = orbit;
		this.log('setOrbit',orbit)

		// Remove existing selections
		E('.orrery .selected').removeClass('selected');
		E('#orbit_list .selected').removeClass('selected');
		if(orbit){
			// Select
			E('.orrery .'+orbit).addClass('selected');
			E('#orbit_list .orbit-'+orbit).addClass('selected');
		}
		this.updateNavigation();

		return this;
	}

	RocketScientist.prototype.navigate = function(e){
		e.originalEvent.preventDefault();
		var href = E(e.currentTarget).attr('href');
		var section = href.substr(1);
		if(this.navigable[section]){
			var found = -1;
			var progress = 0;
			for(var i = 0 ; i < this.sections.length; i++){
				if(section==this.sections[i]){
					progress = 100*i/(this.sections.length-1);
					found = i;
				}
			}
			E('#'+section).trigger('load');

			// We know which section we want (found) and we know which we are on (this.currentsection)
			// Remove existing hidden slide classes
			E('.slide-hide').removeClass('slide-hide');
			E('.slide').removeClass('slideOutLeft').removeClass('slideOutRight').removeClass('slideInLeft').removeClass('slideInRight');
			// Although we are using CSS3 animations we also have to manually set properties in CSS as a fallback
			if(found > this.currentsection){
				// Go right
				// Hide all the previous sections if they aren't already
				for(var i = 0; i < this.currentsection;i++) E('#'+this.sections[i]).css({'left':'-100%','margin-left':0});
				// Move the current section off
				E('#'+this.sections[this.currentsection]).addClass('slideOutLeft').css({'left':'-100%','margin-left':0});
				// Move the new section in
				E('#'+this.sections[this.currentsection+1]).addClass('slideInRight').css({'left':'0%','margin-left':0,'visibility':''});
			}else{
				// Go left
				// Move the current section off
				E('#'+this.sections[this.currentsection]).addClass('slideOutRight').css({'left':'-100%','margin-left':'','visibility':''});
				// Bring the new section in
				E('#'+this.sections[found]).focus().addClass('slideInLeft').css({'left':'0%','margin-left':0,'visibility':''});
				// Hide all the following sections if they aren't already
				for(var i = found+2; i < this.sections.length; i++) E('#'+this.sections[i]).css({'margin-left':'0%','left':'-100%','visibility':'hidden'});
			}
			// Update the progress bar
			E('#progressbar .progress-inner').css({'width':progress.toFixed(1)+'%'});
		}
		this.currentsection = found;
		return false;
	}
	RocketScientist.prototype.makeSatelliteControls = function(selector){

		this.z[selector] = {'z':1,'el':E(selector)};
	
		// Create controls for satellite power view
		var zc = this.z[selector].el.find('.zoomcontrol');
		zc.children('.zoomin').on('click',{me:this,by:1.1,z:selector},function(e){ e.data.me.zoom(e.data.z,e.data.by); });
		zc.children('.zoomout').on('click',{me:this,by:1/1.1,z:selector},function(e){ e.data.me.zoom(e.data.z,e.data.by); });
		zc.children('.make3D').on('click',{me:this,z:selector},function(e){ e.data.me.toggle3D(e.data.z); });
		zc.children('.animate').on('click',{me:this,z:selector},function(e){ e.data.me.toggleAnimation(e.data.z); });

		return this;
	}
	RocketScientist.prototype.zoom = function(selector,factor){
		if(this.z[selector].z * factor < 2 && this.z[selector].z * factor > 0.5) this.z[selector].z *= factor;
		this.z[selector].el.css({'font-size':this.z[selector].z.toFixed(3)+'em'});
		return this;
	}
	RocketScientist.prototype.toggle3D = function(element){
		E(element).toggleClass('threeD');
		return this;
	}
	RocketScientist.prototype.toggleAnimation = function(element){
		E(element+' .satellite').toggleClass('spin');
		return this;
	}
	RocketScientist.prototype.addPackage = function(e,to){
		var a = E(e.currentTarget);
		var add = a.hasClass('add') ? true : false;
		var type = a.parent().parent().attr('data-package');
		this.log('addPackage',e,to,type);
		if(to == "instrument") this.processPackage(type,a,"instrument");
		else if(to == "power") this.processPowerPackage(type,a);

		this.updateBudgets();
		this.updateButtons();
		return this;
	}
	// Input is the type of slot e.g. dish-large and the event
	RocketScientist.prototype.processPackage = function(type,el,mode){

		var add = el.hasClass('add') ? true : false;
		var p = (mode=="power") ? this.data['power'][type] : this.data.package[type];
		var slots,slotsp,good;

		if(add){
			// Get the slots
			slots = E('#satellite .slot');
			slotsp = E('#satellite-power .slot');
			good = new Array();
			for(var i = 0; i < slots.e.length; i++){
				var s = E(slots.e[i]);
				if(s.hasClass('slot-empty') && s.hasClass('slot'+p.slot)) good.push([slots.e[i],slotsp.e[i]]);
			}

			// Do we have an available slot?
			if(this.choices['slots'][p.slot].length < this.choices['bus'].slots[p.slot]){
				// Put it in the first available slot
				var goodboth = E(good[0]);
				good = E(good[0][0]);
				if(p.texture){
					if(p.texture.class) goodboth.addClass(p.texture.class);
					if(p.texture.html){
						html = p.texture.html;
						// Deal with directions of hemispheres
						if(html.indexOf('south')>=0){
							var dir = "north";
							// Find the required direction
							if(good.hasClass('upwards')) dir = "south";
							if(good.hasClass('downwards')) dir = "north";
							if(good.hasClass('down')) dir = "east";
							if(good.hasClass('up')) dir = "west";
							if(dir == "north") dir += " no-inside";
							html = html.replace('south',dir);
						}
						goodboth.html(html+good.html());
					}
					this.log('Removing slot-empty from ',goodboth)
					goodboth.addClass('texture').addClass(type).removeClass('slot-empty');
					this.log('Removing slot-empty from ',goodboth.e[1])

					// Add this slot
					this.choices['slots'][p.slot].push(type);
				}
			}
			this.log('addInstrumentPackage',type,this.data.package[type],slots)

			this.log('addInstrumentPackage > slots',this.choices['slots'])

		}else{
			// Get the slots
			slots = E('#satellite .'+type);
			slotsp = E('#satellite-power .'+type);
	
			if(slots.e.length > 0){
				// Remove last one first
				// Put it in the first available slot
				var goodboth = E([slots.e[slots.e.length-1],slotsp.e[slots.e.length-1]]);
				good = E(slots.e[slots.e.length-1]);
				if(p.texture){
					// Put it in the first available slot
					if(p.texture.class) goodboth.removeClass(p.texture.class);
					if(p.texture.html){
						html = p.texture.html;
						// Deal with directions of hemispheres
						if(html.indexOf('south')>=0){
							var dir = "north";
							// Find the required direction
							if(good.hasClass('upwards')) dir = "south";
							if(good.hasClass('downwards')) dir = "north";
							if(good.hasClass('down')) dir = "east";
							if(good.hasClass('up')) dir = "west";
							html = html.replace('south',dir);
						}
						goodboth.html(good.html().replace(html,''));
					}
					this.log('Adding slot-empty from ',goodboth)
					goodboth.removeClass('texture').removeClass(type).addClass('slot-empty');

					var n = this.choices['slots'][p.slot].length;
					if(n > 0){
						for(var i = n-1; i >= 0 ; i--){
							if(this.choices['slots'][p.slot][i]==type){
								this.choices['slots'][p.slot].splice(i,1);
								break;
							}
						}
					}
				}
			}
		}

		this.updateValue(type,el,mode);
		this.log('processPackage',type,el,mode,slotsp,el);
		this.updateNavigation();
		return this;
	}
	RocketScientist.prototype.updateValue = function(type,el,mode){
		this.log('updateValue',type,el,mode)
		var n = 0;
		var p = (mode=="power") ? this.data['power'][type] : this.data.package[type];
		if(type == "solar-panel") n = this.choices['solar-panel'];
		else if(type == "solar-panel-surface") n = (this.choices['solar-panel-fixed'] ? 1 : 0);
		else{
			for(var i = 0; i < this.choices['slots'][p.slot].length; i++){
				if(this.choices['slots'][p.slot][i]==type) n++;
			}
		}
		el.parent().find('.value').html(n > 0 ? '&times;'+n : '');
		if(n > 0) el.parent().parent().addClass('selected')
		else el.parent().parent().removeClass('selected')
		return this;
	}

	RocketScientist.prototype.updateButtons = function(){
		// If we've filled up this slot type we can't add any more 
		// of this type so lose the add buttons otherwise show them
		var add = E('.list .add');
		var rem = E('.list .remove');
		this.log('updateButtons',this.choices['slots'])
		if(this.choices['slots']){
			btn = add.e.concat(rem.e);
			for(var i = 0; i < btn.length; i++){
				var a = E(btn[i]);
				var s = a.attr('data-size');
				var p = a.attr('data-package');
				if(s && p){
					var disable = false;
					if(a.hasClass('add')){
						if(this.choices['slots'][s]) disable = (this.choices['slots'][s].length == this.choices['bus'].slots[s]);
						if(p=="solar-panel") disable = (this.choices['solar-panel'] < this.maxpanels) ? false : true;
						if(p=="solar-panel-surface") disable = (this.choices['solar-panel-fixed']);
					}else if(a.hasClass('remove')){
						var n = 0;
						for(var j in this.choices['slots'][s]) if(this.choices['slots'][s][j] == p) n++;
						if(this.choices['slots'][s]) disable = (this.choices['slots'][s].length == 0 || n==0);
						if(p=="solar-panel") disable = (this.choices['solar-panel'] <= 0);
						if(p=="solar-panel-surface") disable = (!this.choices['solar-panel-fixed']);
					}
					a.prop('disabled',disable);
				}
			}
		}else{
			add.prop('disabled',false);
			rem.prop('disabled',true);
			E('#instrument_list .list-bar .value').html('');
			E('#instrument_list .selected').removeClass('selected')
			E('#power_list .list-bar .value').html('');
			E('#power_list .selected').removeClass('selected')
		}

		//this.log('updateButtons',add,rem)
		return this;
	}

	RocketScientist.prototype.processPowerPackage = function(type,el){
		this.log('processPowerPackage',type,el)
		var add = el.hasClass('add') ? true : false;
		if(type=="solar-panel") this.solarPanel(add,el);
		else if(type=="solar-panel-surface") this.solarFixed(add,el);
		else this.processPackage(type,el,"power");

		this.updateValue(type,el,"power");
		this.updateNavigation();
		return this;
	}
	// Add or remove deployable solar panels up to a maximum
	RocketScientist.prototype.solarPanel = function(add,el){
		this.log('solarPanel',add,el)
		var ps;
		var parent = el.parent();
		var a = parent.children('.add');
		var m = parent.children('.remove');
		var max = this.maxpanels*2;
		if(add){
			var panels = E('#sat-power .solar-panels');
			for(var i = 0; i < panels.e.length; i++){
				ps = panels.e[i].getElementsByTagName('li');
				if(ps.length < this.maxpanels){
					panels.e[i].getElementsByTagName('ol')[0].innerHTML += '<li class="solar-panel"><\/li>';
				}
			}
		}else{
			E('#sat-power .solar-panels li:eq(0)').remove();
		}
		// Find out how many panels we have
		ps = E('#sat-power .solar-panels li');
		this.choices['solar-panel'] = ps.e.length/2;

		return this;
	}
	// Toggle the fixed solar panels
	RocketScientist.prototype.solarFixed = function(add,el){
		var parent = el.parent();
		var p = parent.children('.add');
		var m = parent.children('.remove');
		if(add){
			this.choices['solar-panel-fixed'] = true;
			E('#sat-power .satellite').addClass('solar-fixed');
			p.prop('disabled',true);
			m.prop('disabled',false);
		}else{
			this.choices['solar-panel-fixed'] = false;
			E('#sat-power .satellite').removeClass('solar-fixed');
			p.prop('disabled',false);
			m.prop('disabled',true);
		}
		return this;
	}
	RocketScientist.prototype.setStage = function(stage,i){
		this.log('setStage',stage,i);
		this.choices[stage] = i;
		var h = 0;
		var wide = this.data[stage][i].diameter.value*0.5;
		var tall = this.data[stage][i].height.value*0.5;	// Can't go below 0.5 otherwise the fixed width nozzle messes up
		if(wide < 0) wide = 0;
		if(tall < 0) tall = 0;
		E('.rocket-holder .'+stage).css({'width':wide+'em','height':tall+'em'}).children('.part').html((tall > 0 && stage!="payloadbay") ? '<div class="nozzle"></div>' : '');
		var ok = true;
		var a,b;
		var d = 1e6;
		for(var i = 0; i < this.stages.length; i++){
			a = this.stages[i];
			if(this.choices[a]){
				if(this.data[a][this.choices[a]].diameter.value > d) ok = false;
				d = this.data[a][this.choices[a]].diameter.value;
			}
		}
		if(ok) E('.rocket-holder').removeClass('wobble');
		else E('.rocket-holder').addClass('wobble');
		this.choices['rocket-stable'] = ok;

		return this;
	}
	// Resize function called when window resizes
	RocketScientist.prototype.resize = function(){

		this.wide = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		this.tall = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		var scaleH = !(window.getComputedStyle(E('#bar .left').e[0], null).getPropertyValue('display')==="none");

		function height(el){
			if('getComputedStyle' in window) return parseInt(window.getComputedStyle(el, null).getPropertyValue('height'));
			else return parseInt(el.currentStyle.height);	
		}
		function verticalPadding(el){
			if('getComputedStyle' in window) return (parseInt(window.getComputedStyle(el, null).getPropertyValue('padding-top')) + parseInt(window.getComputedStyle(el, null).getPropertyValue('padding-bottom')));
			else return parseInt(el.currentStyle.paddingTop);	
		}
		var s = E('section');
		var padd = verticalPadding(s.e[0]) + verticalPadding(s.children('.padded').e[0])+2;
		for(var i = 0; i < this.sections.length; i++){
			var page = E('#'+this.sections[i]+' .page');
			if(page.e.length > 0){
				var top = height(page.children('.row-top').e[0]);
				page.css({'height':(scaleH ? (this.tall-padd)+'px' : 'auto')})
				page.children('.row-main').css({'height':(scaleH ? (this.tall-padd-top)+'px' : 'auto')})
			}
		}

		return this;
	}
	RocketScientist.prototype.toggleFullScreen = function(){
		// Get the container
		var elem = E("#application").e[0];

		if(fullScreenApi.isFullScreen()){
			fullScreenApi.cancelFullScreen(elem);
			this.fullscreen = false;
			E('#application').removeClass('fullscreen');
		}else{
			fullScreenApi.requestFullScreen(elem);
			this.fullscreen = true;
			E('#application').addClass('fullscreen');
		}

		return this;
	}
	RocketScientist.prototype.log = function(){
		if(!this.testmode) return this;
		var args = Array.prototype.slice.call(arguments, 0);
		if(console && typeof console.log==="function") console.log('LOG',args);
		return this;
	}

	function Slider(s,data,callback){
		this.el = s;
		this.data = data;
		this.callback = callback;
		this.n = 1.6;	// How many to show
		this.ul = s.find('ul:eq(0)');	// Get the ul
		this.li = this.ul.find('li');	// Get the li
		// Update the property
		if(!this.ul.attr('data-select')) this.ul.attr('data-select','0');	// Set the property if it doesn't exist
		this.setSelected(parseInt(this.ul.attr('data-select')));
		var _obj = this;
		// We'll need to change the sizes when the window changes size
		window.addEventListener('resize',function(e){ _obj.resize(); });
		// Add events to buttons
		this.el.find('button').on('click',{me:this},function(e){ e.data.me.navigate(e); });
		// Set the size
		this.resize();
		return this;
	}
	Slider.prototype.setSelected = function(s){
		var n = this.li.e.length;
		this.selected = ((s+n)%n);
		this.ul.attr('data-select',this.selected);
		this.ul.find('.selected').removeClass('selected');
		E(this.li.e[this.selected]).addClass('selected');
		return this;
	}
	Slider.prototype.navigate = function(e){
		var f = E(e.currentTarget).hasClass('next');
		this.setSelected(this.selected + (f ? 1 : -1));
		this.resize();
		if(typeof this.callback==="function") this.callback.call(this,{i:this.selected,data:this.data});
		return this;
	}
	Slider.prototype.resize = function(){
		function width(el){
			if('getComputedStyle' in window) return parseInt(window.getComputedStyle(el, null).getPropertyValue('width'));
			else return parseInt(el.currentStyle.width);	
		}
		var w = width(this.el.e[0]);
		console.log('resize',w,this.el.e[0])
		this.el.find('.stage').css({'width':(w/this.n).toFixed(1)+'px'});	// Set the widths
		this.el.find('button').css({'width':(w/5).toFixed(1)+'px'});	// Change widths of buttons
		this.ul.css({'margin-left':'-'+((this.selected+0.5)*(w/this.n)).toFixed(1)+'px'});	// Update the offset for the list
		
		return this;
	}

	E.rocketscientist = function(input){
		return new RocketScientist(input);
	};

})(E);	// Self-closing function

// On load
E(document).ready(function(){
	rs = E.rocketscientist(typeof data==="object" ? data : {});
});

function test(){
	// Quick start
	// Trigger selection
	E('#type .NAV button').trigger('click');
	E('#type nav a').trigger('click');
	E('#goal .NAV button:eq(1)').trigger('click');
	E('#goal nav a:eq(1)').trigger('click');
	E('#bus .satellite-l').trigger('click');
	E('#bus nav a:eq(1)').trigger('click');
	E('#orbit_list .orbit-GEO button').trigger('click');
	
	E('#orbit nav a:eq(1)').trigger('click');
	E('#instrument_list .bg4x8:eq(0) .add').trigger('click');
	E('#instrument_list .bg2x4:eq(1) .add').trigger('click');
	E('#instrument_list .bg2x4:eq(2) .add').trigger('click');
	E('#instrument_list .bg2x2:eq(1) .add').trigger('click');
	E('#instrument nav a:eq(1)').trigger('click');
	E('#power nav a:eq(1)').trigger('click');
}	