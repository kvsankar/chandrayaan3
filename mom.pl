#!/usr/bin/perl

# Copyright (c) 2013 Sankaranarayanan K V <kvsankar@gmail.com>

use strict;

use FileHandle;
use LWP;
use Getopt::Long;
use Time::Local;

# constants - ephemerides related

my ($start_year, $start_month, $start_day) = ("2013", "11", "06");
my ($stop_year, $stop_month, $stop_day) =    ("2014", "09", "24");
my $step_size_in_hours = 6;

my $MAVEN   = -202;
my $MOM     = -3;
my $SUN     = 10;
my $MERCURY = 199;
my $VENUS   = 299;
my $EARTH   = 399;
my $MARS    = 499;

my @planets = ($MERCURY, $VENUS, $EARTH, $MARS, $MOM);

my $data_dir = ".";
my $use_cached_data = 0;
my $debugging = 1;

# constants - rendering related

my $km_per_au = 149597870.691;
my $degrees_in_radian = 57.2957795;

my $pixels_per_au = 150; 
my $offset = 300;
my $planet_label_offset_x = 10;
my $planet_label_offset_y = 10;
my $mars_label_offset_x = -50;
my $mars_label_offset_y = 0;

my %fills =      ($SUN => 'white', $MERCURY => 'orange',  $VENUS => 'grey',  $MARS => 'red',  $EARTH => 'blue',  $MOM => 'purple', $MAVEN => 'orange');
my %names =      ($SUN => 'Sun',   $MERCURY => 'Mercury', $VENUS => 'Venus', $MARS => 'Mars', $EARTH => 'Earth', $MOM => 'MOM',    $MAVEN => 'MAVEN');
my %fill_radii = ($SUN => 5,       $MERCURY => 5,         $VENUS => 5,       $MARS => 5,      $EARTH =>  5,      $MOM => 5,        $MAVEN => 5);

# global data structures

my $start_time_gm = 0;  # set later in code
my $stop_time_gm = 0;   # set later in code
my $start_time = '';    # set later in code 
my $stop_time = '';     # set later in code
my $step_size = '';     # set later in code
my $count_duration = 0; # set later in code

my $now = time();
my $jd = my_jd($now);
my $gmtime = gmtime($now);
my %orbits; 
my $earth_rotation = 0;

sub set_start_and_stop_times () {

	$start_time ="$start_year\-$start_month\-$start_day";
	$start_time_gm = timegm(0, 0, 0, $start_day, $start_month-1, $start_year);

	$stop_time ="$stop_year\-$stop_month\-$stop_day";
	$stop_time_gm = timegm(0, 0, 0, $stop_day, $stop_month-1, $stop_year);

	$step_size = "${step_size_in_hours}%20h";
	$count_duration = $step_size_in_hours * 3600;
}

sub print_debug ($) {
    my $msg = shift;
    if ($debugging) {
        print "DEBUG: $msg\n";
    }
}

sub print_error($) {
    my $msg = shift;
    print STDERR "Error: $msg\n";
}

sub my_jd ($) {
    my $t = shift;
    my $jd = 2440587.5 + ($t / 86400);
    return $jd;
}

sub is_craft($) {
	my $planet = shift;
	return ($planet < 0);
}

sub save_fetched_data () {

    my $cache_file_name = "$data_dir/momcache.txt";
    my $fh = FileHandle->new;
    unless ($fh->open(">$cache_file_name")) {
        print_err("Faield to write to $cache_file_name: $!");
    }
    print $fh "jd=$jd\n";
    close $fh;

    foreach my $planet (@planets) {
        
        my $ho_file_name = "$data_dir/ho-$planet-elements.txt";
        my $fh = FileHandle->new;
        unless ($fh->open(">$ho_file_name")) {
            print_err("Can't write to $ho_file_name: $!");
        }
        my $horizons = $orbits{$planet}->{'elements_content'};
        print $fh $horizons;
        close $fh;

        $ho_file_name = "$data_dir/ho-$planet-vectors.txt";
        $fh = FileHandle->new;
        unless ($fh->open(">$ho_file_name")) {
            print_err("Can't write to $ho_file_name: $!");
        }
        $horizons = $orbits{$planet}->{'vectors_content'};
        print $fh $horizons;
        close $fh;
    }
} 

