# Copyright (c) 2024 Sankaranarayanan Viswanathan. All rights reserved.

# Assistance from Cursor AI was used to write this code based on the Perl version. 

import argparse
import os
import sys
import time
from datetime import datetime
import calendar
import requests
import json
from datetime import datetime, timezone
import re

# constants - ephemerides related

JPL_MAVEN      = -202
JPL_CY2        = -152 # Chandrayaan 2 Orbiter
JPL_CY2_VIKRAM = -153 # Chandrayaan 2 Lander Vikram
JPL_CY3        = -158 # Chandrayaan 3 Orbiter
JPL_CY3_VIKRAM = -153 # Chandrayaan 3 Lander Vikram # TODO Change later
LRO            = -85  # Lunar Reconnaissance Orbiter
JPL_MOM        = -3
JPL_EMB        = 3
JPL_SUN        = 10
JPL_MERCURY    = 199
JPL_VENUS      = 299
JPL_MOON       = 301
JPL_EARTH      = 399
JPL_MARS       = 499
JPL_CSS        = "C/2013 A1"

JPL_EARTH_CENTER = '@399'
JPL_MARS_CENTER = '@499'
JPL_SUN_CENTER = '500@10'
JPL_MOON_CENTER = '@301'

planet_codes = {
    "MAVEN":    JPL_MAVEN,
    "CY2":      JPL_CY2,
    "CY3":      JPL_CY3,
    "VIKRAM":   JPL_CY3_VIKRAM,
    "LRO":      LRO,
    "MOM":      JPL_MOM,
    "EMB":      JPL_EMB,
    "SUN":      JPL_SUN,
    "MERCURY":  JPL_MERCURY,
    "VENUS":    JPL_VENUS,
    "MOON":     JPL_MOON,
    "EARTH":    JPL_EARTH,
    "MARS":     JPL_MARS,
    "CSS":      JPL_CSS
}

help = False
phase = None
use_cached_data = False
date = datetime.now().strftime('%Y-%m-%d')
data_dir = os.path.join("data-fetched", date)
debugging = True

