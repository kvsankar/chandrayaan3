
// Copyright (c) 2013-2024 Sankaranarayanan Viswanathan. All rights reserved.

import { lunar_pole } from "./astro.js";
import { deg_to_rad } from "./astro.js";

import * as THREE from 'three';
import Swiper from 'swiper';
import { TrackballControls } from './third-party/TrackballControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// orbit and location related data

// constants

var CY3     = "CY3";
var VIKRAM  = "VIKRAM";
var LRO     = "LRO";
var SUN     = "SUN";
var MERCURY = "MERCURY";
var VENUS   = "VENUS";
var EARTH   = "EARTH";
var MARS    = "MARS";
var MOON    = "MOON";
var CSS     = "CSS";

var ONE_SECOND_MS = 1000;
var ONE_MINUTE_MS = 60*1000;
var KM_PER_AU = 149597870.691;
var DEGREES_PER_RADIAN = 57.2957795;
var DEGREES_PER_CIRCLE = 360.0;
var MILLI_SECONDS_PER_MINUTE = 60000;
var MILLI_SECONDS_PER_HOUR = 3600000;
var GREENWICH_LONGITUDE = 0; // used to be that of Bangalore earlier: 77.5667;
var EARTH_MOON_DISTANCE_MEAN_AU = 0.00257;
var EARTH_RADIUS_KM = 6371;
var EARTH_RADIUS_MAX_KM = 6378.1;
var EARTH_RADIUS_MIN_KM = 6356.8;
var MOON_RADIUS_KM = 1737.4 + 0.52; // TODO jugaad to get Vikram land at 18:04 IST instead of 17:59 IST and keep landing altitude at 0.0 km
var MOON_SOI_RADIUS_KM = 66000;
var EARTH_AXIS_INCLINATION_DEGREES = 23.439279444;
var EARTH_AXIS_INCLINATION_RADS = EARTH_AXIS_INCLINATION_DEGREES * Math.PI / 180.0;

var STEP_DURATION_MS = 1 * MILLI_SECONDS_PER_MINUTE; // update this whenever Orbit JSON time resolution changes

var craftSize = 5; // in pixels

//
// Colors
//

var blackColor = 0x000000; // black
var earthAxisColor = 0xFFFF00; // yellow
var moonAxisColor = 0xFFFF00; // yellow
var moonSOIColor = 0x414141; // charcoal
var northPoleColor = 0xff6347; // tomato
var southPoleColor = 0x6a5acd; // steel blue
var eclipticPlaneColor = 0xFFFFE0; // light yellow
var equatorialPlaneColor = 0xABEBC6; // light green

var primaryLightColor = 0xFFFFFF; // white
var primaryLightIntensity = 2.5;
var ambientLightColor = 0x222222; // soft white
var ambientLightIntensity = 1.5;

var primaryLightColorForCraft = 0xFFFFFF; 
var primaryLightIntensityForCraft = 2.5;
var ambientLightColorForCraft = 0x777777;
var ambientLightIntensityForCraft = 1.5;

var planetProperties = {
    "CY3":      { "id": CY3,        "name": "CY3",              "color": "#ffa000",     "orbitcolor": "#66CCFF",    "stroke-width": 1.0, "r": 3.2, "labelOffsetX": -30, "labelOffsetY": -10 },
    "VIKRAM":   { "id": VIKRAM,     "name": "VIKRAM",           "color": "#ffe000",     "orbitcolor": "#FFFF00",    "stroke-width": 1.0, "r": 3.2, "labelOffsetX": +30, "labelOffsetY": +10 },    
    "LRO":      { "id": LRO,        "name": "LRO",              "color": "#00FF00",     "orbitcolor": "#00FF00",    "stroke-width": 1.0, "r": 3.2, "labelOffsetX": +30, "labelOffsetY": +10 },    
    "SUN":      { "id": SUN,        "name": "Sun",              "color": "yellow",      "orbitcolor": "yellow",     "stroke-width": 1.0, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MERCURY":  { "id": MERCURY,    "name": "Mercury",          "color": "green",       "orbitcolor": "green",      "stroke-width": 1.0, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "VENUS":    { "id": VENUS,      "name": "Venus",            "color": "grey",        "orbitcolor": "grey",       "stroke-width": 1.0, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "EARTH":    { "id": EARTH,      "name": "Earth",            "color": "blue",        "orbitcolor": "blue",       "stroke-width": 1.0, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MARS":     { "id": MARS,       "name": "Mars",             "color": "red",         "orbitcolor": "red",        "stroke-width": 0.3, "r": 5,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "MOON":     { "id": MOON,       "name": "Moon",             "color": "lightgrey",   "orbitcolor": "grey",       "stroke-width": 1.0, "r": 3,   "labelOffsetX": +10, "labelOffsetY": +10 },
    "CSS":      { "id": CSS,        "name": "Siding Spring",    "color": "cyan",        "orbitcolor": "cyan",       "stroke-width": 1.0, "r": 3,   "labelOffsetX": +10, "labelOffsetY": +10 },
};      
    
var CENTER_LABEL_OFFSET_X = -5;
var CENTER_LABEL_OFFSET_Y = -15;

var SPEED_CHANGE_FACTOR = 2;
var ZOOM_SCALE = 1.10;
var ZOOM_TIMEOUT = 200; // TODO Why did I end up calling this variable this way? 
var SVG_ORIGIN_X = 0; // TODO match with CSS value; find a better way
var SVG_ORIGIN_Y = 0; // TODO match with CSS value; find a better way
var FORMAT_PERCENT = d3.format(".0%");
var FORMAT_METRIC = d3.format(" >10,.2f");

//
// General state variables
//

var craftId = "CY3";
// var config = "geo";
var missionStartCalled = false;
var orbitDataLoaded = { "geo": false, "lunar": false, "lro": false };
var orbitDataProcessed = { "geo": false, "lunar": false, "lro": false };
var orbitData = {};
var landingDataLoaded = false;
var landingDataProcessed = false;
var landingData = {};
var nOrbitPoints = 0;
var nLandingPoints = 0;
var nOrbitPointsVikram = 0;
var nOrbitPointsLRO = 0;
var progress = 0;
var bannerShown = false;
var stopZoom = false;
var sunLongitude = 0.0;

// animation control
var mouseDown = false;

// locks on objects
var lockOnCY3 = false;
var previousLockOnCY3 = false;
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
var xFactor = 1;
var yFactor = 1;
var zFactor = 1;

//
// Orbit data related variables
//

// var planetsForOrbits;
// var planetsForLocations;
// var orbitsJson;
// var orbits = {};
var craftData = {};
var vikramData = {};

//
// Space related variables (as in Space Time)
//

var PIXELS_PER_AU;
var svgX = 0;
var svgY = 0;
var svgWidth = 0;
var svgHeight = 0;
var offsetx = 0;
var offsety = 0;
var trackWidth;
var earthRadius;
var skyRadius;
var moonRadius;
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
var defaultCameraDistance = 0;

//
// Time related variables
//

var animateLoopCount = 0;
var epochJD;
var epochDate;

var startTime;
var endTime;
var endTimeCY3;
var startTimeVikram;
var endTimeVikram;
var latestEndTime; 
var startLandingTime = Date.UTC(2023, 8-1, 23,  12, 13, 51, 0); // 12:13:51 UTC = 12:15:00 TDT
var endLandingTime =   Date.UTC(2023, 8-1, 23,  12, 38, 51, 0); // 25 minutes high resolution data

var timelineTotalSteps;
var stepsPerHop;
var stepDurationInMilliSeconds;
var orbitsJsonFileSizeInBytes;
var animDate;
var animTime;
// var timelineIndex = 0;
// var timelineIndexStep = 1;
var animTimeStepMinutes = 1;
var realtimespeed = false;
var prevFrameTime = null;
var curFrameTime = null;
var deltaFrameTime = ONE_MINUTE_MS;
var animationRunning = false;
var stopAnimationFlag = false;
var startLandingFlag = false;
var timeoutHandle;
var timeoutHandleZoom;
var dataLoaded = false;
var ticksPerAnimationStep;
var mousedownTimeout = ZOOM_TIMEOUT;

// Chandrayaan 3 specific times and information
var timeTransLunarInjection;
var timeLunarOrbitInsertion;
var eventInfos = [];

// 3D rendering related variables

var currentDimension = "3D"; 
var theSceneHandler = null;
export var animationScenes = {};
var joyRideFlag = false;
var landingFlag = false;
var moonPhaseCamera = false;

// View variables

var configGeo = $("#origin-earth").is(":checked"); 
var configLunar = $("#origin-moon").is(":checked"); 
var config = configGeo ? "geo" : (configLunar ? "lunar" : "undefined");

var viewOrbit = $("#view-orbit").is(":checked"); 
var viewOrbitDescent = $("#view-orbit-descent").is(":checked"); 
var viewOrbitVikram = $("#view-orbit-vikram").is(":checked"); 
var viewOrbitLRO = $("#view-orbit-lro").is(":checked"); 
var viewCraters = $("#view-craters").is(":checked"); 
var viewXYZAxes = $("#view-xyz-axes").is(":checked"); 
var viewPoles = $("#view-poles").is(":checked"); 
var viewPolarAxes = $("#view-polar-axes").is(":checked"); 
var viewSky = $("#view-sky").is(":checked"); 
var viewMoonSOI = $("#view-moonsoi").is(":checked");
var viewEclipticPlane = $("#view-eclipticplane").is(":checked");
var viewEquatorialPlane = $("#view-equatorialplane").is(":checked");

let wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let wait10 = () => wait(10);
let wait20 = () => wait(20);
let wait50 = () => wait(50);
async function sleep() { return new Promise(requestAnimationFrame); } // The Promise resolves after the next frame is painted

function fetchJson(url, callback = null, callbackError = null) {
    fetch(url, { headers: { 'accept': 'application/json; charset=utf8;' } }) 
      .then(r => { return r.json(); })  
      .then(r => {
        if (callback !== null) callback(r);
      })  
      .catch(err => {
        if (callbackError !== null) callbackError(err);
    }); 
};  

function getStartAndEndTimes(id) {

    // Note: we should keep end times 1 minute (current resolution) less than the last orbit data point time argument

    var startTime                  = Date.UTC(2023, 7-1, 14,  9, 21, 51, 0);
    var endTime                    = Date.UTC(2023, 9-1,  6, 12, 30, 51, 0);
    var endTimeCY3                 = Date.UTC(2023, 9-1,  6, 12, 30, 51, 0);
    var startTimeVikram            = Date.UTC(2023, 8-1,  2,  7, 46,  0, 0); // TODO Update
    var endTimeVikram              = Date.UTC(2023, 8-1,  6, 20, 26,  0, 0); // TODO Update

    if (config == "lro") { // TODO Not needed for CY3 mission (at least for now); Will disable in HTML

        startTime                   = Date.UTC(2023,  9-1,  1,  0,  0, 0, 0); // aligned with 5 minute intervals
        endTime                     = Date.UTC(2023, 11-1,  1,  0,  0, 0, 0); // aligned with 5 minute intervals
        startTimeVikram             = Date.UTC(2023,  9-1,  2,  7, 50, 0, 0); // aligned with 5 minute intervals
        endTimeVikram               = Date.UTC(2023,  9-1,  6, 20, 25, 0, 0); // aligned with 5 minute intervals
    }

    if (id === "CY3") {
        return [startTime, endTimeCY3];
    } else if (id === "VIKRAM") {
        return [startTimeVikram, endTimeVikram];
    } else {
        return [startTime, endTime];
    }
}

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

        computeSVGDimensions();
        var width = svgWidth;
        var height = svgHeight; // - $("#svg-top-baseline").position().top;

        // add renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        // this.renderer.domElement.style.display = "none";

        // document.body.appendChild(renderer.domElement);
        // console.log("Adding rendererer ...");
        this.canvasNode = d3.select("#canvas-wrapper")[0][0].appendChild(this.renderer.domElement); // TODO find a better D3 way to do this
        // this.canvasNode = d3.select("#canvas-wrapper").node().appendChild(this.renderer.domElement); // TODO find a better D3 way to do this

        window.addEventListener('resize', onWindowResize, {passive: false}); // TODO verify 

        $("#settings-panel-button").on("click", function() {
            $("#settings-panel").dialog({
                dialogClass: "dialog",
                modal: false,
                position: {
                    my: "left top",
                    at: "left bottom",
                    of: "#svg-top-baseline",
                    collision: "fit flip"},
                title: "Settings",
                closeOnEscape: false
                }).dialogExtend({
                    closable: true,
                    minimizable: false,
                    collapsable: false,
                    })/* .dialogExtend("collapse") */;
            $("#settings-panel")
                .closest('.ui-dialog')
                // .addClass("transparent-panel")
                .css({'background-image': 'none', 'border': '0', 'max-width': '80%', 'z-index': '9999'});

                });

        this.initialized = true;
    }

    render(animationScene) {

        // console.log("SceneHandler.render() called");

        if (animationScene.initialized3D) {

            if (moonPhaseCamera) {
                animationScene.camera.lookAt(animationScene.secondaryBody3D.position);            
            }
            
            if (lockOnEarth || lockOnMoon) {
            
                var x = animationScene.secondaryBody3D.position.x;
                var y = animationScene.secondaryBody3D.position.y;
                var z = animationScene.secondaryBody3D.position.z;
                animationScene.motherContainer.position.set(-x, -y, -z);
                // animationScene.camera.lookAt(animationScene.secondaryBody3D.position);

            } else if (lockOnCY3) {
                
                var x = animationScene.craft.position.x;
                var y = animationScene.craft.position.y;
                var z = animationScene.craft.position.z;
                animationScene.motherContainer.position.set(-x, -y, -z);
                // animationScene.camera.lookAt(animationScene.craft.position);                
            }                

            if (joyRideFlag || landingFlag) {

                var craftEarthDistance = animationScene.craft.position.distanceTo(animationScene.earthContainer.position);
                var craftMoonDistance = animationScene.craft.position.distanceTo(animationScene.moonContainer.position);
                var earthAngleRads = Math.asin(earthRadius / craftEarthDistance);
                var moonAngleRads = Math.asin(moonRadius / craftMoonDistance);
                // console.log("earthAngleRads = " + earthAngleRads + ", moonAngleRads = " + moonAngleRads);

                // console.log("craftEarthDistance = " + craftEarthDistance + ", craftMoonDistance = " + craftMoonDistance + ", moonRadius = " + moonRadius);

                var closerBody;
                var closerAngleRads;
                var radius;
                var distance;
                if (craftEarthDistance < craftMoonDistance) {

                    closerBody = animationScene.earthContainer;
                    closerAngleRads = earthAngleRads;
                    distance = craftEarthDistance;
                    radius = earthRadius;
                    animationScene.craftCamera.up.set(0, 0, 1);
                    animationScene.droneCamera.up.set(0, 1, 0);

                } else {

                    closerBody = animationScene.moonContainer;
                    closerAngleRads = moonAngleRads;
                    distance = craftMoonDistance;
                    radius = moonRadius;
                    animationScene.craftCamera.up.set(1, 0, 0);
                    animationScene.droneCamera.up.set(1, 0, 0);
                }
                
                // var v1 = new THREE.Vector3();
                // var v2 = new THREE.Vector3();

                // v1.subVectors(closerBody.position, animationScene.craft.position).normalize();
                // v2.subVectors(animationScene.curve[timelineIndex+1], animationScene.craft.position).normalize();
                // v2.add(v1);
                // v2.add(animationScene.craft.position);
                // var theta = Math.acos(radius/distance);

                animationScene.craftCamera.lookAt(closerBody.position); 
                animationScene.droneCamera.lookAt(animationScene.craft.position); 

                var specialCamera = joyRideFlag ? animationScene.craftCamera : animationScene.droneCamera;

                this.renderer.autoClear = true;
                specialCamera.layers.set(0);
                this.renderer.render(animationScene.scene, specialCamera);    

                this.renderer.autoClear = false;
                specialCamera.layers.set(1);
                this.renderer.render(animationScene.scene, specialCamera);    


            } else {
                this.renderer.autoClear = true;
                animationScene.camera.layers.set(0);
                this.renderer.render(animationScene.scene, animationScene.camera);    

                this.renderer.autoClear = false;
                animationScene.camera.layers.set(1);
                this.renderer.render(animationScene.scene, animationScene.camera);    

            }
        }
    }
}

function updateCraftScale() {
    if (animationScenes[config] && animationScenes[config].initialized3D) {

        // var origin = new THREE.Vector3(0, 0, 0);
        // var target = new THREE.Vector3();
        // var craftLocation = animationScenes[config].craft.getWorldPosition(target);
        // var distance = animationScenes[config].cameraControls.getWorldPos().distanceTo(craftLocation);
        // var scale =  distance / defaultCameraDistance;

        var craftLocation = new THREE.Vector3();
        animationScenes[config].craft.getWorldPosition(craftLocation);
        
        var cameraLocation = new THREE.Vector3();

        if (joyRideFlag) {
            animationScenes[config].camera.getWorldPosition(cameraLocation); // not craftCamera
        } else if (landingFlag) {
            animationScenes[config].droneCamera.getWorldPosition(cameraLocation);
        } else {
            animationScenes[config].camera.getWorldPosition(cameraLocation);
        }
        
        var distance = cameraLocation.distanceTo(craftLocation);
        var scale =  distance / defaultCameraDistance;
        if (landingFlag) { scale = scale * 5; }
        // console.log(`Setting scale to ${scale}`); // TODO seems to be buggy

        animationScenes[config].craft.scale.set(scale, scale, scale);
        animationScenes[config].drone.scale.set(scale, scale, scale);
        // animationScenes[config].vikramCraft.scale.set(scale, scale, scale); // we'll use the same scale for Vikram too
        
        // animationScenes[config].craft.scale.set(10, 10, 10);

        if (isLocationAvaialable("CY3", animTime)) {
            // console.log(`CY3 location avaialble: setting CY3 visibility to ${animationScenes[config].craftVisible}`);
            animationScenes[config].craft.visible = animationScenes[config].craftVisible;
            animationScenes[config].drone.visible = false;
        } else {
            // console.log(`CY3 location NOT avaialble: setting CY3 visibility to false`);
            animationScenes[config].craft.visible = false;
            animationScenes[config].drone.visible = false;
        }
        // if (isLocationAvaialable("VIKRAM", animTime)) {
            // console.log(`Vikram location avaialble: setting Vikram visibility to ${animationScenes[config].vikramCraftVisible}`);
            // animationScenes[config].vikramCraft.visible = animationScenes[config].vikramCraftVisible;
        // } else {
            // console.log(`Vikram location NOT avaialble: setting Vikram visibility to false`);
            // animationScenes[config].vikramCraft.visible = false;
        // }

        if (config == "lro") {
            animationScenes[config].lroCraft.scale.set(scale, scale, scale); // we'll use the same scale for LRO too
            if (isLocationAvaialable("LRO", animTime)) {
                animationScenes[config].lroCraft.visible = animationScenes[config].lroCraftVisible;
            } else {
                animationScenes[config].lroCraft.visible = false;
            }
        }
    }
}

function cameraControlsCallback() {
    // console.log("cameraControlsCallback() called");
    updateCraftScale();
}

// Based on https://stackoverflow.com/a/32038265
THREE.Object3D.prototype.rotateAroundWorldAxis = function() {

    // rotate object around axis in world space (the axis passes through point)
    // axis is assumed to be normalized
    // assumes object does not have a rotated parent

    var q = new THREE.Quaternion();

    return function rotateAroundWorldAxis( point, axis, angle ) {

        q.setFromAxisAngle( axis, angle );

        this.applyQuaternion( q );

        this.position.sub( point );
        this.position.applyQuaternion( q );
        this.position.add( point );

        return this;

    }

}();

class AnimationScene {
    
    static SCENE_STATE_START = 0;
    static SCENE_STATE_INIT_CONFIG_DONE = 1;
    static SCENE_STATE_INIT_DONE = 2;
    static SCENE_STATE_ADD_CURVE_DONE = 3;