sub save_orbit_data () {

    foreach my $planet (@planets) {
        
        my $ho_file_name = "$data_dir/ho-$planet-orbit.txt";
        my $fh = FileHandle->new;
        unless ($fh->open(">$ho_file_name")) {
            print_err("Can't write to $ho_file_name: $!");
        }
        my $elements = $orbits{$planet}->{'elements'};

        # print_debug("Planet $planet has elements at: " . join(",", (sort keys %{$elements})));

        foreach my $jdct (sort keys %{$elements}) {
            print_elements($fh, $elements->{$jdct});    
            print $fh "\n";
        }
        
        print $fh "\n";
        close $fh;
    }
} 

sub fetch_horizons_data ($$) {
    my $planet = shift;
    my $options = shift;

    my $table_type;
    my $content_key;
    my $center;

    if ($options->{'table_type'} eq 'elements') {
        $table_type = 'ELEMENTS';
        $content_key = 'elements_content';
    } elsif ($options->{'table_type'}  eq 'vectors') {
        $table_type = 'VECTORS';
        $content_key = 'vectors_content';
    }

    $center = '500@10';

    # if ($planet == $MOM) {
    #   $center = '399';
    # } else {
    #   $center = '500@10';
    # }

    my $url = "http://ssd.jpl.nasa.gov/horizons_batch.cgi?batch=1";
    $url = $url . "&COMMAND='" . $planet . "'";
    # $url = $url . "&MAKE_EPHEM='YES'";
    $url = $url . "&TABLE_TYPE='$table_type'";
    $url = $url . "&CENTER='$center'";
    if ($options->{'range'}) {
        $url = $url . "&START_TIME='" . $options->{'start_time'} . "'";
        $url = $url . "&STOP_TIME='" . $options->{'stop_time'} . "'";
        $url = $url . "&STEP_SIZE='" . $options->{'step_size'} . "'";
    } else {
        $url = $url . "&TLIST=$jd'";    
    }   
    # $url += "&QUANTITIES='1,9,20,23,24'";
    $url = $url . "&CSV_FORMAT='YES'";

    print_debug("url = $url");

    use LWP::UserAgent;
    my $ua = LWP::UserAgent->new;

    # Create a request
    my $req = HTTP::Request->new(GET => $url);

    # Pass request to the user agent and get a response back
    my $res = $ua->request($req);

    # Check the outcome of the response
    if ($res->is_success) {
        $orbits{$planet}->{$content_key} .= $res->content;
        return 1;
    }
    else {
        print_err("HTTP request failed: " . $res->status_line);
        return 0;
    }
}

sub fetch_elements ($) {
    my $planet = shift;
    print_debug("Fetching elements for planet $planet ...");
    my $status = fetch_horizons_data($planet, {'table_type' => 'elements'});
    print_debug("Fetching elements for planet $planet completed.");
    return $status;
}

sub fetch_vectors ($) {
    my $planet = shift;
    print_debug("Fetching vectors for planet $planet ...");
    my $status = fetch_horizons_data($planet, {'table_type' => 'vectors'});
    print_debug("Fetching vectors for planet $planet completed.");
    return $status;
}

