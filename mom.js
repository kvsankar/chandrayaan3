
// Copyright (c) 2013 Sankaranarayanan K. V. All rights reserved.

// orbit and location related data

// constants

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
    "MAVEN":    { "id": MAVEN,      "name": "MAVEN",    "color": "lightpink",  "r": 2.4, "labelOffsetX": +10, "labelOffsetY": -10 },
    "MOM":      { "id": MOM,        "name": "MOM",      "color": "orange",  "r": 3.2, "labelOffsetX": -30, "labelOffsetY": -10 },
    "SUN":      { "id": SUN,        "name": "Sun",      "color": "yellow",  "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MERCURY":  { "id": MERCURY,    "name": "Mercury",  "color": "green",   "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "VENUS":    { "id": VENUS,      "name": "Venus",    "color": "grey",    "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "EARTH":    { "id": EARTH,      "name": "Earth",    "color": "blue",    "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MARS":     { "id": MARS,       "name": "Mars",     "color": "red",     "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MOON":     { "id": MOON,       "name": "Moon",     "color": "grey",    "r": 3,   "labelOffsetX": +10, "labelOffsetY": +10 },
};

var CENTER_LABEL_OFFSET_X = -5;
var CENTER_LABEL_OFFSET_Y = -15;
var BANGALORE_LONGITUDE = 77.5667;
var BANGALORE_RADIUS = 20;
var EARTH_SOI_RADIUS_IN_KM = 925000 * 0.90; // The 0.90 factor is an adustment since we are using only (x, y) and not z.
var soiRadius;
var ZOOM_SCALE = 1.10;
var ZOOM_TIMEOUT = 0;
var SVG_ORIGIN_X = 100; // TODO match with CSS value; find a better way
var SVG_ORIGIN_Y = 100; // TODO match with CSS value; find a better way
var FORMAT_PERCENT = d3.format(".0%");
var FORMAT_METRIC = d3.format(" >10,.2f");

// begin - data structures which change based on configuration

var config = "helio";
var offsetx = 0;
var offsety = 0;
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
var animDate;
var svgContainer;
var svgRect;
var viewBoxWidth;
var viewBoxHeight;
var zoomFactor = 1;
var stopZoom = false;
var panx = 0;
var pany = 0;
var lockOnMOM = false;
var previousLockOnMOM = false;
var now;
var count = 0;
var countStep = 1;
var animationRunning = false;
var stopAnimationFlag = false;
var timeoutHandle;
var timeoutHandleZoom;
var showMaven = true;
var dataLoaded = false;
var progress = 0;
var mouseDown = false;
var firefox = false;
var chrome = false;
var bannerShown = false;

function initConfig() {

    if (config == "geo") {

        var svgWidth = window.innerWidth;
        var svgHeight = window.innerHeight - 40;
        offsetx = svgWidth / 2 - SVG_ORIGIN_X;
        offsety = svgHeight / 3 - SVG_ORIGIN_Y;

        PIXELS_PER_AU = 60000;
        trackWidth = 0.6;
        centerPlanet = "EARTH";
        centerRadius = 3;
        soiRadius = (EARTH_SOI_RADIUS_IN_KM / KM_PER_AU) * PIXELS_PER_AU;
        planetsForOrbits = ["MOON"];
        planetsForLocations = ["MOON", "MOM", "MAVEN"];
        countDurationMilliSeconds = (1/3) * MILLI_SECONDS_PER_HOUR; // TODO add to and read from JSON
        orbitsJson = "geo.json";
        total = 1348990; // TODO
        leapSize = 12; // 4 hours

        startTime                  = Date.UTC(2013, 11-1,  6,  0,  0, 0, 0);
        helioCentricPhaseStartTime = Date.UTC(2013, 11-1, 30, 19, 20, 0, 0);
        martianPhaseStartTime      = Date.UTC(2014,  9-1, 24,  0,  0, 0, 0);
        endTime                    = Date.UTC(2013, 12-1, 11,  0,  0, 0, 0);
        mavenStartTime             = Date.UTC(2013, 11-1, 19,  0,  0, 0, 0);
        mavenEndTime               = Date.UTC(2015,  9-1, 22,  0,  0, 0, 0);

        latestEndTime = endTime;
        nSteps = (latestEndTime - startTime) / countDurationMilliSeconds;
        timeout = 5;

        epochJD = "N/A";
        epochDate = "N/A";

        count = 0;

        d3.select("#mode").html("Switch to Helio Mode");
        d3.selectAll(".geo").style("visibility", "visible");
        d3.selectAll(".helio").style("visibility", "hidden");
        d3.selectAll(".helio").style("display", "none");
        d3.select("#center").text("Earth");

    } else if (config == "helio") {

        var svgWidth = window.innerWidth;
        var svgHeight = window.innerHeight - 40;
        offsetx = svgWidth / 2 - SVG_ORIGIN_X;
        offsety = svgHeight / 2  + 50 - SVG_ORIGIN_Y;

        PIXELS_PER_AU = 200;
        trackWidth = 1;
        centerPlanet = "SUN";
        centerRadius = 6;
        planetsForOrbits = ["MERCURY", "VENUS", "EARTH", "MARS"];
        planetsForLocations = ["MERCURY", "VENUS", "EARTH", "MARS", "MOM", "MAVEN"];
        countDurationMilliSeconds = 4.0 * MILLI_SECONDS_PER_HOUR; // TODO add to and read from JSON
        orbitsJson = "orbits.json";
        total = 4555792; // TODO
        leapSize = 20; // 5 days

        startTime                  = Date.UTC(2013, 11-1,  6, 0, 0, 0, 0);
        helioCentricPhaseStartTime = Date.UTC(2013, 12-1,  1, 0, 0, 0, 0);
        martianPhaseStartTime      = Date.UTC(2014,  9-1, 24, 0, 0, 0, 0);
        endTime                    = Date.UTC(2014,  9-1, 26, 0, 0, 0, 0);
        mavenStartTime             = Date.UTC(2013, 11-1, 19, 0, 0, 0, 0);
        mavenEndTime               = Date.UTC(2015,  9-1, 22, 0, 0, 0, 0);

        latestEndTime = mavenEndTime;
        nSteps = (latestEndTime - startTime) / countDurationMilliSeconds;
        timeout = 5;

        count = 0;

        d3.select("#mode").html("Switch to Geo Mode");
        d3.selectAll(".geo").style("visibility", "hidden");
        d3.selectAll(".helio").style("visibility", "visible");
        d3.selectAll(".helio").style("display", "inline");
        d3.select("#center").text("Sun");
    }
}

function toggleMode() {
    stopAnimation();
    config = (config == "geo") ? "helio" : "geo";
    initRest();
}

function toggleMaven() {
    showMaven = ! showMaven;

    var orbitVisibility = showMaven ? "visible" : "hidden";
    d3.select("#orbit-MAVEN").attr("visibility", orbitVisibility);

    var visibility = (showMaven && (isLocationAvaialable("MAVEN", now))) ? "visible" : "hidden";    
    d3.select("#MAVEN").attr("visibility", visibility);
    d3.select("#label-MAVEN").attr("visibility", visibility);
    d3.selectAll(".maven").attr("visibility", visibility);
}

function showPlanet(planet) {
    if (planet == "MAVEN") {
        return showMaven;
    } else {
        return true;
    }
}

function shouldDrawOrbit(planet) {
    return ((planet == "MOM") || (planet == "MAVEN") || (planet == "MOON"));
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

function setLabelLocation(planetKey) {

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

        var labelx = newx + planetProps.labelOffsetX/zoomFactor;
        var labely = newy + planetProps.labelOffsetY/zoomFactor;

        d3.select("#label-" + planetKey)
            .attr("visibility", showPlanet(planetKey) ? "visible" : "hidden")                
            .attr("x", labelx)
            .attr("y", labely);

    } else {
        d3.select("#label-" + planetKey)
            .attr("visibility", "hidden");
    }
}

function setLocation() {

    // console.log("setLocation(): count = " + count + ", nSteps = " + nSteps);

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

            if ((planetKey == "MOM") || (planetKey == "MAVEN")) {

                // relative to center

                var z = vectors[index]["z"];
                var r = Math.sqrt(x*x + y*y + z*z);
                d3.select("#distance-" + planetKey).text(FORMAT_METRIC(r));

                var vx = vectors[index]["vx"];
                var vy = vectors[index]["vy"];
                var vz = vectors[index]["vz"];
                var v = Math.sqrt(vx*vx + vy*vy + vz*vz);
                d3.select("#velocity-" + planetKey).text(FORMAT_METRIC(v));

                if (config == "helio") {
                    // relative to Earth
                    x = vectors[index]["x"] - orbits[EARTH]["vectors"][count]["x"];
                    y = vectors[index]["y"] - orbits[EARTH]["vectors"][count]["y"];
                    z = vectors[index]["z"] - orbits[EARTH]["vectors"][count]["z"];
                    r = Math.sqrt(x*x + y*y + z*z);
                    d3.select("#distance-" + planetKey +"-Earth").text(FORMAT_METRIC(r));

                    vx = vectors[index]["vx"] - orbits[EARTH]["vectors"][count]["vx"];
                    vy = vectors[index]["vy"] - orbits[EARTH]["vectors"][count]["vy"];
                    vz = vectors[index]["vz"] - orbits[EARTH]["vectors"][count]["vz"];
                    v = Math.sqrt(vx*vx + vy*vy + vz*vz);
                    d3.select("#velocity-" + planetKey +"-Earth").text(FORMAT_METRIC(v));    

                    // relative to Mars
                    x = vectors[index]["x"] - orbits[MARS]["vectors"][count]["x"];
                    y = vectors[index]["y"] - orbits[MARS]["vectors"][count]["y"];
                    z = vectors[index]["z"] - orbits[MARS]["vectors"][count]["z"];
                    r = Math.sqrt(x*x + y*y + z*z);
                    d3.select("#distance-" + planetKey +"-Mars").text(FORMAT_METRIC(r));

                    vx = vectors[index]["vx"] - orbits[MARS]["vectors"][count]["vx"];
                    vy = vectors[index]["vy"] - orbits[MARS]["vectors"][count]["vy"];
                    vz = vectors[index]["vz"] - orbits[MARS]["vectors"][count]["vz"];
                    v = Math.sqrt(vx*vx + vy*vy + vz*vz);
                    d3.select("#velocity-" + planetKey +"-Mars").text(FORMAT_METRIC(v));    
                }
            }

        } else {
            d3.select("#" + planetKey)
                .attr("visibility", "hidden");

            d3.select("#distance-" + planetKey).text("");
            d3.select("#velocity-" + planetKey).text("");
            d3.select("#distance-" + planetKey + "-Earth").text("");
            d3.select("#velocity-" + planetKey + "-Earth").text("");
            d3.select("#distance-" + planetKey + "-Mars").text("");
            d3.select("#velocity-" + planetKey + "-Mars").text("");
        }
    }
    
    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];


        setLabelLocation(planetKey);
    }

    zoomChangeTransform(0);
    showBangaloreLongitude();
}