config = {
    "geo": {
        'start_year'           : '2023', 'start_month'           : '07', 'start_day'           : '14', 'start_hour'              : '09', 'start_minute'             : '23', 
        'stop_year'            : '2023', 'stop_month'            : '09', 'stop_day'            : '06', 'stop_hour'               : '12', 'stop_minute'              : '33',
        'start_year_CY3'       : '2023', 'start_month_CY3'       : '07', 'start_day_CY3'       : '14', 'start_hour_CY3'          : '09', 'start_minute_CY3'         : '23',
        'stop_year_CY3'        : '2023', 'stop_month_CY3'        : '09', 'stop_day_CY3'        : '06', 'stop_hour_CY3'           : '12', 'stop_minute_CY3'          : '33',
        'start_year_vikram'    : '2023', 'start_month_vikram'    : '09', 'start_day_vikram'    : '14', 'start_hour_vikram'       : '09', 'start_minute_vikram'      : '23',
        'stop_year_vikram'     : '2023', 'stop_month_vikram'     : '09', 'stop_day_vikram'     : '06', 'stop_hour_vikram'        : '12', 'stop_minute_vikram'       : '33',

        'step_size_in_minutes' : 1,

        'planets'              : ["MOON", "CY3"], # TODO Add Vikram later

        'center'               : JPL_EARTH_CENTER,

        'orbits_file'          : f"{data_dir}/geo-CY3.json"
    },
    "lunar": {
        'start_year'           : '2023', 'start_month'           : '07', 'start_day'           : '14', 'start_hour'              : '09', 'start_minute'             : '23', 
        'stop_year'            : '2023', 'stop_month'            : '09', 'stop_day'            : '06', 'stop_hour'               : '12', 'stop_minute'              : '33',
        'start_year_CY3'       : '2023', 'start_month_CY3'       : '07', 'start_day_CY3'       : '14', 'start_hour_CY3'          : '09', 'start_minute_CY3'         : '23',
        'stop_year_CY3'        : '2023', 'stop_month_CY3'        : '09', 'stop_day_CY3'        : '06', 'stop_hour_CY3'           : '12', 'stop_minute_CY3'          : '33',
        'start_year_vikram'    : '2023', 'start_month_vikram'    : '09', 'start_day_vikram'    : '14', 'start_hour_vikram'       : '09', 'start_minute_vikram'      : '23',
        'stop_year_vikram'     : '2023', 'stop_month_vikram'     : '09', 'stop_day_vikram'     : '06', 'stop_hour_vikram'        : '12', 'stop_minute_vikram'       : '33',

        'step_size_in_minutes' : 1,

        'planets'              : ["CY3", "EARTH"], # TODO Add Vikram later

        'center'               : JPL_MOON_CENTER,

        'orbits_file'          : f"{data_dir}/lunar-CY3.json"
    },
    "lro": {
        'start_year'           : '2023', 'start_month'           : '07', 'start_day'           : '14', 'start_hour'              : '09', 'start_minute'             : '23', 
        'stop_year'            : '2023', 'stop_month'            : '09', 'stop_day'            : '06', 'stop_hour'               : '12', 'stop_minute'              : '33',
        'start_year_CY3'       : '2023', 'start_month_CY3'       : '07', 'start_day_CY3'       : '14', 'start_hour_CY3'          : '09', 'start_minute_CY3'         : '23',
        'stop_year_CY3'        : '2023', 'stop_month_CY3'        : '09', 'stop_day_CY3'        : '06', 'stop_hour_CY3'           : '12', 'stop_minute_CY3'          : '33',
        'start_year_vikram'    : '2023', 'start_month_vikram'    : '09', 'start_day_vikram'    : '14', 'start_hour_vikram'       : '09', 'start_minute_vikram'      : '23',
        'stop_year_vikram'     : '2023', 'stop_month_vikram'     : '09', 'stop_day_vikram'     : '06', 'stop_hour_vikram'        : '12', 'stop_minute_vikram'       : '33',

        'step_size_in_minutes' : 5,

        'planets'              : ["CY3", "LRO", "EARTH"], # TODO Add Vikram later

        'center'               : JPL_MOON_CENTER,

        'orbits_file'          : f"{data_dir}/lunar-lro.json"
    },
    "landing": {
        'start_year'           : '2023', 'start_month'           : '08', 'start_day'           : '23', 'start_hour'              : '12', 'start_minute'             : '15', 
        'stop_year'            : '2023', 'stop_month'            : '08', 'stop_day'            : '23', 'stop_hour'               : '12', 'stop_minute'              : '40',
        'start_year_CY3'       : '2023', 'start_month_CY3'       : '08', 'start_day_CY3'       : '23', 'start_hour_CY3'          : '12', 'start_minute_CY3'         : '15',
        'stop_year_CY3'        : '2023', 'stop_month_CY3'        : '08', 'stop_day_CY3'        : '23', 'stop_hour_CY3'           : '12', 'stop_minute_CY3'          : '40',
        'start_year_vikram'    : '2023', 'start_month_vikram'    : '08', 'start_day_vikram'    : '23', 'start_hour_vikram'       : '12', 'start_minute_vikram'      : '15',
        'stop_year_vikram'     : '2023', 'stop_month_vikram'     : '08', 'stop_day_vikram'     : '23', 'stop_hour_vikram'        : '12', 'stop_minute_vikram'       : '40',

        'step_size_in_minutes' : 1500, # TODO jugaad to get 1800 seconds of data -- see below

        'planets'              : ["CY3"], # TODO Add Vikram later

        'center'               : JPL_MOON_CENTER,

        'orbits_file'          : f"{data_dir}/landing-CY3.json"
    },
}

# Initialize variables
start_year, start_month, start_day, start_hour, start_minute = None, None, None, None, None
stop_year, stop_month, stop_day, stop_hour, stop_minute = None, None, None, None, None
start_year_CY3, start_month_CY3, start_day_CY3, start_hour_CY3, start_minute_CY3 = None, None, None, None, None
stop_year_CY3, stop_month_CY3, stop_day_CY3, stop_hour_CY3, stop_minute_CY3 = None, None, None, None, None
step_size_in_minutes = None
start_year_vikram, start_month_vikram, start_day_vikram, start_hour_vikram, start_minute_vikram = None, None, None, None, None
stop_year_vikram, stop_month_vikram, stop_day_vikram, stop_hour_vikram, stop_minute_vikram = None, None, None, None, None