sub load_cached_data {

    my $ret_status = 1;

    print_debug("Entering load_cached_data");

    my $cache_file = "$data_dir/momcache.txt";
    if (open CACHE, "<$cache_file") {
        while (my $line = <CACHE>) {
            chomp;
            if ($line =~ /\s*jd\s*=\s*(\S+)$/) {
                $jd = $1;
                print_debug("jd = $jd");
            }
        }
        foreach my $planet (@planets) {

            foreach my $key ('elements', 'vectors') {
                my $fn = "$data_dir/ho-$planet-$key.txt";

                if (-r $fn) {
                    if (open IN, "<$fn") {

                        while (my $line = <IN>) {
                            $orbits{$planet}->{"${key}_content"} .= $line;  
                        }
                        
                        close IN;

                    } else {
                        print_err("Unabled to open $fn: $!");
                        $ret_status = 0;
                        last;
                    }
                }           
            }
        }
        close CACHE;
    } else {
        print_err("Unable to open $cache_file: $!");
        $ret_status = 0;
    }

    print_debug("Leaving load_cached_data");
    return $ret_status;
}
sub parse_horizons_elements ($$) {
    my $code = shift;
    my $planet = shift;

    print_debug("Entering parse_horizons_elements: code = $code, planet = $planet");

    my $parse = 0;

    my $key = ($code eq 'elements') ? 'elements_content' : 'vectors_content';
    my @lines = split("\n", $orbits{$planet}->{$key});

    my $count = 0;
    foreach my $line (@lines) {
        if ($line =~ /^\$\$SOE/) {
            $parse = 1;
            next;
        }
        if ($line =~ /^\$\$EOE/) {
            $parse = 0;
            next; # we save data from multiple HTTP requests in the same buffer
        }
        if ($parse) {

            ++$count;
            if ($code eq 'elements') {

                my ($jdct, $date, $ec, $qr, $in, $om, $w, $tp, $n, $ma, $ta, $a, $ad, $pr) = 
                    split(/,\s*/, $line);

                my $rec;
                $rec->{'jdct'} = $jdct;
                $rec->{'date'} = $date;
                $rec->{'ec'} = $ec;
                $rec->{'qr'} = $qr;
                $rec->{'in'} = $in;
                $rec->{'om'} = $om;
                $rec->{'w'} = $w;
                $rec->{'tp'} = $tp;
                $rec->{'n'} = $n;
                $rec->{'ma'} = $ma;
                $rec->{'ta'} = $ta;
                $rec->{'a'} = $a;
                $rec->{'ad'} = $ad;
                $rec->{'pr'} = $pr;

                if ($planet == $EARTH) {
                    # $earth_rotation = $rec->{'om'} + $rec->{'w'};
                    $earth_rotation = 0;
                    while ($earth_rotation >= 360.0) { $earth_rotation -= 360.0; }
                    $earth_rotation = $earth_rotation;
                    # print_debug "earth_rotation = $earth_rotation";
                }

                if (exists $orbits{$planet}->{'elements'}->{$jdct}) {
                    # print_debug("Merging elements for planet=$planet, jdct=$jdct");
                    my $exrec = $orbits{$planet}->{'elements'}->{$jdct};
                    @$exrec{keys %$rec} = values %$rec;
                } else {
                	# print_debug("Adding elements for planet=$planet, jdct=$jdct");
                    $orbits{$planet}->{'elements'}->{$jdct} = $rec;
                }
            
            } elsif ($code eq 'vectors') {

                my ($jdct, $date, $x, $y) = split(/,\s*/, $line);

                my $rec;
                $rec->{'jdct'} = $jdct;
                $rec->{'x'} = $x;
                $rec->{'y'} = $y;

                if (exists $orbits{$planet}->{'elements'}->{$jdct}) {
                	# print_debug("Merging vectors for planet=$planet, jdct=$jdct");
                    my $exrec = $orbits{$planet}->{'elements'}->{$jdct};
                    @$exrec{keys %$rec} = values %$rec;
                } else {
                	# print_debug("Merging vectors for planet=$planet, jdct=$jdct");
                    $orbits{$planet}->{'elements'}->{$jdct} = $rec;
                }
            }
            
        }
    }

    print_debug("Found $count $code records for planet $planet");

    print_debug("Leaving parse_horizons_elements");

}

