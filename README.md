
## MOM and MAVEN Orbit Animation

This project holds the source code for the 2D animation used
in http://sankara.net/mom.html. That page shows an animation
of the orbits of the <a href="http://www.isro.org/mars/home.aspx">
Mars Orbiter Mission</a> and <a href="http://www.nasa.gov/mission_pages/maven/main/">
MAVEN</a>.

## Design

The Perl script orbits.pl is used to fetch orbit data offline from 
<a href="http://ssd.jpl.nasa.gov/?horizons">NASA JPL HORIZONS</a> web interface.
The script generates a couple of JSON files carrying the orbit data
used the JavaScript code running the animation. 

The JavaScript file mom.js renders the animation. 
It uses <a href="http://d3js.org">D3</a> and 
<a href="">JQuery</a> libraries.

At present the page can be hosted statically. 

## Future Work Planned

At present some specific data about MOM and MAVEN are hard coded.
Code changes are planned to remove these and to make the code data driven
so that it can be configured to work with any mission. 