planets = []
center = None
orbits_file = None

# global data structures

start_time_gm = 0  # set later in code
stop_time_gm = 0   # set later in code
start_time = ''    # set later in code 
stop_time = ''     # set later in code
step_size = ''     # set later in code

now = time.time()

def my_jd(t):
    return 2440587.5 + (t / 86400)

jd = my_jd(now)
gmtime = time.gmtime(now)
orbits_raw = {}
orbits = {}

def filename_for_planet(fn):
    retfn = fn.replace('/', '_')
    print_debug(f"planet={fn}, filename={retfn}")
    return retfn

def init_config(option):
    global start_year, start_month, start_day, start_hour, start_minute
    global stop_year, stop_month, stop_day, stop_hour, stop_minute
    global start_year_CY3, start_month_CY3, start_day_CY3, start_hour_CY3, start_minute_CY3
    global stop_year_CY3, stop_month_CY3, stop_day_CY3, stop_hour_CY3, stop_minute_CY3
    global start_year_vikram, start_month_vikram, start_day_vikram, start_hour_vikram, start_minute_vikram
    global stop_year_vikram, stop_month_vikram, stop_day_vikram, stop_hour_vikram, stop_minute_vikram
    global step_size_in_minutes, planets, center, orbits_file

    start_year = config[option]['start_year']
    start_month = config[option]['start_month']
    start_day = config[option]['start_day']
    start_hour = config[option]['start_hour']
    start_minute = config[option]['start_minute']

    stop_year = config[option]['stop_year']
    stop_month = config[option]['stop_month']
    stop_day = config[option]['stop_day']
    stop_hour = config[option]['stop_hour']
    stop_minute = config[option]['stop_minute']

    start_year_CY3 = config[option]['start_year_CY3']
    start_month_CY3 = config[option]['start_month_CY3']
    start_day_CY3 = config[option]['start_day_CY3']
    start_hour_CY3 = config[option]['start_hour_CY3']
    start_minute_CY3 = config[option]['start_minute_CY3']
    
    start_year_vikram = config[option]['start_year_vikram']
    start_month_vikram = config[option]['start_month_vikram']
    start_day_vikram = config[option]['start_day_vikram']
    start_hour_vikram = config[option]['start_hour_vikram']
    start_minute_vikram = config[option]['start_minute_vikram']

    stop_year_CY3 = config[option]['stop_year_CY3']
    stop_month_CY3 = config[option]['stop_month_CY3']
    stop_day_CY3 = config[option]['stop_day_CY3']
    stop_hour_CY3 = config[option]['stop_hour_CY3']
    stop_minute_CY3 = config[option]['stop_minute_CY3']

    stop_year_vikram = config[option]['stop_year_vikram']
    stop_month_vikram = config[option]['stop_month_vikram']
    stop_day_vikram = config[option]['stop_day_vikram']
    stop_hour_vikram = config[option]['stop_hour_vikram']
    stop_minute_vikram = config[option]['stop_minute_vikram']

    step_size_in_minutes = config[option]['step_size_in_minutes']

    planets = config[option]['planets']

    center = config[option]['center']

    orbits_file = config[option]['orbits_file']

def print_config():
    print(f"(start_year, start_month, start_day, start_hour, start_minute) = ({start_year}, {start_month}, {start_day}, {start_hour}, {start_minute})")
    print(f"(stop_year, stop_month, stop_day, stop_hour, stop_minute) = ({stop_year}, {stop_month}, {stop_day}, {stop_hour}, {stop_minute})")
    print(f"step_size_in_minutes = {step_size_in_minutes}")
    print(f"planets = {', '.join(planets)}")
    print(f"orbits_file = {orbits_file}")

def get_horizons_start_time(planet):
    if planet == "CY3":
        return f"{start_year_CY3}-{start_month_CY3}-{start_day_CY3} {start_hour_CY3}:{start_minute_CY3}"
    elif planet == "VIKRAM":
        return f"{start_year_vikram}-{start_month_vikram}-{start_day_vikram} {start_hour_vikram}:{start_minute_vikram}"
    else:
        return f"{start_year}-{start_month}-{start_day} {start_hour}:{start_minute}"

