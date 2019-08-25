
Date.prototype.getJD = function() {
	// https://stackoverflow.com/questions/11759992/calculating-jdayjulian-day-in-javascript
  	return (this / 86400000) - (this.getTimezoneOffset() / 1440) + 2440587.5;
}

Date.prototype.getMJD = function() {
  	return (this.getJD() - 2451545.0)
}

Date.prototype.getT = function() {
	return this.getMJD()/35625.0;
}


function deg_to_rad(deg) {
	return deg * Math.PI / 180.0;
}

function rad_to_deg(rad) {
	return rad * 180.0 / Math.PI;
}

function normalize_rad(x) {
	var y = (x % (2 * Math.PI));
	return y < 0.0 ? y + (2 * Math.PI) : y;
}

function normalize_deg(x) {
	var y = (x % 360.0);
	return y < 0.0 ? y + 360.0 : y;
}

function dms(d, m, s) {
	return d + m/60.0 + s/3600.0;
}

function epsT(T) {
	var eps = dms(23, 26, 21.406 ) 
  	      - dms(0, 0, 46.836769)*T 
  	      - dms(0, 0, 0.0001831)*T*T 
  	      + dms(0, 0, 0.0020034)*T*T*T
  	      - dms(0, 0, 0.576E-6 )*T*T*T*T 
  	      - dms(0, 0, 4.340E-8 )*T*T*T*T*T;
    
    return deg_to_rad(eps);
}

function to_long_lat(alpha, delta, T) {
	// Based on https://github.com/brandon-rhodes/pyephem/blob/master/libastro-3.7.7/eq_ecl.c 

	var eps = epsT(T);
	var ceps = Math.cos(eps);
	var seps = Math.sin(eps);

	var sy = Math.sin(delta);
	var cy = Math.cos(delta);
	if (Math.abs(cy) < 1E-20) { cy = 1E-20; };
	var ty = sy / cy;

	var cx = Math.cos(alpha);
	var sx = Math.sin(alpha);
	var sq = (sy * ceps) - (cy * seps * sx)
	if (sq < -1) { sq = -1 };
	if (sq > +1) { sq = +1 }; 

	var lat = Math.asin(sq);

	var long = Math.atan(((sx*ceps)+(ty*seps))/cx);
	if (cx < 0.0) {	long += Math.PI; }
	if (long < 0.0) { long += 2*Math.PI; }

	return [long, lat];
}

function lunar_pole(dateArg) {

	var jd = dateArg.getJD();
	var  d = dateArg.getMJD();
	var  T = dateArg.getT();

	var rad = Math.PI / 180.0;

	var E1  = rad * (125.045 -  0.0529921 * d);
	var E2  = rad * (250.089 -  0.1059842 * d);
	var E3  = rad * (260.008 + 13.0120009 * d);
	var E4  = rad * (176.625 + 13.3407154 * d);
	var E5  = rad * (357.529 +  0.9856003 * d);
	var E6  = rad * (311.589 + 26.4057084 * d);
	var E7  = rad * (134.963 + 13.0649930 * d);
	var E8  = rad * (276.617 +  0.3287146 * d);
	var E9  = rad * ( 34.226 +  1.7484877 * d);
	var E10 = rad * ( 15.134 -  0.1589763 * d); 
	var E11 = rad * (119.743 +  0.0036096 * d);
	var E12 = rad * (239.961 +  0.1643573 * d);
	var E13 = rad * ( 25.053 + 12.9590088 * d);

	var alpha0 = 269.9949 + 0.0031 * T 
		- 3.8787 * Math.sin(E1)  - 0.1204 * Math.sin(E2) + 0.0700 * Math.sin(E3) 
		- 0.0172 * Math.sin(E4)  + 0.0072 * Math.sin(E6) - 0.0052 * Math.sin(E10) 
		+ 0.0043 * Math.sin(E13);

	var delta0 = 66.5392 + 0.0130 * T
		+ 1.5419 * Math.cos(E1)  + 0.0239 * Math.cos(E2) - 0.0278 * Math.cos(E3) 
		+ 0.0068 * Math.cos(E4)  - 0.0029 * Math.cos(E6) + 0.0009 * Math.cos(E7) 
		+ 0.0008 * Math.cos(E10) - 0.0009 * Math.cos(E13);

	var W = 38.2813 + 13.17635815 * d - 1.4E-12 * d * d 
		+ 3.5610 * Math.sin(E1)  + 0.1208 * Math.sin(E2)  - 0.0642 * Math.sin(E3) 
		+ 0.0158 * Math.sin(E4)  + 0.0252 * Math.sin(E5)  - 0.0066 * Math.sin(E6) 
		- 0.0047 * Math.sin(E7)  - 0.0046 * Math.sin(E8)  + 0.0028 * Math.sin(E9) 
		+ 0.0052 * Math.sin(E10) + 0.0040 * Math.sin(E11) + 0.0019 * Math.sin(E12)
		- 0.0044 * Math.sin(E13);


	return {
		"alpha0": deg_to_rad(normalize_deg(alpha0)), 
		"delta0": deg_to_rad(normalize_deg(delta0)),
		"W": deg_to_rad(normalize_deg(W))
	};
}

function test_lunar_pole() {

	var dt = new Date();

	for (var i = 0; i < 100; ++i) {
		var lp = lunar_pole(dt);
		var a = lp["alpha0"];
		var d = lp["delta0"];

		var long_lat = to_long_lat(a, d, 0);
		var long = rad_to_deg(long_lat[0]);
		var lat = rad_to_deg(long_lat[1]);

		console.log(dt + ": ("+rad_to_deg(a)+", "+rad_to_deg(d)+")");
		dt.setDate(dt.getDate() + 30);
	}
}

// end of file