    constructor(name) {

        // console.log("AnimationScene ctor called for " + name);

        this.name = name;

        this.orbits = {};

        this.initialized3D = false;

        this.earth = null;
        this.earthContainer = null;
        this.earthAxis = null;
        this.earthGlow = null;

        this.moon = null;
        this.moonAxisRotationAngle = 0;

        this.primaryBody3D = null;
        this.secondaryBody3D = null;
        this.craft = null;
        this.camera = null;
        this.cameraControlsEnabled = true;
        this.cameraControls = null;
        this.scene = null;
        this.renderer = null;
        this.curve = [];
        this.landingCurve = [];
        this.vikramCurve = [];
        this.lroCurve = [];
        this.curveVelocities = [];
        this.landingCurveVelocities = [];

        this.locations = [];

        this.stopCreationFlag = false;

        this.state = AnimationScene.SCENE_STATE_START;
    }


    stopCreation() {
        this.stopCreationFlag = true;
    }

    setCameraPosition(x, y, z) {
        // console.log(`Setting camera position to (${x}, ${y}, ${z}).`);

        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;

        this.skyContainer.position.setFromMatrixPosition(this.camera.matrixWorld);
        this.camera.updateProjectionMatrix();
        if (this.cameraControls) { this.cameraControls.update(); cameraControlsCallback(); }
    }

    init3d(callback) {
        if (this.initialized3D) {
            return;
        }

        var scene = this;

        const getTextures = ()=> new Promise((resolve, reject)=>{
          const loader = new THREE.TextureLoader();
          THREE.DefaultLoadingManager.onLoad = ()=>resolve(textures);
          const textures = [
            
            "images/earth/2_no_clouds_8k.jpg",
            "images/earth/earthspec1k.jpg",
            // "images/moon/lroc_color_poles_8k.png",
            "images/moon/Solarsystemscope_texture_8k_moon.jpg",
            "images/moon/ldem_16.png",
            "images/sky/starmap_4k.jpg",
            "images/sky/constellation_figures.jpg",

          ].map(filename=>loader.load(filename));
        });

        getTextures().then(async result=>{

            // console.log("Loaded textures: ", result);

            var mapIndex = 0;

            scene.earthTexture = result[mapIndex++];
            scene.earthTexture.minFilter = THREE.LinearFilter;

            scene.earthSpecularTexture = result[mapIndex++];
            scene.earthSpecularTexture.minFilter = THREE.LinearFilter;

            scene.moonMap = result[mapIndex++];
            scene.moonMap.minFilter = THREE.LinearFilter;

            scene.moonDisplacementMap = result[mapIndex++];
            scene.moonDisplacementMap.minFilter = THREE.LinearFilter;

            scene.skyTexture = result[mapIndex++];
            scene.skyTexture.minFilter = THREE.LinearFilter;
            // scene.skyTexture.flipY = false;

            scene.skyConstellationTexture = result[mapIndex++];
            scene.skyConstellationTexture.minFilter = THREE.LinearFilter;
            // scene.skyConstellationTexture.flipY = false;
            
            scene.init3dRest(); // We can't call callback until we are done
            callback();

        }, (error) => {
            console.log("Error: couldn't load textures: " + erorr);
        });

        // var loader = new THREE.TextureLoader();

        // // console.log("Loading texture ...");

        // loader.load(
        //     'images/2_no_clouds_8k.jpg',

        //     function(texture) {

        //         // console.log("Loaded texture.");
        //         scene.earthTexture = texture;
        //         await scene.init3dRest();
        //         callback();

        //     });

        /* DON'T PUT ANY CODE HERE */
    }

    computeDimensions() {
        computeSVGDimensions();
        this.width = svgWidth;
        this.height = svgHeight;
    }

    async addCurve() {

        var scene = this;

        // [0  .. 420) => [320 .. 420), [220 .. 320), [120 .. 220), [20 .. 120), [0, 20)

        scene.startingIndex = scene.leftOrbitPoints;
        // console.log("addCurve(): startingIndex = " + scene.startingIndex, ", nPoints = " + scene.leftOrbitPoints);

        do {
            var nPoints = Math.min(scene.leftOrbitPoints, scene.pointsPerSlice);
            if (nPoints <= 0) {
                break;
            } else {
                scene.startingIndex -= nPoints;
                scene.leftOrbitPoints -= nPoints;
            }

            var arr = scene.curve.slice(scene.startingIndex, scene.startingIndex + nPoints + 1); // +1 because we want the last point
            var curves = new THREE.CatmullRomCurve3(arr);
        
            var orbitGeometry = new THREE.BufferGeometry();
            const vertexVectors = curves.getSpacedPoints(nPoints * 40);
            const vertices = [];
            vertexVectors.forEach(function(elem) { vertices.push(elem.x, elem.y, elem.z); }); 
            orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            var orbitLine = new THREE.Line(orbitGeometry, scene.orbitMaterial);
            orbitLine.visible = viewOrbit;
            scene.orbitLines.push(orbitLine);
            scene.motherContainer.add(orbitLine);
            render();
            await wait10();
            if (this.stopCreationFlag) {
                // console.log("Stopping creation of " + scene.name + " scene");
                break;
            }
        } while (true);

        // console.log("addCurve() done for " + scene.name);
        this.state = AnimationScene.SCENE_STATE_ADD_CURVE_DONE;
        // timeoutHandler();
    }

    addSky() {
        // add Sky

        this.skyContainer = new THREE.Group();
        this.skyContainer.lookAt(0, Math.sin(EARTH_AXIS_INCLINATION_RADS), Math.cos(EARTH_AXIS_INCLINATION_RADS));

        // console.log("Creating Sky...");

        skyRadius = 200 * earthRadius;

        var skyGeometry = new THREE.SphereGeometry(skyRadius);

        var skyMaterial = new THREE.MeshBasicMaterial({ blending: THREE.AdditiveBlending, map: this.skyTexture, opacity: 0.4 });
        skyMaterial.side = THREE.BackSide;
        var skyConstellationMaterial = new THREE.MeshBasicMaterial({ blending: THREE.AdditiveBlending, map: this.skyConstellationTexture, opacity: 0.1 });
        skyConstellationMaterial.side = THREE.BackSide;

        this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.sky.receiveShadow = false;
        this.sky.castShadow = false;
        this.sky.rotateX(Math.PI/2); // this is to get the orientation of the texture correct
        this.skyContainer.add(this.sky);

        this.skyConstellation = new THREE.Mesh(skyGeometry, skyConstellationMaterial);
        this.skyConstellation.receiveShadow = false;
        this.skyConstellation.castShadow = false;
        this.skyConstellation.rotateX(Math.PI/2); // this is to get the orientation of the texture correct
        this.skyContainer.add(this.skyConstellation);

        this.skyContainer.scale.set(-1, 1, 1);
        this.skyContainer.rotateZ(Math.PI);

        // console.log("Created Sky");
        
        this.motherContainer.add(this.skyContainer);

        render();
    }

    disposeSky() {
        if (this.skyContainer) {
            // Dispose of sky geometry
            if (this.sky && this.sky.geometry) {
                this.sky.geometry.dispose();
            }
            
            // Dispose of sky material
            if (this.sky && this.sky.material) {
                this.sky.material.dispose();
            }
            
            // Dispose of sky constellation geometry
            if (this.skyConstellation && this.skyConstellation.geometry) {
                this.skyConstellation.geometry.dispose();
            }
            
            // Dispose of sky constellation material
            if (this.skyConstellation && this.skyConstellation.material) {
                this.skyConstellation.material.dispose();
            }
            
            // Remove sky and sky constellation from skyContainer
            if (this.sky) {
                this.skyContainer.remove(this.sky);
            }
            if (this.skyConstellation) {
                this.skyContainer.remove(this.skyConstellation);
            }
            
            // Remove skyContainer from motherContainer
            if (this.motherContainer) {
                this.motherContainer.remove(this.skyContainer);
            }
            
            // Nullify references
            this.sky = null;
            this.skyConstellation = null;
            this.skyContainer = null;
        }
        
        // Dispose of textures
        if (this.skyTexture) {
            this.skyTexture.dispose();
            this.skyTexture = null;
        }
        if (this.skyConstellationTexture) {
            this.skyConstellationTexture.dispose();
            this.skyConstellationTexture = null;
        }
    }
    
    addEarth() {
        // add Earth

        this.earthContainer = new THREE.Group();
        this.earthContainer.lookAt(0, Math.sin(EARTH_AXIS_INCLINATION_RADS), Math.cos(EARTH_AXIS_INCLINATION_RADS));

        // console.log("Creating Earth...");
        // var earthColor = planetProperties["EARTH"]["color"];
        var earthGeometry = new THREE.SphereGeometry(earthRadius, 100, 100);
        var earthMaterial = new THREE.MeshPhongMaterial({
            // color: primaryBodyColor, 
            // specular: blackColor,
            // shininess: 1,
            map: this.earthTexture,
            // bumpMap: this.earthBumpMapTexture,
            // bumpScale: 0.01,
            specularMap: this.earthSpecularTexture, // shininess on oceans
            specular: 0x101010,
            // side: THREE.DoubleSide
        });
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.receiveShadow = false;
        this.earth.castShadow = false;
        this.earth.rotateX(Math.PI/2); // this is to get the orientation of the texture correct
        this.earthContainer.add(this.earth);
        // console.log("Created Earth");

        // // add Earth glow

        // var earthGlowMaterial = THREEx.createAtmosphereMaterial();
        // earthGlowMaterial.uniforms.glowColor.value.set(0x00b3ff);
        // earthGlowMaterial.uniforms.coeficient.value = 0.8;
        // earthGlowMaterial.uniforms.power.value = 2.0;
        // this.earthGlow = new THREE.Mesh(earthGeometry, earthGlowMaterial);
        // this.earthGlow.scale.multiplyScalar(1.02);
        // this.earth.add(this.earthGlow);

        // add axes to Earth and Moon

        var earthPoleScale = 1.2;
        var earthNorthPolePoint = new THREE.Vector3(0, 0, +1 * earthRadius * earthPoleScale);
        var earthSouthPolePoint = new THREE.Vector3(0, 0, -1 * earthRadius * earthPoleScale);
        var earthAxisGeometry = new THREE.BufferGeometry();
        const vertices = [];
        vertices.push(earthNorthPolePoint.x, earthNorthPolePoint.y, earthNorthPolePoint.z);
        vertices.push(earthSouthPolePoint.x, earthSouthPolePoint.y, earthSouthPolePoint.z);
        earthAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        var earthAxisMaterial = new THREE.LineBasicMaterial({color: earthAxisColor});
        this.earthAxis = new THREE.Line(earthAxisGeometry, earthAxisMaterial);
        this.earthAxis.visible = viewPolarAxes;

        var earthNorthPoleGeometry = new THREE.SphereGeometry(earthRadius/50, 100, 100);
        var earthNorthPoleMaterial = new THREE.MeshPhysicalMaterial({color: blackColor, emissive: northPoleColor, reflectivity: 0.0});
        this.earthNorthPoleSphere = new THREE.Mesh(earthNorthPoleGeometry, earthNorthPoleMaterial);
        this.earthNorthPoleSphere.castShadow = false;
        this.earthNorthPoleSphere.receiveShadow = false;
        this.earthNorthPoleSphere.position.set(0, 0, 0.985 * earthRadius);

        var earthSouthPoleGeometry = new THREE.SphereGeometry(earthRadius/50, 100, 100);
        var earthSouthPoleMaterial = new THREE.MeshPhysicalMaterial({color: blackColor, emissive: southPoleColor, reflectivity: 0.0}); 
        this.earthSouthPoleSphere = new THREE.Mesh(earthSouthPoleGeometry, earthSouthPoleMaterial);
        this.earthSouthPoleSphere.castShadow = false;
        this.earthSouthPoleSphere.receiveShadow = false;
        this.earthSouthPoleSphere.position.set(0, 0, -0.985 * earthRadius);

        this.earthNorthPoleSphere.visible = viewPoles;
        this.earthSouthPoleSphere.visible = viewPoles;
        
        render();
    }
    
    disposeEarth() {
        if (this.earthContainer) {
            // Dispose of Earth geometry
            if (this.earth && this.earth.geometry) {
                this.earth.geometry.dispose();
            }
            
            // Dispose of Earth material
            if (this.earth && this.earth.material) {
                this.earth.material.dispose();
            }
            
            // Dispose of Earth axis geometry
            if (this.earthAxis && this.earthAxis.geometry) {
                this.earthAxis.geometry.dispose();
            }
            
            // Dispose of Earth axis material
            if (this.earthAxis && this.earthAxis.material) {
                this.earthAxis.material.dispose();
            }
            
            // Dispose of Earth North Pole geometry
            if (this.earthNorthPoleSphere && this.earthNorthPoleSphere.geometry) {
                this.earthNorthPoleSphere.geometry.dispose();
            }
            
            // Dispose of Earth North Pole material
            if (this.earthNorthPoleSphere && this.earthNorthPoleSphere.material) {
                this.earthNorthPoleSphere.material.dispose();
            }
            
            // Dispose of Earth South Pole geometry
            if (this.earthSouthPoleSphere && this.earthSouthPoleSphere.geometry) {
                this.earthSouthPoleSphere.geometry.dispose();
            }
            
            // Dispose of Earth South Pole material
            if (this.earthSouthPoleSphere && this.earthSouthPoleSphere.material) {
                this.earthSouthPoleSphere.material.dispose();
            }
            
            // Remove Earth and its components from earthContainer
            if (this.earth) {
                this.earthContainer.remove(this.earth);
            }
            if (this.earthAxis) {
                this.earthContainer.remove(this.earthAxis);
            }
            if (this.earthNorthPoleSphere) {
                this.earthContainer.remove(this.earthNorthPoleSphere);
            }
            if (this.earthSouthPoleSphere) {
                this.earthContainer.remove(this.earthSouthPoleSphere);
            }
            
            // Remove earthContainer from its parent (if it has one)
            if (this.earthContainer.parent) {
                this.earthContainer.parent.remove(this.earthContainer);
            }
            
            // Nullify references
            this.earth = null;
            this.earthAxis = null;
            this.earthNorthPoleSphere = null;
            this.earthSouthPoleSphere = null;
            this.earthContainer = null;
        }
        
        // Dispose of textures
        if (this.earthTexture) {
            this.earthTexture.dispose();
            this.earthTexture = null;
        }
        if (this.earthSpecularTexture) {
            this.earthSpecularTexture.dispose();
            this.earthSpecularTexture = null;
        }
    }

