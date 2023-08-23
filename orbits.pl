#!/usr/bin/perl -w

# Copyright (c) 2013 Sankaranarayanan K V. All rights reserved.

use strict;

use Getopt::Long;
use FileHandle;
use LWP;
use Time::Local;
use JSON;

# constants - ephemerides related

my $JPL_MAVEN      = -202;
my $JPL_CY2        = -152; # Chandrayaan 2 Orbiter
my $JPL_CY2_VIKRAM = -153; # Chandrayaan 2 Lander Vikram
my $JPL_CY3        = -158; # Chandrayaan 3 Orbiter
my $JPL_CY3_VIKRAM = -153; # Chandrayaan 3 Lander Vikram # TODO Change later
my $LRO            = -85; # Lunar Reconnaissance Orbiter
my $JPL_MOM        = -3;
my $JPL_EMB        = 3;
my $JPL_SUN        = 10;
my $JPL_MERCURY    = 199;
my $JPL_VENUS      = 299;
my $JPL_MOON       = 301;
my $JPL_EARTH      = 399;
my $JPL_MARS       = 499;
my $JPL_CSS        = "C/2013 A1";

my $JPL_EARTH_CENTER = '@399';
my $JPL_MARS_CENTER = '@499';
my $JPL_SUN_CENTER = '500@10';
my $JPL_MOON_CENTER = '@301';

my %planet_codes = 
    ("MAVEN"    => $JPL_MAVEN,
     "CY2"      => $JPL_CY2,
     "CY3"      => $JPL_CY3,
     "VIKRAM"   => $JPL_CY3_VIKRAM, 
     "LRO"      => $LRO,
     "MOM"      => $JPL_MOM,
     "EMB"      => $JPL_EMB,
     "SUN"      => $JPL_SUN,
     "MERCURY"  => $JPL_MERCURY,
     "VENUS"    => $JPL_VENUS,
     "MOON"     => $JPL_MOON,
     "EARTH"    => $JPL_EARTH,
     "MARS"     => $JPL_MARS,
     "CSS"      => $JPL_CSS);

my $phase;
my $use_cached_data = 0;
my $date = 'today';
chomp($date);
my $data_dir = "data-fetched/" . $date;
my $debugging = 1;

