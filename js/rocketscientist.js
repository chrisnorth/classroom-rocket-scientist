// I don't like to pollute the global namespace 
// but I can't get this to work any other way.
var eventcache = {};

function E(e){
	
	function matchSelector(e,selector){
		var result = false;
		// Does this one element match the selector
		if(selector[0] == '.'){
			selector = selector.substr(1);
			for(var i = 0; i < e.classList.length; i++) if(e.classList[i] == selector) return true;
		}else if(selector[0] == '#'){
			if(e.id == selector.substr(1)) return true;
		}else{
			if(e.tagName == selector.substr(1).toUpperCase()) return true;
		}
		return false;
	}
	function getBy(e,selector){
		var i = -1;
		var result = new Array();
		if(selector.indexOf(':eq') > 0){
			var m = selector.replace(/(.*)\:eq\(([0-9]+)\)/,'$1 $2').split(" ");
			selector = m[0];
			i = parseInt(m[1]);
		}
		if(selector[0] == '.') els = e.getElementsByClassName(selector.substr(1));
		else if(selector[0] == '#') els = e.getElementById(selector.substr(1));
		else els = e.getElementsByTagName(selector);
		if(!els) els = [];
		if(typeof els.length!=="number") els = [els];
		for(k = 0; k < els.length; k++){ result.push(els[k]); }
		if(i >= 0 && result.length > 0){
			if(i < result.length) result = [result[i]];
			else result = [];
		}
		return result;
	}

	// Make our own fake, tiny, version of jQuery simulating the parts we need
	function stuQuery(els){
		if(typeof els==="string"){
			var a,els,els2,i,j,k,tmp;
			a = els.split(' ');
			for(i = 0; i < a.length; i++){
				if(i==0){
					els = getBy(document,a[i]);
				}else{
					els2 = new Array();
					for(j = 0; j < els.length; j++) els2 = els2.concat(getBy(els[j],a[i]));
					els = els2.splice(0);
				}
			}
		}
		this.e = [];
		if(!els) return this;
		if(typeof els.length!=="number") els = [els];
		this.e = els;
		return this;
	}
	stuQuery.prototype.ready = function(f){ /in/.test(document.readyState)?setTimeout('E(document).ready('+f+')',9):f() }
	// Return HTML or set the HTML
	stuQuery.prototype.html = function(html){
		if(!html && this.e.length == 1) return this.e[0].innerHTML;
		if(html) for(var i = 0; i < this.e.length; i++) this.e[i].innerHTML = html;
		return this;
	}
	stuQuery.prototype.append = function(html){
		if(!html && this.e.length == 1) return this.e[0].innerHTML;
		if(html) for(var i = 0; i < this.e.length; i++) this.e[i].innerHTML += html;
		return this;	
	}
	stuQuery.prototype.setCache = function(a){
		eventcache = a;
		return;
	}
	function NodeMatch(a,el){
		if(a && a.length > 0){
			for(var i = 0; i < a.length; i++){
				if(a[i].node == el) return {'success':true,'match':i};
			}
		}
		return {'success':false};
	}
	function storeEvents(e,event,fn,fn2,data){
		if(!eventcache[event]) eventcache[event] = new Array();
		eventcache[event].push({'node':e,'fn':fn,'fn2':fn2,'data':data});
	}
	function getEvent(e){
		if(eventcache[e.type]){
			var m = NodeMatch(eventcache[e.type],e.currentTarget);
			if(m.success){
				if(m.match.data) e.data = eventcache[e.type][m.match].data;
				return {'fn':eventcache[e.type][m.match].fn,'data':e};
			}
		}
		return function(){ return {'fn':''}; }
	}
	// Try to remove an event with attached data and supplied function, fn.
	stuQuery.prototype.off = function(event){

		// If the remove function doesn't exist, we make it
		if(typeof Element.prototype.removeEventListener !== "function"){
			Element.prototype.removeEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
				if (!oListeners.hasOwnProperty(sEventType)) { return; }
				var oEvtListeners = oListeners[sEventType];
				for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
					if (oEvtListeners.aEls[iElId] === this) { nElIdx = iElId; break; }
				}
				if (nElIdx === -1) { return; }
				for (var iLstId = 0, aElListeners = oEvtListeners.aEvts[nElIdx]; iLstId < aElListeners.length; iLstId++) {
					if (aElListeners[iLstId] === fListener) { aElListeners.splice(iLstId, 1); }
				}
			}
		}
		for(var i = 0; i < this.e.length; i++){
			var m = NodeMatch(eventcache[event],this.e[i]);
			if(m.success){
				this.e[i].removeEventListener(event,eventcache[event][m.match].fn2,false);
				eventcache[event].splice(m.match,1);
			}
		}
		return this;
	}
	// Add events
	stuQuery.prototype.on = function(event,data,fn){
		event = event || window.event; // For IE
		this.cache = [4,5,6];
		if(typeof data==="function" && !fn){
			fn = data;
			data = "";
		}
		if(typeof fn !== "function") return this;

		if(this.e.length > 0){
			var _obj = this;
			var a = function(b){
				var e = getEvent({'currentTarget':this,'type':event,'data':data,'originalEvent':b});
				if(typeof e.fn === "function") return e.fn.call(_obj,e.data);
			}
		
			for(var i = 0; i < this.e.length; i++){
				storeEvents(this.e[i],event,fn,a,data);
				if(this.e[i].addEventListener) this.e[i].addEventListener(event, a, false); 
				else if(this.e[i].attachEvent) this.e[i].attachEvent(event, a);
			}
		}
		return this;
	}
	stuQuery.prototype.trigger = function(e){
		var event; // The custom event that will be created

		if (document.createEvent) {
			event = document.createEvent("HTMLEvents");
			event.initEvent(e, true, true);
		} else {
			event = document.createEventObject();
			event.eventType = e;
		}

		event.eventName = e;

		for(var i = 0 ;  i < this.e.length ; i++){
			if (document.createEvent) this.e[i].dispatchEvent(event);
			else this.e[i].fireEvent("on" + event.eventType, event);
		}

		return this;
	}
	// If there is only one element, we trigger the focus event
	stuQuery.prototype.focus = function(){
		if(this.e.length == 1) this.e[0].focus();
		return this;
	}
	// If there is only one element, we trigger the blur event
	stuQuery.prototype.blur = function(){
		if(this.e.length == 1) this.e[0].blur();
		return this;
	}
	// Remove DOM elements
	stuQuery.prototype.remove = function(){
		if(!this.e) return this;
		for(var i = this.e.length-1; i >= 0; i--){
			if(!this.e[i]) return;
			if(typeof this.e[i].remove==="function") this.e[i].remove(this.e[i]);
			else if(typeof this.e[i].parentElement.removeChild==="function") this.e[i].parentElement.removeChild(this.e[i]);
		}
		return E(this.e);
	}
	// Check if a DOM element has the specified class
	stuQuery.prototype.hasClass = function(cls){
		var result = true;
		for(var i = 0; i < this.e.length; i++){
			if(!this.e[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) result = false;
		}
		return result;
	}
	// Toggle a class on a DOM element
	stuQuery.prototype.toggleClass = function(cls){
		// Remove/add it
		for(var i = 0; i < this.e.length; i++){
			if(this.e[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) this.e[i].className = this.e[i].className.replace(new RegExp("(\\s|^)" + cls + "(\\s|$)", "g")," ").replace(/ $/,'');
			else this.e[i].className = (this.e[i].className+' '+cls).replace(/^ /,'');
		}
		return E(this.e);
	}
	// Toggle a class on a DOM element
	stuQuery.prototype.addClass = function(cls){
		// Remove/add it
		for(var i = 0; i < this.e.length; i++){
			if(!this.e[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) this.e[i].className = (this.e[i].className+' '+cls).replace(/^ /,'');
		}
		return E(this.e);
	}
	// Remove a class on a DOM element
	stuQuery.prototype.removeClass = function(cls){
		// Remove/add it
		for(var i = 0; i < this.e.length; i++){
			while(this.e[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) this.e[i].className = this.e[i].className.replace(new RegExp("(\\s|^)" + cls + "(\\s|$)", "g")," ").replace(/ $/,'').replace(/^ /,'');
		}
		return E(this.e);
	}
	stuQuery.prototype.css = function(css){
		for(var i = 0; i < this.e.length; i++){
			// Read the currently set style
			var styles = {};
			var style = this.e[i].getAttribute('style');
			if(style){
				var bits = this.e[i].getAttribute('style').split(";");
				for(var b = 0; b < bits.length; b++){
					var pairs = bits[b].split(":");
					if(pairs.length==2) styles[pairs[0]] = pairs[1];
				}
			}
			// Add the user-provided style to what was there
			for(key in css) styles[key] = css[key];
			// Build the CSS string
			var newstyle = '';
			for(key in styles){
				if(newstyle) newstyle += ';';
				if(styles[key]) newstyle += key+':'+styles[key];
			}
			// Update style
			this.e[i].setAttribute('style',newstyle);
		}
		return this;
	}
	stuQuery.prototype.parent = function(){
		var tmp = [];
		for(var i = 0; i < this.e.length; i++) tmp.push(this.e[i].parentElement);
		return E(tmp);
	}
	// Only look one level down
	stuQuery.prototype.children = function(c){
		if(typeof c==="string"){
			// We are using a selector
			var result = [];
			for(var i = 0; i < this.e.length; i++){
				for(var ch = 0; ch < this.e[i].children.length; ch++){
					if(matchSelector(this.e[i].children[ch],c)) result.push(this.e[i].children[ch]);
				}
			}
			return E(result);
		}else{
			// We are using an index
			for(var i = 0; i < this.e.length; i++) this.e[i] = (this.e[i].children.length > c ? this.e[i].children[c] : this.e[i]);
			return E(this.e);
		}
	}
	stuQuery.prototype.find = function(selector){
		var tmp = [];
		var result = [];
		for(var i = 0; i < this.e.length; i++){
			tmp = getBy(this.e[i],selector);
			for(k = 0; k < tmp.length; k++){ result.push(tmp[k]); }
		}
		// Return a new instance of stuQuery
		return E(result);
	}
	stuQuery.prototype.attr = function(attr,val){
		var tmp = [];
		for(var i = 0; i < this.e.length; i++){
			tmp.push(this.e[i].getAttribute(attr));
			if(typeof val==="string") this.e[i].setAttribute(attr,val)
		}
		if(tmp.length==1) tmp = tmp[0];
		return tmp;
	}
	stuQuery.prototype.prop = function(attr,val){
		var tmp = [];
		for(var i = 0; i < this.e.length; i++){
			tmp.push(this.e[i].getAttribute(attr));
			if(typeof val==="boolean"){
				if(val) this.e[i].setAttribute(attr,attr);
				else this.e[i].removeAttribute(attr);
			}
		}
		if(tmp.length==1) tmp = tmp[0];
		return tmp;
	}
	stuQuery.prototype.clone = function(){
		var span = document.createElement('div');
		span.appendChild(this.e[0].cloneNode(true));
		return span.innerHTML;
	}
	stuQuery.prototype.replaceWith = function(html){
		var span = document.createElement("span");
		span.innerHTML = html;
		var clone = E(this.e);
		for(var i = 0; i < this.e.length; i++) clone.e[0].parentNode.replaceChild(span, clone.e[0]);
  		return clone;
	}
	stuQuery.prototype.loadJSON = function(file,fn,attrs){

		if(!attrs) attrs = {};
		attrs['_file'] = file;

		var httpRequest = new XMLHttpRequest();
		httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState === 4) {
				if (httpRequest.status === 200) {
					var data = JSON.parse(httpRequest.responseText);
					if(typeof fn==="function") fn.call((attrs['this'] ? attrs['this'] : this),data,attrs);
				}else{
					this.log('error loading '+file)
					if(typeof attrs.error==="function") attrs.error.call((attrs['this'] ? attrs['this'] : this),httpRequest.responseText,attrs);
				}
			}
		};
		httpRequest.open('GET', file);
		httpRequest.send(); 
		return this;
	}
	return new stuQuery(e);
}




function RocketScientist(){
	this.maxpanels = 4;
	this.wide = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	this.tall = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	this.defaults = {'currency':'credits', 'length':'m', 'mass': 'kg' };
	this.z = {};
	this.choices = { 'type':'', 'goal':'', 'mission':'', 'orbit':'', 'bus':'', 'slots':{}, 'solar-panel':0, 'solar-panel-fixed':false };

	this.getSections();
	this.parseQueryString();
	E().loadJSON('config/en_advanced_options.json',this.init,{'this':this});

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
			this.navigable[id] = false;
		}
	}
	// Make first section navigable
	this.navigable[this.sections[0]] = true;
	this.has = {};
	this.has['vw'] = (E('#progressbar').css({'width':'100vw'}).e[0].offsetWidth==this.wide);

	return this;
}
RocketScientist.prototype.init = function(data){

	this.data = data;
	this.currentsection = 0;
	function updateConvertables(o){
		for (i in o){
			if(typeof(o[i])=="object") {
				if(o[i].value && o[i].units && o[i].dimension) o[i] = new Convertable(o[i]);
				else o[i] = updateConvertables(o[i]);
			}
		}
		return o;
	}  
	// Loop over the data and update Convertables
	updateConvertables(data);

	var _obj = this;

	// Remove elements that show noscript messages
	E('.noscriptmsg').remove();

	// For testing
	if(this.testmode){
		E('#bar .barmenu').append('<div class="baritem"><button id="speedy">automate</button></div>');
		E('#speedy').on('click',function(e){ test(); E('#speedy').parent().remove(); });
	}

	// Remove classes from script only elements
	E('.scriptonly').toggleClass('scriptonly');

	if(E('body').hasClass('front')) return this;

	// We hide elements that shouldn't be visible (but we are leaving visible
	// in the plain HTML so there is something if Javascript doesn't work.
	for(var s = 0; s < this.sections.length; s++) E('#'+this.sections[s]).addClass('js').addClass('slide').css({'left':(s>0 ? '100%':'0'),'visibility':(s>0 ? 'hidden':'visible')});

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
	E('.prev a').on('click',{me:this},function(e){ e.data.me.navigate(e); });
	E('.next a').on('click',{me:this},function(e){ e.data.me.navigate(e); }).addClass('disabled');

	// Update all the convertable values
	this.updateConvertables();
	
	// Add events to add/remove buttons
	var _obj;
	
	this.makeSatelliteControls('#satellite');
	this.makeSatelliteControls('#satellite-power');

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
		if(this.defaults[c.dimension]) el.e[i].innerHTML = c.toString({'units':this.defaults[c.dimension]});
	};
	return this;
}
// Escape HTML characters
RocketScientist.prototype.htmlDecode = function(input){ var d = document.createElement('div'); d.innerHTML = input; return d.innerHTML; }

