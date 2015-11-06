// Helper functions
function r(f){/in/.test(document.readyState)?setTimeout('r('+f+')',9):f()}
// Remove a DOM element
function removeEl(el){
	if(typeof el.remove==="function") el.remove(el);
	else if(typeof el.parentElement.removeChild==="function") el.parentElement.removeChild(el);
}
// Check if a DOM element has the specified class
function hasClass(el,cls){
	if(!el) return false;
	if(el.className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) return true;
	else return false;
}
// Toggle a class on a DOM element
function toggleClass(el,cls){
	if(!el) return;
	// Remove/add it
	if(hasClass(el,cls)) el.className = el.className.replace(new RegExp("(\\s|^)" + cls + "(\\s|$)", "g")," ").replace(/ $/,'');
	else el.className += ' '+cls;
	return el;
}
var z = 1;
function toggle3D(){
	toggleClass(document.getElementById('satellite'),'threeD');
}
function zoom(factor){
	z *= factor;
	document.getElementById('satellite').setAttribute('style','font-size:'+z.toFixed(3)+'em');
}
function toggleSolar(){
	var ids = ['sat-power-l','sat-power-m','sat-power-s','sat-power-c'];
	for(var j = 0; j < ids.length; j++){
		if(document.getElementById(ids[j])) toggleClass(document.getElementById(ids[j]).children[0],'solar-fixed');
	}
}
function toggleAnimation(){
	var ids = ['sat-power-l','sat-power-m','sat-power-s','sat-power-c'];
	for(var j = 0; j < ids.length; j++){
		if(document.getElementById(ids[j])) toggleClass(document.getElementById(ids[j]).children[0],'spin');
	}
}
function setSolar(n){
	var ids = ['sat-power-l','sat-power-m'];
	var ul = "<ul>";
	for(var i = 0; i < n; i++) ul += "<li class=\"solar-panel\"><\/li>";
	ul += '<\/ul>';
	for(var j = 0; j < ids.length; j++){
		el = document.getElementById(ids[j]);
		panels = el.getElementsByClassName('solar-panels');
		for(var i = 0; i < panels.length; i++){
			panels[i].innerHTML = ul;
		}
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
	for(var j = 0; j < ids.length; j++){
		el = document.getElementById(ids[j]);
		if(el){
			panels = el.getElementsByClassName('solar-panels');
			for(var i = 0; i < panels.length; i++){
				ps = panels[i].getElementsByTagName('li');
				if(ps.length > 0) removeEl(ps[ps.length-1]);
			}
		}
	}
}
function toggleComms(){
	var slots = [{'el':'sat-l','cls':'slot4x8','type':'north no-inside'},{'el':'sat-l','cls':'slot2x4','type':'south'},{'el':'sat-m','cls':'slot2x4','type':'south'},{'el':'sat-s','cls':'slot2x4','type':'south'}];
	var el,radio,cls,i,i2;
	for(var s = 0; s < slots.length; s++){
		el = document.getElementById(slots[s].el);
		if(el){
			els = el.getElementsByClassName(slots[s].cls);
			if(hasClass(els[0],'radio')) removeEl(el.getElementsByClassName('hemisphere')[0]);
			else els[0].innerHTML = '<div class="hemisphere '+slots[s].type+'"><div class="inner"><\/div><div class="dome"><\/div><\/div>'+els[0].innerHTML;
			toggleClass(els[0],'radio');
			toggleClass(els[0],'slot-empty');
		}
	}
	var slots = [{'el':'sat-c','cls':'slot0x2'}];
	var el,aerial,top,cls,i,i2,ant;
	for(var s = 0; s < slots.length; s++){
		el = document.getElementById(slots[s].el)
		if(el){
			els = el.getElementsByClassName(slots[s].cls);
			if(hasClass(els[0],'antenna')){
				aerial = el.getElementsByClassName('aerial');
				for(var i = aerial.length-1; i >= 0; i--) removeEl(aerial[i]);
			}else{
				top = els[0].getElementsByClassName('top');
				top[0].innerHTML = "<div class=\"aerial1 aerial\"><\/div><div class=\"aerial2 aerial\"><\/div>";
			}
			toggleClass(els[0],'antenna');
			toggleClass(els[0],'slot-empty');
		}
	}
}
// On load
r(function(){
	// Remove elements that show noscript messages
	var ns = document.getElementsByClassName('noscriptmsg');
	for(var i = 0; i < ns.length;i++) removeEl(ns[i]);

	// Remove classes from script only elements
	el = document.getElementsByClassName('scriptonly');
	for(var i = el.length-1; i >= 0;i--) toggleClass(el[i],'scriptonly');
	
})