function showBangaloreLongitude() {
    if (config == "helio") return;
    
    var mst = getMST(new Date(now), BANGALORE_LONGITUDE);

    var x1 = 0;
    var y1 = 0;
    var x2 = +1 * BANGALORE_RADIUS * Math.cos(mst/DEGREES_PER_RADIAN) / zoomFactor;
    var y2 = -1 * BANGALORE_RADIUS * Math.sin(mst/DEGREES_PER_RADIAN) / zoomFactor;

    d3.select("#Bangalore")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2);
}

function adjustLabelLocations() {

    d3.selectAll("ellipse").attr("stroke-width", (1/zoomFactor));
    for (var i = 0; i < planetsForOrbits.length; ++i) {
        var planetKey = planetsForLocations[i];
        d3.selectAll("#orbit-" + planetKey).attr("r", (0.5/zoomFactor));    
    }

    d3.select("#" + centerPlanet).attr("r", (centerRadius/zoomFactor));

    for (var i = 0; i < planetsForLocations.length; ++i) {
    
        var planetKey = planetsForLocations[i];
        setLabelLocation(planetKey);

        var planetProps =planetProperties[planetKey];
        d3.selectAll("#" + planetKey).attr("r", (planetProps.r/zoomFactor));

        d3.select("#orbit-" + planetKey)
            .selectAll("line")
            .attr("style", "stroke: " + planetProps.color + "; stroke-width: " + (0.5/zoomFactor));
        d3.select("#label-" + planetKey).attr("font-size", (10/zoomFactor));
    }

    d3.select("#Bangalore").attr("style", "stroke: DarkGray; stroke-opacity: 0.5; " + "stroke-width: " + (0.5/zoomFactor));
    d3.select("#label-" + centerPlanet).attr("x", (CENTER_LABEL_OFFSET_X/zoomFactor));
    d3.select("#label-" + centerPlanet).attr("y", (CENTER_LABEL_OFFSET_Y/zoomFactor));
    d3.select("#label-" + centerPlanet).attr("font-size", (10/zoomFactor));

    d3.select("#earth-soi")
        .attr("stroke-width", (0.5/zoomFactor));

    d3.select("#earth-soi-label")
        .attr("font-size", (8/zoomFactor));
}

