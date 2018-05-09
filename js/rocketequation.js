/*
	Input:
	* orb - the key for the chosen orbit e.g. "LEO", "MEO", "HEO", "GEO"
	* d - the JSON data structure
	* stages - an array holding the appropriate data for each stage
*/
function rocketEquation(orb,d,stages,payloadmass){
	var dv = 0;
	var none = new Convertable({'value':0,'units':'m/s','dimension':'velocity'});
	var rtn = {
		'ok': false,
		'orbit': { 'key': orb, 'data': (d.orbit[orb] || {}) },
		'v': { 'LEO': '', 'orbit': '' },
		'deltav': { 'required': none, 'hofmann': none, 'drag': none, 'total': none },
		'stages': stages
	}
	if(!orb) return rtn;
	for(var s = 0; s < stages.length; s++){
		// Calculated values
		if(stages[s]){
			if(!stages[s]['thrust']) stages[s]['thrust'] = 0;
			stages[s].veff = (stages[s]['impulse']) ? {'value':9.81*stages[s]['impulse'].value,'units':'m/s','dimension':'velocity'} : 0;
			stages[s].mfr = (stages[s]['thrust'] && stages[s]['veff'].value > 0) ? {'value':(stages[s]['thrust'].value*1000)/stages[s]['veff'].value,'units':'kg/s','dimension':'massflowrate'} : 0;
			stages[s].burn = (stages[s]['mfr'] && stages[s]['fuel']) ? {'value':(stages[s]['fuel'].value/stages[s]['mfr'].value),'units':'s','dimension':'time'} : 0;

			if(stages[s].fuel){
				massinitial = 0;
				if(stages[s].fuel) massinitial += stages[s].fuel.value;
				if(stages[s].drymass) massinitial += stages[s].drymass.value;
				massfinal = 0;
				for(var st = s+1; st < stages.length; st++){
					if(stages[st].fuel) massfinal += stages[st].fuel.value;
					if(stages[st].drymass) massfinal += stages[st].drymass.value;
				}
				if(payloadmass) massfinal += payloadmass.value;
				stages[s].massinitial = {'value':massinitial+massfinal,'units':'kg','dimension':'mass'};
				stages[s].massfinal = {'value':massfinal,'units':'kg','dimension':'mass'};

				// delta-V (per stage) [m/s] = V_eff [m/s] * ln(Mass_init/Mass_final)
				// remembering to include the masses of all the stages and fuel above]
				stages[s].deltav = (stages[s].veff.value > 0) ? {'value': stages[s].veff.value * Math.log(stages[s].massinitial.value/stages[s].massfinal.value),'units':'m/s','dimension':'velocity'} : 0;
			}
			if(stages[s].deltav) dv += stages[s].deltav.value;
		}
	}
	dv = new Convertable({'value':dv,'units':'m/s','dimension':'velocity'});

	// Process orbit
	var mu = (6.673e-11 * 5.98e24);
	var r_E = 6378100;
	// 4π²R³ = T²GM
	// V²R = GM
	// We have R, G, M
	var v = new Convertable({'value':Math.sqrt(mu/(r_E + 1000*d.orbit[orb].altitude.value)),'units':'m/s','dimension':'velocity'});
	var v_leo = new Convertable({'value':Math.sqrt(mu/(r_E + 1000*d.orbit['LEO'].altitude.value)),'units':'m/s','dimension':'velocity'});
	var r1 = r_E + d.orbit['LEO'].altitude.value*1000;
	var r2 = r_E + d.orbit[orb].altitude.value*1000;
	var dv1 = Math.sqrt(mu/r1)*( Math.sqrt((2*r2) / (r1 + r2)) - 1 );
	var dv2 = Math.sqrt(mu/r2)*( 1 - Math.sqrt((2*r1) / (r1 + r2)));
	var deltav = new Convertable({'value':(dv1 + dv2),'units':'m/s','dimension':'velocity'});
	var drag = new Convertable({'value':1300,'units':'m/s','dimension':'velocity'});	// Extra due to atmospheric/gravity drag https://en.wikipedia.org/wiki/Low_Earth_orbit
	d.orbit[orb].dv = v_leo.copy();
	d.orbit[orb].dv.value += drag.value;
	d.orbit[orb].dv.value += deltav.value;
	d.orbit[orb].v = v.copy();

	rtn.ok = (dv.value >= d.orbit[orb].dv.value);
	rtn.v.LEO = v_leo;
	rtn.v.orbit = v;
	rtn.deltav.required = d.orbit[orb].dv;
	rtn.deltav.hofmann = deltav;
	rtn.deltav.drag = drag;
	rtn.deltav.total = dv;
	
	return rtn;
}