my $config = {

    # TODO Add support for seconds (ss.sss) later

    "geo" => {
        'start_year'       => '2023', 'start_month'       => '07', 'start_day'       => '14', 'start_hour'          => '09', 'start_minute'         => '23', 
        'stop_year'        => '2023', 'stop_month'        => '09', 'stop_day'        => '06', 'stop_hour'           => '12', 'stop_minute'          => '33',
        'start_year_CY3'   => '2023', 'start_month_CY3'   => '07', 'start_day_CY3'   => '14', 'start_hour_CY3'      => '09', 'start_minute_CY3'     => '23',
        'stop_year_CY3'    => '2023', 'stop_month_CY3'    => '09', 'stop_day_CY3'    => '06', 'stop_hour_CY3'       => '12', 'stop_minute_CY3'      => '33',
        'start_year_vikram'=> '2023', 'start_month_vikram'=> '09', 'start_day_vikram'=> '14', 'start_hour_vikram'   => '09', 'start_minute_vikram'  => '23',
        'stop_year_vikram' => '2023', 'stop_month_vikram' => '09', 'stop_day_vikram' => '06', 'stop_hour_vikram'    => '12', 'stop_minute_vikram'   => '33',

        'step_size_in_minutes' => 1,

        'planets' => ["MOON", "CY3"], # TODO Add Vikram later

        'center' => $JPL_EARTH_CENTER,

        'orbits_file' => "$data_dir/geo-CY3.json"
    },
    "lunar" => {
        'start_year'       => '2023', 'start_month'       => '07', 'start_day'       => '14', 'start_hour'          => '09', 'start_minute'         => '23', 
        'stop_year'        => '2023', 'stop_month'        => '09', 'stop_day'        => '06', 'stop_hour'           => '12', 'stop_minute'          => '33',
        'start_year_CY3'   => '2023', 'start_month_CY3'   => '07', 'start_day_CY3'   => '14', 'start_hour_CY3'      => '09', 'start_minute_CY3'     => '23',
        'stop_year_CY3'    => '2023', 'stop_month_CY3'    => '09', 'stop_day_CY3'    => '06', 'stop_hour_CY3'       => '12', 'stop_minute_CY3'      => '33',
        'start_year_vikram'=> '2023', 'start_month_vikram'=> '09', 'start_day_vikram'=> '14', 'start_hour_vikram'   => '09', 'start_minute_vikram'  => '23',
        'stop_year_vikram' => '2023', 'stop_month_vikram' => '09', 'stop_day_vikram' => '06', 'stop_hour_vikram'    => '12', 'stop_minute_vikram'   => '33',

        'step_size_in_minutes' => 1,

        'planets' => ["CY3", "EARTH"], # TODO Add Vikram later

        'center' => $JPL_MOON_CENTER,

        'orbits_file' => "$data_dir/lunar-CY3.json"
    },
    "lro" => {
        'start_year'       => '2023', 'start_month'       => '07', 'start_day'       => '14', 'start_hour'          => '09', 'start_minute'         => '23', 
        'stop_year'        => '2023', 'stop_month'        => '09', 'stop_day'        => '06', 'stop_hour'           => '12', 'stop_minute'          => '33',
        'start_year_CY3'   => '2023', 'start_month_CY3'   => '07', 'start_day_CY3'   => '14', 'start_hour_CY3'      => '09', 'start_minute_CY3'     => '23',
        'stop_year_CY3'    => '2023', 'stop_month_CY3'    => '09', 'stop_day_CY3'    => '06', 'stop_hour_CY3'       => '12', 'stop_minute_CY3'      => '33',
        'start_year_vikram'=> '2023', 'start_month_vikram'=> '09', 'start_day_vikram'=> '14', 'start_hour_vikram'   => '09', 'start_minute_vikram'  => '23',
        'stop_year_vikram' => '2023', 'stop_month_vikram' => '09', 'stop_day_vikram' => '06', 'stop_hour_vikram'    => '12', 'stop_minute_vikram'   => '33',

        'step_size_in_minutes' => 5,

        'planets' => ["CY3", "LRO", "EARTH"], # TODO Add Vikram later

        'center' => $JPL_MOON_CENTER,

        'orbits_file' => "$data_dir/lunar-lro.json"
    },
    "landing" => {
        'start_year'       => '2023', 'start_month'       => '08', 'start_day'       => '23', 'start_hour'          => '12', 'start_minute'         => '15', 
        'stop_year'        => '2023', 'stop_month'        => '08', 'stop_day'        => '23', 'stop_hour'           => '12', 'stop_minute'          => '40',
        'start_year_CY3'   => '2023', 'start_month_CY3'   => '08', 'start_day_CY3'   => '23', 'start_hour_CY3'      => '12', 'start_minute_CY3'     => '15',
        'stop_year_CY3'    => '2023', 'stop_month_CY3'    => '08', 'stop_day_CY3'    => '23', 'stop_hour_CY3'       => '12', 'stop_minute_CY3'      => '40',
        'start_year_vikram'=> '2023', 'start_month_vikram'=> '08', 'start_day_vikram'=> '23', 'start_hour_vikram'   => '12', 'start_minute_vikram'  => '15',
        'stop_year_vikram' => '2023', 'stop_month_vikram' => '08', 'stop_day_vikram' => '23', 'stop_hour_vikram'    => '12', 'stop_minute_vikram'   => '40',

        'step_size_in_minutes' => 1500, # TODO jugaad to get 1800 seconds of data -- see below

        'planets' => ["CY3"], # TODO Add Vikram later

        'center' => $JPL_MOON_CENTER,

        'orbits_file' => "$data_dir/landing-CY3.json"
    },

};

my ($start_year, $start_month, $start_day, $start_hour, $start_minute);
my ($stop_year, $stop_month, $stop_day, $stop_hour, $stop_minute);
my ($start_year_CY3, $start_month_CY3, $start_day_CY3, $start_hour_CY3, $start_minute_CY3);
my ($stop_year_CY3, $stop_month_CY3, $stop_day_CY3, $stop_hour_CY3, $stop_minute_CY3);
my $step_size_in_minutes;
my ($start_year_vikram, $start_month_vikram, $start_day_vikram, $start_hour_vikram, $start_minute_vikram);
my ($stop_year_vikram, $stop_month_vikram, $stop_day_vikram, $stop_hour_vikram, $stop_minute_vikram);