RocketScientist.prototype.allowNavigateBeyond = function(t){
	var found = false;
	for(var i = 0; i < this.sections.length; i++){
		if(!found) E('#'+this.sections[i]+' .next a').removeClass('disabled');
		else E('#'+this.sections[i]+' .next a').addClass('disabled');
		
		if(this.sections[i]==t && i < this.sections.length-1){
			found = true;
			this.navigable[this.sections[i+1]] = true;
		}
	}
	if(!t){
		// If we didn't get provided a section, we reset everything
		for(var i = 0; i < this.sections.length; i++){
			this.navigable[this.sections[i]] = (i > 0 ? false : true);
			E('#'+this.sections[i]+' .next a').addClass('disabled');
		}
	}
	return this;
}
RocketScientist.prototype.noNavigateBeyond = function(t){
	var found = false;
	for(var i = 0; i < this.sections.length; i++){
		if(!found) E('#'+this.sections[i]+' .next a').removeClass('disabled');
		else E('#'+this.sections[i]+' .next a').addClass('disabled');
		
		if(found) this.navigable[this.sections[i]] = false;
		if(this.sections[i]==t && i < this.sections.length-1) found = true;
	}
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
		this.updateBudget();
		E('#goal button').removeClass('selected');
		this.allowNavigateBeyond('type');
	}else{
		this.allowNavigateBeyond('');
	}
	return this;
}
RocketScientist.prototype.updateBudget = function(){
	var budget;
	var css = "";
	if(this.choices.type && this.choices.goal){
		this.choices.mission = this.data.scenarios[this.choices.type].missions[this.choices.goal];
		budget = this.choices.mission.budget
	}else{
		budget = new Convertable(0,this.defaults.currency);
		css = 'none';
	}
	E('#bar .togglecost .cost').html(budget.toString({'units':this.defaults.currency}))
	E('#bar .togglecost').css({'display':css});
	return this;
}
RocketScientist.prototype.setGoal = function(g){
	this.choices['goal'] = parseInt(g);

	// Reset any existing selection
	E('#goal button').removeClass('selected');

	// Select this button
	E(E('#goal .'+this.choices.type+' button').e[this.choices.goal]).addClass('selected');

	// Update the budget
	this.updateBudget();

	// Update what is displayed in the instrument requirements
	this.log('Should update the instrument requirements');

	this.allowNavigateBeyond('goal');

	// If this goal comes with a size, we set that
	if(this.data.scenarios[this.choices['type']].missions[this.choices['goal']].size) this.setBus(this.data.scenarios[this.choices['type']].missions[this.choices['goal']].size)

	return this;
}