function initOnce() {
    if (navigator.userAgent.indexOf('Firefox') != -1) {
        firefox = true;
    } else if (navigator.userAgent.indexOf('Chrome') != -1) {
        chrome = true;
    }
}

function initRest() {
    initConfig();
    init();    
}

function onload() {
    initOnce();
    initRest();
}

// TODO - find a better way to handle the following

function f1()  { zoomIn();          timeoutHandleZoom = setTimeout(f1,  ZOOM_TIMEOUT); }
function f2()  { zoomOut();         timeoutHandleZoom = setTimeout(f2,  ZOOM_TIMEOUT); }
function f3()  { panLeft();         timeoutHandleZoom = setTimeout(f3,  ZOOM_TIMEOUT); }
function f4()  { panRight();        timeoutHandleZoom = setTimeout(f4,  ZOOM_TIMEOUT); }
function f5()  { panUp();           timeoutHandleZoom = setTimeout(f5,  ZOOM_TIMEOUT); }
function f6()  { panDown();         timeoutHandleZoom = setTimeout(f6,  ZOOM_TIMEOUT); }
function f7()  { forward();         timeoutHandleZoom = setTimeout(f7,  ZOOM_TIMEOUT); }
function f8()  { fastForward();     timeoutHandleZoom = setTimeout(f8,  ZOOM_TIMEOUT); }
function f9()  { backward();        timeoutHandleZoom = setTimeout(f9,  ZOOM_TIMEOUT); }
function f10() { fastBackward();    timeoutHandleZoom = setTimeout(f10, ZOOM_TIMEOUT); }
function f11() { slower();          timeoutHandleZoom = setTimeout(f11, ZOOM_TIMEOUT); }
function f12() { faster();          timeoutHandleZoom = setTimeout(f12, ZOOM_TIMEOUT); }