my @planets;
my $center;
my $orbits_file;

# global data structures

my $start_time_gm = 0;  # set later in code
my $stop_time_gm = 0;   # set later in code
my $start_time = '';    # set later in code 
my $stop_time = '';     # set later in code
my $step_size = '';     # set later in code

my $now = time();
sub my_jd($);
my $jd = my_jd($now);
my $gmtime = gmtime($now);
my %orbits_raw;
my %orbits; 

sub filename_for_planet($) {
  my $fn = shift;
  my $retfn = $fn;
  $retfn =~ s/\//_/g;
  print_debug("planet=$fn, filename=$retfn");
  return $retfn;
}

sub init_config ($) {
    my $option = shift;

    $start_year = $config->{$option}->{'start_year'};
    $start_month = $config->{$option}->{'start_month'};
    $start_day = $config->{$option}->{'start_day'};
    $start_hour = $config->{$option}->{'start_hour'};
    $start_minute = $config->{$option}->{'start_minute'};

    $stop_year = $config->{$option}->{'stop_year'};
    $stop_month = $config->{$option}->{'stop_month'};
    $stop_day = $config->{$option}->{'stop_day'};
    $stop_hour = $config->{$option}->{'stop_hour'};
    $stop_minute = $config->{$option}->{'stop_minute'};

    $start_year_CY3 = $config->{$option}->{'start_year_CY3'};
    $start_month_CY3 = $config->{$option}->{'start_month_CY3'};
    $start_day_CY3 = $config->{$option}->{'start_day_CY3'};
    $start_hour_CY3 = $config->{$option}->{'start_hour_CY3'};
    $start_minute_CY3 = $config->{$option}->{'start_minute_CY3'};
    
    $start_year_vikram = $config->{$option}->{'start_year_vikram'};
    $start_month_vikram = $config->{$option}->{'start_month_vikram'};
    $start_day_vikram = $config->{$option}->{'start_day_vikram'};
    $start_hour_vikram = $config->{$option}->{'start_hour_vikram'};
    $start_minute_vikram = $config->{$option}->{'start_minute_vikram'};

    $stop_year_CY3 = $config->{$option}->{'stop_year_CY3'};
    $stop_month_CY3 = $config->{$option}->{'stop_month_CY3'};
    $stop_day_CY3 = $config->{$option}->{'stop_day_CY3'};
    $stop_hour_CY3 = $config->{$option}->{'stop_hour_CY3'};
    $stop_minute_CY3 = $config->{$option}->{'stop_minute_CY3'};

    $stop_year_vikram = $config->{$option}->{'stop_year_vikram'};
    $stop_month_vikram = $config->{$option}->{'stop_month_vikram'};
    $stop_day_vikram = $config->{$option}->{'stop_day_vikram'};
    $stop_hour_vikram = $config->{$option}->{'stop_hour_vikram'};
    $stop_minute_vikram = $config->{$option}->{'stop_minute_vikram'};

    $step_size_in_minutes = $config->{$option}->{'step_size_in_minutes'};

    @planets = @{$config->{$option}->{'planets'}};

    $center = $config->{$option}->{'center'};

    $orbits_file = $config->{$option}->{'orbits_file'};
}

sub print_config() {
    print "(start_year, start_month, start_day, start_hour, start_minute) = ($start_year, $start_month, $start_day, $start_hour, $start_minute)\n";
    print "(stop_year, stop_month, stop_day, $stop_hour, $stop_minute) = ($stop_year, $stop_month, $stop_day, $stop_hour, $stop_minute)\n";
    print "step_size_in_minutes = $step_size_in_minutes\n";
    print "planets = ", join(", ", @planets), "\n";
    print "orbits_file = $orbits_file\n";
} 