// Choose the bus size
RocketScientist.prototype.setBus = function(size){
	this.choices['bus'] = this.data.bus[size];

	// Reset any previous choices
	this.setOrbit('');
	this.choices['solar-panel'] = 0;
	this.choices['solar-panel-fixed'] = false;
	// Construct a dictionary for filling slots
	this.choices['slots'] = {};
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
		}
	}

	// Reset the selected DOM elements
	sat.addClass("selected").parent().removeClass("blackandwhite").find('button').addClass('selected');

	this.updateButtons();
	this.allowNavigateBeyond('bus');
	return this;
}
RocketScientist.prototype.setOrbit = function(orbit){
	this.choices['orbit'] = orbit;
	this.log('setOrbit',orbit)

	// Remove existing selections
	E('.orrery .selected').removeClass('selected');
	E('#orbit_list .selected').addClass('selected');
	if(orbit){
		// Select
		E('.orrery .'+orbit).addClass('selected');
		E('#orbit_list .orbit-'+orbit).addClass('selected');
		this.allowNavigateBeyond('orbit');
	}else{
		this.noNavigateBeyond('orbit');
	}
	
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
				progress = 100*i/this.sections.length;
				found = i;
			}
		}
		E('#'+section).trigger('load');

		// We know which section we want (found) and we know which we are on (this.currentsection)
		// Remove existing hidden slide classes
		E('.slide-hide').removeClass('slide-hide');
		if(found > this.currentsection){
			// Go right
			// Hide all the previous sections if they aren't already
			for(var i = 0; i < this.currentsection;i++) E('#'+this.sections[i]).css({'left':'-100%','visibility':'hidden'});
			// Move the current section off
			E('#'+this.sections[this.currentsection]).addClass('slide-hide').css({'left':'-100%','visibility':''});
			// Move the new section in
			E('#'+this.sections[this.currentsection+1]).css({'left':'0%','visibility':'visible','display':''});
		}else{
			// Go left
			// Move the current section off
			E('#'+this.sections[this.currentsection]).css({'left':'100%','visibility':''}).addClass('slide-hide');
			// Bring the new section in
			E('#'+this.sections[found]).focus().css({'left':'0','visibility':'visible'});
			// Hide all the following sections if they aren't already
			for(var i = found+2; i < this.sections.length; i++) E('#'+this.sections[i]).css({'left':'100%','visibility':'hidden'});
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
	zc.children('.make3D').on('click',{me:this,by:1/1.1,z:selector},function(e){ e.data.me.toggle3D(e.data.z); });
	zc.children('.animate').on('click',{me:this,by:1/1.1,z:selector},function(e){ e.data.me.toggleAnimation(e.data.z); });

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
RocketScientist.prototype.log = function(){
	if(!this.testmode) return this;
	var args = Array.prototype.slice.call(arguments, 0);
	if(console && typeof console.log==="function") console.log('LOG',args);
	return this;
}
RocketScientist.prototype.toggleAnimation = function(element){
	E(element+' .satellite').toggleClass('spin');
	return this;
}
RocketScientist.prototype.addPackage = function(e,to){
	var a = E(e.currentTarget);
	var type = a.parent().parent().attr('data-package');
	this.log('addPackage',e,to,type);
	if(to == "instrument") this.processPackage(type,a,"instrument");
	else if(to == "power") this.processPowerPackage(type,a);
	
	this.updateButtons();
}
// Input is the type of slot e.g. dish-large and the event
RocketScientist.prototype.processPackage = function(type,el,mode){

	var add = el.hasClass('add') ? true : false;
	var p = (mode=="power") ? this.data['power'][type] : this.data.package[type];
	this.log('processPackage',type,el,mode,p)

	if(add){
		// Get the slots
		var slots = E('#satellite .slot');
		var slotsp = E('#satellite-power .slot');
		var good = new Array();
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
		var slots = E('#satellite .'+type);
		var slotsp = E('#satellite-power .'+type);
	
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
		this.log('processPackage',this.choices['slots'])
	}

	this.allowNavigateBeyond('instrument');

	return this;
}
RocketScientist.prototype.updateButtons = function(){
	// If we've filled up this slot type we can't add any more 
	// of this type so lose the add buttons otherwise show them
	var add = E('.list .add');
	var rem = E('.list .remove');
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
	}

	this.log('updateButtons',add,rem)
	return this;
}