function zoomFunction(f) {
    mouseDown = true;
    f();
    timeoutHandleZoom = setTimeout(f, ZOOM_TIMEOUT);
}

function init() {
    zoomFactor = 1;
    panx = 0;
    pany = 0;
    lockOnMOM = false;
    d3.select("#checkbox-lock-mom").property("checked", false);
    d3.selectAll("button").attr("disabled", true);

    var handlers = {
        "zoomin":       { "mousedown":  f1 },
        "zoomout":      { "mousedown":  f2  },
        "panleft":      { "mousedown":  f3  },
        "panright":     { "mousedown":  f4  },
        "panup":        { "mousedown":  f5  },
        "pandown":      { "mousedown":  f6  },
        "forward":      { "mousedown":  f7  },
        "fastforward":  { "mousedown":  f8  },
        "backward":     { "mousedown":  f9  },
        "fastbackward": { "mousedown":  f10 },
        "slower":       { "mousedown":  f11 },
        "faster":       { "mousedown":  f12 }
    };

    var buttons = [
        "zoomin", "zoomout", 
        "panleft", "panright", "panup", "pandown",
        "forward", "fastforward", "backward", "fastbackward",
        "slower", "faster"
    ];

    for (var i = 0; i < buttons.length; ++i) {

        var b = buttons[i];

        d3.select("#" + b).on("mousedown", handlers[b]["mousedown"]);

        d3.select("#" + b).on("mouseup", function() { 

            mouseDown = false;
            clearTimeout(timeoutHandleZoom); 
            timeoutHandleZoom = null;

            zoomEnd();
        });
        d3.select("#" + b).on("mouseout", function() { 

            mouseDown = false;
            if (timeoutHandleZoom == null) return;
            clearTimeout(timeoutHandleZoom);
            timeoutHandleZoom = null;

            zoomEnd();
        });
        d3.select("#" + b).on("click", function() { 
            // TODO - would there be a case where mousedown is not called?
        });        
    }

    $("#control-panel").dialog({
        modal: false, 
        position: {
            my: "left top", 
            at: "left bottom", 
            of: "#blurb",
            collision: "fit flip"}, 
        width: "100%",
        height: '100',
        resizable: false,
        // title: "Controls",
        closeOnEscape: false 
    }).dialogExtend({
        titlebar: 'none',
        closable: false,
        "dblclick" : "collapse",
        minimizable: false,
        minimizeLocation: 'right',
        collapsable: true,
    });
    $("#control-panel")
        .closest('.ui-dialog')
        .addClass("transparent-panel")
        .css({'background': 'transparent', 'background-image': 'none', 'border': '0'});    

    $("#zoom-panel").dialog({
        modal: false, 
        position: {
            my: "left top", 
            at: "left bottom", 
            of: "#control-panel",
            collision: "fit flip"},
        title: "Pan/Zoom",
        closeOnEscape: false
    }).dialogExtend({
        closable: false,
        "dblclick" : "collapse",
        minimizable: true,
        minimizeLocation: 'right',
        collapsable: true,
    });
    $("#zoom-panel")
        .closest('.ui-dialog')
        .addClass("transparent-panel")
        .css({'background': 'transparent', 'background-image': 'none', 'border': '0'});

    $("#stats").dialog({
        modal: false, 
        position: {
            my: "left top", 
            at: "left bottom", 
            of: "#zoom-panel",
            collision: "fit flip"}, 
            title: "Information",
            minimizable: true,            
            collapsable: true,
            closeOnEscape: false
        }).dialogExtend({
            closable: false,
            "dblclick" : "collapse",
            minimizable: true,
            minimizeLocation: 'right',            
            collapsable: true,            
    });
    $("#stats")
        .closest('.ui-dialog')
        .addClass("transparent-panel")
        .css({'background': 'transparent', 'background-image': 'none', 'border': '0'});

    animDate = d3.select("#date");

    d3.select("svg").remove();

    var svgWidth = window.innerWidth;
    var svgHeight = window.innerHeight - 40;

    svgContainer = d3.select("#svg-wrapper")
        .append("svg")
            .attr("id", "svg")
            .attr("overflow", "visible") // added for SVG elements to be visible in Chrome 36+; TODO side effects analysis
        .append("g")
            .attr("transform", "translate(" + offsetx + ", " + offsety + ")");
            
    if (firefox) {
        // console.log("svgWidth = " + svgWidth + ", svgHeight = " + svgHeight);
        d3.select("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);
    }
        
    d3.select("#progressbar-label").html("Loading orbit data ...");

    dataLoaded = false;

    d3.xhr("whatsnew.html")
        .get(function(error, data) {
            if (error) {
                // console.log("Error: unable to load whatsnew.html");
            } else {
                // console.log("whatsnew.html = " + data);
                d3.select("#banner").html(data.response);
           }
        });

    d3.json(orbitsJson)
        .on("progress", function() {

            var progress = d3.event.loaded / total;
            var msg = dataLoaded ? "" : ("Loading orbit data ... " + FORMAT_PERCENT(progress) + ".");
            // console.log(msg);
            $("#progressbar").progressbar({value: progress * 100});
            $("#progressbar").show();
            d3.select("#progressbar-label").html(msg);
        })
        .get(function(error, data) {
            if (error) {
                $("#progressbar").hide();
                d3.select("#progressbar-label").html("Error: failed to load orbit data.");                
            } else {
                dataLoaded = true;
                $("#progressbar").hide();
                d3.select("#progressbar-label").html("");
                orbits = data;
                if (config == "helio") processOrbitElementsData();
                processOrbitVectorsData();

                svgRect = d3.select("#svg")
                    .append("rect")
                        .attr("id", "svg-rect")
                        .attr("class", "overlay")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", svgWidth)
                        .attr("height", svgHeight)
                        .attr("style", "fill:none;stroke:black;stroke-width:0;fill-opacity:0;stroke-opacity:0")
                        // .attr("class", "background")
                        .call(d3.behavior.zoom()
                            .translate([offsetx+panx, offsety+pany])
                            .scale(zoomFactor)
                            .on("zoom", zoom)
                            .on("zoomend", zoomEnd));

                missionStart();
                d3.selectAll("button").attr("disabled", null);

                if (!bannerShown) {
                    bannerShown = true;
                    $("#banner").dialog({height: 200, width: 400, modal: true});
                }
                
            }
        });

    d3.select("#checkbox-maven").attr("checked", true);
    d3.select("#animate").text("Start");
}

function zoom() {
    // console.log("zoom called: " + d3.event.translate[0] + ", " + d3.event.translate[1] + ", " + d3.event.scale);
    zoomFactor = d3.event.scale;
    panx = d3.event.translate[0] - offsetx;
    pany = d3.event.translate[1] - offsety;
    zoomChangeTransform();
}

function zoomEnd() {
    adjustLabelLocations();
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
                .attr("stroke-width", (1.0/zoomFactor))
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
                    .attr("style", "stroke: " + planetProps.color + "; stroke-width: " + (0.5/zoomFactor))
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
            .attr("x", CENTER_LABEL_OFFSET_X)
            .attr("y", CENTER_LABEL_OFFSET_Y)
            .attr("font-size", 10)
            .attr("fill", planetProperties[centerPlanet].color)
            .text(planetProperties[centerPlanet].name);

    if (config == "geo") {
        svgContainer.append("circle")
            .attr("id", "earth-soi")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", (soiRadius/zoomFactor))
            .attr("stroke", "cyan")
            .attr("stroke-opacity", 0.5)
            .attr("stroke-dasharray", "5 2")
            .attr("stroke-width", (0.5/zoomFactor))
            .attr("fill", "none");

        svgContainer.append("text")
            .attr("id", "earth-soi-label")
            .attr("x", -1 * (soiRadius / zoomFactor))
            .attr("y", 0)
            .attr("text-anchor", "end")
            .attr("font-size", (8/zoomFactor))
            .attr("fill", "grey")
            .text("Earth's Sphere of Influence");
    }

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

    // Add Bangalore longitude

    svgContainer.append("line")
        .attr("id", "Bangalore")
        .attr("class", "geo")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0)
        .attr("style", "stroke: DarkGray; stroke-opacity: 0.5; stroke-width: " + (0.5/zoomFactor))
        .attr("visibility", "inherit");

    d3.select("#epochjd").html(epochJD);
    d3.select("#epochdate").html(epochDate);
}

