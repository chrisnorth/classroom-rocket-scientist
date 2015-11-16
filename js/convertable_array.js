// Sum an array of input values.
// Input:
//   An array of the form [{'value':100,'units':'GBP','dimension':'currency'},{'value':100,'units':'GBP','dimension':'currency'}]
// Output:
//   A value object with the same dimension and units as the first input value
// Notes:
//   Only values with the same dimension will be summed
//   Input units can differ - this will take care of unit conversions
Array.prototype.sumValues = function(){
	var o,a,i;
	if(this.length > 0){
		for(i = 0 ; i < this.length ; i++){
			if(this[i].typeof=="convertable"){
				if(!o){
					o = this[i].copy();
				}else{
					if(this[i].typeof==="convertable" && this[i].dimension===o.dimension){
						a = this[i].copy().convertTo(o.units);
						o.value += a.value;
					}
				}
			}
		}
		return o;
	}
	return this;
}

// Return the minimum value in an array of input values	
Array.prototype.minValue = function(){
	var a,i,m,o;
	if(this.length > 0){
		for(i = 0 ; i < this.length ; i++){
			if(this[i].typeof=="convertable"){
				if(!o){
					o = this[i].copy();
					m = o.copy();
				}else{
					if(this[i].typeof==="convertable" && this[i].dimension===o.dimension){
						a = this[i].copy().convertTo(o.units);
						if(a.value < m.value) m = a;
					}
				}
			}
		}
		if(m) return m;
	}
	return {};
}

// Return the maximum value in an array of input values	
Array.prototype.maxValue = function(){
	var a,i,m,o;
	if(this.length > 0){
		for(i = 0 ; i < this.length ; i++){
			if(this[i].typeof=="convertable"){
				if(!o){
					o = this[i].copy();
					m = o.copy();
				}else{
					if(this[i].typeof==="convertable" && this[i].dimension===o.dimension){
						a = this[i].copy().convertTo(o.units);
						if(a.value > m.value) m = a;
					}
				}
			}
		}
		if(m) return m;
	}
	return {};
}