def get_horizons_stop_time(planet):
    if planet == "CY3":
        return f"{stop_year_CY3}-{stop_month_CY3}-{stop_day_CY3} {stop_hour_CY3}:{stop_minute_CY3}"
    elif planet == "VIKRAM":
        return f"{stop_year_vikram}-{stop_month_vikram}-{stop_day_vikram} {stop_hour_vikram}:{stop_minute_vikram}"
    else:
        return f"{stop_year}-{stop_month}-{stop_day} {stop_hour}:{stop_minute}"    
    

def set_start_and_stop_times():
    global start_time, start_time_gm, stop_time, stop_time_gm, step_size, jd

    start_time = f"{start_year}-{start_month}-{start_day}"
    start_time_gm = calendar.timegm((int(start_year), int(start_month), int(start_day), 
                                     int(start_hour), int(start_minute), 0))

    stop_time = f"{stop_year}-{stop_month}-{stop_day}"
    stop_time_gm = calendar.timegm((int(stop_year), int(stop_month), int(stop_day), 
                                    int(stop_hour), int(stop_minute), 0))

    step_size = f"{step_size_in_minutes}" + ("" if phase == "landing" else " m")  # TODO jugaad for landing resolution

    # Calculate JD for start time
    jd = my_jd(start_time_gm)

def print_debug(msg):
    if debugging:
        print(f"DEBUG: {msg}")

def print_error(msg):
    print(f"Error: {msg}", file=sys.stderr)

def my_jd(t):
    return 2440587.5 + (t / 86400)

def is_craft(planet):
    return (planet < 0) or ((planet == "MOON") and (phase == "geo"))

def save_fetched_data():
    cache_file_name = f"{data_dir}/momcache.txt"
    try:
        with open(cache_file_name, 'w') as fh:
            fh.write(f"jd={jd}\n")
    except IOError as e:
        print_error(f"Failed to write to {cache_file_name}: {e}")

    for planet in planets:
        fn = filename_for_planet(planet)
        
        ho_file_name = f"{data_dir}/ho-{fn}-elements.txt"
        try:
            with open(ho_file_name, 'w') as fh:
                horizons = orbits_raw[planet]['elements_content']
                fh.write(horizons)
        except IOError as e:
            print_error(f"Can't write to {ho_file_name}: {e}")

        ho_file_name = f"{data_dir}/ho-{fn}-vectors.txt"
        try:
            with open(ho_file_name, 'w') as fh:
                horizons = orbits_raw[planet]['vectors_content']
                fh.write(horizons)
        except IOError as e:
            print_error(f"Can't write to {ho_file_name}: {e}")

def save_orbit_data_json():
    print_debug(f"Entering save_orbit_data_json")
    print_debug(f"orbits_file: {orbits_file}")
    
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(orbits_file), exist_ok=True)
        
        with open(orbits_file, 'w') as fh:
            json.dump(orbits, fh, indent=2)
        
        print_debug(f"JSON data written to {orbits_file}")
        
        # Verify the file was created and has content
        if os.path.exists(orbits_file) and os.path.getsize(orbits_file) > 0:
            print_debug(f"File {orbits_file} exists and has content")
        else:
            print_error(f"File {orbits_file} either doesn't exist or is empty")
        
        return True
    except IOError as e:
        print_error(f"IOError when writing to {orbits_file}: {e}")
    except json.JSONEncodeError as e:
        print_error(f"JSON encoding error: {e}")
    except Exception as e:
        print_error(f"Unexpected error when saving JSON: {e}")
    
    return False

def save_orbit_data():
    for planet in planets:
        fn = filename_for_planet(planet)
        ho_file_name = f"{data_dir}/ho-{fn}-orbit.txt"
        try:
            with open(ho_file_name, 'w') as fh:
                elements = orbits[planet]['elements']
                
                # print_debug(f"Planet {planet} has elements at: {','.join(sorted(elements.keys()))}")
                
                for jdct in sorted(elements.keys()):
                    print_elements(fh, elements[jdct])
                    fh.write("\n")
                
                fh.write("\n")
        except IOError as e:
            print_error(f"Can't write to {ho_file_name}: {e}")

