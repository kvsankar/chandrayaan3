#!/usr/bin/perl

use strict;

use FileHandle;
use LWP;

my %orbits; 
my $km_per_au = 149597870.691;
my $pixels_per_au = 100; 
my $earth_rotation = 0;

my $MOM = -3;
my $SUN = 10;
my $MERCURY = 199;
my $VENUS = 299;
my $EARTH = 399;
my $MARS = 499;
my $JUPITER = 599;
my @planets = ($MERCURY, $VENUS, $EARTH, $MARS, $MOM);
my %fills = ($MERCURY => 'orange', $VENUS => 'grey', $MARS => 'red', $EARTH => 'blue', $MOM => 'purple');
my %names = ($SUN => 'Sun', $MERCURY => 'Mercury', $VENUS => 'Venus', $MARS => 'Mars', $EARTH => 'Earth', $MOM => 'MOM');
my $data_dir = ".";
my $debugging = 1;

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

sub save_data () {

	foreach my $planet (@planets) {
		
		my $ho_file_name = "$data_dir/ho-$planet-elements.txt";
		my $fh = FileHandle->new;
		$fh->open(">$ho_file_name") or die "Can't write to $ho_file_name: $!\n";
		my $horizons = $orbits{$planet}->{'elements_content'};
		print $fh $horizons;
		close $fh;

		$ho_file_name = "$data_dir/ho-$planet-vectors.txt";
		$fh = FileHandle->new;
		$fh->open(">$ho_file_name") or die "Can't write to $ho_file_name: $!\n";
		$horizons = $orbits{$planet}->{'vectors_content'};
		print $fh $horizons;
		close $fh;

		$ho_file_name = "$data_dir/ho-$planet-orbit.txt";
		$fh = FileHandle->new;
		$fh->open(">$ho_file_name") or die "Can't write to $ho_file_name: $!\n";
		my $elements = $orbits{$planet}->{'elements'};
		print_elements($fh, $elements);
		print $fh "\n";
		close $fh;
	}
		

} 

sub fetch_horizons_data ($$) {
	my $code = shift;
	my $planet = shift;

	my $table_type;
	my $content_key;
	my $center;

	if ($code eq 'elements') {
		$table_type = 'ELEMENTS';
		$content_key = 'elements_content';
	} elsif ($code eq 'vectors') {
		$table_type = 'VECTORS';
		$content_key = 'vectors_content';
	}

	if ($planet == $MOM) {
		$center = '399';
	} else {
		$center = '500@10';
	}

	my $jd = my_jd(time());
	my $url = "http://ssd.jpl.nasa.gov/horizons_batch.cgi?batch=1";
	$url = $url . "&COMMAND='" . $planet . "'";
	# $url = $url . "&MAKE_EPHEM='YES'";
	$url = $url . "&TABLE_TYPE='$table_type'";
	$url = $url . "&CENTER='$center'";
	$url = $url . "&TLIST=$jd'";
	# $url = $url . "&START_TIME='2013-11-16'";
	# $url = $url . "&STOP_TIME='2013-11-17'";
	# $url = $url . "&STEP_SIZE='1%20d'";  
    # $url += "&QUANTITIES='1,9,20,23,24'";
    $url = $url . "&CSV_FORMAT='YES'";

    print_debug("url = $url");

 	use LWP::UserAgent;
  	my $ua = LWP::UserAgent->new;
  	# $ua->agent("MyApp/0.1 ");

  	# Create a request
 	my $req = HTTP::Request->new(GET => $url);

	# Pass request to the user agent and get a response back
  	my $res = $ua->request($req);

	# Check the outcome of the response
	if ($res->is_success) {
		$orbits{$planet}->{$content_key} = $res->content;
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
	my $status = fetch_horizons_data('elements', $planet);
	print_debug("Fetching elements for planet $planet completed.");
	return $status;
}

sub fetch_vectors ($) {
	my $planet = shift;
	print_debug("Fetching vectors for planet $planet ...");
	my $status = fetch_horizons_data('vectors', $planet);
	print_debug("Fetching vectors for planet $planet completed.");
	return $status;
}

sub parse_horizons_elements ($$) {
	my $code = shift;
	my $planet = shift;

	print_debug("Entering parse_horizons_elements: code = $code, planet = $planet");

	my $parse = 0;

	my $key = ($code eq 'elements') ? 'elements_content' : 'vectors_content';
	my @lines = split("\n", $orbits{$planet}->{$key});

	foreach my $line (@lines) {
		if ($line =~ /^\$\$SOE/) {
			$parse = 1;
			next;
		}
		if ($line =~ /^\$\$EOE/) {
			$parse = 0;
			last;
		}
		if ($parse) {

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
					$earth_rotation = $rec->{'om'} + $rec->{'w'};
					while ($earth_rotation >= 360.0) { $earth_rotation -= 360.0; }
					$earth_rotation = -1 * $earth_rotation;
					print_debug "earth_rotation = $earth_rotation";
				}

				if (exists $orbits{$planet}->{'elements'}) {
					my $exrec = $orbits{$planet}->{'elements'};
					@$exrec{keys %$rec} = values %$rec;
				} else {
					print "Adding elements data for object $planet\n";
					$orbits{$planet}->{'elements'} = $rec;
				}
			
			} elsif ($code eq 'vectors') {

				my ($jdct, $date, $x, $y) = split(/,\s*/, $line);

				my $rec;
				$rec->{'x'} = $x;
				$rec->{'y'} = $y;

				if (exists $orbits{$planet}->{'elements'}) {
					my $exrec = $orbits{$planet}->{'elements'};
					@$exrec{keys %$rec} = values %$rec;
				} else {
					print "Adding vectors data for object $planet\n";
					$orbits{$planet}->{'elements'} = $rec;
				}
			}
			
		}
	}

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

	print_debug "Entering generate_svg_params";

	my $svg_params;
	my $rec = $orbits{$planet}->{'elements'};

	# om - longitude of ascending node
	# w  - argument of perifocus
	my $angle = $rec->{'om'} + $rec->{'w'};
	while ($angle >= 360.0) { $angle -= 360.0; }
	$svg_params->{'orbit_rotation'} = -1 * $angle;
	$svg_params->{'orbit_rotation'} += 90.0;
	$svg_params->{'planet_rotation'} = $earth_rotation;
	$svg_params->{'cx'} = ($pixels_per_au * $rec->{'a'} / $km_per_au) * $rec->{'ec'};
	$svg_params->{'rx'} = ($pixels_per_au * $rec->{'a'} / $km_per_au);
	$svg_params->{'ry'} = ($pixels_per_au * $rec->{'a'} / $km_per_au) * (1 - ($rec->{'ec'} * $rec->{'ec'}));
	$svg_params->{'x'} = ($pixels_per_au * $rec->{'x'} / $km_per_au); 
	$svg_params->{'y'} = -1 * ($pixels_per_au * $rec->{'y'} / $km_per_au); # y is up in co-ordinates; but down in screen
	$svg_params->{'fill'} = $fills{$planet} || 'black';
	$svg_params->{'name'} = $names{$planet} || 'unknown';

	print_debug "Leaving generate_svg_params";

	return $svg_params;
}

