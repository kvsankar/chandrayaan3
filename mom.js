
// Copyright (c) 2013 Sankaranarayanan K. V. All rights reserved.

// orbit and location related data

// We use NASA JPL HORIZONS identifiers

var MAVEN   = -202;
var MOM     = -3;
var SUN     = 10;
var MERCURY = 199;
var VENUS   = 299;
var EARTH   = 399;
var MARS    = 499

var KM_PER_AU = 149597870.691;
var DEGREES_PER_RADIAN = 57.2957795;
var DEGREES_PER_CIRCLE = 360.0;
var PIXELS_PER_AU = 150;
var MILLI_SECONDS_PER_HOUR = 3600000;

var planetProperties = {
    "MAVEN":    { "id": MAVEN,      "name": "MAVEN",    "color": "purple",  "r": 2, "labelOffsetX": +10, "labelOffsetY": -10 },
    "MOM":      { "id": MOM,        "name": "MOM",      "color": "orange",  "r": 3, "labelOffsetX": -30, "labelOffsetY": -10 },
    "SUN":      { "id": SUN,        "name": "Sun",      "color": "yellow",   "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "MERCURY":  { "id": MERCURY,    "name": "Mercury",  "color": "green",  "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "VENUS":    { "id": VENUS,      "name": "Venus",    "color": "grey",    "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "EARTH":    { "id": EARTH,      "name": "Earth",    "color": "blue",    "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "MARS":     { "id": MARS,       "name": "Mars",     "color": "red",     "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 }
};

var planetsForOrbits = ["MERCURY", "VENUS", "EARTH", "MARS"];
var planetsForLocations = ["MERCURY", "VENUS", "EARTH", "MARS", "MOM", "MAVEN"];

var orbits = {};

var countDurationMilliSeconds = 6 * MILLI_SECONDS_PER_HOUR; // TODO add to and read from JSON

var epochJD;
var epochDate;

var startTime                  = new Date(2013, 11-1, 06, 0, 0, 0, 0);
var helioCentricPhaseStartTime = new Date(2013, 12-1, 01, 0, 0, 0, 0);
var martianPhaseStartTime      = new Date(2014, 09-1, 24, 0, 0, 0, 0);
var endTime                    = new Date(2015, 06-1, 24, 0, 0, 0, 0);

var mavenStartTime             = new Date(2013, 11-1, 19, 0, 0, 0, 0);
var mavenEndTime               = new Date(2015, 09-1, 22, 0, 0, 0, 0);

// rendering related data

var svgContainer;
var offset = 260;

var now;
var animDate;

var nSteps;
var timeout = 25;
var count = 0;
var stopAnimationFlag = false;
var timeout;

var showMaven = true;

var dataLoaded = false;
var progress = 0;
var total = 1841981; // must be hard-coded if server doesn't report Content-Length
var formatPercent = d3.format(".0%");

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
    if (planet == "MAVEN") {
        return ((date >= mavenStartTime) && (date <= mavenEndTime));
    } else {
        return ((date >= startTime) && (date <= endTime));
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

    var now = new Date(startTime.getTime() + count * countDurationMilliSeconds);
    animDate.html(now);

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

            var index = count - (planetStartTime(planetKey).getTime() - startTime.getTime()) / countDurationMilliSeconds;

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

        } else {
            d3.select("#" + planetKey)
                .attr("visibility", "hidden");

            d3.select("#label-" + planetKey)
                .attr("visibility", "hidden");
        }
    }
}

function onload() {

    d3.selectAll("button").attr("disabled", true);

    animDate = d3.select("#date");
    animDate.html(new Date());

    svgContainer = d3.select("#svg").append("svg")
                                 .attr("width", window.innerWidth)
                                 .attr("height", window.innerHeight)
                                 .append("g")
                                 .attr("transform", "translate(" + offset + ", " + offset + ")");

    d3.select("#message").html("Loading orbit data ...");

    d3.json("orbits.json")
        .on("progress", function() {
            var progress = d3.event.loaded / total;
            var msg = dataLoaded ? "" : ("Loading " + formatPercent(progress) + "...");
            d3.select("#message").html(msg);
        })
        .get(function(error, data) {
            if (error) {
                d3.select("#message").html("Error: failed to load orbit data.");                
            } else {
                dataLoaded = true;
                d3.select("#message").html("");
                orbits = data;
                processOrbitData();
                missionNow();
                d3.selectAll("button").attr("disabled", null);
            }
        });

    d3.select("#checkbox-maven").attr("checked", true);
}

function processOrbitData() {
    
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

            for (var j = 0; j < vectors.length; ++j) {
                
                var x = vectors[j]["x"];
                var y = vectors[j]["y"];
                var newx = +1 * (x / KM_PER_AU) * PIXELS_PER_AU;
                var newy = -1 * (y / KM_PER_AU) * PIXELS_PER_AU;

                svgContainer.select("#" + "orbit-" + planetKey)
                    .append("circle")
                    .attr("cx", newx)
                    .attr("cy", newy)
                    .attr("r", 1)
                    .attr("stroke", "none")
                    .attr("stroke-width", 0)
                    .attr("fill", planetProps.color)
                    .attr("transform", "rotate(0 0 0)")
                    .attr("visibility", "inherit");
            }
        }
    }

    // Add Sun

    svgContainer.append("circle")
        .attr("id", "SUN")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 6)
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .attr("fill", planetProperties["SUN"].color)
        .attr("transform", "rotate(0 0 0)");

    // Add planetary positions

    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var vectors = planet["vectors"];

        nSteps = vectors.length; 
        // though this is set within the planet loop,
        // it would be the same for all planets

        svgContainer.append("circle")
            .attr("id", planetKey)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", planetProps.r)
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            .attr("fill", planetProps.color)
            .attr("transform", "rotate(0 0 0)");
    }

    // Add labels

    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var vectors = planet["vectors"];

        nSteps = vectors.length; 
        // though this is set within the planet loop,
        // it would be the same for all planets

        svgContainer.append("text")
            .attr("id", "label-" + planetKey)
            .attr("x", 0)
            .attr("y", 0)
            .attr("font-size", 10)
            .attr("fill", planetProps.color)
            .attr("transform", "rotate(0 0 0)");

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
            timeout = setTimeout(function() { changeLocation(); }, timeout);
        }            
    }
}

function animate() {
    stopAnimationFlag = false;
    if (count >= nSteps) count = 0;
    changeLocation();
}

function backward() {
    count -= 20; 
    if (count < 0) count = 0;
    setLocation();
}

function stopAnimation() {
    stopAnimationFlag = true;
    clearTimeout(timeout);
}

function forward() {
    count += 20; 
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
    var x = (now.getTime() - startTime.getTime()) / countDurationMilliSeconds;
    count = Math.max(0, Math.floor(x));
    setLocation();
}

function missionNow() {
    now = new Date();
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
    timeout -= 5;
    if (timeout < 0) timeout = 0;
}

function slower() {
    timeout += 5;
}

// end of file