sub print_elements ($$) {
    my $fh = shift;
    my $rec = shift;

    print $fh "JDCT = ", $rec->{'jdct'}, "\n";
    print $fh "Date = ", $rec->{'date'}, "\n";
    print $fh "EC = ", $rec->{'ec'}, "\n";
    print $fh "QR = ", $rec->{'qr'}, "\n";
    print $fh "IN = ", $rec->{'in'}, "\n";
    print $fh "OM = ", $rec->{'om'}, "\n";
    print $fh "W = ", $rec->{'w'}, "\n";
    print $fh "Tp = ", $rec->{'tp'}, "\n";
    print $fh "N = ", $rec->{'n'}, "\n";
    print $fh "MA = ", $rec->{'ma'}, "\n";
    print $fh "TA = ", $rec->{'ta'}, "\n";
    print $fh "A = ", $rec->{'a'}, "\n";
    print $fh "AD = ", $rec->{'ad'}, "\n";
    print $fh "PR = ", $rec->{'pr'}, "\n";
    print $fh "X = ", $rec->{'x'}, "\n";
    print $fh "Y = ", $rec->{'y'}, "\n";
}

sub generate_svg_params ($) {
    my $planet = shift;
    my %svg_params;

    print_debug "Entering generate_svg_params";

    foreach my $jdct (sort keys %{$orbits{$planet}->{'elements'}}) {
        my $svg_params_rec;
        my $rec = $orbits{$planet}->{'elements'}->{$jdct};

        $svg_params_rec->{'name'} = $names{$planet};
        # om - longitude of ascending node
        # w  - argument of perifocus
        my $angle = $rec->{'om'} + $rec->{'w'};
        # my $angle = 0;
        while ($angle >= 360.0) { $angle -= 360.0; }

        $svg_params_rec->{'orbit_rotation'} = -1 * $angle;
        # $svg_params_rec->{'orbit_rotation'} += 90.0; # TODO
        $svg_params_rec->{'planet_rotation'} = -1 * $earth_rotation;

        $svg_params_rec->{'a'}  =      ($pixels_per_au *  ($rec->{'a'} / $km_per_au));
        $svg_params_rec->{'cx'} = -1 * ($pixels_per_au * (($rec->{'a'} / $km_per_au)) * $rec->{'ec'});
        $svg_params_rec->{'rx'} =      ($pixels_per_au *  ($rec->{'a'} / $km_per_au));
        $svg_params_rec->{'ry'} =      ($pixels_per_au * (($rec->{'a'} / $km_per_au)) * sqrt(1 - $rec->{'ec'} * $rec->{'ec'}));
        $svg_params_rec->{'x'}  =      ($pixels_per_au *  ($rec->{'x'} / $km_per_au)); 
        $svg_params_rec->{'y'}  = -1 * ($pixels_per_au *  ($rec->{'y'} / $km_per_au)); # y is up in co-ordinates; but down in screen

        $svg_params_rec->{'fill'} = $fills{$planet} || 'white';
        $svg_params_rec->{'name'} = $names{$planet} || 'unknown';

        $svg_params{$jdct} = $svg_params_rec;
    }

    print_debug "Leaving generate_svg_params";
    return \%svg_params;
}

sub rotate($$$$) {
    my $planet = shift;
    my $x = shift;
    my $y = shift;
    my $phi_degrees = shift;

    my ($retx, $rety) = ($x, $y);
    my $phi = $phi_degrees / $degrees_in_radian;

    if ($x != 0) {
        $retx = $x * cos($phi) - $y * sin($phi);
        $rety = $y * cos($phi) + $x * sin($phi);
    }

    # print_debug("Rotating planet $names{$planet}: x = $x, y = $y, phi (degrees) = $phi_degrees, retx = $retx, rety = $rety");

    return ($retx, $rety);
}