function changeLocation() {

    if (!stopAnimationFlag) {
        setLocation();
        count += countStep;
        if (count < nSteps) {
            timeoutHandle = setTimeout(function() { changeLocation(); }, timeout);
        } else {
            count = nSteps - 1;
            d3.select("#animate").text("Start");
            animationRunning = false;
        }
    }
}

function momAnimate() {

    if (animationRunning) {
        stopAnimation();
    } else {
        animationRunning = true;
        stopAnimationFlag = false;
        if (count >= nSteps - 1) count = 0;
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
    // console.log(now);
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
    if (timeout > 1) {
        timeout /= ZOOM_SCALE;
    } else {
        countStep += 1;
        if (countStep > 12) countStep = 12;
    }
    // console.log("timeout = " + timeout);
}

function slower() {
    if (countStep > 1) {
        countStep -= 1;
    } else {
        timeout *= ZOOM_SCALE; 
        if (timeout >= 1000) timeout = 1000;
    }
    // console.log("timeout = " + timeout);
}

function zoomChangeTransform(t) {

    var momx = 0;
    var momy = 0;

    if (lockOnMOM) {
        momx = parseFloat(d3.select("#MOM").attr("cx"));
        momy = parseFloat(d3.select("#MOM").attr("cy"));
    }

    var container = svgContainer;
    // if (t != 0) {
    //     container = svgContainer.transition().delay(t);
    // }

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

    // sychronize D3's state
    svgRect
        .call(d3.behavior.zoom()
        .translate([offsetx+panx, offsety+pany])
        .scale(zoomFactor)
        .on("zoom", zoom)
        .on("zoomend", adjustLabelLocations));          
}

function zoomChange(t) {
    zoomChangeTransform(t);
    showBangaloreLongitude();
}

function zoomOut() {
    zoomFactor /= ZOOM_SCALE;
    var factor = 1/ZOOM_SCALE;
    zoomChange(ZOOM_TIMEOUT);
}

function zoomIn() {
    zoomFactor *= ZOOM_SCALE;
    var factor = ZOOM_SCALE;
    zoomChange(ZOOM_TIMEOUT);
}

function panLeft() {
    panx += +10;
    zoomChange(ZOOM_TIMEOUT);
}

function panRight() {
    panx += -10;
    zoomChange(ZOOM_TIMEOUT);
}

function panUp() {
    pany += +10;
    zoomChange(ZOOM_TIMEOUT);
}

function panDown() {
    pany += -10;
    zoomChange(ZOOM_TIMEOUT);
}

function reset() {
    panx = 0;
    pany = 0;
    zoomFactor = 1;

    zoomChange(ZOOM_TIMEOUT);
    zoomEnd();
}

function toggleLockMOM() {
    previousLockOnMOM = lockOnMOM;
    lockOnMOM = !lockOnMOM;
    reset();
}

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

// The following function getMST() is from
//
// http://mysite.verizon.net/res148h4j/javascript/script_clock.html
// 
//
/*
** "getMST" computes Mean Sidereal Time in units of degrees. Use lon = 0 to
** get the Greenwich MST.
**
** returns: time in degrees
*/
function getMST( now, lon )
{
    var year   = now.getUTCFullYear();
    var month  = now.getUTCMonth() + 1;
    var day    = now.getUTCDate();
    var hour   = now.getUTCHours();
    var minute = now.getUTCMinutes();
    var second = now.getUTCSeconds();

    // 1994 June 16th at 18h UT
    // days since J2000: -2024.75
    // GMST: 174.77111347427126
    //       11h 39m 5.0672s 
    // year   = 1994;
    // month  = 6;
    // day    = 16;
    // hour   = 18;
    // minute = 0; 
    // second = 0; 

    if( month == 1 || month == 2 )
    {
    year = year - 1;
    month = month + 12;
    }

    var a = Math.floor( year/100 );
    var b = 2 - a + Math.floor( a/4 );

    var c = Math.floor(365.25 * year);
    var d = Math.floor(30.6001 * (month + 1));

    // days since J2000.0   
    var jd = b + c + d - 730550.5 + day + (hour + minute/60.0 + second/3600.0)/24.0;
    
    var jt   = jd/36525.0;                   // julian centuries since J2000.0         
    var GMST = 280.46061837 + 360.98564736629*jd + 0.000387933*jt*jt - jt*jt*jt/38710000 + lon;           
    if( GMST > 0.0 )
    {
        while( GMST > 360.0 )
            GMST -= 360.0;
    }
    else
    {
        while( GMST < 0.0 )
            GMST += 360.0;
    }
        
    return GMST;
}

// end of file