sub get_horizons_start_time($) {
    my $planet = shift;

    if ($planet eq "CY3") {
        return "$start_year_CY3\-$start_month_CY3\-$start_day_CY3 $start_hour_CY3:$start_minute_CY3";
    } elsif ($planet eq "VIKRAM") {
        return "$start_year_vikram\-$start_month_vikram\-$start_day_vikram $start_hour_vikram:$start_minute_vikram";
    } else {
        return "$start_year\-$start_month\-$start_day $start_hour:$start_minute";
    }
}

sub get_horizons_stop_time($) {
    my $planet = shift;

    if ($planet eq "CY3") {
        return "$stop_year_CY3\-$stop_month_CY3\-$stop_day_CY3 $stop_hour_CY3:$stop_minute_CY3";
    } elsif ($planet eq "VIKRAM") {
        return "$stop_year_vikram\-$stop_month_vikram\-$stop_day_vikram $stop_hour_vikram:$stop_minute_vikram";
    } else {
        return "$stop_year\-$stop_month\-$stop_day $stop_hour:$stop_minute";
    }
}

sub set_start_and_stop_times () {

    $start_time ="$start_year\-$start_month\-$start_day";
    $start_time_gm = timegm(0, 0, 0, $start_day, $start_month-1, $start_year);

    $stop_time ="$stop_year\-$stop_month\-$stop_day";
    $stop_time_gm = timegm(0, 0, 0, $stop_day, $stop_month-1, $stop_year);

    $step_size = "${step_size_in_minutes}" . ($phase eq "landing" ? "" : "%20m"); # TODO jugaad for landing resolution
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
    return ($planet < 0) || (($planet == "MOON") && ($phase eq "geo"));
}

sub save_fetched_data () {

    my $cache_file_name = "$data_dir/momcache.txt";
    my $fh = FileHandle->new;
    unless ($fh->open(">$cache_file_name")) {
        print_error("Faield to write to $cache_file_name: $!");
    }
    print $fh "jd=$jd\n";
    close $fh;

    foreach my $planet (@planets) {
        
        my $fn = filename_for_planet($planet);
        my $ho_file_name = "$data_dir/ho-$fn-elements.txt";
        my $fh = FileHandle->new;
        unless ($fh->open(">$ho_file_name")) {
            print_error("Can't write to $ho_file_name: $!");
        }
        my $horizons = $orbits_raw{$planet}->{'elements_content'};
        print $fh $horizons;
        close $fh;

        $ho_file_name = "$data_dir/ho-$fn-vectors.txt";
        $fh = FileHandle->new;
        unless ($fh->open(">$ho_file_name")) {
            print_error("Can't write to $ho_file_name: $!");
        }
        $horizons = $orbits_raw{$planet}->{'vectors_content'};
        print $fh $horizons;
        close $fh;
    }
} 

sub save_orbit_data_json() {
    my $json = JSON->new;
    
    my $utf8_encoded_json_text = $json->canonical->encode(\%orbits);

    my $json_file_name = $orbits_file;
    my $fh = FileHandle->new;
    unless ($fh->open(">$json_file_name")) {
        print_error("Can't write to $json_file_name: $!");
        return 0;
    }
    print $fh $utf8_encoded_json_text;
    close $fh;
    return 1;
}

