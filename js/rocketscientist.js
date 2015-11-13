// I don't like to pollute the global namespace 
// but I can't get this to work any other way.
var eventcache = {};

function E(e){
	
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
		this.e = undefined;
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
		this.cache = [4,5,6];
		if(typeof data==="function" && !fn){
			fn = data;
			data = "";
		}
		if(typeof fn !== "function") return this;

		var _obj = this;
		var a = function(a){
			var e = getEvent({'currentTarget':this,'type':event,'originalEvent':a});
			if(typeof e.fn === "function") e.fn.call(_obj,e.data);
		}
		
		for(var i = 0; i < this.e.length; i++){
			storeEvents(this.e[i],event,fn,a,data);
			if(this.e[i].addEventListener) this.e[i].addEventListener(event, a, false); 
			else if(this.e[i].attachEvent) this.e[i].attachEvent(event, a);
		}
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
		return this;
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
		return this;
	}
	stuQuery.prototype.style = function(css){
		var style = '';
		for(key in css){
			if(style) style += ';';
			style += key+':'+css[key];
		}
		for(var i = 0; i < this.e.length; i++){
			this.e[i].setAttribute('style',style);
		}
		return this;
	}
	stuQuery.prototype.parent = function(){
		for(var i = 0; i < this.e.length; i++) this.e[i] = (this.e[i].parentElement);
		return this;
	}
	stuQuery.prototype.children = function(i){
		this.e = [this.e[i]];
		return this;
	}
	return new stuQuery(e);
}


var z = 1;
function toggle3D(element){
	if(element) element = element.parentElement.parentElement.parentElement;
	else element = '#satellite';
	E(element).toggleClass('threeD');
}
function zoom(element,factor){
	if(z * factor < 2 && z * factor > 0.5) z *= factor;
	E(element).parent().parent().parent().style({'font-size':z.toFixed(3)+'em'});
}
function chooseBus(element,factor){
	E(element).toggleClass("selected").parent().toggleClass("blackandwhite");
}
function toggleSolar(){
	E('#sat-power .satellite').toggleClass('solar-fixed');
}
function toggleAnimation(){
	E('#sat-power .satellite').toggleClass('spin');
}
function setSolar(n){
	var ids = ['sat-power-l','sat-power-m'];
	var ul = "<ul>";
	for(var i = 0; i < n; i++) ul += "<li class=\"solar-panel\"><\/li>";
	ul += '<\/ul>';
	for(var j = 0; j < ids.length; j++){
		el = document.getElementById(ids[j]);
		panels = el.getElementsByClassName('solar-panels');
		for(var i = 0; i < panels.length; i++) E(panels[i]).html(ul);
	}
}
function addSolar(){
	var ids = ['sat-power-l','sat-power-m'];
	for(var j = 0; j < ids.length; j++){
		el = document.getElementById(ids[j]);
		if(el){
			panels = el.getElementsByClassName('solar-panels');
			for(var i = 0; i < panels.length; i++){
				ps = panels[i].getElementsByTagName('li');
				if(ps.length < 4) panels[i].getElementsByTagName('ol')[0].innerHTML += '<li class="solar-panel"><\/li>';
			}
		}
	}
}
function removeSolar(){
	var ids = ['sat-power-l','sat-power-m'];
	for(var j = 0; j < ids.length; j++) E('#'+ids[j]+' .solar-panels li').remove();
}
function toggleComms(){
	var slots = [{'el':'sat','cls':'slot4x8','type':'north no-inside'},{'el':'sat','cls':'slot2x4','type':'south'}];
	var el,radio,cls,i,i2,e;
	for(var s = 0; s < slots.length; s++){
		e = E('#'+slots[s].el+' .'+slots[s].cls+':eq(0)');
		if(e.e.length > 0){
			if(E(e.e[0]).hasClass('radio')) E('#'+slots[s].el+' .hemisphere').remove();
			else e.html('<div class="hemisphere '+slots[s].type+'"><div class="inner"><\/div><div class="dome"><\/div><\/div>'+e.html());
			e.toggleClass('radio').toggleClass('slot-empty');
		}
	}
	var slots = [{'el':'sat-c','cls':'slot0x2'}];
	var el,aerial,top,cls,i,i2,ant;
	for(var s = 0; s < slots.length; s++){
		e = E('#'+slots[s].el+' .'+cls+':eq(0)');
		if(e.e.length > 0){
			if(e.hasClass('antenna')) E('#'+slots[s].el+' .aerial').remove();
			else E('#'+slots[s].el+' .'+cls+':eq(0) .top:eq(0)').html("<div class=\"aerial1 aerial\"><\/div><div class=\"aerial2 aerial\"><\/div>");
			e.toggleClass('antenna').toggleClass('slot-empty');
		}
	}
}

// On load
E(document).ready(function(){

	// Remove elements that show noscript messages
	E('.noscriptmsg').remove();

	// Remove classes from script only elements
	E('.scriptonly').toggleClass('scriptonly');

	// We hide elements that shouldn't be visible (but we are leaving visible
	// in the plain HTML so there is something if Javascript doesn't work.
	var sections = ['goal','bus','orbit','instrument','power','rocket','launch'];
	//for(var s = 0; s < sections.length; s++) E('#'+sections[s]).toggleClass('not-at-start');

	// Remove the overlay we've added inline
	E('#overlay').remove();

});