sub generate_html ($) {
	my $filename = shift;

	open OUT, ">$filename" or die "Can't create '$filename': $!";

	print OUT <<"EOT";
<!DOCTYPE html>
<html>
<body>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<g transform="translate(300 ,300)">
EOT

	# Sun
	print OUT "<circle cx=\"0\" cy=\"0\" r=\"5\" " . 
		    "stroke=\"red\" stroke-width=\"0\" fill=\"black\" transform=\"rotate(0 0 0)\" />\n";

	foreach my $planet (@planets) {
		my $rec = $orbits{$planet}->{'svg_params'};

		print OUT "<ellipse cx=\"$rec->{'cx'}\" cy=\"0\" rx=\"$rec->{'rx'}\" ry=\"$rec->{'ry'}\" " . 
		    "stroke=\"black\" stroke-width=\"2\" fill=\"none\" transform=\"rotate(" . $rec->{'orbit_rotation'} . " 0 0)\" />\n";

		print OUT "<circle cx=\"$rec->{'x'}\" cy=\"$rec->{'y'}\" r=\"5\" " . 
		    "stroke=\"black\" stroke-width=\"0\" fill=\"$rec->{'fill'}\" transform=\"rotate(" . $earth_rotation . " 0 0)\" />\n";

		# print OUT "<text x=\"" . ($rec->{'x'} + 10) . "\" y=\"" . ($rec->{'y'} + 10) . 
		    # " font-size=\"10\" fill=\"black\" transform=\"rotate(" . $earth_rotation . " 0 0)\"	>$rec->{'name'}</text>\n";
			
	}
   

   print OUT <<"EOT";
</g>
</svg> 
 
</body>
</html>
EOT

	close OUT;
}

sub main {


	foreach my $planet (@planets) {
		
		fetch_elements($planet);
		fetch_vectors($planet);
		parse_horizons_elements('elements', $planet);
		parse_horizons_elements('vectors', $planet);

		my $svg_params = generate_svg_params($planet);
		
		$orbits{$planet}->{'svg_params'} = $svg_params;
	}
	
	save_data();
	generate_html("orbits.html");
}

main;

# end of file