sub save_orbit_data () {

    foreach my $planet (@planets) {
        
        my $fn = filename_for_planet($planet);
        my $ho_file_name = "$data_dir/ho-$fn-orbit.txt";
        my $fh = FileHandle->new;
        unless ($fh->open(">$ho_file_name")) {
            print_error("Can't write to $ho_file_name: $!");
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

    if ($options->{'table_type'} eq 'elements') {
        $table_type = 'ELEMENTS';
        $content_key = 'elements_content';
    } elsif ($options->{'table_type'}  eq 'vectors') {
        $table_type = 'VECTORS';
        $content_key = 'vectors_content';
    }

    my $url = "https://ssd.jpl.nasa.gov/horizons_batch.cgi?batch=1";
    $url = $url . "&COMMAND='" . $planet_codes{$planet} . "'";
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
        $orbits_raw{$planet}->{$content_key} .= $res->content;
        return 1;
    }
    else {
        print_error("HTTP request failed: " . $res->status_line);
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
                my $pn = filename_for_planet($planet);
                my $fn = "$data_dir/ho-$pn-$key.txt";

                if (-r $fn) {
                    if (open IN, "<$fn") {

                        while (my $line = <IN>) {
                            $orbits_raw{$planet}->{"${key}_content"} .= $line;  
                        }
                        
                        close IN;

                    } else {
                        print_error("Unabled to open $fn: $!");
                        $ret_status = 0;
                        last;
                    }
                }           
            }
        }
        close CACHE;
    } else {
        print_error("Unable to open $cache_file: $!");
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
    my @lines = split("\n", $orbits_raw{$planet}->{$key});

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

                if (exists $orbits{$planet}->{'elements'}->{$jdct}) {
                    # print_debug("Merging elements for planet=$planet, jdct=$jdct");
                    my $exrec = $orbits{$planet}->{'elements'}->{$jdct};
                    @$exrec{keys %$rec} = values %$rec;
                } else {
                    # print_debug("Adding elements for planet=$planet, jdct=$jdct");
                    $orbits{$planet}->{'elements'}->{$jdct} = $rec;
                }
            
            } elsif ($code eq 'vectors') {

                my ($jdct, $date, $x, $y, $z, $vx, $vy, $vz, $lt, $rg, $rr) = split(/,\s*/, $line);

                my $rec;
                $rec->{'jdct'} = $jdct;
                # $rec->{'date'} = $date;
                $rec->{'x'} = $x;
                $rec->{'y'} = $y;
                $rec->{'z'} = $z;
                $rec->{'vx'} = $vy;
                $rec->{'vy'} = $vx;
                $rec->{'vz'} = $vz;
                # $rec->{'lt'} = $lt;
                # $rec->{'rg'} = $rg;
                # $rec->{'rr'} = $rr;

                push @{$orbits{$planet}->{'vectors'}}, $rec;
                
                # if (exists $orbits{$planet}->{'vectors'}->{$jdct}) {
                # 	# print_debug("Merging vectors for planet=$planet, jdct=$jdct");
                #     my $exrec = $orbits{$planet}->{'vectors'}->{$jdct};
                #     @$exrec{keys %$rec} = values %$rec;
                # } else {
                # 	# print_debug("Merging vectors for planet=$planet, jdct=$jdct");
                #     $orbits{$planet}->{'vectors'}->{$jdct} = $rec;
                # }
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
    # print $fh "X = ", $rec->{'x'}, "\n";
    # print $fh "Y = ", $rec->{'y'}, "\n";
}

sub main {

    print "Running ...\n";

    GetOptions(
        "phase=s" => \$phase, 
        "use-cache" => \$use_cached_data,
        "data-dir=s" => \$data_dir);

    unless (-d $data_dir) {
      unless (mkdir($data_dir)) {
        print_error("Unable to create data directory $data_dir");
        exit(1);
      }
    }

    $phase = 'geo' unless $phase; # Set default as geo for Chandrayaan 2

    unless (($phase eq "geo") || ($phase eq "lro") || ($phase eq "lunar") || ($phase eq "landing")) {
        print_error("Argument 'phase' must be either 'geo' or 'helio' or 'lunar' (without quotes).");
        exit(1);
    }

    init_config($phase);
    print_config();

    set_start_and_stop_times();

    if ($use_cached_data) {
        load_cached_data();
    }

    print_debug("Using a JD of $jd");

    foreach my $planet (@planets) {
        
        unless ($use_cached_data) {

            fetch_elements($planet);
            
            # fetch_vectors($planet);
        
            fetch_horizons_data($planet, {
                'table_type' => 'vectors',
                'range' => 1,
                'start_time' => get_horizons_start_time($planet),
                'stop_time' => get_horizons_stop_time($planet),
                'step_size' => $step_size});        
            
        }
    }

    unless ($use_cached_data) {
        save_fetched_data();
    }
    
    foreach my $planet (@planets) {

        parse_horizons_elements('elements', $planet);
        parse_horizons_elements('vectors', $planet);
    }

    save_orbit_data();
    save_orbit_data_json();
}

main;

# end of file