def fetch_horizons_data(planet, options):
    table_type_map = {
        'elements': ('ELEMENTS', 'elements_content'),
        'vectors': ('VECTORS', 'vectors_content')
    }
    
    try:
        table_type, content_key = table_type_map[options['table_type']]
    except KeyError:
        raise ValueError(f"Invalid table_type: {options['table_type']}")

    base_url = "https://ssd.jpl.nasa.gov/horizons_batch.cgi"
    params = {
        'batch': '1',
        'COMMAND': f"'{planet_codes[planet]}'",
        'TABLE_TYPE': f"'{table_type}'",
        'CENTER': f"'{center}'",
        'CSV_FORMAT': "'YES'"
    }
    
    if options.get('range'):
        params.update({
            'START_TIME': f"'{options['start_time']}'",
            'STOP_TIME': f"'{options['stop_time']}'",
            'STEP_SIZE': f"'{options['step_size']}'"
        })
    else:
        params['TLIST'] = f"{jd}'"

    print_debug(f"url = {base_url}")
    print_debug(f"params = {params}")

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Raises an HTTPError for bad responses
        
        orbits_raw.setdefault(planet, {})[content_key] = response.text
        return True
    except requests.RequestException as e:
        print_error(f"HTTP request failed: {str(e)}")
        return False

def fetch_elements(planet):
    print_debug(f"Fetching elements for planet {planet} ...")
    status = fetch_horizons_data(planet, {'table_type': 'elements'})
    print_debug(f"Fetching elements for planet {planet} completed.")
    return status

def fetch_vectors(planet):
    print_debug(f"Fetching vectors for planet {planet} ...")
    status = fetch_horizons_data(planet, {'table_type': 'vectors'})
    print_debug(f"Fetching vectors for planet {planet} completed.")
    return status    

import os

def load_cached_data():
    ret_status = True

    print_debug("Entering load_cached_data")

    cache_file = f"{data_dir}/momcache.txt"
    try:
        with open(cache_file, 'r') as cache:
            for line in cache:
                line = line.strip()
                if line.startswith('jd'):
                    global jd
                    jd = float(line.split('=')[1].strip())
                    print_debug(f"jd = {jd}")

        for planet in planets:
            for key in ['elements', 'vectors']:
                pn = filename_for_planet(planet)
                fn = f"{data_dir}/ho-{pn}-{key}.txt"

                if os.path.isfile(fn) and os.access(fn, os.R_OK):
                    try:
                        with open(fn, 'r') as f:
                            content = f.read()
                            if planet not in orbits_raw:
                                orbits_raw[planet] = {}
                            orbits_raw[planet][f"{key}_content"] = content
                    except IOError as e:
                        print_error(f"Unable to open {fn}: {e}")
                        ret_status = False
                        break
                else:
                    print_debug(f"File {fn} not found or not readable")

    except IOError as e:
        print_error(f"Unable to open {cache_file}: {e}")
        ret_status = False

    print_debug("Leaving load_cached_data")
    return ret_status

