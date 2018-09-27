var rs;

(function(S) {

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
	if(typeof document.cancelFullScreen != 'undefined') {
		fullScreenApi.supportsFullScreen = true;
	}else{
		// check for fullscreen support by vendor prefix
		for(var i = 0, il = browserPrefixes.length; i < il; i++ ) {
			fullScreenApi.prefix = browserPrefixes[i];
			if(typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
				fullScreenApi.supportsFullScreen = true;
				break;
			}
		}
	}

	// update methods to do something useful
	if(fullScreenApi.supportsFullScreen) {
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
		this.defaults = {'currency':'credits', 'length':'m', 'area': 'mxm', 'mass': 'kg', 'power':'watts', 'powerdensity':'watts/m^2','velocity':'km/s'};
		this.z = {};
		this.totals = { 'cost': new Convertable(0,this.defaults.currency), 'power': new Convertable(0,this.defaults.power), 'mass':new Convertable(0,this.defaults.mass) };
		this.choices = { 'type':'', 'goal':'', 'mission':'', 'orbit':'', 'bus':'', 'slots':{}, 'solar-panel':0, 'solar-panel-surface':false, 'bussize':'', 'stable': false, 'fueled': false };
		this.requirements = new Array();
		this.stages = ['firststage','secondstage','thirdstage','payloadbay'];

		this.getSections();

		this.query = this.parseQueryString();

		// If we have a function to run before init(), call it now
		if(typeof this.init_before === "function") this.init_before();

		if(data) this.init(data);
		else S().loadJSON('config/en_'+(this.level || "advanced")+'_options.json',this.init,{'this':this});

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
				if(/^(true|false)$/.test(val)) val = (val == "true" ? true : false);
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
	// Initiate the Rocket Scientist
	RocketScientist.prototype.init = function(data){

		// Remove classes from script only elements
		S('.scriptonly').toggleClass('scriptonly');

		// Remove elements that show noscript messages
		S('.noscriptmsg').remove();

		// For testing - we add it here before attaching events otherwise they don't fire
		if(this.testmode && !S('body').hasClass('front') && this.mode=="build"){
			S('#menu').append('<li class="baritem"><button id="speedy"><img class="icon options" alt="" src="images/cleardot.gif" /><span>Test</span></button></li>');
			S('#speedy').on('click',function(e){ test(); S('#speedy').parent().remove(); });
		}

		// Set up main menu events
		S('#bar .togglemenu').on('click',{me:this},function(e){ S('.dropdown').addClass('not-at-start'); S('#menu').toggleClass('not-at-start'); })
		S('#bar .togglecost').on('click',{me:this},function(e){ S('.dropdown').addClass('not-at-start'); S('#menu-cost').toggleClass('not-at-start'); })
		S('#bar .togglepower').on('click',{me:this},function(e){ S('.dropdown').addClass('not-at-start'); S('#menu-power').toggleClass('not-at-start'); })
		S('#bar .togglemass').on('click',{me:this},function(e){ S('.dropdown').addClass('not-at-start'); S('#menu-mass').toggleClass('not-at-start'); })
		S('#menu').on('mouseleave',{me:this},function(e){ S('#menu').toggleClass('not-at-start'); })
		S('#menu-mass').on('mouseleave',{me:this},function(e){ S('#menu-mass').toggleClass('not-at-start'); })
		S('#menu-power').on('mouseleave',{me:this},function(e){ S('#menu-power').toggleClass('not-at-start'); })
		S('#menu-cost').on('mouseleave',{me:this},function(e){ S('#menu-cost').toggleClass('not-at-start'); })
		S('#menu .restart').on('click',{me:this},function(e){ location.href = location.href.replace(/[\/]+$/,'') + (location.protocol==="file:") ? "index.html" : ""; })
		S('#menu .units').on('click',{me:this},function(e){ S('#units').removeClass('not-at-start'); S('body').addClass('nooverflow'); });
		S('#menu .about').on('click',{me:this},function(e){ S('#about').removeClass('not-at-start'); S('body').addClass('nooverflow'); });
		S('#menu .guide').on('click',{me:this},function(e){ S('#guide').removeClass('not-at-start'); S('body').addClass('nooverflow'); });
		S('#menu .help').on('click',{me:this},function(e){ S('#help').removeClass('not-at-start'); S('body').addClass('nooverflow'); });
		S('#units .close').on('click',{me:this},function(e){ S('#units').addClass('not-at-start'); S('body').removeClass('nooverflow'); });
		S('#about .close').on('click',{me:this},function(e){ S('#about').addClass('not-at-start'); S('body').removeClass('nooverflow'); });
		S('#guide .close').on('click',{me:this},function(e){ S('#guide').addClass('not-at-start'); S('body').removeClass('nooverflow'); });
		S('#help .close').on('click',{me:this},function(e){ S('#help').addClass('not-at-start'); S('body').removeClass('nooverflow'); });

		// Deal with changes to the unit selectors
		S('#units select').on('change',{me:this},function(e){
			// Get the unit type
			var u = this.attr('data-units');
			if(typeof u==="string"){
				// Set to the selected value
				e.data.me.defaults[u] = this[0].value;
				// Update all the convertables
				e.data.me.updateConvertables();
			}
		});
		// Add fullscreen to menu if the browser supports it
		if(fullScreenApi.supportsFullScreen) S('#menu .fullscreen').removeClass('not-at-start').find('button').on('click', {me:this}, function(e){ e.data.me.toggleFullScreen(); });

		// If we are on the front page we can update the links for local use
		if(S('body').hasClass('front')){
			if(location.protocol==="file:"){
				var el = S('#start a');
				for(var i = 0; i < el.length; i++){
					el[i].href = el[i].href+".html";
				}
			}else{
				var el = S('#start a');
				for(var i = 0; i < el.length; i++){
					if (el[i].href.substring(el[i].href.length-4)==="html"){el[i].href=el[i].href;}
					else{el[i].href = el[i].href+".html";}
				}
			}
			return this;
		}

		// Set the data
		if(data) this.data = data;
		if(!this.data) return;


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

		// Update all the convertable values
		this.updateConvertables();

		var _obj = this;

		// We'll need to change the sizes when the window changes size
		window.addEventListener('resize', function(event){ _obj.resize(); });
		this.resize();

		// Remove the overlay we've added inline
		S('#overlay').remove();

		if(typeof this.init_after === "function") this.init_after();

		return this;
	}
	RocketScientist.prototype.updateConvertables = function(){
		this.log('updating Convertables')
		var el,c,i;
		el = S('.convertable');
		for(i = 0; i < el.length; i++){
			c = new Convertable(el[i]);
			if(this.defaults[c.dimension]) el[i].innerHTML = c.toString({'units':this.defaults[c.dimension],'unitdisplayed':(el[i].getAttribute('nounits')=="true" ? false : true)});
		};
		return this;
	}
	// Escape HTML characters
	RocketScientist.prototype.htmlDecode = function(input){ var d = document.createElement('div'); d.innerHTML = input; return d.innerHTML; }

	RocketScientist.prototype.setNavigable = function(section,i,state){
		this.navigable[section] = state;
		this.log('setNavigable',section,i,state)
		if(state) this.navs[i].removeClass('disabled');
		else this.navs[i].addClass('disabled');
		return this;
	}
	RocketScientist.prototype.updateNavigation = function(){
		if(!this.navs){
			var navs = S('section nav li a');
			if(navs && navs.length > 0){
				this.navs = new Array(navs.length);
				for(var i = 0; i < navs.length; i++) this.navs[i] = S(navs[i]);
			}
		}
		if(this.navs){
			for(var i = 0; i < this.navs.length; i++){
				var href = this.navs[i].attr('href').substr(1);
				if(href=="goal") this.setNavigable(href,i,this.choices.type); // To get to goal we require the type to be set
				else if(href=="bus") this.setNavigable(href,i,typeof this.choices.goal==="number"); // To get to bus we need the goal to be set
				else if(href=="instrument") this.setNavigable(href,i,this.choices.bus);	// To get to the instruments section we need a bus
				else if(href=="power") this.setNavigable(href,i,this.choices.bus);	// To get to the power section we need a bus
				else if(href=="rocket") this.setNavigable(href,i,this.choices.bus);	// To get to the rocket section we need a bus
				else this.setNavigable(href,i,true); // We can get to the orbit section regardless
			}
		}
		return this;
	}
	RocketScientist.prototype.setBudget = function(){
		this.log('setBudget')
		if(this.choices.type && typeof this.choices.goal==="number") this.choices.mission = this.data.scenarios[this.choices.type].missions[this.choices.goal];
		var d = (!this.choices.mission || this.choices.mission.budget.value==0) ? 'none':'';
		S('#bar .togglecost').css({'display':d});
		S('#bar .togglemass').css({'display':d});
		S('#bar .togglepower').css({'display':d});
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
					if(c.value != Infinity) c.value *= m[i];
					else c.value = (m[i]==0) ? 0 : Infinity;
					tot[i].add(c);
				}
			}
			return tot;
		}

		if(this.choices['bus']) total = add(total,this.choices['bus'],{'cost':1,'mass':1,'power':1});	// We don't include mass
		if(this.choices['slots']){
			for(var i in this.choices['slots']){
				for(var j = 0; j < this.choices['slots'][i].length; j++){
					var key = this.choices['slots'][i][j];
					if(this.data['package'][key]) total = add(total,this.data['package'][key]);
					if(this.data['power'][key]){
						total = add(total,this.data['power'][key],{'cost':1,'mass':1,'power':0});	// We don't include power
						power.value += this.data['power'][key].power.value;	// Store the power here
					}
				}
			}
		}
		if(this.choices['solar-panel']){
			var n = this.choices['solar-panel'];
			total = add(total,this.data['power']['solar-panel'],{'cost':n,'mass':n,'power':0});
			power.value += this.data['power']['solar-panel'].power.value*n;
		}
		if(this.choices['solar-panel-surface']){
			var n = (this.choices['bus'].area) ? this.choices['bus'].area.convertTo('m^2').value : 0;
			var pow = new Convertable(0,'watts','power');
			var p = this.data['power']['solar-panel-surface'].power.copy();
			if(p.dimension == "powerdensity") pow.value = p.convertTo('watts/m^2').value * n;
			else if(p.dimension == "power") pow.value = p.convertTo('watts').value * n;
			total = add(total,this.data['power']['solar-panel-surface'],{'cost':n,'mass':n,'power':0});
			power.value += pow.value;
		}

		// Add costs from rocket stages
		for(var s = 0; s < this.stages.length ; s++){
			if(this.choices[this.stages[s]]) total = add(total,this.choices[this.stages[s]],{'cost':1,'mass':0,'power':0});	// We don't include mass or energy
		}

		this.totals = total;
		this.power = power;

		this.log('updateBudgets',this.data,this.choices,total,power);
	}
	RocketScientist.prototype.updateTotals = function(){
		this.log('updateTotals');
		S('#bar .togglecost .cost').html(this.totals.cost.toString({'units':this.defaults.currency}));
		S('#menu-cost .menucost .cost').html(this.totals.cost.toString({'units':this.defaults.currency}));
		if(this.choices.mission.budget){
			S('#menu-cost .menubudget .cost').html(this.choices.mission.budget.toString({'units':this.defaults.currency}));
			if(this.totals.cost.value <= this.choices.mission.budget.value) {
				S('#bar .togglecost').removeClass('overbudget');
				this.choices.inbudget=true;
			}else {
				S('#bar .togglecost').addClass('overbudget');
				this.choices.inbudget=false;
			}
		}
		S('#bar .togglemass .mass').html(this.totals.mass.toString({'units':this.defaults.mass}));
		S('#bar .togglepower .power').html(this.totals.power.toString({'units':this.defaults.power}));
		S('#menu-power .menupowerreq .power').html(this.totals.power.toString({'units':this.defaults.power}));
		S('#menu-power .menupoweravail .power').html(this.power.toString({'units':this.defaults.power}));
		// Update battery-style indicator
		var pc = (this.power.value == Infinity) ? 100 : (this.totals.power.value > 0 ? 100*this.power.value/this.totals.power.value : 100);
		var p = S('#power_indicator');
		p.children('.level').css({'width':Math.min(pc,100)+'%'});
		p.children('.value').html((pc >= 100 ? '&#9889;':'')+Math.round(pc)+'%');
		if (this.totals.power.value <= this.power.value){
			S('#bar .togglepower').removeClass('overbudget');
			this.choices.powered=true
		}else{
			S('#bar .togglepower').addClass('overbudget');
			this.choices.powered=false;
		}
		if(this.choices.orbit){
			var stages = new Array();
			for(var k = 0; k < this.stages.length; k++) stages.push(this.choices[this.stages[k]] ? this.choices[this.stages[k]] : this.data[this.stages[k]][0]);
			var eq = rocketEquation(this.choices.orbit,this.data,stages,this.totals.mass);
			pc = (this.choices.payloadbay && this.choices.payloadbay.drymass.value > 0) ? (100*eq.deltav.total.value/eq.deltav.required.value) : 0;
			if ((this.level=="beginner")&(pc>0)) pc=100
			var dv = S('#deltav_indicator');
			// dv.attr('class','meter').addClass('orbit-'+this.choices.orbit);
			dv.find('.level').css({'width':(pc > 100 ? 100 : pc).toFixed(3)+'%'});
			dv.find('.value').html(pc.toFixed(1)+'%');
			if(pc >= 100){
				S('#deltav_indicator_light').addClass('on');
				this.choices['fueled'] = true;
			}else{
				S('#deltav_indicator_light').removeClass('on');
				this.choices['fueled'] = false;
			}
			dvavail=new Convertable(eq.deltav.total.value,'m/s','velocity')
			dvreq=new Convertable(eq.deltav.required.value,'m/s','velocity')
			S('#menu-mass .menudvreq .deltav').html(dvreq.toString({'units':this.defaults.velocity}));
			S('#menu-mass .menudvavail .deltav').html(dvavail.toString({'units':this.defaults.velocity}));
		}
		if((this.choices.payloadbay)&&(this.choices.bus)){
			this.choices['bigenough'] = (this.choices.payloadbay.size >= this.choices.bus.width.value)
		}
		return this;
	}
	RocketScientist.prototype.setType = function(t){
		this.choices['type'] = t;

		// Reset any existing selection
		S('#type button').removeClass('selected');

		if(t){
			// Select this button
			S('#type .'+t+' button').addClass('selected');

			// Update what is displayed in the goals section
			for(s in this.data.scenarios){
				if(t==s) S('#goal .'+s).css({'display':''});
				else S('#goal .'+s).css({'display':'none'});
			}
			// Reset any goals
			this.choices['goal'] = "";
			this.choices['mission'] = "";
			S('#goal button').removeClass('selected');
			this.setBudget();

		}
		this.updateNavigation();
		return this;
	}
	RocketScientist.prototype.setGoal = function(g){
		this.choices['goal'] = parseInt(g);

		// Reset any existing selection
		S('#goal button').removeClass('selected');

		// Select this button
		S(S('#goal .'+this.choices.type+' button')[this.choices.goal]).addClass('selected');

		// Update the budget
		this.setBudget();

		// Update what is displayed in the instrument requirements
		this.log('Set the instrument requirements');
		this.updateRequirements();

		// If this goal/mission comes with a bus size or orbit, we set them
		this.setDefault('bus');
		this.setDefault('orbit');

		// Update the navigation
		this.updateNavigation();

		return this;
	}
	// Function to take a preset choice from the chosen scenario
	RocketScientist.prototype.setDefault = function(key){
		this.log('setDefault',key)
		if(!key) return;
		if(this.choices['type'] && typeof this.choices['goal']==="number"){
			// Look for If this goal/mission comes with a bus size, we set that
			var m = this.data.scenarios[this.choices['type']].missions[this.choices['goal']];
			if(m.choices){
				// If a choice for this key has been pre-set by the mission, we use that
				if(m.choices[key]){
					// Ideally we would validate the input here
					this.log('Auto-setting '+key+' to '+m.choices[key],m);
					if(key=="bus") this.setBus(m.choices[key]);
					if(key=="orbit") this.setOrbit(m.choices[key]);
				}else this.log('No preset for '+key);
			}
		}
	}
	RocketScientist.prototype.updateRequirements = function(){
		this.log('updateRequirements',this.choices['type'],this.choices['goal']);
		// Each requirement object consists of:
		//  type: key (string) e.g. "package", "power", "orbit", "bus"
		//	oneof: array (strings)
		//	label: value (string)
		//	error: value (string)
		this.requirements = new Array();
		var c;
		if(this.data.scenarios[this.choices['type']].missions[this.choices['goal']].requires) this.requirements = this.requirements.concat(this.data.scenarios[this.choices['type']].missions[this.choices['goal']].requires);
		if(this.choices['slots']){
			// Loop over the slot types
			for(var slottype in this.choices['slots']){
				// For each slot key, find out if it has any requirements
				for(var i = 0; i < this.choices['slots'][slottype].length ;i++){
					c = this.choices['slots'][slottype][i];
					// Add the requirements to our array
					if(this.data['package'][c] && this.data['package'][c].requires) this.requirements = this.requirements.concat(this.data['package'][c].requires);
					if(this.data['power'][c] && this.data['power'][c].requires) this.requirements = this.requirements.concat(this.data['power'][c].requires);
				}
			}
		}

		if(this.data['rocket'] && this.data['rocket'].requires){
			for(var i = 0; i < this.data['rocket'].requires.length; i++) this.requirements = this.requirements.concat(this.data['rocket'].requires[i]);
		}

		if(this.data['missionreq'] && this.data['missionreq'].requires){
			for(var i = 0; i < this.data['missionreq'].requires.length; i++) this.requirements = this.requirements.concat(this.data['missionreq'].requires[i]);
		}

		// See which requirements are met
		this.checkRequirements();

		// The keys are the HTML <section> IDs and the values are the JSON data keys
		var sections = {'orbit':'orbit','instrument':'package','power':'power','rocket':'rocket','goal':'goal'};
		var ul,li,i,l,notlisted,j,e;
		var requirementslist = "";
		var requirementslistlaunch = "";
		var requirementssectionlist = "";
		var sectionexists;
		var listedLaunch = new Array();
		if (S('#fixme').length > 0){
			var fixme = S('#fixme')[0].innerHTML;
		}else{fixme=''}
		for(var s in sections){
			// Remove existing requirements
			S('#'+s+' .requirements ul').remove();
			S('#'+s+' .requirements ol').remove();
			ul = S('#'+s+' .requirements h3');
			li = "";
			var listed = new Array();
			sectionexists = (S('#'+s).length > 0);
			for(var i = 0; i < this.requirements.length; i++){
				// for(var is = 0 ; is < this.data['sections'].length; is++){
				// 	this.log(s,sections[s],is,this.data['sections'][is]['id'],(this.data['sections'][is]['id']==sections[s]))
				// 	if (this.data['sections'][is]['id']==sections[s]){
				// 		is==s
				// 	}
				// }
				// this.log(is,this.data['sections'][is])
				if((this.requirements[i]['showin'] == sections[s] || this.requirements[i]['type'] == sections[s]) && this.requirements[i]['label'] != ""){
				// if((this.requirements[i]['type'] == sections[s]) && this.requirements[i]['label'] != ""){
					if(typeof this.requirements[i]['label'] === "undefined") this.requirements[i]['label'] = "";
					l = "<li"+((this.data.options && this.data.options['require-hint']) ? (this.requirements[i]['met'] ? ' class="met"' : ' class="notmet"') : "")+">"+this.requirements[i]['label']+"</li>";
					e = "<li"+((this.data.options && this.data.options['require-hint']) ? (this.requirements[i]['met'] ? ' class="met"' : ' class="notmet"') : "")+">"
					e += this.requirements[i]['error']+
					((this.data.options && this.data.options['fix-links']) ? '&nbsp;<a href="#'+s+'">'+fixme+'</a>' : "")+'</li>';
					notlisted = true;
					notlistedLaunch = true;
					for(j = 0; j < listed.length; j++){
						if(listed[j] == l) notlisted = false;
					}
					for(k = 0; k < listedLaunch.length; k++){
						if(listedLaunch[k] == l) notlistedLaunch = false;
					}
					if(notlisted){
						listed.push(l);
						li += l;
						if(!this.requirements[i]['met'] && sectionexists) requirementslist += e;
					}
					if(notlistedLaunch){
						listedLaunch.push(l);
						if(!this.requirements[i]['met'] && sectionexists) requirementslistlaunch += e;
					}
				}
			}
			this.log('List of requirements for '+s,li,listed);
			if(li && sectionexists){
				ul.after("<ol>"+li+"</ol>");
				// Find which section this is and add it to the section list for the launch screen
				for(var i = 0 ; i < this.data['sections'].length; i++){
					if(this.data['sections'][i]['id'] == s) requirementssectionlist += '<li><a href="#'+s+'">'+this.data['sections'][i]['short']+"</a></li>";
				}
			}
			S('#'+s+' .requirements').css({'display':(li ? '':'none')});
			if (this.data.options && this.data.options['fix-links']){

			}
		}
		this.log('Requirement sections',requirementssectionlist);
		var ok = 0;
		for(var i = 0; i < this.requirements.length; i++){
			if(this.requirements[i].met) ok++;
		}

		var ltxt = "";

		if(ok < this.requirements.length){
			ltxt = '<div class="requirements">'+this.data.launch.prep.checklist+'</div>';
			ltxt = ltxt.replace("$requirementslist$",(requirementslistlaunch ? '<ol class="errors">'+requirementslistlaunch+"</ol>":""));
			ltxt = ltxt.replace("$requirementssectionlist$",(requirementssectionlist ? '<ol class="errors">'+requirementssectionlist+"</ol>":""));
		}else{
			ltxt = this.data.launch.prep.goforlaunch;
		}

		// Update launch text
		S('#launch-text').html(ltxt);
		// Add event to links we've just added
		S('#launch-text a').on('click',{me:this},function(e){ e.data.me.navigate(e); });

		this.log('Met '+ok+' of '+this.requirements.length+' requirements')
		return this;
	}
	// Update each of the requirements with a flag to say if it is met or not
	RocketScientist.prototype.checkRequirements = function(){
		this.log('checkRequirements',this.requirements);
		// Build array of choice keys that we will check against
		var ch = [];
		if(this.choices['orbit']) ch.push(this.choices['orbit']);
		if(this.choices['fueled']) ch.push(this.choices['fueled']);
		if(this.choices['stable']) ch.push(this.choices['stable']);
		if(this.choices['inbudget']) ch.push(this.choices['inbudget']);
		if(this.choices['powered']) ch.push(this.choices['powered']);
		if(this.choices['bigenough']) ch.push(this.choices['bigenough']);
		if(this.choices['solar-panel-surface']) ch.push('solar-panel-surface');
		if(this.choices['solar-panel'] > 0) ch.push('solar-panel');
		this.log('power: total',this.totals.power.value,'choices',this.power.value,'powered',this.choices.powered)
		this.log('budget: total',this.totals.cost.value,'choices',this.choices.mission.budget.value,'inbudget',this.choices.inbudget)
		for(var j in this.choices.slots){
			for(var i = 0; i < this.choices.slots[j].length; i++) ch.push(this.choices.slots[j][i]);
		}
		var ok;
		for(var i = 0; i < this.requirements.length; i++){
			ok = false;
			if(this.requirements[i].oneof){
				ok = false;
				for(var o = 0; o < this.requirements[i].oneof.length; o++){
					for(var c = 0; c < ch.length; c++){
						if(ch[c] == this.requirements[i].oneof[o]) ok = true;
					}
				}
			}
			// If we failed the oneof requirement, don't bother checking the allof requirement
			if(this.requirements[i].allof){
				for(var o = 0; o < this.requirements[i].allof.length; o++){
					var ok2 = false;
					for(var c = 0; c < ch.length; c++){
						if(ch[c] == this.requirements[i].allof[o]) ok2 = true;	// We've matched the requirement
					}
					if(!ok2){
						// We didn't find this requirement so fail
						ok = false;
						continue;
					}
				}
			}
			if(this.requirements[i].is){
				if(typeof this.choices[this.requirements[i].is]==="boolean") ok = this.choices[this.requirements[i].is];
			}
			this.requirements[i].met = ok;
		}
	}

	// Choose the bus size
	RocketScientist.prototype.setBus = function(size){
		this.log('setBus',size);
		this.choices['bussize'] = size;
		this.choices['bus'] = this.data.bus[size];

		// Reset any previous choices regarding instruments, power options, or rockets
		this.choices['solar-panel'] = 0;
		this.choices['solar-panel-surface'] = false;
		this.choices['slots'] = "";
		if(typeof this.updateButtons==="function") this.updateButtons();
		this.choices['slots'] = {};
		// Construct a dictionary for filling slots
		for(var i in this.choices['bus'].slots) this.choices['slots'][i] = [];

		// Get the selected satellite
		var sat = S('#bus .satellite-'+size[0]);

		// Reset all to black and white
		S('#bus .holder').addClass('blackandwhite');
		// Remove existing selections
		S('#bus .selected').removeClass('selected');

		// Update satellite section with choice
		var html = sat.clone();
		S('#satellite .satellite').replaceWith(html);
		S('#satellite-power .satellite').replaceWith(html);

		// Hide list items that aren't selectable
		var li = S('.list li');
		var s,el;
		// Re-enable all list items
		S('.slot-unavailable').removeClass('slot-unavailable');//.find('.overlay').remove();


		if(this.choices && this.choices.bus) S('#rocket .payload-dummy').css({'width':(this.choices.bus.width.value*10*0.8).toFixed(1)+'%'});

		var _obj = this;
		function scaleConvertableByArea(el){
			var props = ['cost','mass','power'];
			var v,j,nv;
			for(j = 0 ; j < props.length; j++){
				if(_obj.data.power['solar-panel-surface'][props[j]].typeof=="convertable"){
					v = el.find('.package_'+props[j]).find('.value');
					if(v.attr('data-dimension')!="powerdensity"){
						nv = _obj.data.power['solar-panel-surface'][props[j]].convertTo(v.attr('data-dimension'));
						v.attr('data-value',nv.value*_obj.data.bus[size].area.value);
					}
				}
			}
			return;
		}

		for(var i = 0; i < li.length; i++){
			el = S(li[i]);
			s = el.find('.add').attr('data-size');
			if(s){
				var available = false;
				for(var j in this.data.bus[size].slots){
					if(this.data.bus[size].slots[j] > 0 && j==s) available = true;
				}
				// Hide list items that have a specified slot size that doesn't fit
				if(!available) el.addClass('slot-unavailable');//.append('<div class="overlay"></div>');

				// Update values for solar-panel-surface given the surface area
				if(el.attr('data-package') == "solar-panel-surface"){
					if(this.data.bus[size].area.typeof=="convertable") scaleConvertableByArea(el);
				}
			}
		}

		this.reorderLists()

		// Update any changed convertables
		this.updateConvertables();

		// Reset the selected DOM elements
		sat.addClass("selected").parent().removeClass("blackandwhite").find('button').addClass('selected');

		this.updateBudgets();
		this.updateNavigation();
		this.updateRequirements();
		return this;
	}
	RocketScientist.prototype.reorderLists = function(){
		var sections = ['instrument','power'];
		this.log('reorderLists',sections);
		var ul,u,i,li,l_top,l_bot;
		for(s = 0; s < sections.length; s++){
			var uls = S('#'+sections[s]+' .list ul');
			this.log('reorderind',s,sections,sections[s]);
			for(u = 0; u < uls.length; u++){
				ul = S(uls[u]);
				li = ul.find('li');

				this.sizeorder=true;
				if (this.sizeorder){
					// For each list item we check if the slot is available or not
					// If it isn't it goes at the bottom of the list
					// Within the top and bottom, lists are sorted by size
					sizes=[];
					l_tops = {};
					l_bots = {};
					l_top_all="";
					l_bot_all="";
					for (i = 0; i< li.length; i++){
						lsize=S(li[i]).attr('data-size');
						if (sizes.indexOf(lsize)<0) sizes.push(lsize);
						if (S(li[i]).hasClass('slot-unavailable')){
							// put at bottom of list
							if (!l_bots.hasOwnProperty(lsize)) l_bots[lsize]="";
							l_bots[lsize] += li[i].outerHTML;
						}else{
							if (!l_tops.hasOwnProperty(lsize)) l_tops[lsize]="";
							l_tops[lsize] += li[i].outerHTML;
						}
					}
					for (l = 0; l < sizes.length; l++){
						if (l_tops.hasOwnProperty(sizes[l])) l_top_all += l_tops[sizes[l]];
						if (l_bots.hasOwnProperty(sizes[l])) l_bot_all += l_bots[sizes[l]];
					}
					ul.html(l_top_all + l_bot_all);
				}else{
					// For each list item we check if the slot is available or not
					// If it isn't it goes at the bottom of the list
					l_top = "";
					l_bot = "";
					for(i = 0; i < li.length; i++){
						if(S(li[i]).hasClass('slot-unavailable')) l_bot += li[i].outerHTML;
						else l_top += li[i].outerHTML;
					}
					ul.html(l_top+l_bot);
				}
				this.log('reordered',s,sections,sections[s],ul);
			}
		}
		return this;
	}
	RocketScientist.prototype.setOrbit = function(orbit){
		this.choices['orbit'] = orbit;
		this.log('setOrbit',orbit)

		// If we have an orbit section in the DOM we deal with that
		if(S('#orbit').length > 0){
			// Remove existing selections
			S('.orrery .selected').removeClass('selected');
			S('#orbit_list .selected').removeClass('selected');
			if(orbit){
				// Select
				S('.orrery .'+orbit).addClass('selected');
				S('#orbit_list .orbit-'+orbit).addClass('selected');
			}
		}

		// Update the navigation
		this.updateNavigation();
		this.updateRequirements();
		this.updateTotals();
		return this;
	}

	// Add the CSS class for displaying pseudo-3D CSS
	RocketScientist.prototype.toggle3D = function(element){
		S(element).toggleClass('threeD');
		return this;
	}
	// Toggle the spinning animation class
	RocketScientist.prototype.toggleAnimation = function(element){
		S(element+' .satellite').toggleClass('spin');
		return this;
	}
	// Input is the type of slot e.g. dish-large and the event
	RocketScientist.prototype.processPackage = function(type,el,mode){

		var add = el.hasClass('add') ? true : false;
		var p = (mode=="power") ? this.data['power'][type] : this.data.package[type];
		var slots,slotsp,good;

		if(add){
			// Get the slots
			slots = S('#satellite .slot');
			slotsp = S('#satellite-power .slot');
			good = new Array();
			for(var i = 0; i < slots.length; i++){
				var s = S(slots[i]);
				if(s.hasClass('slot-empty') && s.hasClass('slot'+p.slot)) good.push([slots[i],slotsp[i]]);
			}

			// Do we have an available slot?
			if(this.choices['slots'][p.slot].length < this.choices['bus'].slots[p.slot]){
				// Put it in the first available slot
				var goodboth = S(good[0]);
				good = S(good[0][0]);
				if(p.texture){
					if(p.texture.class) goodboth.addClass(p.texture.class);
					if(p.texture.icon) {
						goodboth.addClass(p.texture.icon);
						this.log('package texture',p,p.texture.icon)
					}
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
					}else if(p.texture.file){
                        html='<img class="slot" src="'+p.texture.file+'"/>'
                        goodboth.html(html+good.html())
                        this.log('adding file to slot',p.texture.file)
                    }
					this.log('Removing slot-empty from ',goodboth,type)
					goodboth.addClass('texture').addClass(type).removeClass('slot-empty');
					this.log('Removing slot-empty from ',goodboth[1])

					// Add this slot
					this.choices['slots'][p.slot].push(type);
				}
			}
			this.log('addInstrumentPackage',type,this.data.package[type],slots)

			this.log('addInstrumentPackage > slots',this.choices['slots'])

		}else{
			// Get the slots
			slots = S('#satellite .'+type);
			slotsp = S('#satellite-power .'+type);

			if(slots.length > 0){
				// Remove last one first
				// Put it in the first available slot
				var goodboth = S([slots[slots.length-1],slotsp[slots.length-1]]);
				good = S(slots[slots.length-1]);
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
					goodboth.removeClass('texture').removeClass(type).addClass('slot-empty').find('.hemisphere').remove();

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

		this.log('processPackage',type,el,mode,slotsp,el);

		this.updateValue(type,el,mode);
		this.updateTotals();
		// Update the requirements;
		this.updateRequirements();

		this.updateNavigation();
		return this;
	}
	RocketScientist.prototype.updateValue = function(type,el,mode){
		this.log('updateValue',type,el,mode)
		var n = 0;
		var p = (mode=="power") ? this.data['power'][type] : this.data.package[type];
		if(type == "solar-panel") n = this.choices['solar-panel'];
		else if(type == "solar-panel-surface") n = (this.choices['solar-panel-surface'] ? 1 : 0);
		else{
			if(p){
				for(var i = 0; i < this.choices['slots'][p.slot].length; i++){
					if(this.choices['slots'][p.slot][i]==type) n++;
				}
			}
		}
		el.parent().find('.value').html(n > 0 ? '&times;'+n : '');
		if(n > 0) el.parent().parent().addClass('selected')
		else el.parent().parent().removeClass('selected')
		return this;
	}

	RocketScientist.prototype.processPowerPackage = function(type,el){
		this.log('processPowerPackage',type,el)
		var add = el.hasClass('add') ? true : false;
		if(type=="solar-panel") this.solarPanel(add,el);
		else if(type=="solar-panel-surface") this.solarFixed(add,el);
		else this.processPackage(type,el,"power");

		this.updateBudgets()
		this.updateValue(type,el,"power");

		// Update the requirements;
		this.updateRequirements();

		this.updateNavigation();
		return this;
	}
	// Toggle the fixed solar panels
	RocketScientist.prototype.solarFixed = function(add,el){
		var parent = el.parent();
		var p = parent.children('.add');
		var m = parent.children('.remove');
		if(add){
			this.choices['solar-panel-surface'] = true;
			S('#sat-power .satellite').addClass('solar-fixed');
			p.prop('disabled',true);
			m.prop('disabled',false);
		}else{
			this.choices['solar-panel-surface'] = false;
			S('#sat-power .satellite').removeClass('solar-fixed');
			p.prop('disabled',false);
			m.prop('disabled',true);
		}
		return this;
	}
	RocketScientist.prototype.setStage = function(stage,i){
		this.log('setStage',stage,i);
		this.choices[stage] = this.data[stage][i];
		var h = 0;
		var wide = this.data[stage][i].diameter.value*0.5;
		var tall = this.data[stage][i].height.value*0.5;	// Can't go below 0.5 otherwise the fixed width nozzle messes up
		if(wide < 0) wide = 0;
		if(tall < 0) tall = 0;
		S('.rocket-holder .'+stage).css({'width':wide+'em','height':tall+'em'}).children('.part').html((tall > 0 && stage!="payloadbay") ? '<div class="nozzle"></div>' : '');
		var ok = true;
		var a,b;
		var d = 1e6;
		// Check if the rocket is 'stable' i.e. each stage is narrower than those below
		for(var i = 0; i < this.stages.length; i++){
			a = this.stages[i];
			// If the stage has a diameter, check if it is larger than
			if(this.choices[a] && this.choices[a].diameter.value > 0){
				if(this.choices[a].diameter.value > d && a!="payloadbay") ok = false;
				d = this.choices[a].diameter.value;
			}
		}
		// Add the 'wobble' class if the rocket is unstable
		if(ok) S('.rocket-holder').removeClass('wobble');
		else S('.rocket-holder').addClass('wobble');
		// Save the state for use at launch
		this.choices['stable'] = ok;

		css = "";
		var w,h,st;
		// Make an array to hold the valid stages
		var d = new Array();
		// Loop over the stages storing the width, height and ID for stages which exist
		for(var s = 0; s < this.stages.length; s++){
			if(this.choices[this.stages[s]]){
				st = this.stages[s];
				// Only make a copy of the stage if the width is non-zero
				// That way the fairings will be applied correctly below
				if(this.choices[this.stages[s]].diameter.value > 0) d.push({'w':this.choices[this.stages[s]].diameter.value*0.5,'h':this.choices[this.stages[s]].height.value*0.5,'s':st});
			}
		}
		// Loop over all but the final stage (which doesn't need a fairing) adding fairings
		for(var i = 0; i < d.length-1; i++){
			// The difference in width between the current stage and the next one
			w = (d[i].w-d[i+1].w)/2;
			if(w > 0){
				// The height of the next stage
				h = Math.min(w*3,d[i+1].h*0.7);
				css += '#vehicle .stage.'+d[i].s+':before { border-width: 0 '+Math.abs(w)+'em '+Math.abs(h)+'em; top: -'+Math.abs(h*0.95)+'em; }';
			}else if(w < 0 & d[i+1].s=="payloadbay"){
				// allow "inverted fairing" for payload bay
				h = Math.min(Math.abs(w*3),d[i].h*0.7);
				css += '#vehicle .stage.'+d[i+1].s+':after { border-width: '+Math.abs(h)+'em '+Math.abs(w)+'em '+' 0; bottom: -'+Math.abs(h*0.97)+'em; }';
			}
		}
		S('#customstylesheet').html(css);

		this.updateTotals();
		this.updateBudgets();
		this.updateRequirements();

		return this;
	}
	// Resize function called when window resizes
	RocketScientist.prototype.resize = function(){

		this.wide = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		this.tall = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		var scaleH = !(window.getComputedStyle(S('#bar .left')[0], null).getPropertyValue('display')==="none");

		function height(el){
			if('getComputedStyle' in window) return parseInt(window.getComputedStyle(el, null).getPropertyValue('height'));
			else return parseInt(el.currentStyle.height);
		}
		function verticalPadding(el){
			if('getComputedStyle' in window) return (parseInt(window.getComputedStyle(el, null).getPropertyValue('padding-top')) + parseInt(window.getComputedStyle(el, null).getPropertyValue('padding-bottom')));
			else return parseInt(el.currentStyle.paddingTop);
		}
		var s = S('section');
		var padd = (s.children('.padded').length > 0) ? verticalPadding(s[0]) + verticalPadding(s.children('.padded')[0])+2 : 0;
		for(var i = 0; i < this.sections.length; i++){
			var page = S('#'+this.sections[i]+' .page');
			if(page.length > 0){
				var eltop = page.children('.row-top');
				var top = (eltop.length > 0) ? height(eltop[0]) : 0;
				page.css({'height':(scaleH ? (this.tall-padd)+'px' : 'auto')});
				var versions = page.children('.row-main');
				for(var j = 0; j < versions.length; j++){
					var el = S(page.children('.row-main')[j]);
					// Clear any existing height that has been set
					el.css({'height':'auto'});
					// Find the minimum height needed. It is either enough to fill
					// the screen height or the element's natural height whichever
					// is largest
					var h = Math.max(((el) ? (height(page.children('.row-main')[j]) || 0) : 0),(this.tall-padd-top));
					el.css({'height':((scaleH) ? h+'px' : 'auto')})
				}
			}
		}

		return this;
	}

	RocketScientist.prototype.getSections = function(){
		var sec = S('section');
		this.sections = [];
		this.navigable = {};
		for(var i = 0 ;i < sec.length; i++){
			var el = S(sec[i]);
			if(el.hasClass('view')){
				var id = el.attr('id');
				this.sections.push(id);
				this.navigable[id] = true;
			}
		}
		this.has = {};
		this.has['vw'] = (S('#progressbar').css({'width':'100vw'})[0].offsetWidth==this.wide);

		return this;
	}

	RocketScientist.prototype.toggleFullScreen = function(){
		// Get the container
		var elem = S("#application")[0];

		if(fullScreenApi.isFullScreen()){
			fullScreenApi.cancelFullScreen(elem);
			this.fullscreen = false;
			S('#application').removeClass('fullscreen');
		}else{
			fullScreenApi.requestFullScreen(elem);
			this.fullscreen = true;
			S('#application').addClass('fullscreen');
		}

		return this;
	}
	RocketScientist.prototype.log = function(){
		if(!this.testmode) return this;
		var args = Array.prototype.slice.call(arguments, 0);
		if(console && typeof console.log==="function") console.log('LOG',args);
		return this;
	}

	// Add RocketScientist as a global variable
	window.RocketScientist = RocketScientist;

})(S);	// Self-closing function

// On load we create an instance of RocketScientist
S(document).ready(function(){
	rs = new RocketScientist(typeof data==="object" ? data : "");
});