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
	// Toggle a class on a DOM element
	stuQuery.prototype.addClass = function(cls){
		// Remove/add it
		for(var i = 0; i < this.e.length; i++){
			if(!this.e[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) this.e[i].className = (this.e[i].className+' '+cls).replace(/^ /,'');
		}
		return this;
	}
	stuQuery.prototype.css = function(css){
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
	stuQuery.prototype.clone = function(){
		var target = this.e[0];
		var wrap = document.createElement('div');
		wrap.appendChild(target.cloneNode(true));
		return wrap.innerHTML;
	}
	stuQuery.prototype.replaceWith = function(html){
		var myAnchor = this.e[0];
		var mySpan = document.createElement("span");
		mySpan.innerHTML = html;
		this.e[0].parentNode.replaceChild(mySpan, this.e[0]);
  		return this;
	}
	return new stuQuery(e);
}


var z = 1;
function toggle3D(element){
	E(element ? element.parentElement.parentElement.parentElement : '#satellite').toggleClass('threeD');
}
function zoom(element,factor){
	if(z * factor < 2 && z * factor > 0.5) z *= factor;
	E(element).parent().parent().parent().css({'font-size':z.toFixed(3)+'em'});
}
function chooseBus(element){
	// Reset all to black and white
	E('#bus .holder').addClass('blackandwhite');
	// Remove existing selections
	E('#bus .selected').toggleClass('selected');

	html = E(element).parent().children(0).clone();
	E('#sat .satellite').replaceWith(html)
	E('#sat-power .satellite').replaceWith(html)

	E(element).toggleClass("selected").parent().toggleClass("blackandwhite");
}
function toggleSolar(){
	E('#sat-power .satellite').toggleClass('solar-fixed');
}
function toggleAnimation(){
	E('#sat-power .satellite').toggleClass('spin');
}
function setSolar(n){
	var list = "";
	if(n > 4) n = 4;
	for(var i = 0; i < n; i++) list += "<li class=\"solar-panel\"><\/li>";
	E('#sat-power .solar-panels ol').html(list);
}
function addSolar(){
	panels = E('#sat-power .solar-panels');
	for(var i = 0; i < panels.e.length; i++){
		ps = panels.e[i].getElementsByTagName('li');
		if(ps.length < 4) panels.e[i].getElementsByTagName('ol')[0].innerHTML += '<li class="solar-panel"><\/li>';
	}
}
function removeSolar(){
	E('#sat-power .solar-panels li:eq(0)').remove();
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
	e = E('#sat .slot0x2:eq(0)');
	if(e.e.length > 0){
		if(e.hasClass('antenna')) E('#sat .aerial').remove();
		else E('#sat .slot0x2:eq(0) .top:eq(0)').html("<div class=\"aerial1 aerial\"><\/div><div class=\"aerial2 aerial\"><\/div>");
		e.toggleClass('antenna').toggleClass('slot-empty');
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
	
	E('#bus .satellite').on('click',function(e){
		chooseBus(E(e.currentTarget).parent().children(2).e[0]);
	})
	E('#bus button').on('click',function(e){
		chooseBus(e.currentTarget);
	})

	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

	var has = {};
	var wrap = E('#progressbar').css({'width':'100vw'});
	has['vw'] = (wrap.e[0].offsetWidth==w);

/*	function getHeight(el){
		if('getComputedStyle' in window) return parseInt(window.getComputedStyle(el, null).getPropertyValue('height'));
		else return parseInt(document.getElementById('example').currentStyle.height);	
	}*/

	// Kludgy fix for old browsers that don't have vw/vh/flex in CSS
	if(!has.vw){
		function resize(){
			E('section').css({'min-height':h+'px'});
			// Hard-coded fudge based on padding of 2em (1em=14px)
			var paddh = h-48;
			E('section').children('.padded').css({'min-height':paddh+'px'});
			var table = E('section').children('.padded').children('.table');
			table.css({'height':paddh+'px'});

			var rows = table.children('.table-row');//E('.table-row');
			for(var r = 0; r < rows.e.length; r++){
				// Step up to the table parent
				var table = E(rows.e[r]).parent();
				var dh = 0;
				var fixed = table.children('.table-row-top');
				// Get all table-row children
				var rs = table.children('.table-row');
				dh = Math.floor((table.e[0].offsetHeight - fixed.e[0].offsetHeight)/(rs.e.length));
				rs.css({'min-height':dh+'px'});
				rs.children('.table-left').css({'float':'left','min-height':dh+'px'}).children('.table').css({'height':dh+'px'});
				rs.children('.table-right').css({'float':'right','min-height':dh+'px'});
				
				table = rs.children('.table-left').css({'float':'left','min-height':dh+'px'}).children('.table');
				if(table.e.length > 0){
					fixed = table.children('.table-row-top');
					rs = table.children('.table-row');
					// Hardcoded 1em padding
					dh = Math.floor((table.e[0].offsetHeight - fixed.e[0].offsetHeight - 14)/(rs.e.length));
					rs.css({'min-height':dh+'px'}).children('.satellite-holder').css({'height':dh+'px'})
				}
			}
		}
		// We'll need to change the sizes when the window changes size
		window.addEventListener('resize', function(event){ resize(); });
		resize();
	}

});

