
## Chandrayaan 2 orbit animation

This project holds the source code for the 3D and 2D animations used
in http://sankara.net/chandrayaan2.html. That page shows an animation
of the orbit of the ISRO <a href="http://www.isro.org/mars/home.aspx">
Chandrayaan 2</a> mission.

I created this animation for educational purposes. It has the following features:

* Real-world orbit data and predictions based on information available from JPL/NASA HORIZONS interface
* Rendering of the orbit in 2D and 3D
* Rendering of the orbit with either Earth or Moon at the center
* Rendering of the orbit with views locked on Earth, Moon, or the spacecraft
* Views aligned with J2000 reference axes
* Information on all earth bound and moon bound maneuvers (engine burns)
* Realistic textures for Earth and Moon in 3D mode
* Astronomically correct rendering of sunlight on Earth and Moon, poles, and polar axes
* Various animation controls for education - camera controls (pan, zoom, rotate), timeline controls, visibility controls
* A Joy Ride feature which lets you fly along with Chandrayaan 2 (video capture: https://www.youtube.com/watch?v=go-vquqMZdk)
    
## Design

## High level design

The animation has 2D and 3D rendering modes. 

The 2D mode uses SVG and D3 JS. Planetary orbits are rendered as ellipses
based on orbital elements. Spacecraft orbits are rendered using line segments
using position data.

The 3D mode uses THREE JS.

JQuery and JQueryUI are used for control and information panels.

Orbit data is fetched offline from JPL/NASA HORIZONS.
This data in CSV format is processed a bit and converted into JSON format 
for use in the animation. A few astronomy functions are based on Steve Moshier's routines.

### Fetching orbit data

The Perl script orbits.pl is used to fetch orbit data during development time from
<a href="http://ssd.jpl.nasa.gov/?horizons">NASA JPL HORIZONS</a> web interface.

The script supports the following options:

    --phase=[geo|lunar]   # geocentric or selenocentric phase -- defaults to geo
    --data-dir=<datadir>  # place to save orbit data files -- defaults to .
    --use-cache           # use orbit data retrieved and saved earlier -- optional

Raw orbit data obtained from JPL is stored into the following files:

    ho-<id>-elements.txt  # orbital elements for one instant of time
    ho-<id>-vectors.txt   # co-ordinates for a period of time

Orbital elements are also stored here (though they aren't used at present):

    ho-<id>-orbit.txt     # orbital elements for one instant of time

Orbit data for use by the JavaScript is written in JSON format in a time-stamped directory under data-fetched:

    orbits.json           # contains all heliocentric orbit data (elements and vectors)
    geo.json              # contains all geocentric orbit data (elements and vectors)

### Web page

The site consists of the following three sets of files:

#### Core project files (all are version controlled)

    chandrayaan2.html         # HTML page
    cy2.js                    # JavaScript handling animation
    astro.js                  # A few astronomy support functions
    cy2.css                   # CSS for the web page
    whatsnew-cy2.html         # What's new page
    geo-cy2.json              # contains all geocentric orbit data
    lunary-cy2.json           # contains all selenocentric orbit data

#### Third party library files, style sheets, and images

    d3.v3.min.js
    ephemeris-0.1.0.min.js (https://github.com/mivion/ephemeris)
    jquery.dialogextend.min.js
    jquery-ui-1.10.3.custom.min.js
    jquery-1.9.1.js
    three.min.js
    TrackballControls.js
    css/ui-darkness/images/*
    css/ui-darkness/*.css
    images/* (earth and moon textues for a few sources)

#### Analytics

    ga.js                 # Google analytics

### Hosting

At present the page can be hosted statically. There are no server components needed.
However, to prevent browsers from complaining about CORS, one may use a tiny web server
like Mongoose to test the local site. 


