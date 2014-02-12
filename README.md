
## MOM and MAVEN orbit animation

This project holds the source code for the 2D animation used
in http://sankara.net/mom.html. That page shows an animation
of the orbits of the <a href="http://www.isro.org/mars/home.aspx">
Mars Orbiter Mission</a> and <a href="http://www.nasa.gov/mission_pages/maven/main/">
MAVEN</a>.

## Design

### Fetching orbit data

The Perl script orbits.pl is used to fetch orbit data during development time from 
<a href="http://ssd.jpl.nasa.gov/?horizons">NASA JPL HORIZONS</a> web interface.

The script supports the following options:

    --phase=[geo|helio]   # geocentric or heliocentric phase -- defaults to geo
    --data-dir=<datadir>  # place to save orbit data files -- defaults to .
    --use-cache           # use orbit data retrieved and saved earlier -- optional

Raw orbit data obtained from JPL is stored into the following files:

    ho-<id>-elements.txt  # orbital elements for one instant of time
    ho-<id>-vectors.txt   # co-ordinates for a period of time

Orbital elements are also stored here (though they aren't used at present):

    ho-<id>-orbit.txt     # orbital elements for one instant of time

Orbit data for use by the JavaScript is written in JSON format:

    orbits.json           # contains all heliocentric orbit data (elements and vectors)
    geo.json              # contains all geocentric orbit data (elements and vectors)

### Web page

The site consists of the following three sets of files:

#### Core project files (all are version controlled)

    mom.html              # HTML page
    mom.js                # JavaScript handling animation
    mom.css               # CSS for the web page
    whatsnew.html         # What's new page
    orbits.json           # contains all heliocentric orbit data
    geo.json              # contains all geocentric orbit data    

#### Third party library files, style sheets, and images

    jquery.dialogextend.min.js
    jquery-ui-1.10.3.custom.min.js
    jquery-1.9.1.js
    d3.v3.min.js
    css/ui-darkness/images/* 
    css/ui-darkness/*.css

#### Analytics

    ga.js                 # Google analytics (vesion controlled)

### Animation

The animation is primarily handled using D3 JS. 
Planetary orbits are rendered as ellipses based on orbital elements.
Spacecraft orbits are rendered using line segments using position data.

JQuery and JQueryUI are primarily used for control and information panels.

### Hosting

At present the page can be hosted statically. 

## Future work planned

At present some specific data about MOM and MAVEN are hard coded.
Code changes are planned to remove these and to make the code data driven
so that it can be configured to work with any mission. 