RocketScientist.prototype.processPowerPackage = function(type,el){
	var add = el.hasClass('add') ? true : false;
	if(type=="solar-panel") this.solarPanel(add,el);
	else if(type=="solar-panel-surface") this.solarFixed(add,el);
	else this.processPackage(type,el,"power");

	this.allowNavigateBeyond('power');
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
			if(ps.length < this.maxpanels) panels.e[i].getElementsByTagName('ol')[0].innerHTML += '<li class="solar-panel"><\/li>';
		}
	}else{
		E('#sat-power .solar-panels li:eq(0)').remove();
	//	if(E('#sat-power .solar-panels li').e.length==0) m.prop('disabled',true);
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
// Resize function called when window resizes
RocketScientist.prototype.resize = function(){

	// Kludgy fix for old browsers that don't have vw/vh/flex in CSS
	if(!this.has.vw){
		function height(el){
			if('getComputedStyle' in window) return parseInt(window.getComputedStyle(el, null).getPropertyValue('height'));
			else return parseInt(document.getElementById('example').currentStyle.height);	
		}
		function resize(){
			E('section').css({'min-height':this.tall+'px'});
			var paddh = tall-128;			// Hard-coded fudge based on padding
			E('section').children('.padded').css({'min-height':paddh+'px'});
			var table = E('section').children('.padded').children('.table');
			table.css({'height':paddh+'px'});
			var rows = table.children('.table-row');

			for(var r = 0; r < rows.e.length; r++){
				// Step up to the table parent
				table = E(rows.e[r]).parent();
				var fixed = table.children('.table-row-top');
				var rs = table.children('.table-row');
				var dh = paddh-height(fixed.e[0]);
				var dr = rs.e.length;
				if(dr <= 0) dr = 1;
				E(rows.e[r]).css({'height':(dh/dr)+'px','overflow':'hidden'}).find('.list').css({'height':(dh)+'px'});
				var req = E(rows.e[r]).find('.requirements');
				if(req.e.length > 0){
					E(rows.e[r]).find('.satellite-holder').css({'height':(dh-height(req.e[0]))+'px'});
				}
			}
		}
	}
	return this;
}

var rs;
// On load
E(document).ready(function(){
	rs = new RocketScientist();
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
}
