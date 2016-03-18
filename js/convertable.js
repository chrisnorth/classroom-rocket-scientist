// Add Math.log10 function if it doesn't exist
if(typeof Math.log10!=="function") Math.log10 = function(v) { return Math.log(v)/2.302585092994046; };

function Convertable(v,u,d){

	var ph = {
		"million": { "full": " million", "compact": "&thinsp;Mn" },
		"billion": { "full": " billion", "compact": "&thinsp;Bn" },
		"defaults": {
			"length": "m",
			"area": "m^2",
			"temperature": "K",
			"mass": "kg",
			"time": "seconds",
			"percent": "%",
			"angle": "degrees",
			"currency": "GBP",
			"force": "kN",
			"power": "watts"
		},
		"units": {
			"km": { "unit": "&thinsp;km", "dimension": "length", "conv": 1000 },
			"m": { "unit": "&thinsp;m", "dimension": "length", "conv": 1 },
			"mm": { "unit": "&thinsp;mm", "dimension": "length", "conv": 0.001 },
			"ft": { "unit": "&thinsp;ft", "dimension": "length", "conv": 1/3.281 },
			"mile": { "unit": "&thinsp;miles", "dimension": "length", "conv": 1609.344 },
			"cubit": { "unit": "&thinsp;cubits", "dimension": "length", "conv": 0.4572 },
			"bluewhale": { "unit": "&thinsp;blue whales", "dimension": "length", "conv": 30 },
			"yard": { "unit": "&thinsp;yd", "dimension": "length", "conv": 1/1.094 },
			"league": { "unit": "&thinsp;leagues", "dimension": "length", "conv": 4828.032 },
			"m^2": { "unit": "&thinsp;m&sup2;", "dimension": "area", "conv": 1 },
			"N": { "unit": "&thinsp;N", "dimension": "force", "conv": 1 },
			"kN": { "unit": "&thinsp;kN", "dimension": "force", "conv": 1000 },
			"K": { "unit": "&thinsp;K", "dimension": "temperature" },
			"C": { "unit": "&deg;C", "dimension": "temperature" },
			"F": { "unit": "&deg;F", "dimension": "temperature" },
			"kg": { "unit": "&thinsp;kg", "dimension": "mass", "conv": 1 },
			"lb": { "unit": "&thinsp;lb", "dimension": "mass", "conv": 1/2.205 },
			"elephant": { "unit": "&thinsp;elephants", "dimension": "mass", "conv": 5400 },
			"watts": { "unit": "&thinsp;W", "dimension": "power", "conv": 1 },
			"horsepower": { "unit": "&thinsp;hp", "dimension": "power", "conv": 745.7 },
			"years": { "unit": "&thinsp;years", "dimension": "time", "conv": 365.25*86400 },
			"months": { "unit": "&thinsp;months", "dimension": "time", "conv": 30*86400 },
			"days": { "unit": "&thinsp;days", "dimension": "time", "conv": 86400 },
			"hours": { "unit": "&thinsp;hours", "dimension": "time", "conv": 3600 },
			"minutes": { "unit": "&thinsp;minutes", "dimension": "time", "conv": 60 },
			"seconds": { "unit": "&thinsp;seconds", "dimension": "time", "conv": 1 },
			"%": { "unit": "%", "dimension": "percent" },
			"degrees": { "unit": "&deg;", "dimension": "angle", "conv": 1 },
			"arcmin": { "unit": "'", "dimension": "angle", "conv": 1/60 },
			"arcsec": { "unit": "\"", "dimension": "angle", "conv": 1/3600 }
		},
		"currency": {
			"GBP": { "symbol": "&pound;", "conv": 1 },
			"USD": { "symbol": "&dollar;", "conv": 1.67 },
			"EUR": { "symbol": "&euro;", "conv": 1.21 },
			"JPY": { "symbol": "&yen;", "conv": 170.7 },
			"CAD": { "symbol": "C&dollar;", "conv": 1.8461 },
			"AUD": { "symbol": "&dollar;", "conv": 1.8642 },
			"CHF": { "symbol": "Fr.", "conv": 1.473 },
			"SEK": { "symbol": "kr", "conv": 10.7654 },
			"CNY": { "symbol": "&yen;", "conv": 10.327 }, 
			"INR": { "symbol": "&#8377;", "conv": 100.1 }, 
			"RUB": { "symbol": "RUB", "conv": 59.136 }, 
			"DBL": { "symbol": "DBL", "conv": 0.07485 },
			"credits": { "symbol": "", "conv": 0.001 }
		}
	}
	this.hasUnit = function(u){
		if(ph.units[u]) return true;
		if(ph.currency[u]) return true;
		return false;
	}
	if(typeof v==="object"){
		if(typeof v.value==="string" && (v.value=="inf" || v.value=="Infinity")) v.value = Infinity;
		if(typeof v.getAttribute==="function"){
			u = v.getAttribute('data-units');
			d = v.getAttribute('data-dimension');
			v = parseFloat(v.getAttribute('data-value'));
		}else if(typeof v.value==="number" && typeof v.units==="string" && typeof v.dimension==="string"){
			u = v.units;
			d = v.dimension;
			v = v.value;
		}
	}
	if((typeof v==="number" || typeof v==="string") && u){
		this.value = (typeof v==="string") ? ((v=="inf" || v=="Infinity") ? Infinity : parseFloat(v)) : v;
		if(ph.units[u] || ph.currency[u]) this.units = u;
		else return {};
		if(d) this.dimension = d;
		else{
			if(ph.units[u]) this.dimension = ph.units[u].dimension;
			else if((ph.currency[u])) this.dimension = "currency";
		}
	}

	// Display really large numbers as powers of ten
	function powerOfTen(v,u){
		var p = Math.floor(Math.log10(v));
		var a = Math.round(v/Math.pow(10,p))
		return ''+a+'&times;10<sup>'+p+'</sup>'+u;
	}
	// Add commas every 10^3
	function addCommas(s) {
		s += '';
		var x = s.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) x1 = x1.replace(rgx, '$1' + ',' + '$2');
		return x1 + x2;
	}

	// Convert an input value/unit/dimension object into another unit
	// Inputs:
	//   v - the { "value": 1, "units": "m", "dimension": "length" } object
	//   to - the new unit (must be one of the acceptable units for the dimension
	// Output:
	//   An { "value": 1, "units": "m", "dimension": "length" } object
	this.convertTo = function(to){

		var v = this.copy();

		if(typeof v.value==="string" && v.value != "inf") v.value = parseFloat(v.value,10);

		if(v.dimension == "length"){
			if(v.units != to){
				// Step 1: convert to defaults
				if(ph.units[v.units].conv) v.value *= ph.units[v.units].conv;
				// Step 2: convert to new unit
				if(ph.units[to].conv) v.value /= ph.units[to].conv;
				v.units = to;
			}
			if(v.units=="m" && v.value > 1000){
				v.value /= 1000;
				v.units = "km";
			}
			if(v.units=="ft" && v.value > 5280){
				v.value /= 5280;
				v.units = "mile"
			}
			if(v.units=="yard" && v.value > 1760){
				v.value /= 1760;
				v.units = "mile";
			}
		}else if(v.dimension == "temperature"){
			if(v.units != to){
				// Step 1: convert to defaults
				if(v.units == "C") v.value += 273;
				else if(v.units == "F") v.value = (5/9)*(v.value - 32) + 273;
				// Step 2: convert to new unit
				if(to == "C") v.value -= 273;
				else if(to == "F") v.value = (9/5)*(v.value - 273) + 32;
				v.units = to;
			}
		}else if(v.dimension == "time"){
			if(to == "years" || to == "months" || to == "days" || to == "hours" || to == "minutes" || to == "seconds"){
				if(v.units != to){
					// Step 1: convert to defaults
					if(ph.units[v.units].conv) v.value *= ph.units[v.units].conv;
					// Step 2: convert to new unit
					if(ph.units[to].conv) v.value /= ph.units[to].conv;
					v.units = to;
				}
			}
		}else if(v.dimension == "angle"){
			if(to == "degrees" || to == "arcmin" || to == "arcsec"){
				if(v.units != to){
					// Step 1: convert to defaults
					if(ph.units[v.units].conv) v.value *= ph.units[v.units].conv;
					// Step 2: convert to new unit
					if(ph.units[to].conv) v.value /= ph.units[to].conv;
					v.units = to;
				}
			}
		}else if(v.dimension == "currency"){
			if(ph.currency[to]){
				if(v.units != to){
					if(v.value != "inf"){
						// Step 1: convert to GBP
						if(ph.currency[v.units].conv) v.value /= ph.currency[v.units].conv;
						// Step 2: convert to new unit
						if(ph.currency[to].conv) v.value *= ph.currency[to].conv;
					}
					v.units = to;
				}
			}
		}else{	
			if(v.units != to && ph.units[v.units] && ph.units[to]){
				// Step 1: convert to defaults
				if(ph.units[v.units].conv) v.value *= ph.units[v.units].conv;
				// Step 2: convert to new unit
				if(ph.units[to].conv) v.value /= ph.units[to].conv;
				v.units = to;
			}
		}
		return v;
	}
	// Format a <span>
	this.formatSpan = function(key){
		return '<span class="value'+(key ? " "+key : "")+' convertable" data-value="'+this.value+'" data-units="'+this.units+'" data-dimension="'+this.dimension+'">'+this.toString()+'</span>';
	}
	// Make a copy of this
	this.copy = function(){
		return new Convertable(this.value,this.units,this.dimension);
	}
	// Return the precision in the number
	this.getPrecision = function(){
		if(this.value < 1e-9) return 1;
		if(typeof this.value==="number" && this.value < 1) return Math.ceil(Math.log10(1/this.value))+1;
		return 1;
		/*var str = ''+this.value;
		if(str.indexOf('.') >= 0) return str.substr(str.indexOf('.')+1).length;
		else return 0;*/
	}
	// Format a value differently depending on the dimension
	// Inputs:
	//  p - the number of decimal places to show in the output (if not provided the function
	//      makes an intelligent guess).
	this.toString = function(attr){

		// Make a copy of the original so that we don't overwrite it
		var v = this.copy();

		var p;
		if(!attr){ attr = {}; }
		if(typeof attr==="object" && attr.p) p = attr.p;
		else p = attr;

		// Convert precision to a number if it is a string
		if(typeof p==="string") p = parseInt(p,10);
		var unit;
		var dim = v.dimension;
		var to = (attr.units) ? attr.units : ph.defaults[dim];

		// Define the rounding function
		function round(v,p){
			var f = Math.pow(10,p);
			return ''+(Math.round(v*f)/f).toFixed(p);
		}
		var showunits = (typeof attr.unitdisplayed==="boolean") ? attr.unitdisplayed : true;
		function tidy(v,p,u){
			return ''+addCommas(round(v,p)).replace(/\.0+$/,'').replace(/(\.0?[1-9]+)0+$/,"$1")+''+(showunits ? u : '');
		}

		if(dim=="length"){
		
			v = this.convertTo(to);
			if(typeof p!=="number") p = (v.units=="km" ? 0 : v.getPrecision());
			unit = (ph.units[v.units]) ? ph.units[v.units].unit : "";
			if(v.value > 1e15) return powerOfTen(v.value,v.unit);
			return tidy(v.value,p,unit);
		
		}else if(dim=="currency"){
	
			var append = "";
			v = this.convertTo(to)
			if(typeof p!=="number") p = 0;

			var s = (ph.currency[v.units] && ph.currency[v.units].symbol) ? ph.currency[v.units].symbol : "";
			if(v.value == "inf" || v.value >= 1e15) return '&infin;';

			// Correct for sign of currency (we can have negative values)
			var sign = (v.value < 0) ? '-' : '';
			v.value = Math.abs(v.value);

			if(v.value > Math.pow(10,(6-p))){
				v.value /= 1e6;
				append = (ph.million.compact) ? ph.million.compact : ph.million.full;
				// Change the "million" to "billion" if the number is too big
				if(v.value >= 1000){
					v.value /= 1000;
					append = (ph.billion.compact) ? ph.billion.compact : ph.billion.full;
				}
			}
			if(p == 0){
				if(v.value < 100) p = 1;
				if(v.value < 10) p = 2;
			}
			var val = round(v.value,p).replace(/\.0+$/,'').replace(/(\.[1-9]+)0+$/,"$1").replace(/^ /,"&thinsp;");
			return sign+s+val+append;

		}else if(dim=="temperature"){

			v = this.convertTo(to)
			if(typeof p==="string") p = parseInt(p,10);
			if(typeof p!=="number") p = (v.value > 1000) ? 0 : v.getPrecision();
			unit = (ph.units[v.units]) ? ph.units[v.units].unit : "";
			if(typeof v.value==="string") v.value = parseInt(v.value,10);
			return tidy(v.value,p,unit);

		}else if(dim=="time"){

			if(v.units=="years" && v.value < 5) v = this.convertTo("months");
			if(typeof p!=="number") p = (v.value >= 6) ? 0 : v.getPrecision();
			unit = (ph.units[v.units]) ? ph.units[v.units].unit : "";
			if(typeof v.value==="string") v.value = parseInt(v.value,10)
			return tidy(v.value,p,unit);

		}else if(dim=="percent"){

			v = v.value;
			if(typeof this.value!=="number") v = parseInt(v,10)
			if(typeof this.value!=="number") return "0"+unit;
			if(typeof p!=="number") p = 1;
			unit = (ph.units[v.units]) ? ph.units[v.units].unit : "%";
			return tidy(v.value,p,unit);

		}else if(dim=="angle"){

			if(v.units=="degrees" && v.value < 1) v = this.convertTo("arcmin");
			if(v.units=="arcmin" && v.value < 1) v = this.convertTo("arcsec");
			if(typeof p!=="number") p = (v.value >= 10) ? 0 : v.getPrecision();
			unit = (ph.units[v.units]) ? ph.units[v.units].unit : "";
			if(typeof v.value==="string") v.value = parseInt(v.value,10);
			return tidy(v.value,p,unit);

		}else{
			v = this.convertTo(to);
			unit = (ph.units[v.units]) ? ph.units[v.units].unit : "";
			if(typeof p!=="number") p = (v.value >= 1000) ? 0 : v.getPrecision();
			if(v.value > 1e15) return powerOfTen(v.value,unit);
			else return tidy(v.value,p,unit);
		}
		 return v.value;
	}
	// Return the negative of the input value
	// Input:
	//   In the form {'value':100,'units':'GBP','dimension':'currency'}
	// Output:
	//   The negative of the input
	// Notes:
	//   Only values with the same dimension will be summed
	//   Input units can differ - this will take care of unit conversions
	this.negative = function(){
		var output = this.copy();
		output.value *= -1;
		return output;
	}
	
	// Add the input values.
	// Input:
	//   An convertable
	// Output:
	//   A value object with the same dimension and units as this object
	// Notes:
	//   Only values with the same dimension will be summed
	//   Input units can differ - this will take care of unit conversions
	this.add = function(v){
		if(v.typeof=="convertable"){
			if(this.dimension===v.dimension){
				var a = v.copy().convertTo(this.units);
				this.value += a.value;
			}
		}
		return this;
	}

	this.typeof = "convertable";
	return this;
}

