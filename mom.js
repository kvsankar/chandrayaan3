
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
    "MAVEN":    { "id": MAVEN,      "name": "MAVEN",    "color": "orange",  "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "MOM":      { "id": MOM,        "name": "MOM",      "color": "purple",  "r": 5, "labelOffsetX": -40, "labelOffsetY": -10 },
    "SUN":      { "id": SUN,        "name": "Sun",      "color": "yellow",   "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "MERCURY":  { "id": MERCURY,    "name": "Mercury",  "color": "orange",  "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "VENUS":    { "id": VENUS,      "name": "Venus",    "color": "grey",    "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "EARTH":    { "id": EARTH,      "name": "Earth",    "color": "blue",    "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 },
    "MARS":     { "id": MARS,       "name": "Mars",     "color": "red",     "r": 5, "labelOffsetX": +10, "labelOffsetY": +10 }
};

var planetsForOrbits = ["MERCURY", "VENUS", "EARTH", "MARS"];
var planetsForLocations = ["MERCURY", "VENUS", "EARTH", "MARS", "MOM"];

var orbits = {};

var countDurationMilliSeconds = 6 * MILLI_SECONDS_PER_HOUR; // TODO add to and read from JSON

var epochJD;
var epochDate;

var startTime                  = new Date(2013, 11-1, 06, 0, 0, 0, 0);
var helioCentricPhaseStartTime = new Date(2013, 12-1, 01, 0, 0, 0, 0);
var martianPhaseStartTime      = new Date(2014, 09-1, 24, 0, 0, 0, 0);
var endTime                    = new Date(2015, 06-1, 24, 0, 0, 0, 0);

// rendering related data

var svgContainer;
var offset = 260;

var now;
var animDate;

var nSteps;
var timeout = 25;
var count = 0;
var stopAnimationFlag = false;

function rotate(x, y, phi) {

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

        var x = vectors[count]["x"];
        var y = vectors[count]["y"];
        var newx = +1 * (x / KM_PER_AU) * PIXELS_PER_AU;
        var newy = -1 * (y / KM_PER_AU) * PIXELS_PER_AU;

        d3.select("#" + planetKey).attr("cx", newx).attr("cy", newy);
        d3.select("#label-" + planetKey)
            .attr("x", newx + planetProps.labelOffsetX)
            .attr("y", newy +  + planetProps.labelOffsetY);
    }
}

function onload() {
    animDate = d3.select("#date");
    animDate.html(new Date());

    svgContainer = d3.select("#svg").append("svg")
                                 .attr("width", window.innerWidth)
                                 .attr("height", window.innerHeight)
                                 .append("g")
                                 .attr("transform", "translate(" + offset + ", " + offset + ")");

    d3.select("#message").html("Loading orbit data ...");

    d3.json("orbits.json", function(error, jsonData) {
            d3.select("#message").html("");
        if (error) console.warn(error);
        orbits = jsonData;
        processOrbitData();
        missionNow();
    });
}

function processOrbitData() {
    
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

    // Sun
    svgContainer.append("circle")
        .attr("id", "SUN")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 7)
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .attr("fill", planetProperties["SUN"].color)
        .attr("transform", "rotate(0 0 0)");

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

        svgContainer.append("text")
            .attr("id", "label-" + planetKey)
            .attr("x", 0)
            .attr("y", 0)
            .attr("font-size", 10)
            .attr("fill", "DarkGrey")
            .attr("transform", "rotate(0 0 0)");

        d3.select("#label-"+planetKey).text(planetProps.name);

        if (planetKey == "MOM") {
            for (var j = 0; j < vectors.length; ++j) {
                
                var x = vectors[j]["x"];
                var y = vectors[j]["y"];
                var newx = +1 * (x / KM_PER_AU) * PIXELS_PER_AU;
                var newy = -1 * (y / KM_PER_AU) * PIXELS_PER_AU;

                svgContainer.append("circle")
                    .attr("id", planetKey)
                    .attr("cx", newx)
                    .attr("cy", newy)
                    .attr("r", 1)
                    .attr("stroke", "none")
                    .attr("stroke-width", 0)
                    .attr("fill", planetProps.color)
                    .attr("transform", "rotate(0 0 0)");
            }
        }
    }

    d3.select("#epochjd").html(epochJD);
    d3.select("#epochdate").html(epochDate);
}

function changeLocation() {

    if (!stopAnimationFlag) {

        setLocation();

        ++count;
        if (count < nSteps) {
            setTimeout(function() { changeLocation(); }, timeout);
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
    clearTimeout();
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