def parse_horizons_elements(code, planet):
    print_debug(f"Entering parse_horizons_elements: code = {code}, planet = {planet}")

    parse = False
    key = 'elements_content' if code == 'elements' else 'vectors_content'
    lines = orbits_raw[planet][key].split('\n')

    count = 0
    for line in lines:
        if line.startswith('$$SOE'):
            parse = True
            continue
        if line.startswith('$$EOE'):
            parse = False
            continue
        if parse:
            count += 1
            if code == 'elements':
                # Use regex to split the line, handling potential quoted fields
                fields = re.findall(r'(?:[^,"]|"(?:\\.|[^"])*")+', line)
                fields = [field.strip().strip('"') for field in fields]  # Remove leading/trailing spaces and quotes
                
                if len(fields) != 14:
                    print_error(f"Unexpected number of fields in line: {line}")
                    continue

                jdct, date, ec, qr, in_, om, w, tp, n, ma, ta, a, ad, pr = fields
                
                rec = {
                    'jdct': jdct, 'date': date, 'ec': ec, 'qr': qr, 'in': in_, 'om': om,
                    'w': w, 'tp': tp, 'n': n, 'ma': ma, 'ta': ta, 'a': a, 'ad': ad, 'pr': pr
                }

                if planet not in orbits:
                    orbits[planet] = {'elements': {}}
                if 'elements' not in orbits[planet]:
                    orbits[planet]['elements'] = {}
                
                if jdct in orbits[planet]['elements']:
                    # print_debug(f"Merging elements for planet={planet}, jdct={jdct}")
                    orbits[planet]['elements'][jdct].update(rec)
                else:
                    # print_debug(f"Adding elements for planet={planet}, jdct={jdct}")
                    orbits[planet]['elements'][jdct] = rec

            elif code == 'vectors':
                # Use regex to split the line, handling potential quoted fields
                fields = re.findall(r'(?:[^,"]|"(?:\\.|[^"])*")+', line)
                fields = [field.strip().strip('"') for field in fields]  # Remove leading/trailing spaces and quotes
                
                if len(fields) != 11:
                    print_error(f"Unexpected number of fields in line: {line}")
                    continue

                jdct, date, x, y, z, vx, vy, vz, lt, rg, rr = fields
                
                rec = {
                    'jdct': jdct,
                    'x': x, 'y': y, 'z': z,
                    'vx': vy, 'vy': vx, 'vz': vz  # Note: vx and vy are swapped as in original
                }

                if planet not in orbits:
                    orbits[planet] = {'vectors': []}
                if 'vectors' not in orbits[planet]:
                    orbits[planet]['vectors'] = []
                
                orbits[planet]['vectors'].append(rec)

    print_debug(f"Found {count} {code} records for planet {planet}")
    print_debug("Leaving parse_horizons_elements")

    import sys

def print_elements(fh, rec):
    fh.write(f"JDCT = {rec['jdct']}\n")
    fh.write(f"Date = {rec['date']}\n")
    fh.write(f"EC = {rec['ec']}\n")
    fh.write(f"QR = {rec['qr']}\n")
    fh.write(f"IN = {rec['in']}\n")
    fh.write(f"OM = {rec['om']}\n")
    fh.write(f"W = {rec['w']}\n")
    fh.write(f"Tp = {rec['tp']}\n")
    fh.write(f"N = {rec['n']}\n")
    fh.write(f"MA = {rec['ma']}\n")
    fh.write(f"TA = {rec['ta']}\n")
    fh.write(f"A = {rec['a']}\n")
    fh.write(f"AD = {rec['ad']}\n")
    fh.write(f"PR = {rec['pr']}\n")
    # fh.write(f"X = {rec['x']}\n")
    # fh.write(f"Y = {rec['y']}\n")

def main():
    print("Running ...")

    parser = argparse.ArgumentParser(description="Orbit data fetcher and processor")
    parser.add_argument("--phase", choices=['geo', 'lro', 'lunar', 'landing'], default='geo', help="Phase of the mission")
    parser.add_argument("--use-cache", action="store_true", help="Use cached data")
    parser.add_argument("--data-dir", default="./data-fetched/today", help="Data directory")
    
    args = parser.parse_args()

    global phase, use_cached_data, data_dir
    phase = args.phase
    use_cached_data = args.use_cache
    data_dir = args.data_dir

    if not os.path.exists(data_dir):
        try:
            os.makedirs(data_dir)
        except OSError as e:
            print_error(f"Unable to create data directory {data_dir}: {e}")
            sys.exit(1)

    init_config(phase)
    print_config()

    set_start_and_stop_times()

    print_debug(f"Using a JD of {jd} for start time: {start_year}-{start_month}-{start_day} {start_hour}:{start_minute}")

    if use_cached_data:
        load_cached_data()

    for planet in planets:
        if not use_cached_data:
            fetch_elements(planet)
            
            # fetch_vectors(planet)
        
            fetch_horizons_data(planet, {
                'table_type': 'vectors',
                'range': 1,
                'start_time': get_horizons_start_time(planet),
                'stop_time': get_horizons_stop_time(planet),
                'step_size': step_size})        

    if not use_cached_data:
        save_fetched_data()
    
    for planet in planets:
        parse_horizons_elements('elements', planet)
        parse_horizons_elements('vectors', planet)

    save_orbit_data()
    save_orbit_data_json()

if __name__ == "__main__":
    main()