sub generate_html ($) {
    my $filename = shift;

    if (open OUT, ">$filename") {

        print OUT <<"EOT";
<!DOCTYPE html>

<!-- Copyright (c) 2013 Sankaranarayan K V; this file is published under the Creative Commons CC-BY-SA 2.0 license. -->

<html>
<body onload="init()">

<script>

    <!-- The HTML and JavaScript have been generated with a Perl script. The generated code needs some cleanup. -->

    var timeout = 25;
    var count = 0;
    var stopAnimationFlag = false;
    var startLocationCxs = {};
    var startLocationCys = {};
    var startLabelXs = {};
    var startLabelYs = {};

    function init() {
    	var svg = document.getElementById("svg");
    	svg.setAttribute("width", window.innerWidth);
    	svg.setAttribute("height", window.innerHeight);
    	initData();
        missionNow();
    }

    function setLocation() {
        var d = new Date(($start_time_gm + count * $count_duration) * 1000);
        document.getElementById("date").innerHTML = d;

EOT

		foreach my $planet (@planets) {
			print OUT <<"EOT";
        document.getElementById("location-$planet").setAttribute('cx', planet_${names{$planet}}_locations[count].cx);
        document.getElementById("location-$planet").setAttribute('cy', planet_${names{$planet}}_locations[count].cy);
        document.getElementById("label-$planet").setAttribute('x', planet_${names{$planet}}_labels[count].x);
        document.getElementById("label-$planet").setAttribute('y', planet_${names{$planet}}_labels[count].y);

EOT
		}

		print OUT <<"EOT";

	} // end of setLocation

    function changeLocation() {

        if (!stopAnimationFlag) {

            setLocation();

            ++count;
            if (count < planet_MOM_locations.length) {
                setTimeout(function() { changeLocation(); }, timeout);
            }            
        }
    }

    function animate() {
        stopAnimationFlag = false;
        if (count >= planet_MOM_locations.length) count = 0;
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
    	if (count >= planet_MOM_locations.length) {
    		count = planet_MOM_locations.length - 1;
    	}
    	setLocation();
    }

    function missionStart() {
        stopAnimation();
        count = 0;
        setLocation();
    }

    function missionNow() {
    	stopAnimation();
    	var t = new Date().getTime();
    	var x = ((t/1000) - $start_time_gm) / $count_duration;
    	count = Math.max(0, Math.floor(x));
        setLocation();
    }

    function missionEnd() {
        stopAnimation();
        count = planet_MOM_locations.length - 1;
        setLocation();
    }

    function faster() {
    	timeout -= 5;
    	if (timeout < 0) timeout = 0;
    }

    function slower() {
    	timeout += 5;
    }

    var planet;
    var label;

EOT

    	foreach my $planet (@planets) {

	        print OUT "    var planet_${names{$planet}}_locations = new Array();\n";
	        print OUT "    var planet_${names{$planet}}_labels = new Array();\n";
		}    

		print OUT <<"EOT";

		function initData() {

EOT
    	foreach my $planet (@planets) {

	        my %svg_params = %{$orbits{$planet}->{'svg_params'}};

	        foreach my $jdct (sort keys %svg_params) {

	            my $rec = $svg_params{$jdct};

	            print OUT ("        planet = new Object(); planet.cx = $rec->{'x'}; planet.cy = $rec->{'y'}; planet_${names{$planet}}_locations.push(planet);\n");
	            my ($lx, $ly) = rotate($planet, $rec->{'x'}, $rec->{'y'}, -1 * $earth_rotation);
	            my ($ex, $ey) = is_craft($planet) ? ($mars_label_offset_x, $mars_label_offset_y) : ($planet_label_offset_x, $planet_label_offset_y);
	            print OUT ("        label = new Object(); label.x = " . ($lx+$ex) . "; label.y = " . ($ly+$ey) . "; planet_${names{$planet}}_labels.push(label);\n");
	        }
    	}

    	print OUT "\n\n";

        print OUT <<"EOT";

		} // end of initData()

</script>

<div class="background">

<div class="blurb">
<p>
<a href="http://www.isro.org/mars/home.aspx">Mars Orbiter Mission, Indian Space Research Organization</a><br/>
Inner solar system and MOM / MAVEN orbit diagram generated using NASA JPL HORIZONS Ephemerides.<br/>
This animation works best with the Google Chrome browser. Firefox works; but produces jittery animation. I won't talk about IE. <br/>
Copyright (c) 2013 Sankaranarayan K V; this file is published under the Creative Commons CC-BY-SA 2.0 license.<br/>
</p>
</div>

<div class="info">
<p>
Orbit data epoch: JD = $jd | UTC = $gmtime <br/>
</p>
</div>

<button type="button" onclick="missionStart()">| &lt;</button>
<button type="button" onclick="missionNow()">Now</button>
<button type="button" onclick="missionEnd()">&gt; |</button>

<button type="button" onclick="animate()">Animate!</button>

<button type="button" onclick="backward()"> -5d </button>
<button type="button" onclick="stopAnimation()">Stop</button>
<button type="button" onclick="forward()"> +5d </button>

<button type="button" onclick="slower()"> Slower </button>
<button type="button" onclick="faster()"> Faster </button>


<div class="date">
<table><tr><td>Animation Time</td><td><pre><label id="date"></label></pre></td></tr></table>
</div>

<svg id="svg" xmlns="http://www.w3.org/2000/svg" version="1.1">
<g transform="translate($offset, $offset)">
EOT

    # Sun
    print OUT "\n\n";
    print OUT "<!-- " . $names{$SUN} . "-->\n";
    print OUT "<circle cx=\"0\" cy=\"0\" r=\"5\" " . 
            "stroke=\"$fills{$SUN}\" stroke-width=\"0\" fill=\"$fills{$SUN}\" transform=\"rotate(0 0 0)\" />\n";

    print OUT "\n\n";

    foreach my $planet (@planets) {

        my %svg_params = %{$orbits{$planet}->{'svg_params'}};

        # print_debug("jd = $jd, svg_params = " . join(" : ", sort keys %svg_params));
        
        foreach my $jdct (sort keys %svg_params) {

        	# print_debug "planet = $planet, jd = $jd, jdct = $jdct";

            next if (abs($jd - $jdct) > 0.0001); # TODO improve this crude calculation

            my $rec = $svg_params{$jdct};

        	print_debug "Generating ellipse and location data for planet = $planet, jd = $jd, jdct = $jdct";

            print OUT "<!-- " . $rec->{'name'} . ", JDCT = $jd -->\n";

            unless (is_craft($planet)) {
                # draw the elliptical orbit of the planet
                print OUT "<ellipse id=\"orbit-$planet\" cx=\"$rec->{'cx'}\" cy=\"0\" rx=\"$rec->{'rx'}\" ry=\"$rec->{'ry'}\" " . 
                    "stroke=\"$rec->{'fill'}\" stroke-width=\"1\" fill=\"none\" transform=\"rotate(" . $rec->{'orbit_rotation'} . " 0 0)\" />\n"; 

                print OUT "<line id=\"periapsis-$planet\" " . 
                	"x1=\"@{[$rec->{'cx'} + $rec->{'a'}-2]}\" y1=\"0\"" . 
                	"x2=\"@{[$rec->{'cx'} + $rec->{'a'}+2]}\" y2=\"0\" style=\"stroke:rgb(63,63,63);stroke-width:2\"" .
                	"transform=\"rotate(" . $rec->{'orbit_rotation'} . " 0 0)\" />\n";               

                print OUT "<line id=\"apoapsis-$planet\" " . 
                	"x1=\"@{[$rec->{'cx'} + -1*$rec->{'a'}-4]}\" y1=\"0\"" . 
                	"x2=\"@{[$rec->{'cx'} + -1*$rec->{'a'}+4]}\" y2=\"0\" style=\"stroke:rgb(63,63,63);stroke-width:2\"" .
                	"transform=\"rotate(" . $rec->{'orbit_rotation'} . " 0 0)\" />\n";               
            }

            # mark the current location
            print OUT "<circle id=\"location-$planet\" cx=\"$rec->{'x'}\" cy=\"$rec->{'y'}\" r=\"$fill_radii{$planet}\" " . 
                "stroke=\"black\" stroke-width=\"0\" fill=\"$rec->{'fill'}\" transform=\"rotate(" . -1 * $earth_rotation . " 0 0)\" />\n";

            # draw the label for the current location
            my ($ex, $ey) = is_craft($planet) ? ($mars_label_offset_x, $mars_label_offset_y) : ($planet_label_offset_x, $planet_label_offset_y);
            my ($lx, $ly) = rotate($planet, $rec->{'x'}, $rec->{'y'}, -1 * $earth_rotation);
            print OUT "<text id=\"label-$planet\" x=\"" . ($lx+$ex) . "\" y=\"" . ($ly+$ey) . 
                " font-size=\"10\" fill=\"DarkGrey\" transform=\"rotate(0 0 0)\">$rec->{'name'}</text>\n";              

            # print OUT "<text x=\"" . ($rec->{'x'}) . "\" y=\"" . ($rec->{'y'}) . 
                # " font-size=\"10\" fill=\"white\" transform=\"rotate(" . -1 * $earth_rotation . " 0 0)\"   >$rec->{'name'}</text>\n";              

            print OUT "\n";
        }
    }
    
    # Draw MOM / MAVEN orbits

    foreach my $planet (@planets) {
    	next unless(is_craft($planet));
	    my %svg_params = %{$orbits{$planet}->{'svg_params'}};
	    foreach my $jdct (sort keys %svg_params) {
	        next if ($jdct == $jd);
	        my $rec = $svg_params{$jdct};
	        print OUT "<circle id=\"orbitpoint-$planet\" cx=\"$rec->{'x'}\" cy=\"$rec->{'y'}\" r=\"1\" " . 
	            "stroke=\"black\" stroke-width=\"0\" fill=\"$rec->{'fill'}\" transform=\"rotate(" . -1 * $earth_rotation . " 0 0)\" />\n";
	    }
    }
   
    print OUT <<"EOT";
</g>
<div/>
</svg> 

<style type="text/css">
.blurb {
  color: DarkGrey;
  font-size: x-small;
  font-family: sans-serif;  
}
.info {
  color: DarkGrey;
  font-size: x-small;
  font-family: sans-serif;  
}
.date {
  color: DarkGrey;
  font-size: x-small;
  font-family: sans-serif;      
}
.background {
  background-color: black; 
  /*background-image: */
}

</body>
</html>
EOT

        close OUT;
        return 1;
    } else {
        print_err("Failed to generate HTML file: $!");
        return 0;
    }
}

sub main {

	set_start_and_stop_times();

    GetOptions("use-cache" => \$use_cached_data);

    if ($use_cached_data) {
        load_cached_data();
    }

    print_debug("Using a JD of $jd");

    foreach my $planet (@planets) {
        
        unless ($use_cached_data) {

            fetch_elements($planet);
            fetch_vectors($planet);
        
            fetch_horizons_data($planet, {
                'table_type' => 'vectors',
                'range' => 1,
                'start_time' => $start_time,
                'stop_time' => $stop_time,
                'step_size' => $step_size});        
            
        }
    }

    unless ($use_cached_data) {
    	save_fetched_data();
    }
    
    foreach my $planet (@planets) {

        parse_horizons_elements('elements', $planet);
        parse_horizons_elements('vectors', $planet);
        my $svg_params = generate_svg_params($planet);
        $orbits{$planet}->{'svg_params'} = $svg_params;
    }

    save_orbit_data();

    generate_html("mom.html");
}

main;

# end of file