    addMoon() {
        // add Moon

        // var today = new Date();
        // var today = eventInfos[0]["startTime"];

        // var lp = lunar_pole(today);
        // var alpha = lp["alpha"];
        // var delta = lp["delta"];
        // var long = lp["long"];
        // var lat = lp["lat"];
        // var W = lp["W"];

        // console.log(`Lunar NP: (long, lat) = (${rad_to_deg(long)}, ${rad_to_deg(lat)}), W = ${rad_to_deg(W)}`);

        // var npx = moonRadius * Math.cos(lat) * Math.cos(long); 
        // var npy = moonRadius * Math.cos(lat) * Math.sin(long);
        // var npz = moonRadius * Math.sin(lat);

        // Stellarium rotation code for reference:
        // https://github.com/Stellarium/stellarium/blob/22218a4b3f9c17d10208278594ac9e83912c726c/src/core/modules/Planet.cpp
        // 
        // this.moonContainer.rotateZ(Math.PI / 2 + alpha);
        // this.moonContainer.rotateX(Math.PI / 2 - delta);
        // this.moonContainer.rotateX(-1 * EARTH_AXIS_INCLINATION_RADS);
        // OR
        // this.moonContainer.rotateZ(Math.PI / 2 + long);
        // this.moonContainer.rotateX(Math.PI / 2 - lat);
        // OR
        // this.moonContainer.rotation.z = Math.PI / 2 + long
        // this.moonContainer.rotation.x = Math.PI / 2 - lat;
        // OR
        // this.moonContainer.lookAt(npx, npy, npz);
        
        var moonColor = planetProperties["MOON"]["color"];
        var moonGeometry = new THREE.SphereGeometry(moonRadius, 100, 100);
        var moonMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            map: this.moonMap,
            displacementMap: this.moonDisplacementMap,
            displacementScale: 0.005,
            bumpMap: this.moonDisplacementMap,
            bumpScale: 0.002,
            reflectivity: 0.0,
            shininess: 0.0
        });
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
        this.moon.receiveShadow = true;
        this.moon.castShadow = true;
        this.moon.rotateX(Math.PI/2);

        this.moonContainer = new THREE.Group();
        this.moonContainer.add(this.moon);
        this.addMoonSOI();

        this.rotateMoon();

        var moonPoleScale = 1.5;
        var moonNorthPolePoint = new THREE.Vector3(0, 0, +1 * moonRadius * moonPoleScale);
        var moonSouthPolePoint = new THREE.Vector3(0, 0, -1 * moonRadius * moonPoleScale);
        this.moonAxisVector = moonNorthPolePoint.clone().normalize();
        var moonAxisGeometry = new THREE.BufferGeometry();
        const vertices = [];
        vertices.push(moonNorthPolePoint.x, moonNorthPolePoint.y, moonNorthPolePoint.z);
        vertices.push(moonSouthPolePoint.x, moonSouthPolePoint.y, moonSouthPolePoint.z);
        moonAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        var moonAxisMaterial = new THREE.LineBasicMaterial({color: moonAxisColor});
        this.moonAxis = new THREE.Line(moonAxisGeometry, moonAxisMaterial);
        this.moonAxis.visible = viewPolarAxes;

        var moonNorthPoleGeometry = new THREE.SphereGeometry(moonRadius/50, 100, 100);
        var moonNorthPoleMaterial = new THREE.MeshPhysicalMaterial({color: blackColor, emissive: northPoleColor, reflectivity: 0.0});
        this.moonNorthPoleSphere = new THREE.Mesh(moonNorthPoleGeometry, moonNorthPoleMaterial);
        this.moonNorthPoleSphere.castShadow = false;
        this.moonNorthPoleSphere.receiveShadow = false;
        this.moonNorthPoleSphere.position.set(0, 0, 0.985 * moonRadius);

        var moonSouthPoleGeometry = new THREE.SphereGeometry(moonRadius/50, 100, 100);
        var moonSouthPoleMaterial = new THREE.MeshPhysicalMaterial({color: blackColor, emissive: southPoleColor, reflectivity: 0.0});
        this.moonSouthPoleSphere = new THREE.Mesh(moonSouthPoleGeometry, moonSouthPoleMaterial);
        this.moonSouthPoleSphere.castShadow = false;
        this.moonSouthPoleSphere.receiveShadow = false;
        this.moonSouthPoleSphere.position.set(0, 0, -0.985 * moonRadius);

        this.moonNorthPoleSphere.visible = viewPoles;
        this.moonSouthPoleSphere.visible = viewPoles;

        render();
    }

    disposeMoon() {
        if (this.moonContainer) {
            // Dispose of moon geometry
            if (this.moon && this.moon.geometry) {
                this.moon.geometry.dispose();
            }
            
            // Dispose of moon material
            if (this.moon && this.moon.material) {
                this.moon.material.dispose();
            }
            
            // Dispose of moon SOI geometry and material
            if (this.moonSOISphere) {
                if (this.moonSOISphere.geometry) {
                    this.moonSOISphere.geometry.dispose();
                }
                if (this.moonSOISphere.material) {
                    this.moonSOISphere.material.dispose();
                }
            }
            
            // Dispose of moon axis geometry and material
            if (this.moonAxis) {
                if (this.moonAxis.geometry) {
                    this.moonAxis.geometry.dispose();
                }
                if (this.moonAxis.material) {
                    this.moonAxis.material.dispose();
                }
            }
            
            // Dispose of moon pole spheres
            if (this.moonNorthPoleSphere) {
                if (this.moonNorthPoleSphere.geometry) {
                    this.moonNorthPoleSphere.geometry.dispose();
                }
                if (this.moonNorthPoleSphere.material) {
                    this.moonNorthPoleSphere.material.dispose();
                }
            }
            if (this.moonSouthPoleSphere) {
                if (this.moonSouthPoleSphere.geometry) {
                    this.moonSouthPoleSphere.geometry.dispose();
                }
                if (this.moonSouthPoleSphere.material) {
                    this.moonSouthPoleSphere.material.dispose();
                }
            }
            
            // Remove moon and its components from the scene
            this.moonContainer.remove(this.moon);
            this.moonContainer.remove(this.moonSOISphere);
            this.moonContainer.remove(this.moonAxis);
            this.moonContainer.remove(this.moonNorthPoleSphere);
            this.moonContainer.remove(this.moonSouthPoleSphere);
            
            // Remove moonContainer from its parent (if any)
            if (this.moonContainer.parent) {
                this.moonContainer.parent.remove(this.moonContainer);
            }
            
            // Nullify references
            this.moon = null;
            this.moonSOISphere = null;
            this.moonAxis = null;
            this.moonNorthPoleSphere = null;
            this.moonSouthPoleSphere = null;
            this.moonContainer = null;
        }
        
        // Dispose of textures
        if (this.moonTexture) {
            this.moonTexture.dispose();
            this.moonTexture = null;
        }
        if (this.moonDisplacementMap) {
            this.moonDisplacementMap.dispose();
            this.moonDisplacementMap = null;
        }
    }
    
    addMoonSOI() {

        var radius = moonRadius * (MOON_SOI_RADIUS_KM / MOON_RADIUS_KM);
        var latSegments = 18;  // 10° increments
        var longSegments = 36; // 10° increments

        var geometry = new THREE.SphereGeometry(radius, longSegments, latSegments);
        var material = new THREE.MeshBasicMaterial({color: moonSOIColor, wireframe: true});

        this.moonSOISphere = new THREE.Mesh(geometry, material);
        this.moon.add(this.moonSOISphere);
        this.moonSOISphere.visible = viewMoonSOI;
    }

    disposeMoonSOI() {
        if (this.moonSOISphere) {
            this.moonSOISphere.geometry.dispose();
            this.moonSOISphere.material.dispose();
            this.moon.remove(this.moonSOISphere);
            this.moonSOISphere = null;
        }
    }

    addEarthLocations() {
        this.dwingeloo = this.plotEarthLocation(deg_to_rad(6.39616944444), deg_to_rad(52.8120194444), "#FF0000");
        this.chennai = this.plotEarthLocation(deg_to_rad(80.2707), deg_to_rad(13.0827), "#FF0000");

        this.locations.map(x => x.visible = viewCraters);
    }

    disposeEarthLocations() {
        if (this.locations) {
            this.locations.forEach(location => {
                if (location.geometry) {
                    location.geometry.dispose();
                }
                if (location.material) {
                    location.material.dispose();
                }
                this.earthContainer.remove(location);
            });
            this.locations = [];
        }

        // Specifically dispose of Dwingeloo and Chennai locations
        if (this.dwingeloo) {
            this.earthContainer.remove(this.dwingeloo);
            this.dwingeloo = null;
        }
        if (this.chennai) {
            this.earthContainer.remove(this.chennai);
            this.chennai = null;
        }
    }
    
    addMoonLocations() {
        // Moon selenographic origin (Prime Meridian = 0 degrees, Equator = 0 degrees) for reference
        // this.plotMoonLocation(deg_to_rad(0), deg_to_rad(0), "#FF00FF"); // TODO 2021 - for testing - (0deg longitude == Prime Meridian, 0deg latitude)

        // Some Moon locations for calibrsation
        //
        // Some of the values are from Wikipedia and some are from NASA:
        //
        // https://astrogeology.usgs.gov/search/map/Moon/Research/Craters/GoranSalamuniccar_MoonCraters
        //
        // this.plotMoonLocation(deg_to_rad(- 9.3),      deg_to_rad(+51.6), "#FF0000");      // Plato crater
        // this.plotMoonLocation(deg_to_rad(- 1.1),      deg_to_rad(+40.6), "#FF0000");      // Mons Piton
        // this.plotMoonLocation(deg_to_rad(+ 5.211),    deg_to_rad(+ 3.212), "#FF0000");    // Mosting A crater
        // this.plotMoonLocation(deg_to_rad(+22.1),      deg_to_rad(-70.1), "#FF0000");      // Manzinus C - https://en.wikipedia.org/wiki/Manzinus_(crater) 
        // this.plotMoonLocation(deg_to_rad(+21.753904), deg_to_rad(-69.996092), "#FF0000"); // Manzinus C - https://en.wikipedia.org/wiki/Manzinus_(crater) 
        // this.plotMoonLocation(deg_to_rad(+24.3),      deg_to_rad(-71.3), "#FF0000");      // Simpelius N - https://en.wikipedia.org/wiki/Simpelius_(crater) 
        // this.plotMoonLocation(deg_to_rad(24.103513),  deg_to_rad(-71.365233), "#FF0000"); // Simpelius N - https://en.wikipedia.org/wiki/Simpelius_(crater) 

        // Moon landing location according to orbit data available with JPL
        // this.plotMoonLocation(deg_to_rad(22.77050), deg_to_rad(-70.89754), "#BB3F3F"); // CY2
        this.plotMoonLocation(deg_to_rad(32.348126), deg_to_rad(-69.367621), "#FFFF00"); // CY3 primary site
        this.plotMoonLocation(deg_to_rad(32.318695), deg_to_rad(-69.374454), "#00FFFF"); // CY3 primary site
        this.plotMoonLocation(deg_to_rad(-17.33040), deg_to_rad(-69.497764), "#FFD700"); // CY3 secondary site


        // Primary landing site as per https://www.reddit.com/r/ISRO/comments/d1b64p/submitting_this_as_post_but_for_anyone_looking/
        //
        // this.plotMoonLocation(deg_to_rad(22.78110), deg_to_rad(-70.902670), "#0000FF"); // primary 
        // this.plotMoonLocation(deg_to_rad(18.46947), deg_to_rad(-68.749153), "#FFFF00"); // secondary
        // this.plotMoonLocation(deg_to_rad(22.78110), deg_to_rad(-70.899920), "#00FFFF"); // chosen one?

        this.locations.map(x => x.visible = viewCraters);
    }

    disposeMoonLocations() {
        if (this.locations) {
            this.locations.forEach(location => {
                if (location.geometry) {
                    location.geometry.dispose();
                }
                if (location.material) {
                    location.material.dispose();
                }
                this.moonContainer.remove(location);
            });
            this.locations = [];
        }
    }

    setPrimaryAndSecondaryBodies() {
        // set primary and secondary bodies
                
        if (config == "geo") {

            this.primaryBody3D = this.earthContainer;
            this.secondaryBody3D = this.moonContainer;

            this.earthContainer.add(this.earthAxis);
            this.earthContainer.add(this.earthNorthPoleSphere);
            this.earthContainer.add(this.earthSouthPoleSphere);

            this.moonContainer.add(this.moonAxis);
            this.moonContainer.add(this.moonNorthPoleSphere);
            this.moonContainer.add(this.moonSouthPoleSphere);
                
        
        } else if ((config == "lunar") || (config == "lro")) {
        
            this.primaryBody3D = this.moonContainer;
            this.secondaryBody3D = this.earthContainer;

            this.moonContainer.add(this.moonAxis);
            this.moonContainer.add(this.moonNorthPoleSphere);
            this.moonContainer.add(this.moonSouthPoleSphere);

            this.earthContainer.add(this.earthAxis);
            this.earthContainer.add(this.earthNorthPoleSphere);
            this.earthContainer.add(this.earthSouthPoleSphere);
        
        }

        this.motherContainer.add(this.primaryBody3D);
        if (this.name != "lro") {
            this.motherContainer.add(this.secondaryBody3D);    
        }    
    }

    addChandrayaanCurve() {
        // add Chandrayaan 3 orbiter orbit
        this.orbitLines = [];
        this.pointsPerSlice = 100;
        this.startingIndex = 0;
        this.leftOrbitPoints = nOrbitPoints;

        var craftOrbitColor = planetProperties[craftId]["orbitcolor"];
        this.orbitMaterial = new THREE.LineBasicMaterial({color: craftOrbitColor, linewidth: 0.2});

        this.addCurve(); // TODO should we prefix await here?


        if (config == "lunar") {
            // console.log("Adding landing curve ...");
            var landingCurves = new THREE.CatmullRomCurve3(this.landingCurve);
            var landingOrbitGeometry = new THREE.BufferGeometry();
            const vertexVectors = landingCurves.getSpacedPoints(nLandingPoints * 40);
            const vertices = [];
            vertexVectors.forEach(function(elem) { vertices.push(elem.x, elem.y, elem.z); }); 
            landingOrbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            var landingOrbitColor = planetProperties["VIKRAM"]["orbitcolor"];
            var landingOrbitMaterial = new THREE.LineBasicMaterial({color: landingOrbitColor, linewidth: 0.2});
            this.landingOrbitLine = new THREE.Line(landingOrbitGeometry, landingOrbitMaterial);
            this.landingOrbitLine.visible = viewOrbitDescent;
            this.motherContainer.add(this.landingOrbitLine);
            render();
            // console.log("Added landing curve.");
        }

        /*
        // add Chandrayaan 3 lander orbit
        var vikramCurves = new THREE.CatmullRomCurve3(this.vikramCurve);
        var vikramOrbitGeometry = new THREE.BufferGeometry();
        vikramOrbitGeometry.vertices = vikramCurves.getSpacedPoints(nOrbitPointsVikram * 40);
        var vikramOrbitColor = planetProperties["VIKRAM"]["orbitcolor"];
        var vikramOrbitMaterial = new THREE.LineBasicMaterial({color: vikramOrbitColor, linewidth: 0.2});
        this.vikramOrbitLine = new THREE.Line(vikramOrbitGeometry, vikramOrbitMaterial);
        this.motherContainer.add(this.vikramOrbitLine);
        */
    }

    disposeChandrayaanCurve() {
        // Dispose of orbit lines
        if (this.orbitLines) {
            this.orbitLines.forEach(line => {
                if (line.geometry) {
                    line.geometry.dispose();
                }
                if (line.material) {
                    line.material.dispose();
                }
                this.motherContainer.remove(line);
            });
            this.orbitLines = [];
        }

        // Dispose of orbit material
        if (this.orbitMaterial) {
            this.orbitMaterial.dispose();
            this.orbitMaterial = null;
        }

        // Dispose of landing orbit line
        if (this.landingOrbitLine) {
            if (this.landingOrbitLine.geometry) {
                this.landingOrbitLine.geometry.dispose();
            }
            if (this.landingOrbitLine.material) {
                this.landingOrbitLine.material.dispose();
            }
            this.motherContainer.remove(this.landingOrbitLine);
            this.landingOrbitLine = null;
        }

        // Clear curve data
        this.chandrayaanCurve = [];
        this.landingCurve = [];
        this.vikramCurve = [];

        // Reset orbit-related variables
        this.pointsPerSlice = 0;
        this.startingIndex = 0;
        this.leftOrbitPoints = 0;
    }

    addLROOrbit() {
        if (this.name == "lro") {
            // add LRO orbit
            var lroCurves = new THREE.CatmullRomCurve3(this.lroCurve);
            var lroOrbitGeometry = new THREE.BufferGeometry();
            lroOrbitGeometry.vertices = lroCurves.getSpacedPoints(nOrbitPointsLRO * 40);
            var lroOrbitColor = planetProperties["LRO"]["orbitcolor"];
            var lroOrbitMaterial = new THREE.LineBasicMaterial({color: lroOrbitColor, linewidth: 0.2});
            this.lroOrbitLine = new THREE.Line(lroOrbitGeometry, lroOrbitMaterial);
            this.motherContainer.add(this.lroOrbitLine);            
        }
    }

    disposeLROOrbit() {
        if (this.lroOrbitLine) {
            if (this.lroOrbitLine.geometry) {
                this.lroOrbitLine.geometry.dispose();
            }
            if (this.lroOrbitLine.material) {
                this.lroOrbitLine.material.dispose();
            }
            this.motherContainer.remove(this.lroOrbitLine);
            this.lroOrbitLine = null;
        }
        // Clear LRO curve data
        this.lroCurve = [];
    }

    addChandrayaan() {

        var craftColor = planetProperties["CY3"]["color"];
        var craftEdgeColor = 0xFF8000;
        // Based on https://stackoverflow.com/questions/49481332/how-to-create-3d-trapezoid-in-three-js 
        var craftGeometry = new THREE.CylinderGeometry(craftSize*0.8 / Math.sqrt(2), craftSize*1 / Math.sqrt(2), craftSize*0.8*1, 4, 1); 
        var craftMaterial = new THREE.MeshPhongMaterial({color: craftColor, transparent: false, opacity: 1.0});
        this.craftInner = new THREE.Mesh(craftGeometry, craftMaterial);
        var craftEdgesGeometry = new THREE.EdgesGeometry(craftGeometry);
        this.craftEdges = new THREE.LineSegments(craftEdgesGeometry, new THREE.LineBasicMaterial({color: craftEdgeColor}));
        this.craftInner.add(this.craftEdges);
        this.craftInner.rotateX(Math.PI/2); // this is to get the "top" of the craft pointing to Z
        this.craftInner.rotateY(Math.PI/4); // this is to get the orientation of the sides correct
        this.craftInner.layers.set(1);

        this.craft = new THREE.Group();
        this.craft.add(this.craftInner);
        this.craftAxesHelper = new THREE.AxesHelper(10);
        this.craftAxesHelper.position.copy(this.craftInner.position);
        this.craft.add(this.craftAxesHelper);
        this.craftAxesHelper.visible = false;
        this.craft.layers.set(1);
        this.craftVisible = true;
        this.craft.visible = this.craftVisible; 

        this.motherContainer.add(this.craft);

        var cubeGeometry = new THREE.BoxGeometry(craftSize, craftSize, craftSize);
        var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        this.drone = new THREE.Mesh(cubeGeometry, cubeMaterial);
        this.drone.layers.set(1);
        this.drone.visible = false;
        this.motherContainer.add(this.drone);

        /*
        // add Chandrayaan 3 lander Vikram

        var vikramCraftColor = planetProperties["VIKRAM"]["color"];
        var vikramCraftEdgeColor = 0xFF8000;
        // var vikramCraftGeometry = new THREE.BoxGeometry(5, 5, 5);
        // var vikramCraftMaterial = new THREE.MeshBasicMaterial({color: vikramCraftColor, transparent: false, opacity: 1.0});
        // this.vikramCraft = new THREE.Mesh(vikramCraftGeometry, vikramCraftMaterial);
        // var vikramCraftEdgesGeometry = new THREE.EdgesGeometry(vikramCraftGeometry);
        // this.vikramCraftEdges = new THREE.LineSegments(vikramCraftEdgesGeometry, new THREE.LineBasicMaterial({color: vikramCraftEdgeColor}));
        // this.vikramCraft.add(this.vikramCraftEdges);


        // https://stackoverflow.com/questions/49481332/how-to-create-3d-trapezoid-in-three-js
        var radiusTop = 5 * 0.8 / Math.sqrt(2);
        var radiusBottom = 5 * 1 / Math.sqrt(2);
        var cylinderHeight = 3 * 1;
        var radialSegments = 4;
        var heightSegments = 1;

        var vikramCraftGeometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, cylinderHeight, radialSegments, heightSegments); // size of top can be changed
        vikramCraftGeometry.rotateY(Math.PI / 4);
        vikramCraftGeometry.computeFlatVertexNormals();
        var vikramCraftMaterial = new THREE.MeshBasicMaterial({color: vikramCraftColor, transparent: false, opacity: 1.0});
        this.vikramCraft = new THREE.Mesh(vikramCraftGeometry, vikramCraftMaterial);
        var vikramCraftEdgesGeometry = new THREE.EdgesGeometry(vikramCraftGeometry);
        this.vikramCraftEdges = new THREE.LineSegments(vikramCraftEdgesGeometry, new THREE.LineBasicMaterial({color: vikramCraftEdgeColor}));
        this.vikramCraft.add(this.vikramCraftEdges);
        this.vikramCraftVisible = true;
        this.vikramCraft.visible = this.vikramCraftVisible; 

        this.motherContainer.add(this.vikramCraft);
        */
    }

    disposeChandrayaan() {
        if (this.craft) {
            // Dispose of craft geometry
            if (this.craft.geometry) {
                this.craft.geometry.dispose();
            }
            
            // Dispose of craft material
            if (this.craft.material) {
                this.craft.material.dispose();
            }
            
            // Dispose of craft axes helper
            if (this.craftAxesHelper) {
                this.craftAxesHelper.dispose();
            }
            
            // Remove craft from motherContainer
            this.motherContainer.remove(this.craft);
            
            // Nullify references
            this.craft = null;
            this.craftAxesHelper = null;
        }

        if (this.drone) {
            // Dispose of drone geometry
            if (this.drone.geometry) {
                this.drone.geometry.dispose();
            }
            
            // Dispose of drone material
            if (this.drone.material) {
                this.drone.material.dispose();
            }
            
            // Remove drone from motherContainer
            this.motherContainer.remove(this.drone);
            
            // Nullify reference
            this.drone = null;
        }
    }

    
    addLRO() {
        if (this.name == "lro") {
            // add LRO

            var lroCraftColor = planetProperties["LRO"]["color"];
            var lroCraftEdgeColor = 0x000000;
            var lroCraftGeometry = new THREE.BoxGeometry(5, 5, 5);
            var lroCraftMaterial = new THREE.MeshBasicMaterial({color: lroCraftColor, transparent: false, opacity: 1.0});
            this.lroCraft = new THREE.Mesh(lroCraftGeometry, lroCraftMaterial);
            var lroCraftEdgesGeometry = new THREE.EdgesGeometry(lroCraftGeometry);
            this.lroCraftEdges = new THREE.LineSegments(lroCraftEdgesGeometry, new THREE.LineBasicMaterial({color: lroCraftEdgeColor}));
            this.lroCraft.add(this.lroCraftEdges);
            this.motherContainer.add(this.lroCraft);
            this.lroCraftVisible = true;
            this.lroCraft.visible = this.lroCraftVisible;

            this.lroLineGeometry = new THREE.BufferGeometry();
            this.lroLineGeometry.vertices.push(this.moonContainer.position, this.lroCraft.position);
            var lroLineMaterial = new THREE.LineBasicMaterial({color: lroCraftColor});
            this.lroLine = new THREE.Line(this.lroLineGeometry, lroLineMaterial);        
            this.lroLine.frustumCulled = false;
            this.motherContainer.add(this.lroLine);            
        }
    }

    disposeLRO() {
        if (this.name == "lro") {
            // Dispose of LRO craft
            if (this.lroCraft) {
                // Dispose of LRO craft geometry
                if (this.lroCraft.geometry) {
                    this.lroCraft.geometry.dispose();
                }
                
                // Dispose of LRO craft material
                if (this.lroCraft.material) {
                    this.lroCraft.material.dispose();
                }
                
                // Dispose of LRO craft edges
                if (this.lroCraftEdges) {
                    if (this.lroCraftEdges.geometry) {
                        this.lroCraftEdges.geometry.dispose();
                    }
                    if (this.lroCraftEdges.material) {
                        this.lroCraftEdges.material.dispose();
                    }
                    this.lroCraft.remove(this.lroCraftEdges);
                    this.lroCraftEdges = null;
                }
                
                // Remove LRO craft from motherContainer
                this.motherContainer.remove(this.lroCraft);
                
                // Nullify reference
                this.lroCraft = null;
            }

            // Dispose of LRO line
            if (this.lroLine) {
                if (this.lroLine.geometry) {
                    this.lroLine.geometry.dispose();
                }
                if (this.lroLine.material) {
                    this.lroLine.material.dispose();
                }
                this.motherContainer.remove(this.lroLine);
                this.lroLine = null;
            }

            // Dispose of LRO line geometry
            if (this.lroLineGeometry) {
                this.lroLineGeometry.dispose();
                this.lroLineGeometry = null;
            }

            this.lroCraftVisible = false;
        }
    }
    
    addLineOfSight() {
        // this.losLineGeometry = new THREE.BufferGeometry();
        // this.losLineGeometry.vertices.push(this.dwingeloo.position, this.vikramCraft.position);
        // var losLineMaterial = new THREE.LineBasicMaterial({color: vikramCraftColor});
        // this.losLine = new THREE.Line(this.losLineGeometry, losLineMaterial);        
        // this.losLine.frustumCulled = false;
        // this.motherContainer.add(this.losLine);        
        // this.losLine.visible = false; // TODO add a control flag for this
    }

    disposeLineOfSight() {
        if (this.losLine) {
            if (this.losLine.geometry) {
                this.losLine.geometry.dispose();
            }
            if (this.losLine.material) {
                this.losLine.material.dispose();
            }
            this.motherContainer.remove(this.losLine);
            this.losLine = null;
        }

        if (this.losLineGeometry) {
            this.losLineGeometry.dispose();
            this.losLineGeometry = null;
        }
    }

    addAxesHelper() {
        // add axes helper
        this.axesHelper = new THREE.AxesHelper(2*PIXELS_PER_AU*EARTH_MOON_DISTANCE_MEAN_AU);
        this.motherContainer.add(this.axesHelper);
        this.axesHelper.visible = viewXYZAxes;

        const radius = earthRadius * 64;
        const sectors = 18;
        const rings = 6;
        const divisions = 64;

        this.eclipticPolarGridHelper = new THREE.PolarGridHelper(radius, sectors, rings, divisions, eclipticPlaneColor, eclipticPlaneColor);
        this.eclipticPolarGridHelper.rotation.x = Math.PI/2; 
        this.eclipticPolarGridHelper.visible = viewEclipticPlane;
        this.motherContainer.add(this.eclipticPolarGridHelper);
                
        const eclipticPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        this.eclipticPlaneHelper = new THREE.PlaneHelper(eclipticPlane, earthRadius * 128, eclipticPlaneColor);
        this.eclipticPlaneHelper.visible = viewEclipticPlane;
        this.motherContainer.add(this.eclipticPlaneHelper);

        this.equatorialPlaneContainer = new THREE.Group();
        this.equatorialPlaneContainer.lookAt(0, Math.sin(EARTH_AXIS_INCLINATION_RADS), Math.cos(EARTH_AXIS_INCLINATION_RADS));

        this.equatorialPolarGridHelper = new THREE.PolarGridHelper(radius, sectors, rings, divisions, equatorialPlaneColor, equatorialPlaneColor);
        this.equatorialPolarGridHelper.rotation.x = Math.PI/2;
        this.equatorialPolarGridHelper.visible = viewEquatorialPlane;
        this.equatorialPlaneContainer.add(this.equatorialPolarGridHelper);

        var direction = new THREE.Vector3();
        this.equatorialPlaneContainer.getWorldDirection(direction);
        const equatorialPlane = new THREE.Plane(direction, 0);        
        this.equatorialPlaneHelper = new THREE.PlaneHelper(equatorialPlane, earthRadius * 144, equatorialPlaneColor);
        this.equatorialPlaneHelper.visible = viewEquatorialPlane;
        this.equatorialPlaneContainer.add(this.equatorialPlaneHelper);

        this.motherContainer.add(this.equatorialPlaneContainer);
    }

    disposeAxesHelper() {
        if (this.axesHelper) {
            this.axesHelper.dispose();
            this.axesHelper = null;
        }

        if (this.eclipticPolarGridHelper) {
            this.eclipticPolarGridHelper.dispose();
            this.eclipticPolarGridHelper = null;    
        }

        if (this.eclipticPlaneHelper) {
            this.eclipticPlaneHelper.dispose();
            this.eclipticPlaneHelper = null;    
        }

        if (this.equatorialPlaneContainer) {    
            this.equatorialPlaneContainer.dispose();
            this.equatorialPlaneContainer = null;
        }

        if (this.equatorialPolarGridHelper) {
            this.equatorialPolarGridHelper.dispose();
            this.equatorialPolarGridHelper = null;    
        }       

        if (this.equatorialPlaneHelper) {
            this.equatorialPlaneHelper.dispose();
            this.equatorialPlaneHelper = null;    
        }
    }
    
    addLight() {
        // add light
        this.light = new THREE.DirectionalLight(primaryLightColor, primaryLightIntensity);
        this.motherContainer.add(this.light); // TODO attempt to fix lighting direction problem when piovoting on non-centered objects

        this.light2 = new THREE.DirectionalLight(primaryLightColorForCraft, primaryLightIntensityForCraft);
        this.light2.layers.set(1);
        this.motherContainer.add(this.light2);

        var ambientLight = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity); // soft white light
        this.motherContainer.add(ambientLight);

        var ambientLightForCraft = new THREE.AmbientLight(ambientLightColorForCraft, ambientLightIntensityForCraft); // soft white light
        ambientLightForCraft.layers.set(1);
        this.motherContainer.add(ambientLightForCraft);

        this.scene.add(this.motherContainer);
    }

    disposeLight() {
        if (this.light) {
            this.motherContainer.remove(this.light);
            this.light.dispose();
            this.light = null;
        }
        
        if (this.light2) {
            this.motherContainer.remove(this.light2);
            this.light2.dispose();
            this.light2 = null;
        }
        
        // Remove ambient lights
        this.motherContainer.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                this.motherContainer.remove(child);
                child.dispose();
            }
        });
        
        // If the motherContainer was added to the scene, remove it
        if (this.scene) {
            this.scene.remove(this.motherContainer);
        }
    }

    addCamera() {
        // add camera
        var angle = 50.0;
        this.camera = new THREE.PerspectiveCamera(angle, this.width/this.height, 0.0001, 100000);
        // console.log(`defaultCameraDistance=${defaultCameraDistance}`);
        this.setCameraPosition(defaultCameraDistance, defaultCameraDistance, defaultCameraDistance);
        this.camera.up.set(0, 0, 1);

        this.craftCamera = new THREE.PerspectiveCamera(50, this.width/this.height, 0.0001, 100000);
        this.craft.add(this.craftCamera);
        this.craftCamera.up.set(0, 0, 1);

        this.droneCamera = new THREE.PerspectiveCamera(100, this.width/this.height, 0.0001, 100000);
        this.drone.add(this.droneCamera);

        // add camera controls
        if (this.cameraControlsEnabled) {
            this.cameraControls = new TrackballControls(this.camera, theSceneHandler.renderer.domElement, cameraControlsCallback);

            // TrackballControls settings
            this.cameraControls.rotateSpeed = 1.0;
            this.cameraControls.zoomSpeed = 1.0;
            this.cameraControls.panSpeed = 1.0;
            this.cameraControls.noZoom = false;
            this.cameraControls.noPan = false;
            this.cameraControls.staticMoving = true;
            this.cameraControls.dynamicDampingFactor = 0.3;
            this.cameraControls.keys = [65, 83, 68];
            this.cameraControls.addEventListener('change', render, {passive: true}); // TODO Verify   
        }

        this.setCameraParameters();
    }

    disposeCamera() {
        if (this.camera) {
            // Dispose of camera
            this.camera.remove(this.camera.children);
            this.camera = null;
        }

        if (this.craftCamera) {
            // Dispose of craft camera
            this.craftCamera.remove(this.craftCamera.children);
            this.craft.remove(this.craftCamera);
            this.craftCamera = null;
        }

        if (this.droneCamera) {
            // Dispose of drone camera
            this.droneCamera.remove(this.droneCamera.children);
            this.drone.remove(this.droneCamera);
            this.droneCamera = null;
        }

        if (this.cameraControls) {
            // Dispose of camera controls
            this.cameraControls.dispose();
            this.cameraControls = null;
        }
    }

    async addChandrayaanModel() {
        const loader = new GLTFLoader();
        var animationScene = this;
        var done = false;

        loader.load('third-party/models/cy3-small.glb', function (gltf) {

            // console.log("Loaded GLB.");

            animationScene.craft = new THREE.Group();

            animationScene.craftInner = gltf.scene;
            animationScene.craftInner.rotateX(Math.PI/2); // this is to get the "top" of the craft pointing to Z

            var bbox = new THREE.Box3().setFromObject(animationScene.craftInner);
            var bbox_xw = (bbox.max.x - bbox.min.x);
            var bbox_yw = (bbox.max.y - bbox.min.y);
            var bbox_zw = (bbox.max.z - bbox.min.z);
            var bbox_max_side = Math.max(bbox_xw, bbox_yw, bbox_zw);

            // var sphereGeometry = new THREE.SphereGeometry(bbox_max_side*0.5);
            // var sphereMaterial = new THREE.MeshStandardMaterial({metalness: 1.0, roughness: 0.0});
            // var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            // sphere.layers.set(1);
            // animationScene.craft.add(sphere);

            // console.log("model (xw, yw, zw) = " +  bbox_xw + ", " +  bbox_yw + ", " + bbox_zw);

            function setLayer(object, layer) {
                object.layers.set(layer);
                object.children.forEach(child => setLayer(child, layer));
            }
            setLayer(animationScene.craftInner, 1);

            animationScene.craft.add(animationScene.craftInner);
            animationScene.craftAxesHelper = new THREE.AxesHelper(10);
            animationScene.craftAxesHelper.position.copy(animationScene.craftInner.position);
            animationScene.craft.add(animationScene.craftAxesHelper);
            animationScene.craftAxesHelper.visible = true;
            animationScene.craft.layers.set(1);
            animationScene.craftVisible = true;
            animationScene.craft.visible = animationScene.craftVisible; 

            // Using PointLight below as they are NOT directional.
            // DirectionalLight has to be targeted, and that target direction seems to be absolute and not relative to the parent.
            // See https://stackoverflow.com/questions/45039999/three-js-light-from-camera-straight-to-object 

            var intensity = 2;
            var light1 = new THREE.DirectionalLight(primaryLightColor, intensity);
            var light2 = new THREE.DirectionalLight(primaryLightColor, intensity);
            var light3 = new THREE.DirectionalLight(primaryLightColor, intensity);
            var light4 = new THREE.DirectionalLight(primaryLightColor, intensity);
            var light5 = new THREE.DirectionalLight(primaryLightColor, intensity);
            var light6 = new THREE.DirectionalLight(primaryLightColor, intensity);
            
            light1.layers.set(1);
            light2.layers.set(1);
            light3.layers.set(1);
            light4.layers.set(1);
            light5.layers.set(1);
            light6.layers.set(1);
            
            animationScene.craft.add(light1);
            animationScene.craft.add(light2);
            animationScene.craft.add(light3);
            animationScene.craft.add(light4);
            animationScene.craft.add(light5);
            animationScene.craft.add(light6);

            var scale = 0.6;
            light1.position.set(+1*scale*bbox_max_side, 0, 0);
            light2.position.set(0, +1*scale*bbox_max_side, 0);
            light3.position.set(0, 0, +1*scale*bbox_max_side);
            light4.position.set(-1*scale*bbox_max_side, 0, 0);
            light5.position.set(0, -1*scale*bbox_max_side, 0);
            light6.position.set(0, 0, -1*scale*bbox_max_side);

            animationScene.motherContainer.add(animationScene.craft);

            done = true;

        }, undefined, function (error) {
            console.error(error);        
        } );

        async function waitUntilDone() {
            // console.log("waitUntilDone(): done = " + done);
            while (!done) { 
                // console.log("Waiting in waitUntilDone() ..."); 
                await wait50(); 
            } 
        };

        await waitUntilDone();
    }

    disposeChandrayaanModel() {
        if (this.craft) {
            // Remove lights
            for (let i = this.craft.children.length - 1; i >= 0; i--) {
                const child = this.craft.children[i];
                if (child instanceof THREE.DirectionalLight) {
                    child.dispose();
                    this.craft.remove(child);
                }
            }

            // Dispose of geometry and material
            if (this.craft.geometry) {
                this.craft.geometry.dispose();
            }
            if (this.craft.material) {
                if (Array.isArray(this.craft.material)) {
                    this.craft.material.forEach(material => material.dispose());
                } else {
                    this.craft.material.dispose();
                }
            }

            // Remove from scene
            if (this.craft.parent) {
                this.craft.parent.remove(this.craft);
            }

            // Nullify reference
            this.craft = null;
        }

        if (this.craftAxesHelper) {
            this.craftAxesHelper.dispose();
            if (this.craftAxesHelper.parent) {
                this.craftAxesHelper.parent.remove(this.craftAxesHelper);
            }
            this.craftAxesHelper = null;
        }

        // Reset flags
        this.craftVisible = false;
    }
    
    init3dRest() {

        // console.log("init3dRest() called");

        this.scene = new THREE.Scene();
        this.motherContainer = new THREE.Group();

        this.computeDimensions(); render(); wait20().then();
        this.addLight(); render(); wait20().then();
        this.addSky(); render(); wait20().then();
        this.addMoon(); render(); wait20().then();
        this.addEarth(); render(); wait20().then();
        
        this.setPrimaryAndSecondaryBodies(); render(); wait20().then();
        this.addChandrayaan(); render(); wait20().then();
        // await this.addChandrayaanModel(); render(); wait20().then();
        this.addCamera(); render(); wait20().then();
        this.initialized3D = true; render(); wait20().then();

        this.addEarthLocations(); render(); wait20().then();
        this.addMoonLocations(); render(); wait20().then();   

        this.addChandrayaanCurve(); render(); wait20().then();
        this.addLROOrbit(); render(); wait20().then();
        this.addLRO(); render(); wait20().then();
        this.addLineOfSight(); render(); wait20().then();
        this.addAxesHelper(); render(); wait20().then();

        d3.select("#eventinfo").text("");
    }

    setCameraParameters() {
        // console.log("setCameraParameters() called");

        if (moonPhaseCamera) {
            this.camera.fov = 1.0;
            this.setCameraPosition(0, 0, 0);
            this.camera.up.set(0, 0, 1);
            this.craftVisible = false;
            // this.vikramCraftVisible = false;
            this.lroCraftVisible = false;
        } else {
            this.camera.fov = 50.0;
            if (config == "geo") {
                this.setCameraPosition(-1*defaultCameraDistance/6, -1*defaultCameraDistance/30, defaultCameraDistance/24);
                // this.motherContainer.position.set(-1*defaultCameraDistance/24, 0, 0);    
            } else {
                this.setCameraPosition(-defaultCameraDistance/96, -defaultCameraDistance/96, -defaultCameraDistance/96);    
            }
            this.camera.up.set(0, 0, 1);
            this.craftVisible = true;
            // this.vikramCraftVisible = true;
            this.lroCraftVisible = true;
        }

        this.camera.updateProjectionMatrix();
        this.cameraControls.update();
        cameraControlsCallback();
    }

    processOrbitVectorsData3D() {

        nOrbitPoints = 0;
        nOrbitPointsVikram = 0;
        nOrbitPointsLRO = 0;

        // console.log(planetsForLocations);
        
        for (var i = 0; i < animationScenes[config].planetsForLocations.length; ++i) {

            var planetKey = animationScenes[config].planetsForLocations[i];
            // console.log("planetKey = " + planetKey);
            
            var planetProps = planetProperties[planetKey];
            
            var planetId = planetProps.id;
            // console.log("planetId = " + planetId);
            
            var planet = animationScenes[config].orbits[planetId];

            var vectors = planet["vectors"];

            if (planetKey == "CY3") {

                for (var j = 0; j < vectors.length; ++j) {

                    var x = +1 * (vectors[j]["x"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var y = +1 * (vectors[j]["y"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var z = +1 * (vectors[j]["z"] / KM_PER_AU) * PIXELS_PER_AU;;


                    var vx = +1 * (vectors[j]["vx"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var vy = +1 * (vectors[j]["vy"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var vz = +1 * (vectors[j]["vz"] / KM_PER_AU) * PIXELS_PER_AU;;

                    var pos = new THREE.Vector3(x, y, z);
                    this.curve.push(pos);

                    var vel = new THREE.Vector3(vx, vy, vz);
                    this.curveVelocities.push(vel);

                    ++nOrbitPoints;
                }
            }

            if (planetKey == "VIKRAM") {

                for (var j = 0; j < vectors.length; ++j) {

                    // console.log("Reading VIKRAM position data at index " + j);

                    var x = +1 * (vectors[j]["x"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var y = +1 * (vectors[j]["y"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var z = +1 * (vectors[j]["z"] / KM_PER_AU) * PIXELS_PER_AU;;

                    var v3 = new THREE.Vector3(x, y, z);
                    this.vikramCurve.push(v3);
                    ++nOrbitPointsVikram;
                }
            }

            if (planetKey == "LRO") {

                for (var j = 0; j < vectors.length; ++j) {

                    // console.log("Reading VIKRAM position data at index " + j);

                    var x = +1 * (vectors[j]["x"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var y = +1 * (vectors[j]["y"] / KM_PER_AU) * PIXELS_PER_AU;;
                    var z = +1 * (vectors[j]["z"] / KM_PER_AU) * PIXELS_PER_AU;;

                    var v3 = new THREE.Vector3(x, y, z);
                    this.lroCurve.push(v3);
                    ++nOrbitPointsLRO;
                }
            }

        }

        // console.log("nOrbitPoints = " + nOrbitPoints);
    }

    processLandingVectors() {
        if (config != "lunar") return;

        nLandingPoints = 0;    
        var planet = landingData["CY3"];
        var vectors = planet["vectors"];

        for (var j = 0; j < vectors.length; ++j) {

            var x = +1 * (vectors[j]["x"] / KM_PER_AU) * PIXELS_PER_AU;;
            var y = +1 * (vectors[j]["y"] / KM_PER_AU) * PIXELS_PER_AU;;
            var z = +1 * (vectors[j]["z"] / KM_PER_AU) * PIXELS_PER_AU;;


            var vx = +1 * (vectors[j]["vx"] / KM_PER_AU) * PIXELS_PER_AU;;
            var vy = +1 * (vectors[j]["vy"] / KM_PER_AU) * PIXELS_PER_AU;;
            var vz = +1 * (vectors[j]["vz"] / KM_PER_AU) * PIXELS_PER_AU;;

            var pos = new THREE.Vector3(x, y, z);
            this.landingCurve.push(pos);

            var vel = new THREE.Vector3(vx, vy, vz);
            this.landingCurveVelocities.push(vel);

            ++nLandingPoints;
        }
    }

    toggleCameraPos(val) {
        // console.log("toggleCameraPos() called in mode " + this.name + " and target origin position " + val);

        if ((this.name == "geo") && (val == "EARTH")) { 
            // console.log("Setting camera position to Origin/Earth.");
            this.camera.position.set(0, 0, 0)
        };
        if ((this.name == "geo") && (val == "MOON")) { 
            // console.log("Setting camera position to Moon.");
            this.camera.position.set(this.secondaryBody3D.position);
        };
        if (((this.name == "lunar") || (this.name == "lro")) && (val == "EARTH")) { 
            // console.log("Setting camera position to Earth.");
            this.camera.position.set(this.secondaryBody3D.position);
        };
        if (((this.name == "lunar") || (this.name == "lro")) && (val == "MOON")) {
            // console.log("Setting camera position to Origin/Moon.");
            this.camera.position.set(0, 0, 0);
        };

        theSceneHandler.render(this);
    }

    toggleCameraLook(val) {
        // console.log("toggleCameraLook() called in mode " + this.name + " and target look position " + val);

        if (this.name == "geo") {

            if (val == "EARTH") { 
                // console.log("Setting camera look to Origin/Earth.");
                this.camera.lookAt(0, 0, 0);
                // this.camera.lookAt(this.secondaryBody3D.position);
            }
            if (val == "MOON") { 
                // console.log("Setting camera look to Moon.");
                this.camera.lookAt(this.secondaryBody3D.position);
            }
            if (val == "CY3") {
                // console.log("Setting camera look to the craft.");
                this.camera.lookAt(this.craft.position);	
            }
        }

        if ((this.name == "lunar") || (this.name == "lro")) {

            if (val == "EARTH") { 
                // console.log("Setting camera look to Earth.");
                this.camera.lookAt(this.secondaryBody3D.position);
            }
            if (val == "MOON") {
                // console.log("Setting camera look to Origin/Moon.");
                this.camera.lookAt(0, 0, 0);
            }
            if (val == "CY3") {
                // console.log("Setting camera look to the craft.");
                this.camera.lookAt(this.craft.position);
            }
        }
    }

    cameraDisntance(position) {
        return Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
    }   

    plotEarthLocation(long, lat, color) {
        var locationRadiusScale = 0.001;
        var geometry = new THREE.SphereGeometry(locationRadiusScale * earthRadius, 100, 100);
        var material = new THREE.MeshPhysicalMaterial({color: blackColor, emissive: color, reflectivity: 0.0, transparent: false, opacity: 0.2});
        var sphere = new THREE.Mesh(geometry, material);
        sphere.castShadow = false;
        sphere.receiveShadow = false;
        var radiusScale = 1 - (locationRadiusScale/2);
        var x = radiusScale * earthRadius * Math.cos(lat) * Math.cos(long); 
        var y = radiusScale * earthRadius * Math.cos(lat) * Math.sin(long);
        var z = radiusScale * earthRadius * Math.sin(lat);
        sphere.position.set(x, y, z);
        this.locations.push(sphere);
        this.earthContainer.add(sphere);
        return sphere;
    }

    plotMoonLocation(long, lat, color) {
        var locationRadiusScale = 0.005;
        var geometry = new THREE.SphereGeometry(locationRadiusScale * moonRadius, 100, 100);
        var material = new THREE.MeshStandardMaterial({color: color, emissive: color, transparent: false, opacity: 1.0});
        var sphere = new THREE.Mesh(geometry, material);
        sphere.castShadow = false;
        sphere.receiveShadow = false;
        var radiusScale = 1.005 - (locationRadiusScale/2);
        var x = radiusScale * moonRadius * Math.cos(lat) * Math.cos(long); 
        var y = radiusScale * moonRadius * Math.cos(lat) * Math.sin(long);
        var z = radiusScale * moonRadius * Math.sin(lat);
        sphere.position.set(x, y, z);
        this.locations.push(sphere);
        this.moonContainer.add(sphere);
        return sphere;
    }

    rotateMoon() {

        var today = new Date(animTime);
        var lp = lunar_pole(today);
        var alpha = lp["alpha"];
        var delta = lp["delta"];
        var W = lp["W"];
        
        this.moonContainer.rotation.set(0, 0, 0);
        this.moonContainer.rotateX(-1 * EARTH_AXIS_INCLINATION_RADS);
        this.moonContainer.rotateZ(+1 * (Math.PI / 2 + alpha));
        this.moonContainer.rotateX(+1 * (Math.PI / 2 - delta));
        this.moonContainer.rotateZ(+1 * W);

        // console.log(`rotateMoon: (long, lat) = (${rad_to_deg(long)}, ${rad_to_deg(lat)}), W = ${rad_to_deg(W)}`);
    }

    rotateEarth() {
        var mst = deg_to_rad(getMST(new Date(animTime), GREENWICH_LONGITUDE));
        this.earthContainer.rotation.z = mst;
        // this.losLine.geometry.verticesNeedUpdate = true;
    } 

    dispose() {
        this.disposeEarthLocations();
        this.disposeEarth();
        this.disposeSky();
        this.disposeMoonLocations();
        this.disposeMoon();
        this.disposeChandrayaanModel();
        this.disposeChandrayaanCurve();
        this.disposeLROOrbit();
        this.disposeMoonSOI();
    }
}

function render() {
    // console.log("render() global function called");  
    var animationScene = animationScenes[config];
    theSceneHandler.render(animationScene);
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
    handleModeSwitch3("Earth", "geo", ["lunar", "lro"]);
}

function handleModeSwitchToLunar() {
    handleModeSwitch3("Moon", "lunar", ["geo", "lro"]);
}

function handleModeSwitchToLRO() {
    handleModeSwitch3("Moon", "lro", ["geo", "lunar"]);
}

function handleModeSwitch(mode) {
    if (mode == "geo") {
        handleModeSwitchToGeo();
    } else if (mode == "lunar") {
        handleModeSwitchToLunar();
    } else if (mode == "lro") {
        handleModeSwitchToLRO();
    }
}

function handleDimensionSwitch(newDim) {

    var oldDim = (newDim === "3D") ? "2D" : "3D";

    // console.log("handleDimensionSwitch() called: oldDim = " + oldDim + "+ newDim = " + newDim);

    d3.selectAll(".dimension-" + newDim).style("visibility", "visible");
    d3.selectAll(".dimension-" + newDim).attr("display", "block");
    d3.selectAll(".dimension-" + oldDim).style("visibility", "hidden");
    d3.selectAll(".dimension-" + oldDim).attr("display", "none");

    // if (newDim == "3D") {
    //     $("#svg-wrapper").css("display", "none");
    //     theSceneHandler.renderer.domElement.style.display = "block";
    // } else {
    //     $("#svg-wrapper").css("display", "block");
    //     theSceneHandler.renderer.domElement.style.display = "none";
    // }
}

function addEvents() {

    var missionStartInfo = {
        "startTime": new Date(Date.UTC(2023, 7-1, 14,  9, 23, 0, 0)),
        "durationSeconds": 0,
        "label" : "🚀 Launch",
        "burnFlag": false,
        "infoText": "Launch:    14th Jul, 14:53 IST - Chandrayaan 3 placed in orbit",
        "body": "CY3"
    }

    /* TODO Need updates based on direct information from ISRO or reverse engineered information from orbit data. */

    var ebn1Info = {
        // TODO estimated from orbit data
        "startTime": new Date(Date.UTC(2023, 7-1, 15,  6, 41, 0, 0)),
        "durationSeconds": 5*60,
        "label": "🔥EBN#1",
        "burnFlag": true,
        "infoText": "EBN#1:     15th Jul, 11:11 IST - 173km x 41762km orbit",
        "body": "CY3"
    }

    var ebn2Info = {
        // TODO estimated from orbit data
        "startTime": new Date(Date.UTC(2023, 7-1, 17,  2, 15, 0, 0)),
        "durationSeconds": 15*60,
        "label": "🔥EBN#2", 
        "burnFlag": true,
        "infoText": "EBN#2:     17th Jul, 7:45 IST - 226km x 41603km orbit",
        "body": "CY3"        
    }

    var ebn3Info = {
        // TODO estimated from orbit data
        "startTime": new Date(Date.UTC(2023, 7-1, 18,  9, 24, 0, 0)),
        "durationSeconds": 15*60,
        "label": "🔥EBN#3", 
        "burnFlag": true,
        "infoText": "EBN#3:     18th Jul, 14:54 IST - 228km x 51400km orbit",
        "body": "CY3"        
    }

    var ebn4Info = {
        // TODO estimated from orbit data
        "startTime": new Date(Date.UTC(2023, 7-1, 20,  9, 16, 0, 0)),
        "durationSeconds": 20*60,
        "label": "🔥EBN#4", 
        "burnFlag": true,
        "infoText": "EBN#4:     12th Jul, 14:46 IST - 233km x 71351km orbit",
        "body": "CY3"    
    }

    var ebn5Info = {
        // TODO estimated from orbit data
        "startTime": new Date(Date.UTC(2023, 7-1, 25,  9,  0, 0, 0)),
        "durationSeconds": 5*60,
        "label": "🔥EBN#5", 
        "burnFlag": true,
        "infoText": "EBN#5:      25th Jul, 14:30 IST - 236km x 127603km orbit",
        "body": "CY3"        
    }

    var tliInfo = {
        // TODO estimated from orbit data
        "startTime": new Date(Date.UTC(2023, 7-1, 31, 18, 43, 0, 0)),
        "durationSeconds": 25*60,
        "label": "🔥TLI", 
        "burnFlag": true,
        "infoText": "TLI:         1st Aug, 00:13 IST - 288km x 369328km orbit",
        "body": "CY3"        
    }

    var loiInfo = {
        // https://www.isro.gov.in/update/20-aug-2019/chandrayaan-2-update-lunar-orbit-insertion 
        //                 || Actual: 0902 IST - 1738 seconds - achieved 114 km x 18072 km
        "startTime": new Date(Date.UTC(2023, 8-1, 5,  14, 0, 0, 0)),
        "durationSeconds": 0,
        "label": "🌖 LBN#1/LOI", 
        "burnFlag": true,
        "infoText": "LOI: 5th Aug, 19:30 IST - 164km x 18074km orbit",
        "body": "CY3"        
    }

    var lbn1Info = {
        // https://www.isro.gov.in/update/21-aug-2019/chandrayaan-2-update-second-lunar-orbit-maneuver
        // Aug 21, 2019 | 12:30 – 13:30 | 121 X 4303 || Actual: 1250 IST - 1228 seconds - achieved 118 km x 4412 km  
        "startTime": new Date(Date.UTC(2023, 8-1, 6, 17, 49, 0, 0)),
        "durationSeconds": 1228,
        "label": "LBN#1",
        "burnFlag": true,
        "infoText": "LBN#1:     6th Aug, 23:19 IST - 170km x 4313km orbit",
        "body": "CY3"        
    }

    var lbn2Info = {
        // Aug 28, 2019 | 05:30 – 06:30 | 178 X 1411 || Actual: 0904 IST - 1190 seconds - achieved 179 km x 1412 km    
        "startTime": new Date(Date.UTC(2023, 8-1, 9, 8, 21, 0, 0)),
        "durationSeconds": 1190,
        "label": "LBN#2", 
        "burnFlag": true,
        "infoText": "LBN#2:     9th Aug, 13:51 IST - 174km x 1437km orbit",
        "body": "CY3"        
    }

    var lbn3Info = {
        // Aug 30, 2019 | 18:00 – 19:00 || Actual: 1818 IST - 1155 seconds - 126 X 164 1818 hours        
        "startTime": new Date(Date.UTC(2023, 8-1, 14, 6, 38, 0, 0)),
        "durationSeconds": 1155,
        "label": "LBN#3",
        "burnFlag": true,
        "infoText": "LBN#3:    14th Aug, 12:08 IST - 150km x 177km orbit",
        "body": "CY3"        
    }    

    var lbn4Info = {
        // Sep 01, 2019 | 18:00 – 19:00 IST | 114 X 128 || Actual: 1821 IST - 52 seconds - achieved 119 km x 127 km
        "startTime": new Date(Date.UTC(2023, 8-1, 16,  3, 0, 0, 0)),
        "durationSeconds": 52,
        "label": "LBN#4", 
        "burnFlag": true,
        "infoText":  "LBN#4:   16th Aug, 8:30 IST - 153km x 163km orbit",
        "body": "CY3"        
    }

    var vikramSeparationInfo = {
        // https://www.isro.gov.in/update/02-sep-2019/chandrayaan-2-update-vikram-lander-successfully-separates-orbiter
        "startTime": new Date(Date.UTC(2019, 9-1,  2,   7, 45, 0, 0)), // 2nd Sep, 13:15 IST 
        "durationSeconds": 0,
        "label": "VS",
        "burnFlag": true,
        "infoText": "Vikram Separation: Vikram goes into a 119 km x 127 km orbit",
        "body": "CY3" // we have Vikram data only from 07:46 IST
    }

    var vikramDeboostOneInfo = {
        // https://www.isro.gov.in/update/03-sep-2019/chandrayaan-2-update-first-de-orbiting-maneuver
        "startTime": new Date(Date.UTC(2019, 9-1,  3,  3, 20, 0, 0)), // 3rd Sep, 08:50 IST
        "durationSeconds": 4,
        "label": "VD#1",
        "burnFlag": true,
        "infoText": "Vikram Deorbit #1 for 4 seconds on 3rd September, at 08:50 IST",
        "body": "VIKRAM"                
    }

    var vikramDeboostTwoInfo = {
        // https://www.isro.gov.in/update/04-sep-2019/chandrayaan-2-update-second-de-orbiting-maneuver
        "startTime": new Date(Date.UTC(2019, 9-1,  4, 22, 12, 0, 0)), // 4th Sep, 3:42 IST
        "durationSeconds": 9,
        "label": "VD#2",
        "burnFlag": true,
        "infoText": "Vikram Deorbit #2 for 9 seconds on 4th September, at 03:42 IST",
        "body": "VIKRAM"                
    }

    var nowInfo = {
        "startTime": new Date(),
        "durationSeconds": 0,
        "label": "⏰ Now",
        "burnFlag": false,
        "infoText": "Now",
        "body": ""  
    }

    var vikramLandingInfo = {
        "startTime": new Date(Date.UTC(2023, 8-1, 23, 12, 34, 0, 0)), // 23rd Aug, 18:04 IST
        "durationSeconds": 0,
        "label": "Vikram Landing",
        "burnFlag": true,
        "infoText": "Vikram Landing - 23rd August, 18:04 IST",
        "body": "VIKRAM"        
    }

    var cy3EndInfo = {
        "startTime": new Date(getStartAndEndTimes("CY3")[1]),
        "durationSeconds": 0,
        "label": "🏁CY3 Data End",
        "burnFlag": false,
        "infoText": "Chandrayaan 3 Data End",
        "body": ""
    }

    var lroStartInfo = {
        "startTime": new Date(Date.UTC(2019, 9-1, 1, 0, 0, 0, 0)),
        "durationSeconds": 0,
        "label": "LRO Data Start",
        "burnFlag": false,
        "infoText": "LRO Data Start",
        "body": ""
    }

    var lroEndInfo = {
        "startTime": new Date(Date.UTC(2019, 11-1, 1, 0, 0, 0, 0)),
        "durationSeconds": 0,
        "label": "LRO Data End",
        "burnFlag": false,
        "infoText": "LRO Data End",
        "body": ""
    }

    if ((config == "geo") || (config == "lunar")) {
        eventInfos = [
            missionStartInfo,
            ebn1Info,
            ebn2Info,
            ebn3Info,
            ebn4Info,
            ebn5Info,
            tliInfo,
            loiInfo,
            lbn1Info,
            lbn2Info,
            lbn3Info,
            lbn4Info,
            // vikramSeparationInfo,
            // vikramDeboostOneInfo,
            // vikramDeboostTwoInfo,
            vikramLandingInfo,
            nowInfo,
            cy3EndInfo
        ];        
    } else if (config == "lro") {
        eventInfos = [
            lroStartInfo,
            vikramSeparationInfo,
            vikramDeboostOneInfo,
            vikramDeboostTwoInfo,
            nowInfo,
            vikramLandingInfo,
            cy3EndInfo,
            lroEndInfo
        ];
    }

    eventInfos.sort(function(a, b) {
        return a.startTime - b.startTime;
    })
}

function initConfig() {

    // console.log("initConfig() called");

    if (animationScenes[config] && animationScenes[config].state >= AnimationScene.SCENE_STATE_INIT_CONFIG_DONE) {
        // console.log("initConfig() returning as already initialized");
        return;
    }

    addEvents();

    timeTransLunarInjection = Date.UTC(2023, 7-1, 31, 18, 43, 0, 0); // TODO Update for CY3
    /* The next maneuver is Trans Lunar Insertion (TLI), which is scheduled on August 14, 2019, between 0300 – 0400 hrs (IST).*/ 
    
    timeLunarOrbitInsertion = Date.UTC(2023, 8-1, 5,  13, 59, 0, 0); // TODO Update for CY3

    if (!theSceneHandler) {
        theSceneHandler = new SceneHandler();
    }    

    if (config == "geo") {

        if (!animationScenes[config]) {
            // console.log("Creating new AnimationScene for " + config);
            animationScenes[config] = new AnimationScene(config);    
        }

        computeSVGDimensions();
    
        PIXELS_PER_AU = Math.min(svgWidth, svgHeight) / (1.2 * (2 * EARTH_MOON_DISTANCE_MEAN_AU)); 
        // The smaller dimension of the screen should fit 120% of the whole Moon orbit around Earth

        defaultCameraDistance = 2 * EARTH_MOON_DISTANCE_MEAN_AU * PIXELS_PER_AU;

        trackWidth = 0.6;

        earthRadius = (EARTH_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;
        moonRadius = (MOON_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;
        
        animationScenes[config].primaryBody = "EARTH";
        animationScenes[config].primaryBodyRadius = earthRadius;

        animationScenes[config].secondaryBody = "MOON";
        animationScenes[config].secondaryBodyRadius = moonRadius;

        animationScenes[config].planetsForOrbits = ["MOON", "CY3"]; // TODO Add Vikram later
        animationScenes[config].planetsForLocations = ["MOON", "CY3"]; // TODO Add Vikram later
        animationScenes[config].stepDurationInMilliSeconds = STEP_DURATION_MS; // TODO add to and read from JSON
        animationScenes[config].orbitsJson = "geo-CY3.json";
        animationScenes[config].orbitsJsonFileSizeInBytes = 34793 * 1024; // TODO
        animationScenes[config].stepsPerHop = 4;

        startTime                  = getStartAndEndTimes("EARTH")[0];
        endTime                    = getStartAndEndTimes("EARTH")[1];
        endTimeCY3                 = getStartAndEndTimes("CY3")[1];
        startTimeVikram            = getStartAndEndTimes("VIKRAM")[0];
        endTimeVikram              = getStartAndEndTimes("VIKRAM")[1];

        latestEndTime = endTime;
        timelineTotalSteps = (latestEndTime - startTime) / stepDurationInMilliSeconds;
        ticksPerAnimationStep = 1;

        epochJD = "N/A";
        epochDate = "N/A";

        // timelineIndex = 0; // Don't reset in case we are switching between modes

        handleModeSwitchToGeo();

    } else if (config == "lunar") {

        if (!animationScenes[config]) {
            // console.log("Creating new AnimationScene for " + config);
            animationScenes[config] = new AnimationScene(config);    
        }

        computeSVGDimensions();
    
        PIXELS_PER_AU = Math.min(svgWidth, svgHeight) / (1.2 * (2 * EARTH_MOON_DISTANCE_MEAN_AU)); 
        // The smaller dimension of the screen should fit 120% of the whole Moon orbit around Earth
        
        defaultCameraDistance = 2 * EARTH_MOON_DISTANCE_MEAN_AU * PIXELS_PER_AU;

        trackWidth = 0.6;

        earthRadius = (EARTH_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;
        moonRadius = (MOON_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU * 0.997;        

        animationScenes[config].primaryBody = "MOON";
        animationScenes[config].primaryBodyRadius = moonRadius;

        animationScenes[config].secondaryBody = "EARTH";
        animationScenes[config].secondaryBodyRadius = earthRadius;

        animationScenes[config].planetsForOrbits = ["EARTH", "CY3"]; // TODO Vikram to be added later
        animationScenes[config].planetsForLocations = ["EARTH", "CY3"]; // TODO Vikram to be added later
        animationScenes[config].stepDurationInMilliSeconds = STEP_DURATION_MS; // TODO add to and read from JSON
        animationScenes[config].orbitsJson = "lunar-CY3.json";
        animationScenes[config].orbitsJsonFileSizeInBytes = 34800 * 1024; // TODO
        animationScenes[config].stepsPerHop = 4;

        startTime                  = getStartAndEndTimes("EARTH")[0];
        endTime                    = getStartAndEndTimes("EARTH")[1];
        endTimeCY3                 = getStartAndEndTimes("CY3")[1];
        // startTimeVikram            = getStartAndEndTimes("VIKRAM")[0];
        // endTimeVikram              = getStartAndEndTimes("VIKRAM")[1];

        latestEndTime = endTime;
        timelineTotalSteps = (latestEndTime - startTime) / stepDurationInMilliSeconds;
        ticksPerAnimationStep = 1;

        epochJD = "N/A";
        epochDate = "N/A";

        // timelineIndex = 0; // Don't reset in case we are switching between modes

        handleModeSwitchToLunar();

    } else if (config == "lro") {

        if (!animationScenes[config]) {
            animationScenes[config] = new AnimationScene(config);    
        }

        computeSVGDimensions();

        PIXELS_PER_AU = Math.min(svgWidth, svgHeight) / (1.5 * (2 * MOON_RADIUS_KM / KM_PER_AU)); 
        // The smaller dimension of the screen should fit 120% of the whole Moon orbit around Earth
        
        trackWidth = 0.6;

        earthRadius = (EARTH_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;
        moonRadius = (MOON_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;        

        defaultCameraDistance = 3 * moonRadius;

        animationScenes[config].primaryBody = "MOON";
        animationScenes[config].primaryBodyRadius = moonRadius;

        animationScenes[config].secondaryBody = "EARTH";
        animationScenes[config].secondaryBodyRadius = earthRadius;

        animationScenes[config].planetsForOrbits = ["CY3"]; // TODO Vikram and LRO to be added later 
        animationScenes[config].planetsForLocations = ["CY3"]; // TODO Vikram and LRO to be added later
        animationScenes[config].stepDurationInMilliSeconds = 5 * MILLI_SECONDS_PER_MINUTE; // TODO add to and read from JSON
        animationScenes[config].orbitsJson = "lunar-lro.json";
        animationScenes[config].orbitsJsonFileSizeInBytes = 29053 * 1024; // TODO
        animationScenes[config].stepsPerHop = 4;

        startTime                  = getStartAndEndTimes("LRO")[0];
        endTime                    = getStartAndEndTimes("LRO")[1];
        endTimeCY3                 = getStartAndEndTimes("CY3")[1];
        // startTimeVikram            = getStartAndEndTimes("VIKRAM")[0];
        // endTimeVikram              = getStartAndEndTimes("VIKRAM")[1];

        latestEndTime = endTime;
        timelineTotalSteps = (latestEndTime - startTime) / stepDurationInMilliSeconds;
        ticksPerAnimationStep = 1;

        epochJD = "N/A";
        epochDate = "N/A";

        // timelineIndex = 0; // Don't reset in case we are switching between modes

        handleModeSwitchToLRO();
    }

    // Add event buttons

    d3.select("#burnbuttons").html("");
    for (let i = 0; i < eventInfos.length; ++i) {

        // console.log("Adding button " + eventInfos[i]["label"]);

        d3.select("#burnbuttons")
            .append("div")
                .attr("class", "swiper-slide")
                .append("button")
                    .attr("id", "burn" + (i+1))
                    .attr("type", "button")
                    .attr("class", "button burnbutton")
                    .attr("title", eventInfos[i]["label"])
                    .html(eventInfos[i]["label"]);

        $("#burn" + (i+1)).on("click", function() { burnButtonHandler(i); });
    }

    var swiper1 = new Swiper('.swiper1', {
        direction: 'horizontal',
        loop: true,
        slidesPerView: 'auto',
      });

    var swiper2 = new Swiper('.swiper2', {
        direction: 'horizontal',
        loop: true,
        slidesPerView: 'auto',
      });


    // console.log("initConfig() done for " + config);
    animationScenes[config].state = AnimationScene.SCENE_STATE_INIT_CONFIG_DONE;
    // console.log("initConfig() returning");
}

function toggleMode() {

    var val = $('input[name=mode]:checked').val();
    // console.log("toggleMode() called with value " + val + ", currentDimension = " + currentDimension);


    if (config != val) {

        if (animationScenes[config]) {
            // console.log("animationScenes[config].state = " + animationScenes[config].state);
            if (animationScenes[config].state != AnimationScene.SCENE_STATE_ADD_CURVE_DONE) {
                animationScenes[config].stopCreation();
                // console.log("Disposing of AnimationScene for " + config + ", as it's not fully initialized.");
                animationScenes[config].dispose();
                delete animationScenes[config];
            } else {
                // console.log("Not disposing of AnimationScene for " + config + ", as it's fully initialized: state = " + animationScenes[config].state);
            }
        }

        config = val;
        // orbitDataProcessed[config] = false;
        initAnimation({'reset': false});
    }
}

function onWindowResize() {
    render(); // TODO is this the right thing to do here?
}

function setDimension() {
    var val = $('input[name=dimension]:checked').val();
    // console.log(`setDimension() called with value ${val}`);
    currentDimension = val;

    if (val == "3D") {

        if (!animationScenes[config].initialized3D) {

            // console.log("Initializing 3D for " + config);
            var msg = "Loading 3D data. This may take a while. Please wait ..."
            // d3.select("#eventinfo").text(msg);
            $("#progressbar").progressbar();
            $("#progressbar").progressbar("option", "value", false);
            $("#progressbar").show();
            d3.select("#progressbar-label").html(msg);

            animationScenes[config].processOrbitVectorsData3D();
            animationScenes[config].processLandingVectors();
            
            animationScenes[config].init3d(function() {

                // console.log("init3d() callback called");
                // d3.select("#eventinfo").text("");
                $("#progressbar").hide();
                handleDimensionSwitch(val);
                setLocation();
                if (startLandingFlag) { startLandingFlag = false; toggleLanding(); }
            });

        } else {

            handleDimensionSwitch(val);
            setLocation();
            if (startLandingFlag) { startLandingFlag = false; toggleLanding(); }
        }
    } else {

        handleDimensionSwitch(val);
        setLocation();
        if (startLandingFlag) { startLandingFlag = false; toggleLanding(); }
    }
}

function showPlanet(planet) {
    return true;
}

function shouldDrawOrbit(planet) {
    return ((planet == "MARS") ||
            (planet == "CY3") ||
            (planet == "VIKRAM") ||
            (planet == "MOON") ||
            (planet == "EARTH") || 
            (planet == "LRO") || 
            (((config == "lunar") || (config == "helio")) && (planet == "CSS")));
}

function planetStartTime(planet) {
    var times = getStartAndEndTimes(planet);
    return times[0];
}

function isLocationAvaialable(planet, date) {
    var flag = false;
    if (planet == "CY3") {
        flag = ((date >= startTime) && (date <= endTimeCY3));
    } else if (planet == "VIKRAM") {
        flag = ((date >= startTimeVikram) && (date <= endTimeVikram));
    } else {
        flag = ((date >= startTime) && (date <= endTime));
    }
    // var d = new Date(date);
    // console.log("isLocationAvaialable() called for body " + planet + " for time " + d + ": returning " + flag);
    return flag;
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
    var planet = animationScenes[config].orbits[planetId];
    var vectors = planet["vectors"];

    if (isLocationAvaialable(planetKey, animTime)) {

        // var index = timelineIndex - planetProperties[planetKey]["offset"];

        var [planet_pos, planet_vel] = getBodyLocation(planetKey, animTime);
        var x = xFactor * planet_pos[xVariable];
        var y = yFactor * planet_pos[yVariable];

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

function getBodyLocation(craftid, t) {
    // console.log("getBodyLocation(" + craftId + ", " + t + ")");
    
    if ((config == "lunar") && (craftid == "CY3") && (t >= startLandingTime) && (t < endLandingTime - ONE_SECOND_MS)) {

        var orbitDataResolutionInSeconds = 1;
        var num = t - startLandingTime;
        var denom = orbitDataResolutionInSeconds * ONE_SECOND_MS;
        var tlIndex1 = Math.floor(num / denom);
        var tlIndex2 = tlIndex1 + 1;
        var remainder = (num % denom) / ONE_SECOND_MS;
        // console.log("tlIndex1 = " + tlIndex1 + ", remainder = " + remainder);
    
        var vectors = landingData[planetProperties[craftid].id]["vectors"];
        var  x = (1 - remainder) * vectors[tlIndex1][ "x"] + remainder * (vectors[tlIndex2][ "x"]);
        var  y = (1 - remainder) * vectors[tlIndex1][ "y"] + remainder * (vectors[tlIndex2][ "y"]);
        var  z = (1 - remainder) * vectors[tlIndex1][ "z"] + remainder * (vectors[tlIndex2][ "z"]);
        var vx = (1 - remainder) * vectors[tlIndex1]["vx"] + remainder * (vectors[tlIndex2]["vx"]);
        var vy = (1 - remainder) * vectors[tlIndex1]["vy"] + remainder * (vectors[tlIndex2]["vy"]);
        var vz = (1 - remainder) * vectors[tlIndex1]["vz"] + remainder * (vectors[tlIndex2]["vz"]);

        // console.log("getBodyLocation(" + craftId + ", " + t + ") => x = " + x, ", y = " + y + ", z = " + z);
        return [new THREE.Vector3(x, y, z), new THREE.Vector3(vx, vy, vz)];
    } else {
        var orbitDataResolutionInMinutes = 1;
        var num = t - startTime;
        var denom = orbitDataResolutionInMinutes * ONE_MINUTE_MS;
        var tlIndex1 = Math.floor(num / denom);
        var tlIndex2 = tlIndex1 + 1;
        var remainder = (num % denom) / ONE_MINUTE_MS;
        // console.log("tlIndex1 = " + tlIndex1 + ", remainder = " + remainder);
        // console.log("tlIndex = " + tlIndex);
    
        var vectors = animationScenes[config].orbits[planetProperties[craftid].id]["vectors"];
        var  x = (1 - remainder) * vectors[tlIndex1][ "x"] + remainder * (vectors[tlIndex2][ "x"]);
        var  y = (1 - remainder) * vectors[tlIndex1][ "y"] + remainder * (vectors[tlIndex2][ "y"]);
        var  z = (1 - remainder) * vectors[tlIndex1][ "z"] + remainder * (vectors[tlIndex2][ "z"]);
        var vx = (1 - remainder) * vectors[tlIndex1]["vx"] + remainder * (vectors[tlIndex2]["vx"]);
        var vy = (1 - remainder) * vectors[tlIndex1]["vy"] + remainder * (vectors[tlIndex2]["vy"]);
        var vz = (1 - remainder) * vectors[tlIndex1]["vz"] + remainder * (vectors[tlIndex2]["vz"]);
    
        // console.log("getBodyLocation(" + craftId + ", " + t + ") => x = " + x, ", y = " + y + ", z = " + z);
        return [new THREE.Vector3(x, y, z), new THREE.Vector3(vx, vy, vz)];    
    }
}

function setLocation() {

    if (!orbitDataProcessed[config]) {
        return;
    }

    // console.log("setLocation(): timelineIndex = " + timelineIndex + ", timelineTotalSteps = " + timelineTotalSteps);

    // animTime = startTime + timelineIndex * stepDurationInMilliSeconds;
    var animTimeDate = new Date(animTime);
    // console.log("animTimeDate = " + animTimeDate);
    animDate.html(animTimeDate); // TODO add custom formatting 

    var ephemYear = animTimeDate.getUTCFullYear();
    var ephemMonth = animTimeDate.getUTCMonth() + 1;
    var ephemDay = animTimeDate.getUTCDate();
    var ephemHours = animTimeDate.getUTCHours();
    var ephemMinutes = animTimeDate.getUTCMinutes();
    var ephemSeconds = animTimeDate.getUTCSeconds();
    var ephemDate = {'year': ephemYear, 'month': ephemMonth, 'day': ephemDay, 'hours': ephemHours, 'minutes': ephemMinutes, 'seconds': ephemSeconds};
    // console.log(ephemDate);
    $const.tlong = 0.0; // longitude
    $const.glat = 0.0; // latitude
    $processor.init(); // TODO not sure whether this needs to be called every time or just once
    var ephemSun = $moshier.body.sun;
    $processor.calc(ephemDate, ephemSun);
    // console.log(ephemSun.position);
    sunLongitude = ephemSun.position.apparentLongitude * Math.PI / 180.0;
    // console.log("Sun longitude: " + sunLongitude * 180.0 / Math.PI);

    // var ephemMoon = $moshier.body.moon;
    // $processor.calc(ephemDate, ephemMoon);
    // console.log(ephemMoon.position);

    if (animationScenes[config] && animationScenes[config].initialized3D) {

        var animationScene = animationScenes[config];
        animationScene.light.position.set(Math.cos(sunLongitude), Math.sin(sunLongitude), 0).normalize();
        animationScene.light2.position.set(Math.cos(sunLongitude), Math.sin(sunLongitude), 0).normalize();
        animationScene.rotateEarth();
        animationScene.rotateMoon();

        if (animationScenes[config].cameraControlsEnabled) {
            animationScenes[config].skyContainer.position.setFromMatrixPosition(animationScenes[config].camera.matrixWorld);
            animationScenes[config].cameraControls.update();
            cameraControlsCallback();
        }    
    }
    
    // console.log("animTime = " + animTime);
    // console.log("helioCentricPhaseStartTime = " + helioCentricPhaseStartTime);
    // console.log("lunarPhaseStartTime = " + lunarPhaseStartTime);

    d3.select("#phase-1").html("Earth Bound Phase");
    d3.select("#phase-2").html("Lunar Bound Phase");
    d3.select("#phase-3").html("Lunar Orbit Phase");

    // TODO find a better way to do this
    if (animTime < timeTransLunarInjection) {
        d3.select("#phase-1").html("<b><u>Earth Bound Phase</u></b>");
    } else if (animTime < timeLunarOrbitInsertion) {
        d3.select("#phase-2").html("<b><u>Lunar Bound Phase</u></b>");
    } else {
        d3.select("#phase-3").html("<b><u>Lunar Orbit Phase</u></b>");
    }

    for (var i = 0; i < animationScenes[config].planetsForLocations.length; ++i) {


        var planetKey = animationScenes[config].planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        // console.log("planetId = ", planetId);
        // console.log("animationScenes[config].orbits = ", animationScenes[config].orbits);
        var planet = animationScenes[config].orbits[planetId];
        // console.log("planet = ", planet);
        var vectors = planet["vectors"];

        if (isLocationAvaialable(planetKey, animTime)) {

            // var index = timelineIndex - planetProperties[planetKey]["offset"];

            // console.log("About to access vectors[length: " + vectors.length + "] for " + planetKey + " using index: " + index);

            var [craft_pos, craft_vel] = getBodyLocation(planetKey, animTime);
            var [realx, realy, realz] = [craft_pos.x, craft_pos.y, craft_pos.z]; 
            // console.log("realx = " + realx + ", realy = " + realy + ", realz = " + realz);
            var [craft_pos_next, craft_vel_next] = getBodyLocation(planetKey, animTime+ONE_MINUTE_MS);
            var [realx_next, realy_next, realz_next] = [craft_pos_next.x, craft_pos_next.y, craft_pos_next.z]; 

            var realx_screen = +1 * (realx / KM_PER_AU) * PIXELS_PER_AU;
            var realy_screen = +1 * (realy / KM_PER_AU) * PIXELS_PER_AU; // note the sign; it's +1
            var realz_screen = +1 * (realz / KM_PER_AU) * PIXELS_PER_AU;

            var realx_screen_next = +1 * (realx_next / KM_PER_AU) * PIXELS_PER_AU;
            var realy_screen_next = +1 * (realy_next / KM_PER_AU) * PIXELS_PER_AU; // note the sign; it's +1
            var realz_screen_next = +1 * (realz_next / KM_PER_AU) * PIXELS_PER_AU;

            var [x, y, z] = [xFactor*craft_pos[xVariable], yFactor*craft_pos[yVariable], zFactor*craft_pos[zVariable]];
            var [vx, vy, vz] = [xFactor*craft_vel[xVariable], yFactor*craft_vel[yVariable], zFactor*craft_vel[zVariable]];

            var newx = +1 * (x / KM_PER_AU) * PIXELS_PER_AU;
            var newy = -1 * (y / KM_PER_AU) * PIXELS_PER_AU;
            var newz = +1 * (z / KM_PER_AU) * PIXELS_PER_AU;

            d3.select("#" + planetKey)
                .attr("visibility", showPlanet(planetKey) ? "visible" : "hidden")
                .attr("cx", newx)
                .attr("cy", newy);

            if (planetKey == animationScenes[config].secondaryBody) {
                if (animationScenes[config] && animationScenes[config].initialized3D) {
                    animationScenes[config].secondaryBody3D.position.set(realx_screen, realy_screen, realz_screen);
                }                
            } else if (planetKey == craftId) {
                if (animationScenes[config] && animationScenes[config].initialized3D) {
                    
                    animationScenes[config].craft.position.set(realx_screen, realy_screen, realz_screen);
                    
                    var droneScale = 1.05;
                    var [deltax, deltay, deltaz] = [realx_screen_next - realx_screen, realy_screen_next - realy_screen, realz_screen_next - realz_screen];
                    animationScenes[config].drone.position.set(
                        droneScale*(realx_screen-deltax), 
                        droneScale*(realy_screen-deltay), 
                        droneScale*(realz_screen-deltaz));
                    // console.log("drone position 1 = ", animationScenes[config].drone.position);

                    animationScenes[config].craft.lookAt(realx_screen_next, realy_screen_next, realz_screen_next);
                    animationScenes[config].drone.lookAt(realx_screen, realy_screen, realz_screen);
                    animationScenes[config].craft.up.set(0, 0, 1);
                    // animationScenes[config].drone.up.set(0, 0, 1);
                    updateCraftScale();
                }                                
            } else if (planetKey == "VIKRAM") {
                if (animationScenes[config] && animationScenes[config].initialized3D) {
                    animationScenes[config].vikramCraft.position.set(realx_screen, realy_screen, realz_screen);
                    // animationScenes[config].losLine.geometry.verticesNeedUpdate = true;
                    updateCraftScale();
                }
            } else if (planetKey == "LRO") {
                if (animationScenes[config] && animationScenes[config].initialized3D) {
                    animationScenes[config].lroCraft.position.set(realx_screen, realy_screen, realz_screen);
                    animationScenes[config].lroLine.geometry.verticesNeedUpdate = true;
                    updateCraftScale();
                }
            }

            if (planetKey == "CY3") {

                craftData["x"] = newx;
                craftData["y"] = newy;
                craftData["z"] = newz;
                
                var r = craft_pos.length();

                var pbr;
                if (config == "geo") {
                    pbr = EARTH_RADIUS_KM; 
                } else if ((config == "lunar") || (config == "lro")) {
                    pbr = MOON_RADIUS_KM;
                }

                var altitude = r - pbr;
                d3.select("#distance-" + planetKey + "-" + animationScenes[config].primaryBody).text(FORMAT_METRIC(r));
                d3.select("#altitude-" + planetKey + "-" + animationScenes[config].primaryBody).text(FORMAT_METRIC(altitude));

                var v = craft_vel.length();
                d3.select("#velocity-" + planetKey + "-" + animationScenes[config].primaryBody).text(FORMAT_METRIC(v));

                if (config == "geo") {
                    // relative to Moon

                    var [moon_pos, moon_vel] = getBodyLocation("MOON", animTime);
                    var dr = moon_pos.distanceTo(craft_pos);
                    var dv = moon_vel.distanceTo(craft_vel);

                    var altitudeMoon = dr - MOON_RADIUS_KM;
                    d3.select("#distance-" + planetKey +"-MOON").text(FORMAT_METRIC(dr));
                    d3.select("#altitude-" + planetKey +"-MOON").text(FORMAT_METRIC(altitudeMoon));
                    d3.select("#velocity-" + planetKey +"-MOON").text(FORMAT_METRIC(dv));
                }

                if ((config == "lunar") || (config == "lro")) {
                    // relative to Earth

                    var [earth_pos, earth_vel] = getBodyLocation("EARTH", animTime);
                    var dr = earth_pos.distanceTo(craft_pos);
                    var dv = earth_vel.distanceTo(craft_vel);

                    var altitudeEarth = dr - EARTH_RADIUS_KM;
                    d3.select("#distance-" + planetKey +"-EARTH").text(FORMAT_METRIC(dr));
                    d3.select("#altitude-" + planetKey +"-EARTH").text(FORMAT_METRIC(altitudeEarth));
                    d3.select("#velocity-" + planetKey +"-EARTH").text(FORMAT_METRIC(dv));
                }

                // show burn
                craftData["angle"] = Math.atan2(vy, vx) * 180.0 / Math.PI + 90;
                var transformString = "translate (" + newx + ", " + newy + ") ";
                transformString += "rotate(" + craftData["angle"] + " 0 0) ";
                transformString += "scale (" + 1/zoomFactor + " " + 1/zoomFactor + ") ";
                d3.select("#burng").attr("transform", transformString);
            }

            if (planetKey == "VIKRAM") {
                vikramData["x"] = newx;
                vikramData["y"] = newy;
                vikramData["z"] = newz;

        /*
                // show burn
                vikramData["angle"] = Math.atan2(vy, vx) * 180.0 / Math.PI + 90;
                var transformString = "translate (" + newx + ", " + newy + ") ";
                transformString += "rotate(" + vikramData["angle"] + " 0 0) ";
                transformString += "scale (" + 1/zoomFactor + " " + 1/zoomFactor + ") ";
                d3.select("#burng-vikram").attr("transform", transformString);
        */

            }

        } else {

            // if (animationScenes[config].initialized3D) {
            //     animationScenes[config].craft.visible = false;    
            //     animationScenes[config].vikramCraft.visible = false;
            // }            

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

    for (var i = 0; i < animationScenes[config].planetsForLocations.length; ++i) {

        var planetKey = animationScenes[config].planetsForLocations[i];
        setLabelLocation(planetKey);
    }

    zoomChangeTransform(0);
    showGreenwichLongitude();

    for (var i = 0; i < eventInfos.length; ++i) {
        // var burnTime = new Date(eventInfos[i]["startTime"].getTime() + (eventInfos[i]["durationSeconds"] * 1000 / 2));
        var burnTime = new Date(eventInfos[i]["startTime"].getTime());
        var burnFlag = eventInfos[i]["burnFlag"];
        if (!burnFlag) {
            continue;
        }
        var difftime = Math.abs(animTimeDate.getTime() - burnTime.getTime());
        if (difftime < 1 * 20 * 60 * 1000) {


            if (eventInfos[i]["body"] === "CY3") {
                d3.select("#burng").style("visibility", "visible");
                d3.select("#eventinfo").text(eventInfos[i]["infoText"]);
                break;                
            } else if (eventInfos[i]["body"] === "VIKRAM") {
                d3.select("#burng-vikram").style("visibility", "visible");
                d3.select("#eventinfo").text(eventInfos[i]["infoText"]);
                break;
            }
        } else {
            d3.select("#burng").style("visibility", "hidden");
            d3.select("#burng-vikram").style("visibility", "hidden");
            d3.select("#eventinfo").text("");
        }
    }

    render();
}

function showGreenwichLongitude() {
    if (config == "helio") return;

    var mst = getMST(new Date(animTime), GREENWICH_LONGITUDE);

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

    for (var i = 0; i < animationScenes[config].planetsForOrbits.length; ++i) {
        var planetKey = animationScenes[config].planetsForLocations[i];
        d3.selectAll("#orbit-" + planetKey).attr("r", (0.5/zoomFactor));
        var strokeWidth = planetProperties[planetKey]["stroke-width"];
        d3.selectAll("#ellipse-orbit-" + planetKey).attr("stroke-width", (strokeWidth/zoomFactor));
    }

    // d3.select("#" + primaryBody).attr("r", (primaryBodyRadius/zoomFactor));

    for (var i = 0; i < animationScenes[config].planetsForLocations.length; ++i) {

        var planetKey = animationScenes[config].planetsForLocations[i];
        setLabelLocation(planetKey);

        var planetProps = planetProperties[planetKey];
        
        if (planetKey == "MOON") {
            var moonRadius = (MOON_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;
            d3.selectAll("#" + planetKey).attr("r", Math.max(moonRadius, (planetProps.r/zoomFactor)));
        } else {
            d3.selectAll("#" + planetKey).attr("r", (planetProps.r/zoomFactor));
        }

        d3.select("#orbit-" + planetKey)
            .selectAll("path")
            .attr("style", "stroke: " + planetProps.orbitcolor + "; stroke-width: " + (1.0/zoomFactor) + "; fill: none");

        d3.select("#label-" + planetKey).attr("font-size", (10/zoomFactor));
    }

    d3.select("#Greenwich").attr("style", "stroke: LightBlue; stroke-opacity: 0.5; " + "stroke-width: " + (0.5/zoomFactor));
    
    var radialLength = (EARTH_RADIUS_KM / KM_PER_AU) * PIXELS_PER_AU;
    d3.select("#label-" + animationScenes[config].primaryBody).attr("x", (-1 * radialLength + CENTER_LABEL_OFFSET_X/zoomFactor));
    d3.select("#label-" + animationScenes[config].primaryBody).attr("y", (-1 * radialLength + CENTER_LABEL_OFFSET_Y/zoomFactor));
    
    d3.select("#label-" + animationScenes[config].primaryBody).attr("font-size", (10/zoomFactor));

    var transformString = "translate (" + craftData["x"] + ", " + craftData["y"] + ") ";
    transformString += "rotate(" + craftData["angle"] + " 0 0) ";
    var burnZoomFactor = Math.max(0.25, zoomFactor);
    // console.log("zoomFactor = " + zoomFactor);
    transformString += "scale (" + 1/burnZoomFactor + " " + 1/burnZoomFactor + ") ";
    d3.select("#burng").attr("transform", transformString);

    // if (isLocationAvaialable("VIKRAM", animTime)) {
    //     var transformStringVikram = "translate (" + vikramData["x"] + ", " + vikramData["y"] + ") ";
    //     transformStringVikram += "rotate(" + vikramData["angle"] + " 0 0) ";
    //     transformStringVikram += "scale (" + 1/burnZoomFactor + " " + 1/burnZoomFactor + ") ";
    //     d3.select("#burng-vikram").attr("transform", transformStringVikram);        
    // }
}

async function initAnimation(flags) {
    
    // try {
        initConfig();
        init(function() {});
    
        await (async function waitUntilOrbitDataProcessed() {
            if (!orbitDataProcessed[config]) {
                // console.log("Waiting for orbit data to be processed for " + config);
                setTimeout(waitUntilOrbitDataProcessed, 50);
            } else {
                // console.log("Orbit data already processed for " + config);
                if (flags.reset) { missionNow(); } else { setLocation(); };
                // realtime();
                setDimension();
                setView();
                updateCraftScale();
                // startLandingFlag = true;
                // cy3Animate();
            }
        })();    
    // } catch (error) {
    //     d3.select("#eventinfo").text("Failed to load the aninmation. Please restart the browser and try again.");
    //     console.log("Error: exception in initAnimation(): " + error);
    //     d3.selectAll("button").attr("disabled", true);
    //     return;
    // }

    render();
    requestAnimationFrame(animateLoop);
}

function animateLoop() {
       
    curFrameTime = (new Date()).getTime();

    if (prevFrameTime != null) {    
        deltaFrameTime = curFrameTime - prevFrameTime;
    }
    prevFrameTime = curFrameTime;
    
    ++animateLoopCount;
    if (animateLoopCount % ticksPerAnimationStep < 0.1) {
        
        animateLoopCount = 0;

        if (animationRunning) {
            if (realtimespeed) {
                animTime += deltaFrameTime;
            } else {
                animTime += animTimeStepMinutes * ONE_MINUTE_MS;
            }
            
            if (animTime > endTime - ONE_MINUTE_MS) {
                animTime = endTime - ONE_MINUTE_MS;
                stopAnimation();
            }
            setLocation();
        }
    }

    if (animationScenes[config] && animationScenes[config].initialized3D && animationScenes[config].cameraControlsEnabled) {
        animationScenes[config].skyContainer.position.setFromMatrixPosition(animationScenes[config].camera.matrixWorld);
        animationScenes[config].cameraControls.update();
        cameraControlsCallback();
    }

    requestAnimationFrame(animateLoop);
 
}

export function main() {
    const onloadStartTime = performance.now();

    $("#reset").on("click", reset);

    $("#origin-earth").on("click", toggleMode);
    $("#origin-moon").on("click", toggleMode);
    $("#camera-default").on("click", toggleCamera);
    $("#camera-moon").on("click", toggleCamera);
    $("#checkbox-lock-cy3").on("click", toggleLockCY3);
    $("#checkbox-lock-moon").on("click", toggleLockMoon);
    $("#checkbox-lock-earth").on("click", toggleLockEarth);

    $("#checkbox-lock-xy").on("click", togglePlane);
    $("#checkbox-lock-xz").on("click", togglePlane);
    $("#checkbox-lock-yz").on("click", togglePlane);

    $("#checkbox-lock-xy-minus").on("click", togglePlane);
    $("#checkbox-lock-xz-minus").on("click", togglePlane);
    $("#checkbox-lock-yz-minus").on("click", togglePlane);


    $("#view-orbit").on("click", setView);
    $("#view-orbit-descent").on("click", setView);
    $("#view-craters").on("click", setView);
    $("#view-xyz-axes").on("click", setView);
    $("#view-poles").on("click", setView);
    $("#view-polar-axes").on("click", setView);
    $("#view-sky").on("click", setView);
    $("#view-moonsoi").on("click", setView);
    $("#view-eclipticplane").on("click", setView);
    $("#view-equatorialplane").on("click", setView);

    $("#dimension-2D").on("click", setDimension);
    $("#dimension-3D").on("click", setDimension);

    $("#animate").on("click", cy3Animate);
    $("#joyride").on("click", toggleJoyRide);
    $("#joyridebutton").on("click", toggleJoyRide);
    $("#landing").on("click", toggleLanding);
    $("#landingbutton").on("click", toggleLanding);

    $("#info-button").on("click", toggleInfo);

    initAnimation({'reset': true}); // no need to await here - we are just kickstarting the setup 
    const onloadEndTime = performance.now() - onloadStartTime;
    // console.log("onload() took " + onloadEndTime + " ms");
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
function f12() { resetspeed();      timeoutHandleZoom = setTimeout(f12, mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f13() { faster();          timeoutHandleZoom = setTimeout(f13, mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}
function f14() { realtime();        timeoutHandleZoom = setTimeout(f14, mousedownTimeout); if (mousedownTimeout > 10) { mousedownTimeout -= 10; }}

function zoomFunction(f) {
    mouseDown = true;
    f();
    timeoutHandleZoom = setTimeout(f, ZOOM_TIMEOUT);
}

function init(callback) {
    if (animationScenes[config] && animationScenes[config].state >= AnimationScene.SCENE_STATE_INIT_DONE) {
        // console.log("init() returning as already initialized");
        return;
    }

    const fnStartTime = performance.now();
    // console.log("init() called");

    zoomFactor = 1;
    panx = 0;
    pany = 0;
    
    lockOnCY3 = false;
    lockOnMoon = false;
    lockOnEarth = false;
    
    d3.select("#checkbox-lock-cy3").property("checked", false);
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
        "resetspeed":   { "mousedown":  f12 },
        "faster":       { "mousedown":  f13 },
        "realtime":     { "mousedown":  f14 },
    };

    var buttons = [
        "zoomin", "zoomout",
        "panleft", "panright", "panup", "pandown",
        "forward", "fastforward", "backward", "fastbackward",
        "slower", "resetspeed", "faster", "realtime"
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

    sleep().then();

    // $("#settings-panel").dialog({
    //     dialogClass: "dialog desktoponly",
    //     modal: false,
    //     position: {
    //         my: "right top",
    //         at: "right top",
    //         of: "#blurb",
    //         collision: "fit flip"},
    //     title: "Settings",
    //     closeOnEscape: false
    // }).dialogExtend({
    //     closable: false,
    //     "dblclick" : "collapse",
    //     minimizable: false,
    //     minimizeLocation: 'right',
    //     collapsable: true,
    // })/* .dialogExtend("collapse") */;
    // $("#settings-panel")
    //     .closest('.ui-dialog')
    //     .addClass("transparent-panel")
    //     .css({'background': 'transparent', 'background-image': 'none', 'border': '0'});

    // $("#animation-control-panel").dialog({
    //     dialogClass: "dialog",
    //     modal: false,
    //     position: {
    //         my: "left top",
    //         at: "left bottom",
    //         of: "#settings-panel",
    //         collision: "fit flip"},
    //     width: "100%",
    //     maxWidth: "100%",
    //     /* height: '300', */
    //     resizable: false,
    //     // title: "Controls",
    //     closeOnEscape: false
    // }).dialogExtend({
    //     titlebar: 'none',
    //     closable: false,
    //     "dblclick" : "collapse",
    //     minimizable: false,
    //     minimizeLocation: 'right',
    //     collapsable: true,
    // });
    // $("#animation-control-panel")
    //     .closest('.ui-dialog')
    //     .addClass("transparent-panel")
    //     .css({'background': 'transparent', 'background-image': 'none', 'border': '0'});

    let isMobile = window.matchMedia("only screen and (max-width: 600px)").matches;

    if (!isMobile) {
        $("#zoom-panel").dialog({
            dialogClass: "dialog dimension-2D desktoponly",
            modal: false,
            position: {
                my: "left top",
                at: "left bottom",
                of: "#animation-control-panel",
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
            .addClass("desktoponly")
            .css({'background': 'transparent', 'background-image': 'none', 'border': '0', 'margin-top': '20px'});    
    }

    // $("#stats").dialog({
    //     dialogClass: "dialog notitledialog",
    //     modal: false,
    //     position: {
    //         my: "left bottom",
    //         at: "left bottom-50",
    //         of: window,
    //         collision: "fit flip"},
    //         title: "Information",
    //         minimizable: true,
    //         collapsable: true,
    //         closeOnEscape: false
    //     }).dialogExtend({
    //         closable: false,
    //         "dblclick" : "collapse",
    //         minimizable: true,
    //         minimizeLocation: 'right',
    //         collapsable: true,
    // });
    // $("#stats")
    //     .closest('.ui-dialog')
    //     .addClass("transparent-panel")
    //     .css({'background': 'transparent', 'background-image': 'none', 'border': '0'});

    animDate = d3.select("#date");

    sleep().then();
    initSVG();

    sleep().then();
    loadOrbitDataIfNeededAndProcess(callback);
    loadLandingDataAndProcess();

    const fnDuration = performance.now() - fnStartTime;
    animationScenes[config].state = AnimationScene.SCENE_STATE_INIT_DONE;
    // console.log("init() returning: took " + fnDuration + " ms");
}

function processOrbitData(data) {
    // console.log("processOrbitData() called");

    $("#progressbar").hide();
    d3.select("#progressbar-label").html("");
    animationScenes[config].orbits = data;
    if (config == "helio") processOrbitElementsData();
    processOrbitVectorsData().then();
    sleep().then();

    // TODO d3v7 handling
    // var zoom = d3.zoom().on("zoom", handleZoom).on("end", zoomEnd);

    // console.log("offsetx = " + offsetx + ", panx = " + panx + ", offsety = " + offsety + ", pany = " + pany);

    svgRect = d3.select("#svg")
        .append("rect")
            .attr("id", "svg-rect")
            .attr("point-events", "all")
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
                .on("zoom", handleZoom)
                .on("zoomend", zoomEnd));

    // TODO d3v7 way of zoom
    // svgRect = d3.select("#svg")
    //     .append("rect")
    //         .attr("id", "svg-rect")
    //         .attr("class", "overlay")
    //         .attr("x", 0)
    //         .attr("y", 0)
    //         .attr("width", svgWidth)
    //         .attr("height", svgHeight)
    //         .attr("style", "fill:none;stroke:black;stroke-width:0;fill-opacity:0;stroke-opacity:0")
    //         // .attr("class", "background");
    //         .zoom(zoom);
        
    // TODO handle error with d3v7        
    // d3.select("#svg-rect").call(zoom
    //     .translateBy(offsetx+panx, offsety+pany)
    //     .scaleBy(zoomFactor)
    //     );

    // svgRect = d3.select("#svg")
    //     .append("rect")
    //         .attr("id", "svg-rect")
    //         .attr("class", "overlay")
    //         .attr("x", 0)
    //         .attr("y", 0)
    //         .attr("width", svgWidth)
    //         .attr("height", svgHeight)
    //         .attr("style", "fill:none;stroke:black;stroke-width:0;fill-opacity:0;stroke-opacity:0")
    //         // .attr("class", "background")
    //         .call(zoom.transform,
    //             d3.zoomIdentity
    //             .translate([offsetx+panx, offsety+pany])
    //             .call(zoom.transform,
    //                 d3.zoomIdentity
    //             .scale(zoomFactor)
    //             .on("zoom", zoom)
    //             .on("zoomend", zoomEnd)));

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
        d3.select("#animate").text("Play");
    }

    zoomChangeTransform(0);

    orbitDataProcessed[config] = true;

    // console.log("processOrbitData() returning");
}

function loadLandingDataAndProcess() {
    if (!landingDataLoaded) {
        var landingDataJson = "landing-CY3.json";
        fetchJson(landingDataJson, async function(data) {

            // console.log("Landing orbit data load from " + landingDataJson + ": OK");
            landingDataLoaded = true;
            landingData = data;

        }, async function(error) {
            var msg = "Error: Orbit data load from " + orbitsJson + ": " + error;
            console.log(msg);
        });
    }
}

function loadOrbitDataIfNeededAndProcess(callback) {

    if (!orbitDataLoaded[config]) {

        // console.log("Loading orbit data for " + config);

        var msg = dataLoaded ? "" : ("Loading orbit data ... ");
        $("#progressbar").progressbar();
        $("#progressbar").progressbar("option", "value", false);
        $("#progressbar").show();
        d3.select("#progressbar-label").html(msg);
        sleep().then();

        fetchJson(animationScenes[config].orbitsJson, function(data) {

            // console.log("Orbit data load from " + animationScenes[config].orbitsJson + ": OK");
            dataLoaded = true;
            orbitDataLoaded[config] = true;
            orbitData[config] = data;
            try {
                $("#progressbar").hide();
                processOrbitData(data);
                sleep().then();
                // console.log("Calling callback() from loadOrbitDataIfNeededAndProcess() ...");
                callback();
                // console.log("Called callback() from loadOrbitDataIfNeededAndProcess() ...");
            } catch(error) {
                $("#progressbar").hide();
                console.log("Error: Orbit data load from " + animationScenes[config].orbitsJson + ": " + error);
            }                    

        }, function(error) {
            $("#progressbar").hide();
            var msg = "Error: Orbit data load from " + animationScenes[config].orbitsJson + ": " + error;
            console.log(msg);
            d3.select("#eventinfo").text(msg);
        });


            // d3.json(orbitsJson)
            // // .on("progress", function() {

            // //     var progress = d3.event.loaded / orbitsJsonFileSizeInBytes;
            // //     var msg = dataLoaded ? "" : ("Loading orbit data ... " + FORMAT_PERCENT(progress) + ".");
            // //     // console.log(msg);
            // //     $("#progressbar").progressbar({value: progress * 100});
            // //     $("#progressbar").show();
            // //     d3.select("#progressbar-label").html(msg);
            // // })
            // .then(function(data) {
            //     console.log("Orbit data load from " + orbitsJson + ": OK");
            //     dataLoaded = true;
            //     orbitDataLoaded[config] = true;
            //     orbitData[config] = data;
            //     processOrbitData(data);

            //     try {
            //         callback();
            //     } catch(error) {
            //         console.log("Error while processing read orbit data.");
            //     }                
            // })
            // .catch(function(error) {
            //     console.log("Orbit data load from " + orbitsJson + ": ERROR");
            //     console.log(error);
            //     $("#progressbar").hide();
            //     d3.select("#progressbar-label").html("Error: failed to load orbit data.");
            // });

            /* DON'T PUT ANY CODE HERE */        
    } else {
        // console.log("Orbit data already loaded for " + config);
        processOrbitData(orbitData[config]);
        sleep().then();
        callback();
    }
}

function computeSVGDimensions() {
    svgX = 0;
    svgY = $("#svg-top-baseline").position().top;
    svgWidth = window.innerWidth;
    svgHeight = window.innerHeight; // - (svgY + $("#footer-wrapper").outerHeight(true));
    offsetx = svgWidth * (1 / 2) - SVG_ORIGIN_X;
    offsety = svgHeight * (1 / 2) - SVG_ORIGIN_Y;

    // console.log("svgX = " + svgX + ", svgY = " + svgY + ", svgWidth = " + svgWidth + ", svgHeight = " + svgHeight + 
    //     ", offsetx = " + offsetx + ", offsety = " + offsety);
}

function initSVG() {
    d3.select("svg").remove();

    computeSVGDimensions();

    svgContainer = d3.select("#svg-wrapper")
        .attr("class", config + " dimension-2D")
        .append("svg")
            .attr("id", "svg")
            // .attr("x", svgX)
            // .attr("y", svgY)
            // .attr("width", svgWidth)
            // .attr("height", svgHeight)    
            .attr("overflow", "visible") // added for SVG elements to be visible in Chrome 36+; TODO side effects analysis
            .attr("class", "dimension-2D")
            .attr("display", "none")
            .style("visibility", "hidden")
        .append("g")
            .attr("transform", "translate(" + offsetx + ", " + offsety + ")");

    //  d3.select("svg")
    //     // .attr("x", svgX)
    //     // .attr("y", svgY)
    //     .attr("width", svgWidth)
    //     .attr("height", svgHeight);

    d3.select("#progressbar-label").html("Loading orbit data ...");

    dataLoaded = false;

    /*
    d3.xhr("whatsnew-cy3.html")
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

function handleZoom(event) {
    var x = d3.event.translate[0];
    var y = d3.event.translate[1];
    zoomFactor = d3.event.scale;
    panx = x - offsetx;
    pany = y - offsety;
    zoomChangeTransform();
}

function handleZoomNew(event) {
    // console.log(event);
    x = event.transform.x || 0;
    y = event.transform.y || 0;
    zoomFactor = event.transform.k || 1;
    panx = x - offsetx;
    pany = y - offsety;
    zoomChangeTransform();
}

function zoomEnd() {
    adjustLabelLocations();
}

function processOrbitElementsData() {

    // console.log("processOrbitElementsData() called");

    // Add elliptical orbits

    for (var i = 0; i < animationScenes[config].planetsForOrbits.length; ++i) {

        var planetKey = animationScenes[config].planetsForOrbits[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = animationScenes[config].orbits[planetId];
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
                .attr("stroke", planetProps.orbitcolor)
                .attr("stroke-width", (1.0/zoomFactor))
                .attr("fill", "none")
                .attr("transform", "rotate(" + angle + " 0 0)");
        }
    }
}


async function processOrbitVectorsData() {
    // Add spacecraft orbits

    for (var i = 0; i < animationScenes[config].planetsForLocations.length; ++i) {

        var planetKey = animationScenes[config].planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = animationScenes[config].orbits[planetId];
        var vectors = planet["vectors"];

        if (shouldDrawOrbit(planetKey)) {

            svgContainer.append("g")
                .attr("id", "orbit-" + planetKey)
                .attr("visibility", "visible");

            var line = d3.svg.line()
                .x(function(d) { return +1 * xFactor*d[xVariable] / KM_PER_AU * PIXELS_PER_AU; } )
                .y(function(d) { return -1 * yFactor*d[yVariable] / KM_PER_AU *PIXELS_PER_AU; } )
                .interpolate("cardinal-open");

            // TODO d3v7
            // var line = d3.line()
            //     .x(function(d) { return +1 * xFactor*d[xVariable] / KM_PER_AU * PIXELS_PER_AU; } )
            //     .y(function(d) { return -1 * yFactor*d[yVariable] / KM_PER_AU *PIXELS_PER_AU; } )
            //     .curve(d3.curveCardinalOpen);

            svgContainer.select("#" + "orbit-" + planetKey)
                .append("path")
                .attr("d", line(vectors))
                .attr("style", "stroke: " + planetProps.orbitcolor + "; stroke-width: " + (1.0/zoomFactor) + "; fill: none")
                .attr("visibility", "inherit");
        }
    }

    await sleep();

    // Add center planet - Sun/Earth/Mars/Moon

    svgContainer.append("circle")
        .attr("id", animationScenes[config].primaryBody)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", animationScenes[config].primaryBodyRadius)
        .attr("fill-opacity", "0.6")
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .attr("fill", planetProperties[animationScenes[config].primaryBody].color);

    await sleep();

    if ((config == "geo") || (config == "helio")) {

        svgContainer
            .append("g")
                .attr("class", "label")
            .append("text")
                .attr("id", "label-" + animationScenes[config].primaryBody)
                .attr("x", CENTER_LABEL_OFFSET_X)
                .attr("y", CENTER_LABEL_OFFSET_Y)
                .attr("font-size", 10/zoomFactor)
                .attr("fill", planetProperties[animationScenes[config].primaryBody].color)
                .text(planetProperties[animationScenes[config].primaryBody].name);
    }

    await sleep();

    if (config == "martian") {
           var r = 3390/KM_PER_AU*PIXELS_PER_AU/zoomFactor;
           svgContainer.append("image")
               .attr("id", "mars-image")
               .attr("xlink:href", "cy3-mars-image-transparent.gif")
               .attr("x", -r)
               .attr("y", -r)
               .attr("height", 2*r)
               .attr("width", 2*r);
    }

    await sleep();

    // Add planetary positions

    for (var i = 0; i < animationScenes[config].planetsForLocations.length; ++i) {

        var planetKey = animationScenes[config].planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = animationScenes[config].orbits[planetId];
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

    await sleep();

    // Add fire

    svgContainer.append("g")
            .attr("id", "burng")
            .style("visibility", "hidden")
        .append("polygon")
            .attr("id", "burn")
            .attr("points", "3 9 3 -9 45 0")
            .attr("fill", "red");

    svgContainer.append("g")
            .attr("id", "burng-vikram")
            .style("visibility", "hidden")
        .append("polygon")
            .attr("id", "burn")
            .attr("points", "3 9 3 -9 45 0")
            .attr("fill", "#CC0000");

    await sleep();

    // Add labels

    svgContainer.append("g")
        .attr("id", "labels")
        .attr("class", "label");

    for (var i = 0; i < animationScenes[config].planetsForLocations.length; ++i) {

        var planetKey = animationScenes[config].planetsForLocations[i];
        var planetProps = planetProperties[planetKey];
        var planetId = planetProps.id;
        var planet = animationScenes[config].orbits[planetId];
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

    await sleep();

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

    await sleep();

    d3.select("#epochjd").html(epochJD);
    d3.select("#epochdate").html(epochDate);
}

function cy3Animate() {

    if (animationRunning) {
        stopAnimation();
    } else {
        animationRunning = true;
        stopAnimationFlag = false;
        if (animTime >= endTime - ONE_MINUTE_MS) animTime = startTime;
        d3.select("#animate").text("Pause");
    }
}

function fastBackward() {
    animTime -= stepsPerHop * ONE_MINUTE_MS;
    if (animTime < startTime) animTime = startTime;
    setLocation();
}

function backward() {
    animTime -= ONE_MINUTE_MS;
    if (animTime < startTime) animTime = startTime;
    setLocation();
}

function stopAnimation() {
    animationRunning = false;
    stopAnimationFlag = true;
    clearTimeout(timeoutHandle);
    d3.select("#animate").text("Play");
}

function forward() {
    animTime += ONE_MINUTE_MS;
    if (animTime > endTime - ONE_MINUTE_MS) {
        animTime = endTime - ONE_MINUTE_MS;
    }
    setLocation();
}

function fastForward() {
    animTime += stepsPerHop * ONE_MINUTE_MS;
    if (animTime > endTime - ONE_MINUTE_MS) {
        animTime = endTime - ONE_MINUTE_MS;
    }
    setLocation();
}

function missionStart() {
    missionStartCalled = true;
    stopAnimation();
    animTime = startTime;
    // console.log("missionStart(): animTime = " + animTime);
    setLocation();
}

function missionSetTime() {
    stopAnimation();
    if (animTime < startTime) {
        // console.log("missionSetTime(): animTime < startTime");
        animTime = startTime;
    } else if (animTime > endTime - ONE_MINUTE_MS) {
        // console.log("missionSetTime(): animTime >= endTime");
        animTime = endTime - ONE_MINUTE_MS;
    }
    setLocation();
}

function missionNow() {
    animTime = new Date().getTime();
    // console.log(animTime);
    missionSetTime();
}

function missionTLI() {
    animTime = timeTransLunarInjection;
    missionSetTime();
}

function missionLunar() {
    animTime = timeLunarOrbitInsertion;
    missionSetTime();
}

function missionEnd() {
    animTime = endTime;
    missionSetTime();
}

function faster() {
    if (realtimespeed) {
        realtimespeed = false;
        animTimeStepMinutes = deltaFrameTime / ONE_MINUTE_MS * SPEED_CHANGE_FACTOR;
    } else {
        animTimeStepMinutes *= SPEED_CHANGE_FACTOR;	
    }
// console.log("animTimeStepMinutes = " + animTimeStepMinutes);
}

function resetspeed() {
    realtimespeed = false;
    animTimeStepMinutes = 1;
    // console.log("animTimeStepMinutes = " + animTimeStepMinutes);
}

function slower() {
    if (realtimespeed) {
        realtimespeed = false;
        animTimeStepMinutes = deltaFrameTime / ONE_MINUTE_MS / SPEED_CHANGE_FACTOR;
    } else {
        animTimeStepMinutes /= SPEED_CHANGE_FACTOR;	
    }
    // console.log("animTimeStepMinutes = " + animTimeStepMinutes);
}

function realtime() {
    realtimespeed = true;
    // console.log("realtimespeed set to true");
}

function zoomChangeTransform(t) {

    var cy3x = 0;
    var cy3y = 0;

    if (lockOnCY3) {
        cy3x = parseFloat(d3.select("#CY3").attr("cx"));
        cy3y = parseFloat(d3.select("#CY3").attr("cy"));
    }

    if (lockOnMoon) {
        cy3x = parseFloat(d3.select("#MOON").attr("cx"));
        cy3y = parseFloat(d3.select("#MOON").attr("cy"));
    }

    if (lockOnEarth) {
        cy3x = parseFloat(d3.select("#EARTH").attr("cx"));
        cy3y = parseFloat(d3.select("#EARTH").attr("cy"));
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
            + ", " + (offsetx+panx+cy3x-zoomFactor*(cy3x)-cy3x)
            + ", " + (offsety+pany+cy3y-zoomFactor*(cy3y)-cy3y)
            + ")"
        );

    // var zoom = d3.zoom().on("zoom", handleZoom).on("end", adjustLabelLocations);

    // sychronize D3's state // TODO
    // svgRect && svgRect
    //     .call(zoom.transform,
    //         d3.zoomIdentity
    //         .translate([offsetx+panx, offsety+pany])
    //         .scale(zoomFactor));
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

function toggleInfo() {
    $("#stats").toggle();
}

function toggleLockCY3() {
    previousLockOnCY3 = lockOnCY3;
    lockOnCY3 = !lockOnCY3;
    
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

    previousLockOnCY3 = lockOnCY3;
    lockOnCY3 = false;
    d3.select("#checkbox-lock-cy3").property("checked", false);

    previousLockOnEarth = lockOnEarth;
    lockOnEarth = false;
    d3.select("#checkbox-lock-earth").property("checked", false);

    reset();
}

function toggleLockEarth() {
    previousLockOnEarth = lockOnEarth;

    lockOnEarth = !lockOnEarth;
    previousLockOnCY3 = lockOnCY3;
    lockOnCY3 = false;
    d3.select("#checkbox-lock-cy3").property("checked", false);
    
    previousLockOnMoon = lockOnMoon;
    lockOnMoon = false;
    d3.select("#checkbox-lock-moon").property("checked", false);

    reset();
}

function toggleCameraPos() {
    var val = $('input[name=camera]:checked').val();
    if (animationScenes[config] && animationScenes[config].initialized3D) {
        animationScenes[config].toggleCameraPos(val);
    }
}

function toggleCameraLook() {
    var val = $('input[name=look]:checked').val();
    if (animationScenes[config] && animationScenes[config].initialized3D) {
        animationScenes[config].toggleCameraLook(val);
    }
}

function togglePlane() {
    
    var val = $('input[name=plane]:checked').val();
    // console.log("togglePlane() called with value " + val);

    var camera = null;
    var distance = 0.0;

    if (currentDimension == "3D") {
        camera = animationScenes[config].camera;

        if (animationScenes[config].cameraControlsEnabled) {
            var cameraControls = animationScenes[config].cameraControls;
            var origin = new THREE.Vector3(0, 0, 0);
            distance = cameraControls.getPos().distanceTo(origin);            
            cameraControls.reset();
        }
    }

    if (val == "XY") {
        plane = "XY";

        if (currentDimension == "2D") {
            zFactor = 1;
            xVariable = "x";
            yVariable = "y";
            zVariable = "z";
            vxVariable = "vx";
            vyVariable = "vy";
            vzVariable = "vz";            
        }

        if (currentDimension == "3D") {

            animationScenes[config].setCameraPosition(0, 0, distance);
            camera.up.set(0, 1, 0); 
        }

    } else if (val == "YZ") {

        plane = "YZ";

        if (currentDimension == "2D") {
            xFactor = 1;
            xVariable = "y";
            yVariable = "z";
            zVariable = "x";
            vxVariable = "vy";
            vyVariable = "vz";
            vzVariable = "vx";            
        }

        if (currentDimension == "3D") {
            
            animationScenes[config].setCameraPosition(distance, 0, 0);
            camera.up.set(0, 0, 1);
        }

    } else if (val == "ZX") {

        plane = "ZX";

        if (currentDimension == "2D") {
            yFactor = 1;
            xVariable = "z";
            yVariable = "x";
            zVariable = "y";
            vxVariable = "vz";
            vyVariable = "vx";
            vzVariable = "vy";            
        }

        if (currentDimension == "3D") {

            animationScenes[config].setCameraPosition(0, distance, 0);
            camera.up.set(1, 0, 0); 
            // TODO 
            // Workaround as per: https://github.com/mrdoob/three.js/issues/10161 
        }

    }

    if (val == "XY-") {
        plane = "XY";

        if (currentDimension == "2D") {
            zFactor = -1;
            xVariable = "x";
            yVariable = "y";
            zVariable = "z";
            vxVariable = "vx";
            vyVariable = "vy";
            vzVariable = "vz";            
        }

        if (currentDimension == "3D") {

            animationScenes[config].setCameraPosition(0, 0, -1 * distance);
            camera.up.set(0, 1, 0); 
        }

    } else if (val == "YZ-") {

        plane = "YZ";

        if (currentDimension == "2D") {
            xFactor = -1;
            xVariable = "y";
            yVariable = "z";
            zVariable = "x";
            vxVariable = "vy";
            vyVariable = "vz";
            vzVariable = "vx";            
        }

        if (currentDimension == "3D") {
            
            animationScenes[config].setCameraPosition(-1 * distance, 0, 0);
            camera.up.set(0, 0, 1);
        }

    } else if (val == "ZX-") {

        plane = "ZX";

        if (currentDimension == "2D") {
            yFactor = -1;
            xVariable = "z";
            yVariable = "x";
            zVariable = "y";
            vxVariable = "vz";
            vyVariable = "vx";
            vzVariable = "vy";            
        }

        if (currentDimension == "3D") {

            animationScenes[config].setCameraPosition(0, -1 * distance, 0);
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

        // TODO check logic
        loadOrbitDataIfNeededAndProcess(function() {
            handleDimensionSwitch(currentDimension);
            setLocation();    
        })
    }
}

function toggleJoyRide() {
    if (landingFlag) { toggleLanding(); }
    joyRideFlag = !joyRideFlag;
    animationScenes[config].craft.visible = !joyRideFlag;
    animationScenes[config].craftEdges.visible = !joyRideFlag;
    $("#joyridebutton").toggleClass("down");
    $("#joyride").prop("checked", joyRideFlag);
    if (joyRideFlag) {
        animationScenes[config].motherContainer.position.set(0, 0, 0);    
        
        $("#view-orbit").prop("checked", false); 
        $("#view-orbit-descent").prop("checked", false); 
        $("#view-orbit-vikram").prop("checked", false); 
        $("#view-orbit-lro").prop("checked", false); 
        $("#view-craters").prop("checked", false); 
        $("#view-xyz-axes").prop("checked", false); 
        $("#view-poles").prop("checked", false); 
        $("#view-polar-axes").prop("checked", false); 
        $("#view-sky").prop("checked", true); 
        $("#view-moonsoi").prop(":checked", false); 
        $("#view-eclipticplane").prop(":checked", false); 
        $("#view-equatorialplane").prop(":checked", false); 
        setView();

    } else {
        $("#view-orbit").prop("checked", true);
        $("#view-orbit-descent").prop("checked", true);  
        $("#view-orbit-vikram").prop("checked", true); 
        $("#view-orbit-lro").prop("checked", true); 
        $("#view-craters").prop("checked", true); 
        $("#view-xyz-axes").prop("checked", true); 
        $("#view-poles").prop("checked", true); 
        $("#view-polar-axes").prop("checked", true);
        $("#view-sky").prop("checked", true); 
        $("#view-moonsoi").prop(":checked", false); 
        $("#view-eclipticplane").prop(":checked", false); 
        $("#view-equatorialplane").prop(":checked", false); 
        setView();
    }
    updateCraftScale();
    render();
}

function toggleLanding() {
    if (joyRideFlag) { toggleJoyRide(); }
    landingFlag = !landingFlag;
    animationScenes[config].craft.visible = true;
    animationScenes[config].craftEdges.visible = true;
    $("#landingbutton").toggleClass("down");
    $("#landing").prop("checked", landingFlag);
    if (landingFlag) {
        animationScenes[config].motherContainer.position.set(0, 0, 0);    
        
        $("#view-orbit").prop("checked", false); 
        $("#view-orbit-descent").prop("checked", true); 
        $("#view-orbit-vikram").prop("checked", false); 
        $("#view-orbit-lro").prop("checked", false); 
        $("#view-craters").prop("checked", false); 
        $("#view-xyz-axes").prop("checked", false); 
        $("#view-poles").prop("checked", false); 
        $("#view-polar-axes").prop("checked", false); 
        $("#view-sky").prop("checked", true); 
        $("#view-moonsoi").prop(":checked", false); 
        $("#view-eclipticplane").prop(":checked", false); 
        $("#view-equatorialplane").prop(":checked", false); 
        setView();

    } else {
        $("#view-orbit").prop("checked", true);
        $("#view-orbit-descent").prop("checked", true);  
        $("#view-orbit-vikram").prop("checked", true); 
        $("#view-orbit-lro").prop("checked", true); 
        $("#view-craters").prop("checked", true); 
        $("#view-xyz-axes").prop("checked", true); 
        $("#view-poles").prop("checked", true); 
        $("#view-polar-axes").prop("checked", true);
        $("#view-sky").prop("checked", true); 
        $("#view-moonsoi").prop(":checked", false); 
        $("#view-eclipticplane").prop(":checked", false); 
        $("#view-equatorialplane").prop(":checked", false); 
        setView();
    }
    updateCraftScale();
    render();
}

function setView() {
    // console.log("setView() called");

    viewOrbit = $("#view-orbit").is(":checked"); 
    viewOrbitDescent = $("#view-orbit-descent").is(":checked"); 
    viewOrbitVikram = $("#view-orbit-vikram").is(":checked"); 
    viewOrbitLRO = $("#view-orbit-lro").is(":checked"); 
    viewCraters = $("#view-craters").is(":checked"); 
    viewXYZAxes = $("#view-xyz-axes").is(":checked"); 
    viewPoles = $("#view-poles").is(":checked"); 
    viewPolarAxes = $("#view-polar-axes").is(":checked"); 
    viewSky = $("#view-sky").is(":checked"); 
    viewMoonSOI = $("#view-moonsoi").is(":checked"); 
    viewEclipticPlane = $("#view-eclipticplane").is(":checked"); 
    viewEquatorialPlane = $("#view-equatorialplane").is(":checked"); 

    ["geo", "lunar", "lro"].map(function(cfg) {
        // console.log("Setting view for config: " + cfg);

        if (animationScenes[cfg] && animationScenes[cfg].initialized3D) {
            animationScenes[cfg].orbitLines.map((orbitLine) => {orbitLine.visible = viewOrbit;});
            if (cfg == "lunar") { animationScenes[cfg].landingOrbitLine.visible = viewOrbitDescent; }
            // animationScenes[cfg].vikramOrbitLine.visible = viewOrbitVikram;
        
            if (cfg == "lro") {
                animationScenes[cfg].lroOrbitLine.visible = viewOrbitLRO;    
            }
            
            animationScenes[cfg].locations.map(x => x.visible = viewCraters);
        
            animationScenes[cfg].axesHelper.visible = viewXYZAxes;
        
            animationScenes[cfg].earthNorthPoleSphere.visible = viewPoles;
            animationScenes[cfg].earthSouthPoleSphere.visible = viewPoles;
            animationScenes[cfg].moonNorthPoleSphere.visible = viewPoles;
            animationScenes[cfg].moonSouthPoleSphere.visible = viewPoles;
        
            animationScenes[cfg].earthAxis.visible = viewPolarAxes;
            animationScenes[cfg].moonAxis.visible = viewPolarAxes;  
            
            animationScenes[cfg].skyContainer.visible = viewSky;  

            animationScenes[cfg].moonSOISphere.visible = viewMoonSOI;  
            animationScenes[cfg].eclipticPlaneHelper.visible = viewEclipticPlane;
            animationScenes[cfg].eclipticPolarGridHelper.visible = viewEclipticPlane;
            animationScenes[cfg].equatorialPlaneHelper.visible = viewEquatorialPlane;
            animationScenes[cfg].equatorialPolarGridHelper.visible = viewEquatorialPlane;
        }
    
    });

    render();
}

function toggleCamera() {
    var val = $('input[name=camera]:checked').val();
    // console.log("toggleCamera() called with value " + val);

    if (val =="default") {
        moonPhaseCamera = false;
    } else {
        moonPhaseCamera = true;
    }

    if (animationScenes[config] && animationScenes[config].initialized3D) {
        animationScenes[config].setCameraParameters();
        animationScenes[config].skyContainer.visible = !moonPhaseCamera;
    }

    render();
}

function burnButtonHandler(index) {
    // console.log("burnButtonHandler() called for event index: " + index);
    // animTime = eventInfos[index]["startTime"];
    if (eventInfos[index]["label"] == "⏰ Now") {
        animTime = new Date().getTime();
    } else {
        // animTime = new Date(eventInfos[index]["startTime"].getTime() + (eventInfos[index]["durationSeconds"] * 1000 / 2));    
        animTime = new Date(eventInfos[index]["startTime"].getTime()).getTime();
    }
    
    // console.log("burnButtonHandler(): animTime = " + animTime + ", startTime = " + startTime + ", endTime = " + endTime);
    missionSetTime();
}

// adapted from - http://stackoverflow.com/questions/9318674/javascript-number-currency-formatting

function formatFloat(decPlaces, thouSeparator, decSeparator) {
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
function getMST(t, lon)
{
    var year   = t.getUTCFullYear();
    var month  = t.getUTCMonth() + 1;
    var day    = t.getUTCDate();
    var hour   = t.getUTCHours();
    var minute = t.getUTCMinutes();
    var second = t.getUTCSeconds();

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

window.addEventListener('load', main);

// end of file
