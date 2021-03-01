
// const ephemeris = require('./third-party/ephemeris-0.1.0.min.js');

Date.prototype.getJD = function() {
	// https://stackoverflow.com/questions/11759992/calculating-jdayjulian-day-in-javascript
    
    // TODO appoximate conversion from UTC to TDB
    // TDB = TDT + small terms
    // TDT = TAI + 32.184s
    // TAI = UTC + leap seconds 
    // TDB = UTC + leap seconds + 32.184s
    // TDB = UTC + 37s + 32.184s // It's 37s in 2019-20 - it's good enough for now

    // console.log(`TZ offset (minutes) = ${this.getTimezoneOffset()}`);
    var t = (this/1.0) + (37.000 + 32.184) * 1000; 
    // var t = this;
    // The accepted SO answer is not really correct.
  	// return (t / 86400000) - (this.getTimezoneOffset() / 1440) + 2440587.5;
    return (t / 86400000) + 2440587.5;
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

function get_moon(nowDate) {

	var ephemYear = nowDate.getUTCFullYear();
    var ephemMonth = nowDate.getUTCMonth() + 1;
    var ephemDay = nowDate.getUTCDate();
    var ephemHours = nowDate.getUTCHours();
    var ephemMinutes = nowDate.getUTCMinutes();
    var ephemSeconds = nowDate.getUTCSeconds();
    var ephemDate = {'year': ephemYear, 'month': ephemMonth, 'day': ephemDay, 'hours': ephemHours, 'minutes': ephemMinutes, 'seconds': ephemSeconds};
    // console.log(ephemDate);
	$const.tlong = 77.5946; // longitude
	$const.glat = 12.9716; // latitude
	$processor.init(); // TODO not sure whether this needs to be called every time or just once
	var ephemMoon = $moshier.body.moon;
	$processor.calc(ephemDate, ephemMoon);
    // console.log(`$moshier.delta.calc=${$moshier.delta.calc(ephemDate)}`);
	return ephemMoon.position;
}

function lunar_pole(dateArg) {

	var jd = dateArg.getJD();
	var  d = dateArg.getMJD();
	var  T = dateArg.getT();

    // console.log(`D = ${d}, T = ${T}`);

	var rad = Math.PI / 180.0;

    // Based on Lunar Constants and Models Document
    // https://ssd.jpl.nasa.gov/dat/lunar_cmd_2005_jpl_d32296.pdf 
    //
    // These calculations use EME2000 (Ecliptic and Mean Equinox of J2000.0) coordinate system. 
  
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

	var alpha_iau_deg = 269.9949 + 0.0031 * T 
		- 3.8787 * Math.sin(E1)  - 0.1204 * Math.sin(E2) + 0.0700 * Math.sin(E3) 
		- 0.0172 * Math.sin(E4)  + 0.0072 * Math.sin(E6) - 0.0052 * Math.sin(E10) 
		+ 0.0043 * Math.sin(E13);

	var delta_iau_deg = 66.5392 + 0.0130 * T
		+ 1.5419 * Math.cos(E1)  + 0.0239 * Math.cos(E2) - 0.0278 * Math.cos(E3) 
		+ 0.0068 * Math.cos(E4)  - 0.0029 * Math.cos(E6) + 0.0009 * Math.cos(E7) 
		+ 0.0008 * Math.cos(E10) - 0.0009 * Math.cos(E13);

    var WP_iau_deg = 38.3213 + 13.17635815 * d - 1.4E-12 * d * d 

	var W_iau_deg = WP_iau_deg 
		+ 3.5610 * Math.sin(E1)  + 0.1208 * Math.sin(E2)  - 0.0642 * Math.sin(E3) 
		+ 0.0158 * Math.sin(E4)  + 0.0252 * Math.sin(E5)  - 0.0066 * Math.sin(E6) 
		- 0.0047 * Math.sin(E7)  - 0.0046 * Math.sin(E8)  + 0.0028 * Math.sin(E9) 
		+ 0.0052 * Math.sin(E10) + 0.0040 * Math.sin(E11) + 0.0019 * Math.sin(E12)
		- 0.0044 * Math.sin(E13);

    // var alpha_pa_deg = alpha_iau_deg + 0.0553 * Math.cos(rad * WP_iau_deg) + 0.0034 * Math.cos((rad * WP_iau_deg) + E1);
    // var delta_pa_deg = delta_iau_deg + 0.0220 * Math.sin(rad * WP_iau_deg) + 0.0007 * Math.sin((rad * WP_iau_deg) + E1);
    // var W_pa_deg     = W_iau_deg     + 0.01775 - 0.0507 * Math.cos(rad * WP_iau_deg) - 0.00034 * Math.cos((rad * WP_iau_deg) + E1);

    alpha_iau = deg_to_rad(normalize_deg(alpha_iau_deg));
	delta_iau = deg_to_rad(normalize_deg(delta_iau_deg));
    W_iau = deg_to_rad(normalize_deg(W_iau_deg));

	return  {"alpha": alpha_iau, 
             "delta": delta_iau, 
             "W": W_iau
            };
}

function test_lunar_pole() {
    for (var year = 2019; year < 2020; ++year) {
        for (var month = 7; month < 10; ++month) {
            
            // var dt1 = new Date(Date.UTC(year, month, 1, 11, 58, 50, 816));
            // var dt2 = new Date(year, month, 1, 17, 28, 50, 816);
            // var dt3 = new Date(dt1);
            // var dt4 = new Date(dt2);
            // var ds = [dt1, dt2, dt3, dt4];

            var dt = new Date(Date.UTC(year, month-1, 7, 0, 0, 0));
            var ds = [dt];

            for (var i = 0; i < ds.length; ++i) {
                var dt = ds[i];
                var lp = lunar_pole(dt);
                var a = lp["alpha"];
                var d = lp["delta"];
                var w = lp["W"];  
                var wp = lp["WP"];
                var long = lp["long"];
                var lat = lp["lat"];
                var q_long = lp["q_long"];
                console.log(`${dt}: ` +
                    `(NPα=${rad_to_deg(a).toFixed(5).padStart(9, '0')}, ` +
                    `NPδ=${rad_to_deg(d).toFixed(5).padStart(9, '0')}, ` +
                    `W=${rad_to_deg(w).toFixed(5).padStart(9, '0')}, ` +
                    `WP=${rad_to_deg(wp).toFixed(5).padStart(9, '0')}, ` +
                    `NPλ=${rad_to_deg(long).toFixed(5).padStart(9, '0')}, ` + 
                    `NPβ=${rad_to_deg(lat).toFixed(5).padStart(9, '0')}, ` +
                    `Qλ=${rad_to_deg(q_long).toFixed(5).padStart(9, '0')}`);
            }    
        }
    }
}

function test_moon() {
    var position = get_moon(new Date(Date.UTC(2010, 1-1, 1, 0, 0, 0)));
    console.log(`Gemotric: lon=${position.geometric.longitude}, lat=${position.geometric.latitude}`);
    console.log(`Apparent: ra=${exports.rad_to_deg(position.altaz.topocentric.ra)}, dec=${exports.rad_to_deg(position.altaz.topocentric.dec)}`);
}

function run_tests() {
    // test_lunar_pole();
    // test_moon();
}

// run_tests();

// end of file
