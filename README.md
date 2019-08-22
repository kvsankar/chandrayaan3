
## Chandrayaan 2 orbit animation

This project holds the source code for the 3D and 2D animations used
in http://sankara.net/chandrayaan2.html. That page shows an animation
of the orbit of the ISRO <a href="http://www.isro.org/mars/home.aspx">
Chandrayaan 2</a> mission.

## Design

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
    cy2.css                   # CSS for the web page
    whatsnew-cy2.html         # What's new page
    geo-cy2.json              # contains all geocentric orbit data
    lunary-cy2.json           # contains all selenocentric orbit data

#### Third party library files, style sheets, and images

    jquery.dialogextend.min.js
    jquery-ui-1.10.3.custom.min.js
    jquery-1.9.1.js
    d3.v3.min.js
    three.min.js
    TrackballControls.js
    css/ui-darkness/images/*
    css/ui-darkness/*.css

#### Analytics

    ga.js                 # Google analytics (vesion controlled)

### Animation

The animation is primarily handled using D3 JS and THREE JS.
Planetary orbits are rendered as ellipses based on orbital elements.
Spacecraft orbits are rendered using line segments using position data.

JQuery and JQueryUI are primarily used for control and information panels.

### Hosting

At present the page can be hosted statically.

