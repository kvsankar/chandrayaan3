
// Copyright (c) 2013-2019 Sankaranarayanan Viswanathan. All rights reserved.

// orbit and location related data

// constants

var CY2     = "CY2";
var SUN     = "SUN";
var MERCURY = "MERCURY";
var VENUS   = "VENUS";
var EARTH   = "EARTH";
var MARS    = "MARS";
var MOON    = "MOON";
var CSS     = "CSS";

var KM_PER_AU = 149597870.691;
var DEGREES_PER_RADIAN = 57.2957795;
var DEGREES_PER_CIRCLE = 360.0;
var MILLI_SECONDS_PER_MINUTE = 60000;
var MILLI_SECONDS_PER_HOUR = 3600000;
var GREENWICH_LONGITUDE = 0; // used to be that of Bangalore earlier: 77.5667;
var EARTH_MOON_DISTANCE_MEAN_AU = 0.00257;
var EARTH_RADIUS_KM = 6371;
var MOON_RADIUS_KM = 1737.1;

var planetProperties = {
    "CY2":      { "id": CY2,        "name": "CY2",              "color": "orange",      "stroke-width": 1.0, "r": 3.2, "labelOffsetX": -30, "labelOffsetY": -10 },
    "SUN":      { "id": SUN,        "name": "Sun",              "color": "yellow",      "stroke-width": 1.0, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MERCURY":  { "id": MERCURY,    "name": "Mercury",          "color": "green",       "stroke-width": 1.0, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "VENUS":    { "id": VENUS,      "name": "Venus",            "color": "grey",        "stroke-width": 1.0, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "EARTH":    { "id": EARTH,      "name": "Earth",            "color": "blue",        "stroke-width": 1.0, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MARS":     { "id": MARS,       "name": "Mars",             "color": "red",         "stroke-width": 0.3, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MOON":     { "id": MOON,       "name": "Moon",             "color": "grey",        "stroke-width": 1.0, "r": 3,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "CSS":      { "id": CSS,        "name": "Siding Spring",    "color": "cyan",        "stroke-width": 1.0, "r": 3,   "labelOffsetX": +10, "labelOffsetY": +10 },
};

var CENTER_LABEL_OFFSET_X = -5;
var CENTER_LABEL_OFFSET_Y = -15;

var SPEED_CHANGE_FACTOR = 1.41;
var ZOOM_SCALE = 1.10;
var ZOOM_TIMEOUT = 200; // TODO Why did I end up calling this variable this way? 
var SVG_ORIGIN_X = 100; // TODO match with CSS value; find a better way
var SVG_ORIGIN_Y = 100; // TODO match with CSS value; find a better way
var FORMAT_PERCENT = d3.format(".0%");
var FORMAT_METRIC = d3.format(" >10,.2f");

//
// General state variables
//

var craftId = "CY2";
var config = "geo";
var missionStartCalled = false;
var orbitDataLoaded = { "geo": false, "lunar": false };
var orbitData = {};
var nOrbitPoints = 0;
var progress = 0;
var bannerShown = false;
var stopZoom = false;

// animation control
var mouseDown = false;

// locks on objects
var lockOnCY2 = false;
var previousLockOnCY2 = false;
var lockOnMoon = false;
var previousLockOnMoon = false;
var lockOnEarth = false;
var previousLockOnEarth = false;

// defaults for XY plane
var plane = "XY";
var xVariable = "x";
var yVariable = "y";
var zVariable = "z";
var vxVariable = "vx";
var vyVariable = "vy";
var vzVariable = "vz";

//
// Orbit data related variables
//

var planetsForOrbits;
var planetsForLocations;
var orbitsJson;
var orbits = {};
var craftData = {};

//
// Space related variables (as in Space Time)
//

var PIXELS_PER_AU;
var svgWidth;
var svgHeight;
var offsetx = 0;
var offsety = 0;
var trackWidth;
var primaryBody;
var primaryBodyRadius;
var secondaryBody;
var secondaryBodyRadius;
var svgContainer;
var svgRect;
var viewBoxWidth;
var viewBoxHeight;
var zoomFactor = 1;
var panx = 0;
var pany = 0;

//
// Time related variables
//

var animateLoopCount = 0;
var epochJD;
var epochDate;

var startTime;
var endTime;
var latestEndTime; 

var timelineTotalSteps;
var stepsPerHop;
var stepDurationInMilliSeconds;
var orbitsJsonFileSizeInBytes;
var animDate;
var now;
var timelineIndex = 0;
var timelineIndexStep = 1;
var animationRunning = false;
var stopAnimationFlag = false;
var timeoutHandle;
var timeoutHandleZoom;
var dataLoaded = false;
var ticksPerAnimationStep;
var mousedownTimeout = ZOOM_TIMEOUT;


// Chandrayaan 2 specific times and information
var timeTransLunarInjection;
var timeLunarOrbitInsertion;
var eventTimes = [];
var eventInfos = [];
var eventLabels = [];
var eventBurnFlags = [];

// 3D rendering related variables

var currentDimension = "2D"; 
var theSceneHandler = null;
var animationScenes = {};

class SceneHandler {

    constructor() {
        // console.log("SceneHandler ctor called");

        this.scene = null;
        this.renderer = null;
        this.canvasNode = null;
        this.initialized = false;

        this.init();
    }

    init() {

        // console.log("SceneHandler init() called");

        if (this.initialized) {
            return;
        }

        var width = window.innerWidth;
        var height = window.innerHeight - $("#footer_wrapper").outerHeight(true) - 40; // TODO fix this

        // add renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);

        // document.body.appendChild(renderer.domElement);
        this.canvasNode = d3.select("#canvas-wrapper")[0][0].appendChild(this.renderer.domElement); // TODO find a better D3 way to do this         

        window.addEventListener('resize', onWindowResize, false);

        this.initialized = true;
    }

    render(animationScene) {

        if (animationScene.initialized3D) {

            if (lockOnEarth || lockOnMoon) {
                animationScene.camera.lookAt(animationScene.secondaryBody3D.position);
            } else if (lockOnCY2) {
                animationScene.camera.lookAt(animationScene.craft.position);
            }                

            this.renderer.render(animationScene.scene, animationScene.camera);
        }
    }
}

function updateCraftScale() {
    if (animationScenes[config] && animationScenes[config].initialized3D) {
        // console.log("cameraControlsCallback() called");

        var origin = new THREE.Vector3(0, 0, 0);
        var craftLocation = animationScenes[config].craft.position;
        var distance = animationScenes[config].cameraControls.getPos().distanceTo(craftLocation);
        var scale =  distance / defaultCameraDistance;
        // console.log("scale = " + scale);
        animationScenes[config].craft.scale.set(scale, scale, scale);
        // animationScenes[config].craft.scale.set(10, 10, 10);
    }
}

function cameraControlsCallback() {
    updateCraftScale();
}

class AnimationScene {
    
    constructor(name) {

        // console.log("AnimationScene ctor called for " + name);

        this.name = name;
        this.initialized3D = false;
        this.secondaryBody3D = null;
        this.craft = null;
        this.camera = null;
        this.cameraControls = null;
        this.scene = null;
        this.renderer = null;
        this.curve = [];
        this.defaultCameraDistance = 0; 
    }

    init3d() {

        if (this.initialized3D) {
            return;
        }

        var width = window.innerWidth;
        var height = window.innerHeight - $("#footer_wrapper").outerHeight(true) - 40; // TODO fix this

        this.scene = new THREE.Scene();

        // add primary body
        var primaryBodyColor = planetProperties[primaryBody]["color"];
        var primaryBodyGeometry = new THREE.SphereGeometry(primaryBodyRadius, 100, 100);
        var primaryBodyMaterial = new THREE.MeshPhongMaterial({color: primaryBodyColor, shininess: 1});
        var primaryBody3D = new THREE.Mesh(primaryBodyGeometry, primaryBodyMaterial);
        this.scene.add(primaryBody3D);

        // add secondary body
        var secondaryBodyColor = planetProperties[secondaryBody]["color"];
        var secondaryBodyGeometry = new THREE.SphereGeometry(secondaryBodyRadius, 100, 100);
        var secondaryBodyMaterial = new THREE.MeshPhongMaterial({color: secondaryBodyColor});
        this.secondaryBody3D = new THREE.Mesh(secondaryBodyGeometry, secondaryBodyMaterial);
        this.scene.add(this.secondaryBody3D);

        // add spacecraft orbit
        var curves = new THREE.CatmullRomCurve3(this.curve);
        var orbitGeometry = new THREE.Geometry();
        orbitGeometry.vertices = curves.getSpacedPoints(nOrbitPoints * 100);
        var orbitMaterial = new THREE.LineBasicMaterial(/* { color : 0xff0000 } */ {color: "orange", linewidth: 0.2});
        var orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        this.scene.add(orbitLine);

        var craftColor = planetProperties[craftId]["color"];
        var craftGeometry = new THREE.BoxGeometry(4, 4, 4);
        var craftMaterial = new THREE.MeshBasicMaterial({color: 0xD4AF37});
        this.craft = new THREE.Mesh(craftGeometry, craftMaterial);
        this.scene.add(this.craft);

        // add axes helper
        var axesHelper = new THREE.AxesHelper(2*PIXELS_PER_AU*EARTH_MOON_DISTANCE_MEAN_AU);
        this.scene.add(axesHelper);

        // add light
        var color = 0xFFFFFF;
        var intensity = 10;
        var light = new THREE.DirectionalLight(color, intensity);
        light.position.set(100000, 0, 0);
        this.scene.add(light);

        var ambientLightColor = 0x404040;
        var ambientLightIntensity = 1;
        var ambientLight = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity); // soft white light
        this.scene.add(ambientLight);

        // add camera
        var angle = 50;
        this.camera = new THREE.PerspectiveCamera(angle, width/height, 0.1, 10000);
        this.camera.position.x = defaultCameraDistance;
        this.camera.position.y = defaultCameraDistance;
        this.camera.position.z = defaultCameraDistance;
        this.camera.up.set(0, 0, 1);

        // add camera controls
        this.cameraControls = new THREE.TrackballControls(this.camera, theSceneHandler.renderer.domElement, cameraControlsCallback);

        // TrackballControls settings
        this.cameraControls.rotateSpeed = 1.0;
        this.cameraControls.zoomSpeed = 1.2;
        this.cameraControls.panSpeed = 0.8;
        this.cameraControls.noZoom = false;
        this.cameraControls.noPan = false;
        this.cameraControls.staticMoving = true;
        this.cameraControls.dynamicDampingFactor = 0.3;
        this.cameraControls.keys = [65, 83, 68];
        this.cameraControls.addEventListener('change', render);

        render();

        d3.select("#eventinfo").text("");
        
        this.initialized3D = true;

        /*
        // dat gui
        var gui = new dat.GUI();
        var cameraGui = gui.addFolder("camera position");
        cameraGui.add(camera.position, 'x');
        cameraGui.add(camera.position, 'y');
        cameraGui.add(camera.position, 'z');
        cameraGui.open();

        var cameraGui = gui.addFolder("camera projection");
        cameraGui.add(camera, "fov");
        cameraGui.open();

        var lightGui = gui.addFolder("light position");
        lightGui.add(light.position, 'x');
        lightGui.add(light.position, 'y');
        lightGui.add(light.position, 'z');
        lightGui.open();

        var cubeGui = gui.addFolder("cube 
        position");
        cubeGui.add(cube.position, 'x');
        cubeGui.add(cube.position, 'y');
        cubeGui.add(cube.position, 'z');
        cubeGui.open();
        */
    }

    processOrbitVectorsData3D() {

        nOrbitPoints = 0;

        // console.log(planetsForLocations);
        
        for (var i = 0; i < planetsForLocations.length; ++i) {

            var planetKey = planetsForLocations[i];
            // console.log("planetKey = " + planetKey);
            
            var planetProps = planetProperties[planetKey];
            
            var planetId = planetProps.id;
            // console.log("planetId = " + planetId);
            
            var planet = orbits[planetId];

            var vectors = planet["vectors"];

            if (planetKey == "CY2") {

                for (var j = 0; j < vectors.length; ++j) {

                    var x = +1 * (vectors[j]["x"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var y = +1 * (vectors[j]["y"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var z = +1 * (vectors[j]["z"] / KM_PER_AU) * PIXELS_PER_AU;;

                    var v3 = new THREE.Vector3(x, y, z);
                    this.curve.push(v3);
                    ++nOrbitPoints;
                }
            }
        }

        // console.log("nOrbitPoints = " + nOrbitPoints);
    }

    cameraDisntance(position) {
        return Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
    }    
}

function render() {
    // console.log("render() called");  
    var animationScene = animationScenes[config];
    theSceneHandler.render(animationScene);
}

function animateLoop() {

    (function() {

        ++animateLoopCount;
        if (animateLoopCount % ticksPerAnimationStep < 0.1) {
            
            animateLoopCount = 0;

            // console.log("timelineIndex = " + timelineIndex + ", timelineTotalSteps = " + timelineTotalSteps);

            if (!stopAnimationFlag) {
                // console.log("Running the next step of the animation");
                setLocation();
                timelineIndex += timelineIndexStep;
                if (timelineIndex >= timelineTotalSteps) {
                    timelineIndex = timelineTotalSteps - 1;
                    d3.select("#animate").text("Start");
                    animationRunning = false;
                }
            }
        }
    })();

    requestAnimationFrame(animateLoop);

    if (animationScenes && animationScenes[config].initialized3D) {
        animationScenes[config].cameraControls.update();
        // var position = animationScenes[config].cameraControls.getPos();
        // d3.select("#camera-position").text("(" + position.x + ", " + position.y + ", " + position.z + ")");

    }
}

function handleGeoInit() {

}

function handleModeSwitch3(center, newMode, otherModes) {

    d3.select("#mode-" + newMode).attr("style", "color: blue; font-weight: bold");
    d3.select("#mode-" + newMode).attr("disabled", null);
    d3.selectAll("." + newMode).style("visibility", "visible");
    d3.selectAll("." + newMode).attr("display", "block");

    for (var i = 0; i < otherModes.length; ++i) {

        var otherMode = otherModes[i];

        d3.select("#mode-" + otherMode).attr("style", null);
        d3.select("#mode-" + otherMode).attr("disabled", "disabled");
        d3.selectAll("." + otherMode).style("visibility", "hidden");
        d3.selectAll("." + otherMode).attr("display", "none");
    }

    d3.select("#center").text(center);
}

function handleModeSwitchToGeo() {
    handleModeSwitch3("Earth", "geo", ["lunar"]);
}

function handleModeSwitchToLunar() {
    handleModeSwitch3("Moon", "lunar", ["geo"]);
}

function handleModeSwitch(mode) {
    if (mode == "geo") {
        handleModeSwitchToGeo();
    } else if (mode == "lunar") {
        handleModeSwitchToLunar();
    }
}

function handleDimensionSwitch(newDim) {

    var oldDim = (newDim === "3D") ? "2D" : "3D";

    // console.log("handleDimensionSwitch() called: oldDim = " + oldDim + ", newDim = " + newDim);

    d3.selectAll(".dimension-" + newDim).style("visibility", "visible");
    d3.selectAll(".dimension-" + newDim).attr("display", "block");
    d3.selectAll(".dimension-" + oldDim).style("visibility", "hidden");
    d3.selectAll(".dimension-" + oldDim).attr("display", "none");    
}

function addEvents() {

    // 
    // Sources of information:
    // 
    // https://www.isro.gov.in/update/24-jul-2019/chandrayaan2-update-first-earth-bound-maneuver
    // https://www.isro.gov.in/update/26-jul-2019/chandrayaan2-update-second-earth-bound-maneuver
    // https://www.isro.gov.in/update/29-jul-2019/chandrayaan2-update-third-earth-bound-maneuver
    // https://www.isro.gov.in/update/02-aug-2019/chandrayaan2-update-fourth-earth-bound-maneuver
    // https://www.isro.gov.in/update/06-aug-2019/chandrayaan2-update-fifth-earth-bound-maneuver
    // https://www.isro.gov.in/update/14-aug-2019/chandrayaan-2-successfully-enters-lunar-transfer-trajectory
    // https://www.isro.gov.in/update/20-aug-2019/chandrayaan-2-update-lunar-orbit-insertion 
    // https://www.isro.gov.in/update/21-aug-2019/chandrayaan-2-update-second-lunar-orbit-maneuver
    // 

    var missionStart = new Date(Date.UTC(2019, 7-1, 22,  9, 31, 0, 0));
    var ebn1 =         new Date(Date.UTC(2019, 7-1, 24,  9, 22, 0, 0));         // 1400 - 1530 IST || Actual: 1452 IST
    var ebn2 =         new Date(Date.UTC(2019, 7-1, 25, 19, 38, 0, 0));         // 0100 - 0200 IST || Actual: 0108 IST
    var ebn3 =         new Date(Date.UTC(2019, 7-1, 29,  9, 42, 0, 0));         // 1430 - 1530 IST || Actual: 1512 IST
    var ebn4 =         new Date(Date.UTC(2019, 8-1,  2,  9, 57, 0, 0));         // 1400 - 1500 IST || Actual: 1527 IST
    var ebn5 =         new Date(Date.UTC(2019, 8-1,  6,  9, 34, 0, 0));         // 1430 - 1530 IST || Actual: 1504 IST
    var ebn6loi =      new Date(Date.UTC(2019, 8-1, 13, 21,  1, 0, 0));         // 0300 - 0400 IST || Actual: 0221 IST - 1203 seconds
    var lbn1tli =      new Date(Date.UTC(2019, 8-1, 20,  3, 47, 0, 0));         //                 || Actual: 0902 IST - 1738 seconds - achieved 114 km x 18072 km
    var lbn2 =         new Date(Date.UTC(2019, 8-1, 21,  7, 20, 0, 0));         // Aug 21, 2019 | 12:30 – 13:30 | 121 X 4303 || Actual: 1250 IST - achieved 118 km x 4412 km

    var now =          new Date();
    
    var lbn3 =         new Date(Date.UTC(2019, 8-1, 28,  0, 30, 0, 0));         // Aug 28, 2019 | 05:30 – 06:30 | 178 X 1411
    var lbn4 =         new Date(Date.UTC(2019, 8-1, 30, 13,  0, 0, 0));         // Aug 30, 2019 | 18:00 – 19:00 | 126 X 164
    var lbn5 =         new Date(Date.UTC(2019, 9-1, 1,  13,  0, 0, 0));         // Sep 01, 2019 | 18:00 – 19:00 IST | 114 X 128
    var animationEnd = new Date(Date.UTC(2019, 8-1, 30,  4, 56, 0, 0));

    eventTimes = [
        missionStart, ebn1,     ebn2,    ebn3,    ebn4,    ebn5,    ebn6loi,    lbn1tli,     lbn2,    now,    lbn3,    animationEnd, lbn4,    lbn5];

    eventLabels = [
        "Launch",     "EBN#1", "EBN#2", "EBN#3", "EBN#4", "EBN#5", "EBN#6/LOI", "LBN#1/TLI", "LBN#2", "Now",  "LBN#3", "Data End",   "LBN#4", "LBN#5", ];

    eventBurnFlags = [
        false,        true,    true,     true,   true,    true,    true,        true,         true,    false, true,   false,        true,     true  
    ];

    eventInfos = [
        "Launch:    22nd Jul, 15:01 IST - Chandrayaan 2 placed in orbit",
        "EBN#1:     24th Jul, 14:52 IST - Target orbit: 230 x  45162, Achieved 230 X  45163",
        "EBN#2:     26th Jul, 01:08 IST - Target orbit: 250 x  54689, Achieved 251 X  54829",
        "EBN#3:     29th Jul, 15:12 IST - Target orbit: 268 x  71558, Achieved 276 x  71792",
        "EBN#4:      2nd Aug, 15:27 IST - Target orbit: 248 x  90229, Achived: 277 x  89472",
        "EBN#5:      6th Aug, 15:04 IST - Target orbit: 221 x 143585, Achieved 276 x 142975",
        "EBN#6/LOI: 14th Aug, 02:21 IST - Target orbit: 266 x 413623, Completed",
        "LBN#1/TLI: 20th Aug, 09:02 IST - Target orbit: 118 x  18078, Achieved 114 x  18072",
        "LBN#2:     21st Aug, 12:50 IST - Target orbit: 121 x   4303, Achieved 118 x   4412",
        "Now",
        "LBN#3:     28th Aug, 05:30 - 06:30 IST - Target orbit: 178 X 1411",
        "Data End:       30th Aug, 04:56 IST - Orbit data predictions end here",
        "LBN#4:     30th Aug, 18:00 - 19:00 IST - Target orbit: 126 x 164",
        "LBN#5:      1st Sep, 18:00 - 19:00 IST - Target orbit: 114 x 128",
    ];
}

function initConfig() {

    addEvents();

    timeTransLunarInjection = Date.UTC(2019, 8-1, 13, 20, 51, 0, 0); 
    /* The next maneuver is Trans Lunar Insertion (TLI), which is scheduled on August 14, 2019, between 0300 – 0400 hrs (IST).*/ 
    
    timeLunarOrbitInsertion = Date.UTC(2019, 8-1, 21, 0, 0, 0, 0);

    if (!theSceneHandler) {
        theSceneHandler = new SceneHandler();
    }

    if (config == "geo") {

        if (!animationScenes[config]) {
            animationScenes[config] = new AnimationScene(config);    
        }
        
        svgWidth = window.innerWidth;
        svgHeight = window.innerHeight - $("#footer_wrapper").outerHeight(true);
        offsetx = svgWidth * (1 / 2) - SVG_ORIGIN_X;
        offsety = svgHeight * (2 / 3) - SVG_ORIGIN_Y;

        PIXELS_PER_AU = Math.min(svgWidth, svgHeight) / (1.2 * (2 * EARTH_MOON_DISTANCE_MEAN_AU)); 
        // The smaller dimension of the screen should fit 120% of the whole Moon orbit around Earth

        defaultCameraDistance = 2 * EARTH_MOON_DISTANCE_MEAN_AU * PIXELS_PER_AU;

        trackWidth = 0.6;
        
        primaryBody = "EARTH";
        primaryBodyRadius = (EARTH_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;

        secondaryBody = "MOON";
        secondaryBodyRadius = (MOON_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;


        planetsForOrbits = ["MOON", "CY2"];
        planetsForLocations = ["MOON", "CY2"];
        stepDurationInMilliSeconds = 5 * MILLI_SECONDS_PER_MINUTE; // TODO add to and read from JSON
        orbitsJson = "geo-cy2.json";
        orbitsJsonFileSizeInBytes = 2167 * 1024; // TODO
        stepsPerHop = 4;

        startTime                  = Date.UTC(2019, 7-1, 22,  9, 31, 0, 0);
        endTime                    = Date.UTC(2019, 8-1, 30,  4, 56, 0, 0);

        latestEndTime = endTime;
        timelineTotalSteps = (latestEndTime - startTime) / stepDurationInMilliSeconds;
        ticksPerAnimationStep = 1;

        epochJD = "N/A";
        epochDate = "N/A";

        timelineIndex = 0;

        handleModeSwitchToGeo();

    } else if (config == "lunar") {

        if (!animationScenes[config]) {
            animationScenes[config] = new AnimationScene(config);    
        }

        svgWidth = window.innerWidth;
        svgHeight = window.innerHeight - $("#footer_wrapper").outerHeight(true);

        offsetx = svgWidth * (1 / 2) - SVG_ORIGIN_X;
        offsety = svgHeight * (2 / 3) - SVG_ORIGIN_Y;

        PIXELS_PER_AU = Math.min(svgWidth, svgHeight) / (1.2 * (2 * EARTH_MOON_DISTANCE_MEAN_AU)); 
        // The smaller dimension of the screen should fit 120% of the whole Moon orbit around Earth
        
        defaultCameraDistance = 2 * EARTH_MOON_DISTANCE_MEAN_AU * PIXELS_PER_AU;

        trackWidth = 0.6;

        primaryBody = "MOON";
        primaryBodyRadius = (MOON_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;

        secondaryBody = "EARTH";
        secondayBodyRadius = (EARTH_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;

        planetsForOrbits = ["EARTH", "CY2"];
        planetsForLocations = ["EARTH", "CY2"];
        stepDurationInMilliSeconds = 5 * MILLI_SECONDS_PER_MINUTE; // TODO add to and read from JSON
        orbitsJson = "lunar-cy2.json";
        orbitsJsonFileSizeInBytes = 2167 * 1024; // TODO
        stepsPerHop = 4;

        startTime                  = Date.UTC(2019, 7-1, 22,  9, 31, 0, 0);
        endTime                    = Date.UTC(2019, 8-1, 30,  4, 56, 0, 0);

        latestEndTime = endTime;
        timelineTotalSteps = (latestEndTime - startTime) / stepDurationInMilliSeconds;
        ticksPerAnimationStep = 1;

        epochJD = "N/A";
        epochDate = "N/A";

        timelineIndex = 0;

        handleModeSwitchToLunar();
    }

    // Add event buttons

    d3.select("#burnbuttons").html("");
    for (var i = 0; i < eventInfos.length; ++i) {
        d3.select("#burnbuttons").append("button")
            .attr("id", "burn" + (i+1))
            .attr("type", "button")
            .attr("class", "button")
            .attr("title", eventInfos[i])
            .attr("onclick", "burnButtonHandler(" + i + ")")
            .html(eventLabels[i]);
    }

}

function toggleMode() {
    var val = $('input[name=mode]:checked').val();
    // console.log("toggleMode() called with value " + val);

    if (config != val) {

        stopAnimation();
        config = val;

        handleModeSwitch(config);
        
        initRest(function() {

            toggleDimension();
            handleDimensionSwitch(currentDimension);
            // TODO can we do this better?
            handleModeSwitch(config);
            render();
        });
    }
}

function onWindowResize() {
    render(); // TODO is this the right thing to do here?
}

function toggleDimension() {
    var val = $('input[name=dimension]:checked').val();
    // console.log("toggleDimension() called with value " + val);

    if (val == "3D") {

        // console.log("Entering 3D dimension");

        currentDimension = val;

        if (!animationScenes[config].initialized3D) {

            // console.log("Initializing 3D for " + config);
            d3.select("#eventinfo").text("Loading 3D data. This may take a while. Please wait ...");

            animationScenes[config].processOrbitVectorsData3D();
            
            setTimeout(function() {
                
                animationScenes[config].init3d();
                setLocation();
                d3.select("#eventinfo").text("");
                handleDimensionSwitch(val);
                render();

            }, 10);

            /* DON"T PUT ANYTHING HERE */

        } else {

            setLocation();
            handleDimensionSwitch(val);
            render();
        }
    } else {

        setLocation();
        handleDimensionSwitch(val);
        render();
    }
}

function showPlanet(planet) {
    return true;
}

function shouldDrawOrbit(planet) {
    return ((planet == "MARS") ||
            (planet == "CY2") ||
            (planet == "MOON") ||
            (planet == "EARTH") || 
            (((config == "lunar") || (config == "helio")) && (planet == "CSS")));
}

function planetStartTime(planet) {
    return startTime;
}

function isLocationAvaialable(planet, date) {
    if (planet == "CY2") {
        return ((date >= startTime) && (date <= endTime));
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

function setLabelLocation(planetKey) {

    var planetProps = planetProperties[planetKey];
    var planetId = planetProps.id;
    var planet = orbits[planetId];
    var vectors = planet["vectors"];

    if (isLocationAvaialable(planetKey, now)) {

        var index = timelineIndex - planetProperties[planetKey]["offset"];

        var x = vectors[index][xVariable];
        var y = vectors[index][yVariable];

        var newx = +1 * (x / KM_PER_AU) * PIXELS_PER_AU;
        var newy = -1 * (y / KM_PER_AU) * PIXELS_PER_AU;

        var labelx = newx + planetProps.labelOffsetX/zoomFactor;
        var labely = newy + planetProps.labelOffsetY/zoomFactor;

        d3.select("#label-" + planetKey)
            .attr("visibility", showPlanet(planetKey) ? "visible" : "hidden")
            .attr("x", labelx)
            .attr("y", labely)
            .attr("font-size", 10/zoomFactor);

    } else {
        d3.select("#label-" + planetKey)
            .attr("visibility", "hidden");
    }
}

function setLocation() {

    // console.log("setLocation(): timelineIndex = " + timelineIndex + ", timelineTotalSteps = " + timelineTotalSteps);

    now = startTime + timelineIndex * stepDurationInMilliSeconds;
    var nowDate = new Date(now);
    animDate.html(nowDate);

    // console.log("now = " + now);
    // console.log("helioCentricPhaseStartTime = " + helioCentricPhaseStartTime);
    // console.log("lunarPhaseStartTime = " + lunarPhaseStartTime);

    d3.select("#phase-1").html("Earth Bound Phase");
    d3.select("#phase-2").html("Lunar Bound Phase");
    d3.select("#phase-3").html("Lunar Orbit Phase");

    // TODO find a better way to do this
    if (now < timeTransLunarInjection) {
        d3.select("#phase-1").html("<b><u>Earth Bound Phase</u></b>");
    } else if (now < timeLunarOrbitInsertion) {
        d3.select("#phase-2").html("<b><u>Lunar Bound Phase</u></b>");
    } else {
        d3.select("#phase-3").html("<b><u>Lunar Orbit Phase</u></b>");
    }

    for (var i = 0; i < planetsForLocations.length; ++i) {


        var planetKey = planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var vectors = planet["vectors"];

        if (isLocationAvaialable(planetKey, now)) {

            var index = timelineIndex - planetProperties[planetKey]["offset"];

            var realx = vectors[index]["x"];
            var realy = vectors[index]["y"];
            var realz = vectors[index]["z"];

            var realx_screen = +1 * (realx / KM_PER_AU) * PIXELS_PER_AU;
            var realy_screen = +1 * (realy / KM_PER_AU) * PIXELS_PER_AU; // note the sign; it's +1
            var realz_screen = +1 * (realz / KM_PER_AU) * PIXELS_PER_AU;

            var x = vectors[index][xVariable];
            var y = vectors[index][yVariable];
            var z = vectors[index][zVariable];

            var newx = +1 * (x / KM_PER_AU) * PIXELS_PER_AU;
            var newy = -1 * (y / KM_PER_AU) * PIXELS_PER_AU;
            var newz = +1 * (z / KM_PER_AU) * PIXELS_PER_AU;

            d3.select("#" + planetKey)
                .attr("visibility", showPlanet(planetKey) ? "visible" : "hidden")
                .attr("cx", newx)
                .attr("cy", newy);

            if (planetKey == secondaryBody) {
                if (animationScenes[config] && animationScenes[config].initialized3D) {
                    animationScenes[config].secondaryBody3D.position.set(realx_screen, realy_screen, realz_screen);
                    render();
                }                
            } else if (planetKey == craftId) {
                if (animationScenes[config] && animationScenes[config].initialized3D) {
                    animationScenes[config].craft.position.set(realx_screen, realy_screen, realz_screen);
                    updateCraftScale();
                    render();
                }                                
            }

            if (planetKey == "CY2") {

                craftData["x"] = newx;
                craftData["y"] = newy;
                craftData["z"] = newz;
                
                // relative to center

                var z = vectors[index]["z"];
                var r = Math.sqrt(x*x + y*y + z*z);

                var primaryBodyRadius;
                if (config == "geo") {
                    primaryBodyRadius = EARTH_RADIUS_KM; 
                } else if (config == "lunar") {
                    primaryBodyRadius = MOON_RADIUS_KM;
                }

                var altitude = r - primaryBodyRadius;
                d3.select("#distance-" + planetKey + "-" + primaryBody).text(FORMAT_METRIC(r));
                d3.select("#altitude-" + planetKey + "-" + primaryBody).text(FORMAT_METRIC(altitude));

                var vx = vectors[index][vxVariable];
                var vy = vectors[index][vyVariable];
                var vz = vectors[index][vzVariable];
                var v = Math.sqrt(vx*vx + vy*vy + vz*vz);
                d3.select("#velocity-" + planetKey + "-" + primaryBody).text(FORMAT_METRIC(v));

                if (config == "geo") {
                    // relative to Moon

                    x = vectors[index][xVariable] - orbits[MOON]["vectors"][timelineIndex][xVariable];
                    y = vectors[index][yVariable] - orbits[MOON]["vectors"][timelineIndex][yVariable];
                    z = vectors[index][zVariable] - orbits[MOON]["vectors"][timelineIndex][zVariable];
                    r = Math.sqrt(x*x + y*y + z*z);
                    var altitudeMoon = r - MOON_RADIUS_KM;
                    d3.select("#distance-" + planetKey +"-MOON").text(FORMAT_METRIC(r));
                    d3.select("#altitude-" + planetKey +"-MOON").text(FORMAT_METRIC(altitudeMoon));

                    vx = vectors[index][vxVariable] - orbits[MOON]["vectors"][timelineIndex][vxVariable];
                    vy = vectors[index][vyVariable] - orbits[MOON]["vectors"][timelineIndex][vyVariable];
                    vz = vectors[index][vzVariable] - orbits[MOON]["vectors"][timelineIndex][vzVariable];
                    v = Math.sqrt(vx*vx + vy*vy + vz*vz);
                    d3.select("#velocity-" + planetKey +"-MOON").text(FORMAT_METRIC(v));
                }

                if (config == "lunar") {
                    // relative to Earth

                    x = vectors[index][xVariable] - orbits[EARTH]["vectors"][timelineIndex][xVariable];
                    y = vectors[index][yVariable] - orbits[EARTH]["vectors"][timelineIndex][yVariable];
                    z = vectors[index][zVariable] - orbits[EARTH]["vectors"][timelineIndex][zVariable];
                    r = Math.sqrt(x*x + y*y + z*z);
                    var altitudeEarth = r - EARTH_RADIUS_KM;
                    d3.select("#distance-" + planetKey +"-EARTH").text(FORMAT_METRIC(r));
                    d3.select("#altitude-" + planetKey +"-EARTH").text(FORMAT_METRIC(altitudeEarth));

                    vx = vectors[index][vzVariable] - orbits[EARTH]["vectors"][timelineIndex][vzVariable];
                    vy = vectors[index][vyVariable] - orbits[EARTH]["vectors"][timelineIndex][vyVariable];
                    vz = vectors[index][vzVariable] - orbits[EARTH]["vectors"][timelineIndex][vzVariable];
                    v = Math.sqrt(vx*vx + vy*vy + vz*vz);
                    d3.select("#velocity-" + planetKey +"-EARTH").text(FORMAT_METRIC(v));
                }

                // show burn
                craftData["angle"] = Math.atan2(vy, vx) * 180.0 / Math.PI + 90;
                var transformString = "translate (" + newx + ", " + newy + ") ";
                transformString += "rotate(" + craftData["angle"] + " 0 0) ";
                transformString += "scale (" + 1/zoomFactor + " " + 1/zoomFactor + ") ";
                d3.select("#burng").attr("transform", transformString);
            }

        } else {
            d3.select("#" + planetKey)
                .attr("visibility", "hidden");

            d3.select("#distance-" + planetKey).text("");
            d3.select("#velocity-" + planetKey).text("");
            d3.select("#distance-" + planetKey + "-Earth").text("");
            d3.select("#velocity-" + planetKey + "-Earth").text("");
            d3.select("#distance-" + planetKey + "-Moon").text("");
            d3.select("#velocity-" + planetKey + "-Moon").text("");
        }
    }

    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];


        setLabelLocation(planetKey);
    }

    zoomChangeTransform(0);
    showGreenwichLongitude();

    for (var i = 0; i < eventTimes.length; ++i) {
        var burnTime = eventTimes[i];
        var burnFlag = eventBurnFlags[i];
        if (!burnFlag) {
            continue;
        }
        var difftime = Math.abs(nowDate.getTime() - burnTime.getTime());
        if (difftime < 1 * 60 * 60 * 1000) {
            d3.select("#burng").style("visibility", "visible");
            d3.select("#eventinfo").text(eventInfos[i]);
            break;
        } else {
            d3.select("#burng").style("visibility", "hidden");
            d3.select("#eventinfo").text("");
        }
    }
}

function showGreenwichLongitude() {
    if (config == "helio") return;

    var mst = getMST(new Date(now), GREENWICH_LONGITUDE);

    var radialLength = (EARTH_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;

    var x1 = 0;
    var y1 = 0;
    var x2 = +1 * radialLength * Math.cos(mst/DEGREES_PER_RADIAN);
    var y2 = -1 * radialLength * Math.sin(mst/DEGREES_PER_RADIAN);

    d3.select("#Greenwich")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2);
}

function adjustLabelLocations() {

    for (var i = 0; i < planetsForOrbits.length; ++i) {
        var planetKey = planetsForLocations[i];
        d3.selectAll("#orbit-" + planetKey).attr("r", (0.5/zoomFactor));
        var strokeWidth = planetProperties[planetKey]["stroke-width"];
        d3.selectAll("#ellipse-orbit-" + planetKey).attr("stroke-width", (strokeWidth/zoomFactor));
    }

    // d3.select("#" + primaryBody).attr("r", (primaryBodyRadius/zoomFactor));

    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];
        setLabelLocation(planetKey);

        var planetProps = planetProperties[planetKey];
        
        if (planetKey == "MOON") {
            var moonRadius = (MOON_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;
            d3.selectAll("#" + planetKey).attr("r", Math.max(moonRadius, (planetProps.r/zoomFactor)));
        } else {
            d3.selectAll("#" + planetKey).attr("r", (planetProps.r/zoomFactor));
        }

        // TODO probably the following statement is not required after the introduction of path
        // d3.select("#orbit-" + planetKey)
        //     .selectAll("line")
        //     .attr("style", "stroke: " + planetProps.color + "; stroke-width: " + (0.5/zoomFactor));

        d3.select("#orbit-" + planetKey)
            .selectAll("path")
            .attr("style", "stroke: " + planetProps.color + "; stroke-width: " + (1.0/zoomFactor) + "; fill: none");

        d3.select("#label-" + planetKey).attr("font-size", (10/zoomFactor));
    }

    d3.select("#Greenwich").attr("style", "stroke: LightBlue; stroke-opacity: 0.5; " + "stroke-width: " + (0.5/zoomFactor));
    
    var radialLength = (EARTH_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;
    d3.select("#label-" + primaryBody).attr("x", (-1 * radialLength + CENTER_LABEL_OFFSET_X/zoomFactor));
    d3.select("#label-" + primaryBody).attr("y", (-1 * radialLength + CENTER_LABEL_OFFSET_Y/zoomFactor));
    
    d3.select("#label-" + primaryBody).attr("font-size", (10/zoomFactor));

    var transformString = "translate (" + craftData["x"] + ", " + craftData["y"] + ") ";
    transformString += "rotate(" + craftData["angle"] + " 0 0) ";
    var burnZoomFactor = Math.max(0.25, zoomFactor);
    // console.log("zoomFactor = " + zoomFactor);
    transformString += "scale (" + 1/burnZoomFactor + " " + 1/burnZoomFactor + ") ";
    d3.select("#burng").attr("transform", transformString);
}

function initRest(callback) {
    initConfig();
    init(callback);
}

function onload() {
    initRest(function() {
        handleDimensionSwitch(currentDimension);
        animateLoop();
        // console.log("onload() -> initRest() completed");
    });
}

// TODO - find a better way to handle the following

function f1()  { zoomIn();          timeoutHandleZoom = setTimeout(f1,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f2()  { zoomOut();         timeoutHandleZoom = setTimeout(f2,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f3()  { panLeft();         timeoutHandleZoom = setTimeout(f3,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f4()  { panRight();        timeoutHandleZoom = setTimeout(f4,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f5()  { panUp();           timeoutHandleZoom = setTimeout(f5,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f6()  { panDown();         timeoutHandleZoom = setTimeout(f6,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f7()  { forward();         timeoutHandleZoom = setTimeout(f7,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f8()  { fastForward();     timeoutHandleZoom = setTimeout(f8,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f9()  { backward();        timeoutHandleZoom = setTimeout(f9,  mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f10() { fastBackward();    timeoutHandleZoom = setTimeout(f10, mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f11() { slower();          timeoutHandleZoom = setTimeout(f11, mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f12() { faster();          timeoutHandleZoom = setTimeout(f12, mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}

function zoomFunction(f) {
    mouseDown = true;
    f();
    timeoutHandleZoom = setTimeout(f, ZOOM_TIMEOUT);
}

function init(callback) {
    zoomFactor = 1;
    panx = 0;
    pany = 0;
    
    lockOnCY2 = false;
    lockOnMoon = false;
    lockOnEarth = false;
    
    d3.select("#checkbox-lock-cy2").property("checked", false);
    d3.select("#checkbox-lock-moon").property("checked", false);
    d3.select("#checkbox-lock-earth").property("checked", false);

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

            mousedownTimeout = ZOOM_TIMEOUT;
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
        /* height: '300', */
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

    initSVG();    
    loadOrbitDataIfNeededAndProcess(callback);
}

function processOrbitData(data) {
    // console.log("processOrbitData() called");

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

    if (!missionStartCalled) {
        missionStart();
    }
    d3.selectAll("button").attr("disabled", null);

    /*
    if (!bannerShown) {
        bannerShown = true;
        $("#banner").dialog({height: 200, width: 400, modal: true});
    }
    */

    if (!animationRunning) {
        d3.select("#animate").text("Start");
    }

    zoomChangeTransform(0);
}

function loadOrbitDataIfNeededAndProcess(callback) {

    if (!orbitDataLoaded[config]) {

        // console.log("Loading orbit data for " + config);

        d3.json(orbitsJson)
            .on("progress", function() {

                var progress = d3.event.loaded / orbitsJsonFileSizeInBytes;
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
                    orbitDataLoaded[config] = true;
                    orbitData[config] = data;
                    processOrbitData(data);
                    callback();
                }
            });

            /* DON'T PUT ANY CODE HERE */        
    } else {
        // console.log("Orbit data already loaded for " + config);
        processOrbitData(orbitData[config]);
        callback();
    }
}

function initSVG() {
    d3.select("svg").remove();

    svgWidth = window.innerWidth;
    svgHeight = window.innerHeight - $("#footer_wrapper").outerHeight(true);

    svgContainer = d3.select("#svg-wrapper")
        .attr("class", config + " dimension-2D")
        .append("svg")
            .attr("id", "svg")
            .attr("overflow", "visible") // added for SVG elements to be visible in Chrome 36+; TODO side effects analysis
            .attr("class", "dimension-2D")
            .attr("display", "none")
            .style("visibility", "hidden")
        .append("g")
            .attr("transform", "translate(" + offsetx + ", " + offsety + ")");

     // console.log("svgWidth = " + svgWidth + ", svgHeight = " + svgHeight);
     d3.select("svg")
         .attr("width", svgWidth)
         .attr("height", svgHeight);

    d3.select("#progressbar-label").html("Loading orbit data ...");

    dataLoaded = false;

    /*
    d3.xhr("whatsnew-cy2.html")
        .get(function(error, data) {
            if (error) {
                // console.log("Error: unable to load whatsnew.html");
            } else {
                // console.log("whatsnew.html = " + data);
                d3.select("#banner").html(data.response);
           }
        });
    */
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

    // console.log("processOrbitElementsData() called");

    // Add elliptical orbits

    for (var i = 0; i < planetsForOrbits.length; ++i) {

        var planetKey = planetsForOrbits[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var elements = planet["elements"];

        // console.log("Processing orbit data of " + planetKey);

        for (var jd in elements) { // only 1 is expected

            var el = elements[jd];
            epochJD = jd;
            epochDate = el.date;
            // consoloe.log(planetKey + ": epochjd: " + epochjd + ", epochDate: " + epochDate);

            var cx = -1 * (el.a / KM_PER_AU) * el.ec * PIXELS_PER_AU;
            var cy = 0 * PIXELS_PER_AU;
            var rx = (el.a / KM_PER_AU) * PIXELS_PER_AU;
            var ry = rx * (Math.sqrt(1 - el.ec * el.ec));

            var angle = parseFloat(el.om) + parseFloat(el.w);
            while (angle >= DEGREES_PER_CIRCLE) angle -= DEGREES_PER_CIRCLE;
            angle = -1 * angle;

            svgContainer.append("ellipse")
                .attr("id", "ellipse-orbit-" + planetKey)
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

            var line = d3.svg.line()
                .x(function(d) { return +1 * d[xVariable] / KM_PER_AU * PIXELS_PER_AU; } )
                .y(function(d) { return -1 * d[yVariable] / KM_PER_AU *PIXELS_PER_AU; } )
                .interpolate("cardinal-open");

            svgContainer.select("#" + "orbit-" + planetKey)
                .append("path")
                .attr("d", line(vectors))
                .attr("style", "stroke: " + planetProps.color + "; stroke-width: " + (1.0/zoomFactor) + "; fill: none")
                .attr("visibility", "inherit");
        }
    }

    // Add center planet - Sun/Earth/Mars/Moon

    svgContainer.append("circle")
        .attr("id", primaryBody)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", primaryBodyRadius)
        .attr("fill-opacity", "0.6")
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .attr("fill", planetProperties[primaryBody].color);

    if ((config == "geo") || (config == "helio")) {

        svgContainer
            .append("g")
                .attr("class", "label")
            .append("text")
                .attr("id", "label-" + primaryBody)
                .attr("x", CENTER_LABEL_OFFSET_X)
                .attr("y", CENTER_LABEL_OFFSET_Y)
                .attr("font-size", 10/zoomFactor)
                .attr("fill", planetProperties[primaryBody].color)
                .text(planetProperties[primaryBody].name);
    }

    if (config == "martian") {
           var r = 3390/KM_PER_AU*PIXELS_PER_AU/zoomFactor;
           svgContainer.append("image")
               .attr("id", "mars-image")
               .attr("xlink:href", "cy2-mars-image-transparent.gif")
               .attr("x", -r)
               .attr("y", -r)
               .attr("height", 2*r)
               .attr("width", 2*r);
    }

    // Add planetary positions

    for (var i = 0; i < planetsForLocations.length; ++i) {

        var planetKey = planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = orbits[planetId];
        var vectors = planet["vectors"];

        // If a planet location is avialable only after an interval of time from the epoch (startTime)
        // For example, Maven and the Mars Orbiter Mission were launched at different times.
        // The "offset" vallue is to take care of such scenarios.

        var planetIndexOffset = (planetStartTime(planetKey) - startTime) / stepDurationInMilliSeconds;
        planetProperties[planetKey]["offset"] = planetIndexOffset;

        svgContainer.append("circle")
            .attr("id", planetKey)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", planetProps.r/zoomFactor)
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            .attr("fill", planetProps.color);

    }

    // Add fire

    svgContainer.append("g")
            .attr("id", "burng")
            .style("visibility", "hidden")
        .append("polygon")
            .attr("id", "burn")
            .attr("points", "3 9 3 -9 45 0")
            .attr("fill", "red");

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
                .attr("font-size", 10/zoomFactor)
                .attr("fill", planetProps.color);

        d3.select("#label-"+planetKey).text(planetProps.name);
    }

    if (config == "geo") {

        // Add Greenwich longitude

        svgContainer.append("line")
            .attr("id", "Greenwich")
            .attr("class", "geo")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 0)
            .attr("style", "stroke: DarkGray; stroke-opacity: 0.5; stroke-width: " + (0.5/zoomFactor))
            .attr("visibility", "inherit");
    }

    d3.select("#epochjd").html(epochJD);
    d3.select("#epochdate").html(epochDate);
}

function changeLocation() {

    if (!stopAnimationFlag) {
        setLocation();
        timelineIndex += timelineIndexStep;
        if (timelineIndex < timelineTotalSteps) {
            timeoutHandle = setTimeout(function() { changeLocation(); }, ticksPerAnimationStep);
        } else {
            timelineIndex = timelineTotalSteps - 1;
            d3.select("#animate").text("Start");
            animationRunning = false;
        }
    }
}

function cy2Animate() {

    if (animationRunning) {
        stopAnimation();
    } else {
        animationRunning = true;
        stopAnimationFlag = false;
        if (timelineIndex >= timelineTotalSteps - 1) timelineIndex = 0;
        // changeLocation();
        d3.select("#animate").text("Stop");
    }
}

function fastBackward() {
    timelineIndex -= stepsPerHop;
    if (timelineIndex < 0) timelineIndex = 0;
    setLocation();
}

function backward() {
    timelineIndex -= 1;
    if (timelineIndex < 0) timelineIndex = 0;
    setLocation();
}

function stopAnimation() {
    animationRunning = false;
    stopAnimationFlag = true;
    clearTimeout(timeoutHandle);
    d3.select("#animate").text("Start");
}

function forward() {
    timelineIndex += 1;
    if (timelineIndex >= timelineTotalSteps) {
        timelineIndex = timelineTotalSteps - 1;
    }
    setLocation();
}

function fastForward() {
    timelineIndex += stepsPerHop;
    if (timelineIndex >= timelineTotalSteps) {
        timelineIndex = timelineTotalSteps - 1;
    }
    setLocation();
}

function missionStart() {
    missionStartCalled = true;
    stopAnimation();
    timelineIndex = 0;
    setLocation();
}

function missionSetTime() {
    stopAnimation();
    var x = (now - startTime) / stepDurationInMilliSeconds;
    timelineIndex = Math.max(0, Math.floor(x));
    if (timelineIndex >= timelineTotalSteps) {
        timelineIndex = timelineTotalSteps - 1;
    }
    setLocation();
}

function missionNow() {
    now = new Date().getTime();
    // console.log(now);
    missionSetTime();
}

function missionTLI() {
    now = timeTransLunarInjection;
    missionSetTime();
}

function missionLunar() {
    now = timeLunarOrbitInsertion;
    missionSetTime();
}

function missionEnd() {
    now = endTime;
    missionSetTime();
}

function faster() {
    if (ticksPerAnimationStep > 1) {
        ticksPerAnimationStep /= SPEED_CHANGE_FACTOR;
    } else {
        timelineIndexStep += 1;
        if (timelineIndexStep > 12) timelineIndexStep = 12;
    }
    // console.log("ticksPerAnimationStep = " + ticksPerAnimationStep + ", timelineIndexStep = " + timelineIndexStep);
}

function slower() {
    if (timelineIndexStep > 1) {
        timelineIndexStep -= 1;
    } else {
        ticksPerAnimationStep *= SPEED_CHANGE_FACTOR;
        if (ticksPerAnimationStep >= 1000) ticksPerAnimationStep = 1000;
    }
    // console.log("ticksPerAnimationStep = " + ticksPerAnimationStep + ", timelineIndexStep = " + timelineIndexStep);
}

function zoomChangeTransform(t) {

    var cy2x = 0;
    var cy2y = 0;

    if (lockOnCY2) {
        cy2x = parseFloat(d3.select("#CY2").attr("cx"));
        cy2y = parseFloat(d3.select("#CY2").attr("cy"));
    }

    if (lockOnMoon) {
        cy2x = parseFloat(d3.select("#MOON").attr("cx"));
        cy2y = parseFloat(d3.select("#MOON").attr("cy"));
    }

    if (lockOnEarth) {
        cy2x = parseFloat(d3.select("#EARTH").attr("cx"));
        cy2y = parseFloat(d3.select("#EARTH").attr("cy"));
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
            + ", " + (offsetx+panx+cy2x-zoomFactor*(cy2x)-cy2x)
            + ", " + (offsety+pany+cy2y-zoomFactor*(cy2y)-cy2y)
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
    showGreenwichLongitude();
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

function toggleLockCY2() {
    previousLockOnCY2 = lockOnCY2;
    lockOnCY2 = !lockOnCY2;
    
    previousLockOnMoon = lockOnMoon;
    lockOnMoon = false;
    d3.select("#checkbox-lock-moon").property("checked", false);
    
    previousLockOnEarth = lockOnEarth;
    lockOnEarth = false;
    d3.select("#checkbox-lock-earth").property("checked", false);

    reset();
}

function toggleLockMoon() {
    previousLockOnMoon = lockOnMoon;
    lockOnMoon = !lockOnMoon;

    previousLockOnCY2 = lockOnCY2;
    lockOnCY2 = false;
    d3.select("#checkbox-lock-cy2").property("checked", false);

    previousLockOnEarth = lockOnEarth;
    lockOnEarth = false;
    d3.select("#checkbox-lock-earth").property("checked", false);

    reset();
}

function toggleLockEarth() {
    previousLockOnEarth = lockOnEarth;

    lockOnEarth = !lockOnEarth;
    previousLockOnCY2 = lockOnCY2;
    lockOnCY2 = false;
    d3.select("#checkbox-lock-cy2").property("checked", false);
    
    previousLockOnMoon = lockOnMoon;
    lockOnMoon = false;
    d3.select("#checkbox-lock-moon").property("checked", false);

    reset();
}

function togglePlane() {
    
    var val = $('input[name=plane]:checked').val();
    // console.log("togglePlane() called with value " + val);

    var camera = null;
    var cameraControls = null;

    if (currentDimension == "3D") {
        camera = animationScenes[config].camera;
        cameraControls = animationScenes[config].cameraControls;
        cameraControls.reset();
    }

    if (val == "XY") {
        plane = "XY";

        if (currentDimension == "2D") {
            xVariable = "x";
            yVariable = "y";
            zVariable = "z";
            vxVariable = "vx";
            vyVariable = "vy";
            vzVariable = "vz";            
        }

        if (currentDimension == "3D") {

            camera.position.x = 0;
            camera.position.y = 0;
            camera.position.z = defaultCameraDistance;
            camera.up.set(0, 1, 0); 

        }

    } else if (val == "YZ") {

        plane = "YZ";

        if (currentDimension == "2D") {
            xVariable = "y";
            yVariable = "z";
            zVariable = "x";
            vxVariable = "vy";
            vyVariable = "vz";
            vzVariable = "vx";            
        }

        if (currentDimension == "3D") {
            
            camera.position.x = defaultCameraDistance;
            camera.position.y = 0;
            camera.position.z = 0;
            camera.up.set(0, 0, 1);
        }

    } else if (val == "ZX") {

        plane = "ZX";

        if (currentDimension == "2D") {
            xVariable = "z";
            yVariable = "x";
            zVariable = "y";
            vxVariable = "vz";
            vyVariable = "vx";
            vzVariable = "vy";            
        }

        if (currentDimension == "3D") {

            camera.position.x = 0;
            camera.position.y = defaultCameraDistance;
            camera.position.z = 0;
            camera.up.set(1, 0, 0); 
            // TODO 
            // Workaround as per: https://github.com/mrdoob/three.js/issues/10161 
        }

    }

    if (currentDimension == "2D") {

        initSVG();
        loadOrbitDataIfNeededAndProcess(function() {
            handleDimensionSwitch(currentDimension);
            setLocation();    
        });
        

    } else if (currentDimension == "3D") {

        handleDimensionSwitch(currentDimension);
        setLocation();
        render();
    }
}

function burnButtonHandler(index) {
    // console.log("burnButtonHandler() called for event index: " + index);
    now = eventTimes[index];
    missionSetTime();
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
