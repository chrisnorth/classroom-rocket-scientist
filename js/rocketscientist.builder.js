// Library of functions for the mission building interface
(function() {

	RocketScientist.prototype.mode = "build";

	RocketScientist.prototype.init_before = function(){
		S(document).on('keyup',{me:this},function(e){
			var rs = e.data.me;
			var sec = S('#'+rs.sections[rs.currentsection]);
			// Left=37
			if(e.originalEvent.keyCode==37) sec.find('.prev a').trigger('click');
			// Right=39
			if(e.originalEvent.keyCode==39) sec.find('.next a').trigger('click');
		});

		this.level = "advanced";
		if(typeof level !== 'undefined'){
			var _obj = this;
			window.onbeforeunload = function(e){
				var ok = S(e.originalTarget.activeElement).attr('safetoleave');
				if(ok) return undefined;
				else return 'Are you sure you want to leave?';
			};
			this.level = level;
		}

		return this;
	}

	RocketScientist.prototype.init_after = function(){

		// Add events to add/remove buttons
		var _obj = this;
	
		// We hide elements that shouldn't be visible (but we are leaving visible
		// in the plain HTML so there is something if Javascript doesn't work.
		for(var s = 0; s < this.sections.length; s++) S('#'+this.sections[s]).addClass('js').addClass('slide').css((s > 0 ? {'visibility':'hidden','left':'-100%'} : {}));

		// Deal with button presses in the type section
		S('#type button').on('click',{me:this},function(e){ _obj.setType(S(e.currentTarget).attr('data-type')); });

		// Deal with button presses in the goal section
		S('#goal button').on('click',{me:this},function(e){ _obj.setGoal(S(e.currentTarget).attr('data-goal')); });

		// Add events to size selection buttons
		S('#bus .satellite').on('click',{me:this},function(e){
			S(e.currentTarget).parent().find('button').trigger('click');
		});
		S('#bus button').on('click',{me:this},function(e){
			e.data.me.setBus(S(e.currentTarget).attr('data-size'));
		});

		// Replace the default behaviour of the navigation links
		S('nav .prev a').on('click',{me:this},function(e){ if(!S(e.currentTarget).hasClass('disabled')) e.data.me.navigate(e); });
		S('nav .next a').on('click',{me:this},function(e){ if(!S(e.currentTarget).hasClass('disabled')) e.data.me.navigate(e); }).addClass('disabled');

		this.makeSatelliteControls('#satellite');
		this.makeSatelliteControls('#satellite-power');
		this.makeSatelliteControls('#vehicle');

		// Add events to buttons in orbit section
		S('#orbit_list button').off('click').on('click',{me:this},function(e){ e.data.me.setOrbit(S(e.currentTarget).attr('data-orbit')); });

		// Add button events for instrument list to the list itself so we can reorder the contents later without losing the events
		S('#instrument_list ul').off('click').on('click',{me:this},function(e){ e.data.me.addPackage({'currentTarget':e.originalEvent.target,'data':e.data,'originalEvent':e.originalEvent,'type':e.type},'instrument') });

		// Add button events for power list to the list itself so we can reorder the contents later without losing the events
		S('#power_list ul').off('click').on('click',{me:this},function(e){ e.data.me.addPackage({'currentTarget':e.originalEvent.target,'data':e.data,'originalEvent':e.originalEvent,'type':e.type},'power'); });

		// Add button events for launch
		S('#launch button').off('click').on('click',{me:this},function(e){ e.data.me.moveToLaunchPad(); });

		S('#instrument').on('load',{me:this},function(e){
			e.data.me.log('Loading instrument panel')
			// Reset button states
			//S('#instrument button.add').prop('disabled',false);
			//S('#instrument button.remove').prop('disabled',true);
		})

		// Update rocket stages
		this.sliders = new Array();
		this.stageslookup = {};
		for(var s = 0; s < this.stages.length; s++){
			this.stageslookup[this.stages[s]] = s;
			var l = this.stages[s];
			this.sliders.push(new Slider(S('.rocket-builder .'+l),{stage:l},function(e){ _obj.setStage(e.data.stage,e.i); }));
			for(var i = 0; i < this.data[l].length; i++) S('.rocket-builder .'+l+' .stage-'+this.data[l][i].key).find('.part').css({'width':(this.data[l][i].diameter.value*10*0.8).toFixed(1)+'%'});
		}

		// Reset button states
		this.updateButtons();

		// Quickly set and unset the type to reset the vertical scroll
		this.setType('EO').setType('');

		// Deal with orbit selection
		for(var i in this.data.orbit) S('.orrery .'+i).on('click',{'me':this,'orbit':i},function(e){ e.data.me.setOrbit(e.data.orbit); });


		return this;
	}

	// In the UI we will update the totals after updating the budgets
	var _fn = RocketScientist.prototype.updateBudgets;
	RocketScientist.prototype.updateBudgets = function(p,sign){
		_fn.call(this);
		this.updateTotals();
		return this;
	}
	
	RocketScientist.prototype.moveToLaunchPad = function(){
	
		var slots = '';
		for(var s in this.choices.slots){
			for(var i = 0 ; i < this.choices.slots[s].length; i++){
				if(slots) slots += ';';
				slots += this.choices.slots[s][i];
			}
		}
		var stages = '';
		for(var s = 0; s < this.stages.length; s++){
			stages += '&'+this.stages[s]+'='+this.choices[this.stages[s]].key;
		}
		location.href = 'launch.html?type='+this.choices.type+'&solar-panel='+this.choices['solar-panel']+'&solar-panel-surface='+this.choices['solar-panel-surface']+'&orbit='+this.choices.orbit+'&goal='+this.choices.goal+'&bus='+this.choices.bussize+'&slots='+slots+'&level='+this.level+stages;
	}

	RocketScientist.prototype.updateButtons = function(){

		// If we've filled up this slot type we can't add any more 
		// of this type so lose the add buttons otherwise show them
		var add = S('.list .add');
		var rem = S('.list .remove');
		this.log('updateButtons',this.choices['slots']);

		if(this.choices['slots']){
			btn = add.e.concat(rem.e);
			for(var i = 0; i < btn.length; i++){
				var a = S(btn[i]);
				var s = a.attr('data-size');
				var p = a.attr('data-package');
				if(s && p){
					var disable = false;
					if(a.hasClass('add')){
						if(this.choices['slots'][s]) disable = (this.choices['slots'][s].length == this.choices['bus'].slots[s]);
						if(p=="solar-panel") disable = (this.choices['solar-panel'] < this.maxpanels) ? false : true;
						if(p=="solar-panel-surface") disable = (this.choices['solar-panel-surface']);
					}else if(a.hasClass('remove')){
						var n = 0;
						for(var j in this.choices['slots'][s]) if(this.choices['slots'][s][j] == p) n++;
						if(this.choices['slots'][s]) disable = (this.choices['slots'][s].length == 0 || n==0);
						if(p=="solar-panel") disable = (this.choices['solar-panel'] <= 0);
						if(p=="solar-panel-surface") disable = (!this.choices['solar-panel-surface']);
					}
					a.prop('disabled',disable);
				}
			}
		}else{
			add.prop('disabled',false);
			rem.prop('disabled',true);
			S('#instrument_list .list-bar .value').html('');
			S('#instrument_list .selected').removeClass('selected')
			S('#power_list .list-bar .value').html('');
			S('#power_list .selected').removeClass('selected')
		}
		return this;
	}

	RocketScientist.prototype.navigate = function(e){
		console.log('navigate')
		e.preventDefault();
		var href = S(e.currentTarget).attr('href');
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
			S('#'+section).trigger('load');

			// We know which section we want (found) and we know which we are on (this.currentsection)
			// Remove existing hidden slide classes
			S('.slide-hide').removeClass('slide-hide');
			S('.slide').removeClass('slideOutLeft').removeClass('slideOutRight').removeClass('slideInLeft').removeClass('slideInRight');
			// Although we are using CSS3 animations we also have to manually set properties in CSS as a fallback
			if(found > this.currentsection){
				// Go right
				// Hide all the previous sections if they aren't already
				for(var i = 0; i < this.currentsection;i++) S('#'+this.sections[i]).css({'left':'-100%','margin-left':0});
				// Move the current section off
				S('#'+this.sections[this.currentsection]).addClass('slideOutLeft').css({'left':'-100%','margin-left':0});
				// Move the new section in
				S('#'+this.sections[this.currentsection+1]).addClass('slideInRight').css({'left':'0%','margin-left':0,'visibility':''});
			}else{
				// Go left
				// Move the current section off
				S('#'+this.sections[this.currentsection]).addClass('slideOutRight').css({'left':'-100%','margin-left':'','visibility':''});
				// Bring the new section in
				S('#'+this.sections[found]).focus().addClass('slideInLeft').css({'left':'0%','margin-left':0,'visibility':''});
				// Hide all the following sections if they aren't already
				for(var i = found+2; i < this.sections.length; i++) S('#'+this.sections[i]).css({'margin-left':'0%','left':'-100%','visibility':'hidden'});
			}
			// Update the progress bar
			S('#progressbar .progress-inner').css({'width':progress.toFixed(1)+'%'});
		}
		this.currentsection = found;
		//S('#'+this.currentsection).focus()
		
		function findNextTabStop(el) {
			var universe = document.querySelectorAll('input, button, select, textarea, a[href]');
			var list = Array.prototype.filter.call(universe, function(item) {return item.tabIndex >= "0"});
			for(var i = list.indexOf(el)+1; i < list.length; i++){
				if(isVisible(list[i])) return list[i];
			}
			return list[0];
		}
		
		// Check if an element is really visible
		function isVisible(el) {
			if(!el) return false;
			var visible = true;
			visible = visible && el.offsetWidth > 0 && el.offsetHeight > 0;
			if(visible) {
				while('BODY' != el.tagName && visible) {
					visible = visible && 'hidden' != window.getComputedStyle(el).visibility;
					el = el.parentElement;
				}
			}
			return visible;
		}

		// Focus on the first focusable element in the new section
		findNextTabStop(S('#'+section).find('.row-top .next a')[0]).focus();

		return false;
	}

	RocketScientist.prototype.addPackage = function(e,to){
		var a = S(e.currentTarget);
		var add = a.hasClass('add') ? true : false;
		var type = a.parent().parent().attr('data-package');
		this.log('addPackage',e,to,type);
		if(to == "instrument") this.processPackage(type,a,"instrument");
		else if(to == "power") this.processPowerPackage(type,a);

		this.updateBudgets();
		this.updateButtons();
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
			var panels = S('#sat-power .solar-panels');
			for(var i = 0; i < panels.length; i++){
				ps = panels[i].getElementsByTagName('li');
				if(ps.length < this.maxpanels){
					panels[i].getElementsByTagName('ol')[0].innerHTML += '<li class="solar-panel"><\/li>';
				}
			}
		}else{
			S('#sat-power .solar-panels li:eq(0)').remove();
		}
		// Find out how many panels we have
		ps = S('#sat-power .solar-panels li');
		this.choices['solar-panel'] = ps.length/2;

		return this;
	}

	RocketScientist.prototype.makeSatelliteControls = function(selector){

		this.z[selector] = {'z':1,'el':S(selector)};
	
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
		var n = this.li.length;
		this.selected = ((s+n)%n);
		this.ul.attr('data-select',this.selected);
		this.ul.find('.selected').removeClass('selected');
		S(this.li[this.selected]).addClass('selected');
		return this;
	}
	Slider.prototype.navigate = function(e){
		var f = S(e.currentTarget).hasClass('next');
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
		var w = width(this.el[0]);
		this.el.find('.stage').css({'width':(w/this.n).toFixed(1)+'px'});	// Set the widths
		this.el.find('button').css({'width':(w/5).toFixed(1)+'px'});	// Change widths of buttons
		this.ul.css({'margin-left':'-'+((this.selected+0.5)*(w/this.n)).toFixed(1)+'px'});	// Update the offset for the list
		
		return this;
	}

})();	// Self-closing function


function test(){
	// Quick start
	// Trigger selection
	S('#type .NAV button').trigger('click');
	S('#type nav a').trigger('click');
	S('#goal .NAV button:eq(1)').trigger('click');
	S('#goal nav a:eq(1)').trigger('click');
	S('#bus .satellite-l').trigger('click');
	S('#bus nav a:eq(1)').trigger('click');
	S('#orbit_list .orbit-GEO button').trigger('click');
	
	S('#orbit nav a:eq(1)').trigger('click');
	S('#instrument_list .bg4x8:eq(0) .add').trigger('click');
	S('#instrument_list .bg2x4:eq(1) .add').trigger('click');
	S('#instrument_list .bg2x4:eq(2) .add').trigger('click');
	S('#instrument_list .bg2x2:eq(1) .add').trigger('click');
	S('#instrument nav a:eq(1)').trigger('click');
	S('#power nav a:eq(1)').trigger('click');
}	