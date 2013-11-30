
// Copyright (c) 2013 Sankaranarayanan K. V. All rights reserved.

// orbit and location related data

// We use NASA JPL HORIZONS identifiers

var MAVEN   = -202;
var MOM     = -3;
var SUN     = 10;
var MERCURY = 199;
var VENUS   = 299;
var EARTH   = 399;
var MARS    = 499;
var MOON    = 301;

var KM_PER_AU = 149597870.691;
var DEGREES_PER_RADIAN = 57.2957795;
var DEGREES_PER_CIRCLE = 360.0;
var MILLI_SECONDS_PER_HOUR = 3600000;

var planetProperties = {
    "MAVEN":    { "id": MAVEN,      "name": "MAVEN",    "color": "purple",  "r": 2, "labelOffsetX": +10, "labelOffsetY": -10 },
    "MOM":      { "id": MOM,        "name": "MOM",      "color": "orange",  "r": 3, "labelOffsetX": -30, "labelOffsetY": -10 },
    "SUN":      { "id": SUN,        "name": "Sun",      "color": "yellow",  "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "MERCURY":  { "id": MERCURY,    "name": "Mercury",  "color": "green",   "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "VENUS":    { "id": VENUS,      "name": "Venus",    "color": "grey",    "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "EARTH":    { "id": EARTH,      "name": "Earth",    "color": "blue",    "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "MARS":     { "id": MARS,       "name": "Mars",     "color": "red",     "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "MOON":     { "id": MOON,       "name": "Moon",     "color": "grey",     "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
};

// begin - data structures which change based on configuration

var config = "helio";
var offsetx;
var offsety;
var PIXELS_PER_AU;
var trackWidth;
var centerPlanet;
var centerRadius;
var planetsForOrbits;
var planetsForLocations;
var countDurationMilliSeconds;
var orbitsJson;
var startTime;
var helioCentricPhaseStartTime;
var martianPhaseStartTime;
var endTime;
var mavenStartTime;
var mavenEndTime;
var latestEndTime;
var orbits = {};
var nSteps;
var leapSize;
var timeout;
var total;

// end - data structures which change based on configuration

// rendering related data

var epochJD;
var epochDate;

var svgContainer;
var viewBoxWidth;
var viewBoxHeight;
var zoomFactor = 1;
var zoomScale = 1.05;
var zoomTimeout = 100;
var stopZoom = false;
var panx = 0;
var pany = 0;
var lockOnMOM = false;
var previousLockOnMOM = false;
var now;
var animDate;

var count = 0;
var animationRunning = false;
var stopAnimationFlag = false;
var timeoutHandle;
var timeoutHandleZoom;

var showMaven = true;

var dataLoaded = false;
var progress = 0;
var formatPercent = d3.format(".0%");
var formatMetric = d3.format(" >10,.2f");

// adapted from - http://stackoverflow.com/questions/9318674/javascript-number-currency-formatting

formatFloat = function formatFloat(rdecPlaces, thouSeparator, decSeparator) {
    var n = this,
    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
    decSeparator = decSeparator == undefined ? "." : decSeparator,
    thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
    sign = n < 0 ? "-" : "",
    i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
};

function initConfig() {

    if (config == "geo") {

        offsetx = 600;
        offsety = 50;
        PIXELS_PER_AU = 500000;
        trackWidth = 0.6;
        centerPlanet = "EARTH";
        centerRadius = 3;
        planetsForOrbits = [];
        planetsForLocations = ["MOON", "MOM", "MAVEN"];
        countDurationMilliSeconds = (1/6) * MILLI_SECONDS_PER_HOUR; // TODO add to and read from JSON
        orbitsJson = "geo.json";
        total = 2174764; // TODO
        leapSize = 24; // 4 hours

        startTime                  = Date.UTC(2013, 11-1, 06, 0, 0, 0, 0);
        helioCentricPhaseStartTime = Date.UTC(2013, 12-1, 01, 0, 0, 0, 0);
        martianPhaseStartTime      = Date.UTC(2014, 09-1, 24, 0, 0, 0, 0);
        endTime                    = Date.UTC(2013, 12-1, 01, 0, 0, 0, 0);
        mavenStartTime             = Date.UTC(2013, 11-1, 19, 0, 0, 0, 0);
        mavenEndTime               = Date.UTC(2015, 09-1, 22, 0, 0, 0, 0);

        latestEndTime = helioCentricPhaseStartTime;
        nSteps = (latestEndTime - startTime) / countDurationMilliSeconds;
        timeout = 25;

        epochJD = "N/A";
        epochDate = "N/A";

        count = 0;

        d3.select("#mode").html("Switch to Helio Mode");
        d3.selectAll(".geo").style("visibility", "visible");

    } else if (config == "helio") {

        offsetx = 300;
        offsety = 250;
        PIXELS_PER_AU = 150;
        trackWidth = 1;
        centerPlanet = "SUN";
        centerRadius = 6;
        planetsForOrbits = ["MERCURY", "VENUS", "EARTH", "MARS"];
        planetsForLocations = ["MERCURY", "VENUS", "EARTH", "MARS", "MOM", "MAVEN"];
        countDurationMilliSeconds = 6.0 * MILLI_SECONDS_PER_HOUR; // TODO add to and read from JSON
        orbitsJson = "orbits.json";
        total = 2023480; // TODO
        leapSize = 20; // 5 days

        startTime                  = Date.UTC(2013, 11-1, 06, 0, 0, 0, 0);
        helioCentricPhaseStartTime = Date.UTC(2013, 12-1, 01, 0, 0, 0, 0);
        martianPhaseStartTime      = Date.UTC(2014, 09-1, 24, 0, 0, 0, 0);
        endTime                    = Date.UTC(2015, 06-1, 24, 0, 0, 0, 0);
        mavenStartTime             = Date.UTC(2013, 11-1, 19, 0, 0, 0, 0);
        mavenEndTime               = Date.UTC(2015, 09-1, 22, 0, 0, 0, 0);

        latestEndTime = mavenEndTime;
        nSteps = (latestEndTime - startTime) / countDurationMilliSeconds;
        timeout = 25;

        count = 0;

        d3.select("#mode").html("Switch to Geo Mode");
        d3.selectAll(".geo").style("visibility", "hidden");
    }
}

function toggleMode() {
    stopAnimation();
    config = (config == "geo") ? "helio" : "geo";
    onload();
}

function toggleMaven() {
    showMaven = ! showMaven;
    var visibility = showMaven ? "visible" : "hidden";
    d3.select("#orbit-MAVEN").attr("visibility", visibility);
    d3.select("#MAVEN").attr("visibility", visibility);
    d3.select("#label-MAVEN").attr("visibility", visibility);
}

function showPlanet(planet) {
    if (planet == "MAVEN") {
        return showMaven;
    } else {
        return true;
    }
}

function shouldDrawOrbit(planet) {
    return ((planet == "MOM") || (planet == "MAVEN"))
}

function planetStartTime(planet) {
    if (planet == "MAVEN") {
        return mavenStartTime;
    } else {
        return startTime;
    }
}

function isLocationAvaialable(planet, date) {
    if (planet == "MOM") {
        return ((date >= startTime) && (date <= endTime));
    } else if (planet == "MAVEN") {
        return ((date >= mavenStartTime) && (date <= mavenEndTime));
    } else {
        return ((date >= startTime) && (date <= mavenEndTime));
    }
}

function rotate(x, y, phi) { // unused function for now

    var phi = phi / DEGREES_PER_RADIAN;
    var retx;
    var rety;

    retx = x * cos(phi) - y * sin(phi);
    rety = y * cos(phi) + x * sin(phi);
    return {"x": retx, "y": rety};
}

function setLocation() {

    // console.log("setLocation(): count = " + count);

    now = startTime + count * countDurationMilliSeconds;
    var nowDate = new Date(now);
    animDate.html(nowDate);

    // console.log("now = " + now);
    // console.log("helioCentricPhaseStartTime = " + helioCentricPhaseStartTime);
    // console.log("martianPhaseStartTime = " + martianPhaseStartTime);

    d3.select("#phase-1").html("Geocentric Phase");
    d3.select("#phase-2").html("Heliocentric Phase");
    d3.select("#phase-3").html("Martian Phase");

    // TODO find a better way to do this
    if (now < helioCentricPhaseStartTime) {
        d3.select("#phase-1").html("<b><u>Geocentric Phase</u></b>");
    } else if (now < martianPhaseStartTime) {
        d3.select("#phase-2").html("<b><u>Heliocentric Phase</u></b>");
    } else {
        d3.select("#phase-3").html("<b><u>Martian Phase</u></b>");
    }

    for (var i = 0; i < planetsForLocations.length; ++i) {


        var planetKey = planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var vectors = planet["vectors"];

        if (isLocationAvaialable(planetKey, now)) {

            var index = count - planetProperties[planetKey]["offset"];

            var x = vectors[index]["x"];
            var y = vectors[index]["y"];

            var newx = +1 * (x / KM_PER_AU) * PIXELS_PER_AU;
            var newy = -1 * (y / KM_PER_AU) * PIXELS_PER_AU;

            d3.select("#" + planetKey)
                .attr("visibility", showPlanet(planetKey) ? "visible" : "hidden")
                .attr("cx", newx)
                .attr("cy", newy);

            d3.select("#label-" + planetKey)
                .attr("visibility", showPlanet(planetKey) ? "visible" : "hidden")                
                .attr("x", newx + planetProps.labelOffsetX)
                .attr("y", newy +  + planetProps.labelOffsetY);

            if (planetKey == "MOM") {


                var z = vectors[index]["z"];
                var r = Math.sqrt(x*x + y*y + z*z);
                d3.select("#distance").text(formatMetric(r));

                var vx = vectors[index]["vx"];
                var vy = vectors[index]["vy"];
                var vz = vectors[index]["vz"];
                var v = Math.sqrt(vx*vx + vy*vy + vz*vz);
                d3.select("#velocity").text(formatMetric(v));
            }

        } else {
            d3.select("#" + planetKey)
                .attr("visibility", "hidden");

            d3.select("#label-" + planetKey)
                .attr("visibility", "hidden");
        }
    }
    
    zoomChange(0);
}

function onload() {

    initConfig();

    zoomFactor = 1;
    panx = 0;
    pany = 0;
    lockOnMOM = false;
    d3.select("#checkbox-lock-mom").property("checked", false);
    d3.selectAll("button").attr("disabled", true);

    // zoom in
    d3.select("#zoomin").on("mousedown", function() { 
        timeoutHandleZoom = setInterval(function() { zoomIn(); }, zoomTimeout); 
    });
    d3.select("#zoomin").on("mouseup", function() { 
        clearInterval(timeoutHandleZoom);
    });
    d3.select("#zoomin").on("mouseout", function() { 
        clearInterval(timeoutHandleZoom);
    });

    // zoom out
    d3.select("#zoomout").on("mousedown", function() { 
        timeoutHandleZoom = setInterval(function() { zoomOut(); }, zoomTimeout); 
    });
    d3.select("#zoomout").on("mouseup", function() { 
        clearInterval(timeoutHandleZoom);
    });
    d3.select("#zoomout").on("mouseout", function() { 
        stopZoom = true; 
    });

    // pan left
    d3.select("#panleft").on("mousedown", function() { 
        timeoutHandleZoom = setInterval(function() { panLeft(); }, zoomTimeout); 
    });
    d3.select("#panleft").on("mouseup", function() { 
        clearInterval(timeoutHandleZoom);
    });
    d3.select("#panleft").on("mouseout", function() { 
        clearInterval(timeoutHandleZoom);
    });

    // pan right
    d3.select("#panright").on("mousedown", function() { 
        timeoutHandleZoom = setInterval(function() { panRight(); }, zoomTimeout); 
    });
    d3.select("#panright").on("mouseup", function() { 
        clearInterval(timeoutHandleZoom);
    });
    d3.select("#panright").on("mouseout", function() { 
        clearInterval(timeoutHandleZoom);
    });

    // pan up
    d3.select("#panup").on("mousedown", function() { 
        timeoutHandleZoom = setInterval(function() { panUp(); }, zoomTimeout); 
    });
    d3.select("#panup").on("mouseup", function() { 
        clearInterval(timeoutHandleZoom);
    });
    d3.select("#panup").on("mouseout", function() { 
        clearInterval(timeoutHandleZoom);
    });

    // pan down
    d3.select("#pandown").on("mousedown", function() { 
        timeoutHandleZoom = setInterval(function() { panDown(); }, zoomTimeout); 
    });
    d3.select("#pandown").on("mouseup", function() { 
        clearInterval(timeoutHandleZoom);
    });
    d3.select("#pandown").on("mouseout", function() { 
        clearInterval(timeoutHandleZoom);
    });

    animDate = d3.select("#date");

    d3.select("svg").remove();

    viewBoxWidth = window.innerWidth;
    viewBoxHeight = window.innerHeight;
    svgContainer = d3.select("#svg").append("svg")
                                 .attr("width", window.innerWidth)
                                 .attr("height", window.innerHeight)
                                 // .attr("viewbox", "0 0 " + viewBoxWidth + " " + viewBoxHeight)
                                 .append("g")
                                 .attr("transform", "translate(" + offsetx + ", " + offsety + ")");

    d3.select("#message").html("Loading orbit data ...");

    d3.json(orbitsJson)
        .on("progress", function() {

            var progress = d3.event.loaded / total;
            var msg = dataLoaded ? "" : ("Loading " + orbitsJson + "  ... " + formatPercent(progress) + ".");
            console.log(msg);
            d3.select("#message").html(msg);
        })
        .get(function(error, data) {
            if (error) {
                d3.select("#message").html("Error: failed to load orbit data.");                
            } else {
                dataLoaded = true;
                d3.select("#message").html("");
                orbits = data;
                if (config == "helio") processOrbitElementsData();
                processOrbitVectorsData();
                missionStart();
                d3.selectAll("button").attr("disabled", null);
            }
        });

    d3.select("#checkbox-maven").attr("checked", true);
    d3.select("#animate").text("Start");
}

function processOrbitElementsData() {
    
    // Add elliptical orbits

    for (var i = 0; i < planetsForOrbits.length; ++i) {

        var planetKey = planetsForOrbits[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var elements = planet["elements"];

        for (var jd in elements) { // only 1 is expected
            
            var el = elements[jd];
            epochJD = jd;
            epochDate = el.date;

            var cx = -1 * (el.a / KM_PER_AU) * el.ec * PIXELS_PER_AU;
            var cy = 0 * PIXELS_PER_AU;
            var rx = (el.a / KM_PER_AU) * PIXELS_PER_AU;
            var ry = rx * (Math.sqrt(1 - el.ec * el.ec));

            var angle = parseFloat(el.om) + parseFloat(el.w);
            while (angle >= DEGREES_PER_CIRCLE) angle -= DEGREES_PER_CIRCLE;
            angle = -1 * angle;

            svgContainer.append("ellipse")
                .attr("id", "orbit-" + planetKey)
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("rx", rx)
                .attr("ry", ry)
                .attr("stroke", planetProps.color)
                .attr("stroke-width", 1)
                .attr("fill", "none")
                .attr("transform", "rotate(" + angle + " 0 0)");
        }
    }
}

function processOrbitVectorsData() {


    // Add spacecraft orbits
    
    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var vectors = planet["vectors"];

        if (shouldDrawOrbit(planetKey)) {
            
            svgContainer.append("g")
                .attr("id", "orbit-" + planetKey)
                .attr("visibility", "visible");

            for (var j = 0; j < vectors.length-1; ++j) {
                
                var x1 = vectors[j]["x"];
                var y1 = vectors[j]["y"];
                var newx1 = +1 * (x1 / KM_PER_AU) * PIXELS_PER_AU;
                var newy1 = -1 * (y1 / KM_PER_AU) * PIXELS_PER_AU;

                var x2 = vectors[j+1]["x"];
                var y2 = vectors[j+1]["y"];
                var newx2 = +1 * (x2 / KM_PER_AU) * PIXELS_PER_AU;
                var newy2 = -1 * (y2 / KM_PER_AU) * PIXELS_PER_AU;

                svgContainer.select("#" + "orbit-" + planetKey)
                    .append("line")
                    .attr("x1", newx1)
                    .attr("y1", newy1)
                    .attr("x2", newx2)
                    .attr("y2", newy2)
                    .attr("style", "stroke: " + planetProps.color + "; stroke-width: " + 0.5)
                    .attr("visibility", "inherit");
            }
        }
    }

    // Add center planet - Sun/Earth

    svgContainer.append("circle")
        .attr("id", centerPlanet)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", centerRadius)
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .attr("fill", planetProperties[centerPlanet].color);

    svgContainer
        .append("g")
            .attr("class", "label")
        .append("text")
            .attr("id", "label-" + centerPlanet)
            .attr("x", -10)
            .attr("y", 15)
            .attr("font-size", 10)
            .attr("fill", planetProperties[centerPlanet].color)
            .text(planetProperties[centerPlanet].name);

    // Add planetary positions

    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var vectors = planet["vectors"];

        var planetIndexOffset = (planetStartTime(planetKey) - startTime) / countDurationMilliSeconds;
        planetProperties[planetKey]["offset"] = planetIndexOffset;

        svgContainer.append("circle")
            .attr("id", planetKey)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", planetProps.r)
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            .attr("fill", planetProps.color);
    }

    // Add labels

    svgContainer.append("g")
        .attr("id", "labels")
        .attr("class", "label");

    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var vectors = planet["vectors"];

        d3.select("#labels")
            .append("text")
                .attr("id", "label-" + planetKey)
                .attr("x", 0)
                .attr("y", 0)
                .attr("font-size", 10)
                .attr("fill", planetProps.color);

        d3.select("#label-"+planetKey).text(planetProps.name);
    }

    d3.select("#epochjd").html(epochJD);
    d3.select("#epochdate").html(epochDate);
}

function changeLocation() {

    if (!stopAnimationFlag) {
        setLocation();
        ++count;
        if (count < nSteps) {
            timeoutHandle = setTimeout(function() { changeLocation(); }, timeout);
        }
    }
}

function animate() {

    if (animationRunning) {
        stopAnimation();
    } else {
        animationRunning = true;
        stopAnimationFlag = false;
        if (count >= nSteps) count = 0;
        changeLocation();
        d3.select("#animate").text("Stop");
    }
}

function fastBackward() {
    count -= leapSize; 
    if (count < 0) count = 0;
    setLocation();
}

function backward() {
    count -= 1; 
    if (count < 0) count = 0;
    setLocation();
}

function stopAnimation() {
    animationRunning = false;
    stopAnimationFlag = true;
    clearTimeout(timeoutHandle);
    d3.select("#animate").text("Start");
}

function forward() {
    count += 1; 
    if (count >= nSteps) {
        count = nSteps - 1;
    }
    setLocation();
}

function fastForward() {
    count += leapSize; 
    if (count >= nSteps) {
        count = nSteps - 1;
    }
    setLocation();
}

function missionStart() {
    stopAnimation();
    count = 0;
    setLocation();
}

function missionSetTime() {
    stopAnimation();
    var x = (now - startTime) / countDurationMilliSeconds;
    count = Math.max(0, Math.floor(x));
    if (count >= nSteps) {
        count = nSteps - 1;
    }
    setLocation();
}

function missionNow() {
    now = new Date().getTime();
    missionSetTime();
}

function missionTMI() {
    now = helioCentricPhaseStartTime;
    missionSetTime();
}

function missionMartian() {
    now = martianPhaseStartTime;
    missionSetTime();
}

function missionEnd() {
    now = endTime;
    missionSetTime();
}

function faster() {
    timeout /= zoomScale;
    if (timeout < 0) timeout = 0;
    // console.log("timeout = " + timeout);
}

function slower() {
    timeout *= zoomScale;
    // console.log("timeout = " + timeout);
}

function zoomChange(t) {

    var momx = 0;
    var momy = 0;

    if (lockOnMOM) {
        momx = parseFloat(d3.select("#MOM").attr("cx"));
        momy = parseFloat(d3.select("#MOM").attr("cy"));
    }

    var container = svgContainer;
    if (t != 0) {
        container = svgContainer.transition().delay(t);
        
    }
    container
        .attr("transform",
            "matrix(" 
            + zoomFactor
            + ", 0"
            + ", 0"
            + ", " + zoomFactor
            + ", " + (offsetx+panx+momx-zoomFactor*(momx)-momx)
            + ", " + (offsety+pany+momy-zoomFactor*(momy)-momy)
            + ")"
        );
}

function zoomOut() {
    zoomFactor /= zoomScale;
    var factor = 1/zoomScale;
    zoomChange(zoomTimeout);
}

function zoomIn() {
    zoomFactor *= zoomScale;
    var factor = zoomScale;
    zoomChange(zoomTimeout);
}

function panLeft() {
    panx += +10;
    zoomChange(zoomTimeout);
}

function panRight() {
    panx += -10;
    zoomChange(zoomTimeout);
}

function panUp() {
    pany += +10;
    zoomChange(zoomTimeout);
}

function panDown() {
    pany += -10;
    zoomChange(zoomTimeout);
}

function reset() {
    panx = 0;
    pany = 0;
    zoomFactor = 1;
    zoomChange(zoomTimeout);
}

function toggleLockMOM() {
    previousLockOnMOM = lockOnMOM;
    lockOnMOM = !lockOnMOM;
    reset();
}

// end of file
