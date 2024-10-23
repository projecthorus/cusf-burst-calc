/*
    Code Copyright (c) 2013 Adam Greig, Rossen Georgiev

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    Underlying maths: Adam Greig, Steve Randall
    Balloon data from Kaymont, Hwoyee.
 */

function get_value(id) {
    return parseFloat(document.getElementById(id).value);
}

function clear_errors() {
    $("#result").removeClass('error').removeClass('warning').text('Result');
}

function set_error(id, text) {
    $("#result").addClass('error').text(text);
}

function set_warning(id, text) {
    text = "Result (" + text + ")";
    $("#result").addClass('warning').text(text);
}
function sanity_check_inputs(balloon_model, payload_mass_g, payload_mass_set, target_ascent_rate, target_burst_altitude, target_ascent_rate_set, target_burst_altitude_set) {
    if(target_ascent_rate_set && target_burst_altitude_set) {
        set_error('target_ascent_rate', "Specify either target burst altitude or target ascent rate!");
        set_error('target_burst_altitude', "Specify either target burst altitude or target ascent rate!");
        return 1;
    } else if(!target_ascent_rate_set && !target_burst_altitude_set) {
        set_error('target_ascent_rate', "Must specify at least one target!");
        set_error('target_burst_altitude', "Must specify at least one target!");
        return 1;
    }

    if(target_ascent_rate_set && target_ascent_rate < 0) {
        set_error('target_ascent_rate', "Target ascent rate can't be negative!");
        return 1;
    } else if(target_ascent_rate_set && target_ascent_rate > 10) {
        set_error('target_ascent_rate', "Target ascent rate is too large! (more than 10m/s)");
        return 1;
    }

    if(target_burst_altitude_set && target_burst_altitude < 10000) {
        set_error('target_burst_altitude', "Target burst altitude is too low! (less than 10km)");
        return 1;
    } else if(target_burst_altitude_set && target_burst_altitude > 40000) {
        set_error('target_burst_altitude',
            "Target burst altitude is too high! (greater than 40km)");
        return 1;
    }

    if(!payload_mass_set) {
        set_error('payload_mass_g', "You have to enter a payload mass!");
        return 1;
    } else if(payload_mass_g < 10) {
        set_error('payload_mass_g', "Mass is too small! (less than 10g)");
        return 1;
    } else if(payload_mass_g > 20000) {
        set_error('payload_mass_g', "Mass is too large! (over 20kg)");
        return 1;
    }

    return 0;

}

function sanity_check_constants(rho_gas, rho_air, adm, gravity_accel, burst_diameter, drag_coeff) {
    if(!rho_air || rho_air < 0) {
        set_error('rho_air',"You need to specify a valid air density. (0<Ad)");
        return 1;
    }
    if(!rho_gas || rho_gas < 0) {
        set_error('rho_gas',"You need to specify a valid gas density. (0<Gd)");
        return 1;
    }
    if(rho_gas > rho_air) {
        set_error('rho_gas',"Air density is less the gas density.");
        return 1;
    }
    if(!adm || adm < 0) {
        set_error('adm',"You need to specify a valid air density model. (0<Adm)");
        return 1;
    }
    if(!gravity_accel || gravity_accel <= 0) {
        set_error('gravity_accel',"You need to specify a valid gravitational acceleration. (0<Ga)");
        return 1;
    }
    if(!drag_coeff || drag_coeff < 0 || drag_coeff > 1) {
        set_error('drag_coeff',"You need to specify a valid drag coefficient. (0≤Cd≤1)");
        return 1;
    }
    if(!burst_diameter || burst_diameter <= 0) {
        set_error('burst_diameter',"You need to specify a valid burst diameter. (0<Bd)");
        return 1;
    }

    return 0;
}

function find_rho_gas() {
    var gas = document.getElementById('gas').value;
    var rho_gas;

    switch(gas) {
        case 'he':
            rho_gas = 0.1786;
            document.getElementById('rho_gas').value = rho_gas;
            document.getElementById('rho_gas').disabled = "disabled";
            break;
        case 'h':
            rho_gas = 0.0899;
            document.getElementById('rho_gas').value = rho_gas;
            document.getElementById('rho_gas').disabled = "disabled";
            break;
        case 'ch4':
            rho_gas = 0.6672;
            document.getElementById('rho_gas').value = rho_gas;
            document.getElementById('rho_gas').disabled = "disabled";
            break;
        case 'boc':
            rho_gas = 0.21076;
            document.getElementById('rho_gas').value = rho_gas;
            document.getElementById('rho_gas').disabled = "disabled";
            break;
        default:
            document.getElementById('rho_gas').disabled = "";
            rho_gas = get_value('rho_gas');
            break;
    }

    return rho_gas;
}

function find_burst_diameter(balloon_model) {
    var burst_diameters = new Array();

    // From Kaymont Totex Sounding Balloon Data
    burst_diameters["k50"] = 0.88;
    burst_diameters["k100"] = 1.96;
    burst_diameters["k150"] = 2.52;
    burst_diameters["k200"] = 3.00;
    burst_diameters["k300"] = 3.78;
    burst_diameters["k350"] = 4.12;
    //burst_diameters["k450"] = 4.72; // Discontinued?
    //burst_diameters["k500"] = 4.99; // Discontinued?
    burst_diameters["k600"] = 6.02;
    //burst_diameters["k700"] = 6.53; // Discontinued?
    burst_diameters["k800"] = 7.00;
    burst_diameters["k1000"] = 7.86;
    burst_diameters["k1200"] = 8.63;
    burst_diameters["k1500"] = 9.44;
    burst_diameters["k1600"] = 9.71;
    burst_diameters["k1800"] = 9.98;
    burst_diameters["k2000"] = 10.54;
    burst_diameters["k3000"] = 13.00;
    burst_diameters["k4000"] = 15.06;
    // 100g Hwoyee Data from http://www.hwoyee.com/images.aspx?fatherId=11010101&msId=1101010101&title=0
    burst_diameters["h100"] = 2.00;
    // Hwoyee data from http://www.hwoyee.com/base.asp?ScClassid=521&id=521102
    // Updated 2024-11 from https://www.hwoyee.com/weather-balloon-meteorological-balloon-for-weather-sounding-wind-or-cloud-detection-near-space-researchesgiant-round-balloons-huge-balloons-product/
    burst_diameters["h200"] = 2.97;
    burst_diameters["h300"] = 4.30;
    burst_diameters["h350"] = 4.80;
    burst_diameters["h500"] = 5.80;
    burst_diameters["h600"] = 6.50;
    burst_diameters["h750"] = 6.90;
    burst_diameters["h800"] = 7.00;
    burst_diameters["h1000"] = 8.00;
    burst_diameters["h1200"] = 9.10;
    burst_diameters["h1600"] = 10.00;
    // These two are fudged a little
    burst_diameters["h2000"] = 11.00;
    burst_diameters["h3000"] = 12.00;
    // PAWAN data from
    // http://randomaerospace.com/Random_Aerospace/Balloons.html
    burst_diameters["p100"] = 1.6;
    burst_diameters["p350"] = 4.0;
    burst_diameters["p600"] = 5.8;
    burst_diameters["p800"] = 6.6;
    burst_diameters["p900"] = 7.0;
    burst_diameters["p1200"] = 8.0;
    burst_diameters["p1600"] = 9.5;
    burst_diameters["p2000"] = 10.2;

    var burst_diameter;

    if($('#burst_diameter_c:checked').length){
        burst_diameter = get_value('burst_diameter');
    } else {
        burst_diameter = burst_diameters[$('#balloon_model').val()];
        // Write data back into burst_diameter field.
        $('#burst_diameter').val(burst_diameter.toFixed(2));
    }

    return burst_diameter;
}

function find_drag_coeff(balloon_model) {
    var drag_coeffs = new Array();

    // From Kaymont Totex Sounding Balloon Data
    drag_coeffs["k50"] = 0.25;
    drag_coeffs["k100"] = 0.25;
    drag_coeffs["k150"] = 0.25;
    drag_coeffs["k200"] = 0.25;
    drag_coeffs["k300"] = 0.25;
    drag_coeffs["k350"] = 0.25;
    drag_coeffs["k450"] = 0.25;
    drag_coeffs["k500"] = 0.25;
    drag_coeffs["k600"] = 0.30;
    drag_coeffs["k700"] = 0.30;
    drag_coeffs["k800"] = 0.30;
    drag_coeffs["k1000"] = 0.30;
    drag_coeffs["k1200"] = 0.25;
    drag_coeffs["k1500"] = 0.25;
    drag_coeffs["k1600"] = 0.25;
    drag_coeffs["k1800"] = 0.25;
    drag_coeffs["k2000"] = 0.25;
    drag_coeffs["k3000"] = 0.25;
    drag_coeffs["k4000"] = 0.25;
    // Hwoyee data just guesswork
    drag_coeffs["h100"] = 0.25;
    drag_coeffs["h200"] = 0.25;
    drag_coeffs["h300"] = 0.25;
    drag_coeffs["h350"] = 0.25;
    drag_coeffs["h400"] = 0.25;
    drag_coeffs["h500"] = 0.25;
    drag_coeffs["h600"] = 0.30;
    drag_coeffs["h750"] = 0.30;
    drag_coeffs["h800"] = 0.30;
    drag_coeffs["h950"] = 0.30;
    drag_coeffs["h1000"] = 0.30;
    drag_coeffs["h1200"] = 0.25;
    drag_coeffs["h1500"] = 0.25;
    drag_coeffs["h1600"] = 0.25;
    drag_coeffs["h2000"] = 0.25;
    drag_coeffs["h3000"] = 0.25;
    // PAWAN data also guesswork
    drag_coeffs["p100"] = 0.25;
    drag_coeffs["p350"] = 0.25;
    drag_coeffs["p600"] = 0.3;
    drag_coeffs["p800"] = 0.3;
    drag_coeffs["p900"] = 0.3;
    drag_coeffs["p1200"] = 0.25;
    drag_coeffs["p1600"] = 0.25;
    drag_coeffs["p2000"] = 0.25;

    var drag_coeff;

    if($('#drag_coeff_c:checked').length){ 
        drag_coeff = get_value('drag_coeff');
    } else {
        drag_coeff = drag_coeffs[$('#balloon_model').val()];
        // Write data back into drag_coeff field.
        $('#drag_coeff').val(drag_coeff.toFixed(2));
    }
    return drag_coeff;
}

function calc_update() {
    // Reset error status
    clear_errors();

    // Get input values and check them
    var balloon_model = document.getElementById('balloon_model').value;
    var payload_mass_g = get_value('payload_mass_g');
    var target_ascent_rate = get_value('target_ascent_rate');
    var target_burst_altitude = get_value('target_burst_altitude');
    var payload_mass_set = 0;
    var target_ascent_rate_set = 0;
    var target_burst_altitude_set = 0;

    if(document.getElementById('payload_mass_g').value)
        payload_mass_set = 1;
    if(document.getElementById('target_ascent_rate').value)
        target_ascent_rate_set = 1;
    if(document.getElementById('target_burst_altitude').value)
        target_burst_altitude_set = 1;

    if(sanity_check_inputs(balloon_model, payload_mass_g, payload_mass_set, target_ascent_rate, target_burst_altitude, target_ascent_rate_set, target_burst_altitude_set))
        return;

    // Get constants and check them
    var rho_gas = find_rho_gas();
    var rho_air = get_value('rho_air');
    var adm = get_value('adm');
    var gravity_accel = get_value('gravity_accel');
    var burst_diameter = find_burst_diameter(balloon_model);
    var drag_coeff = find_drag_coeff(balloon_model);

    if(sanity_check_constants(rho_gas, rho_air, adm, gravity_accel, burst_diameter, drag_coeff))
        return;

    // Do some maths
    // model name is one letter prefix then integer string in grams
    balloon_mass = parseFloat(balloon_model.substr(1)) / 1000.0;
    payload_mass = payload_mass_g / 1000.0;

    var ascent_rate = 0;
    var burst_altitude = 0;
    var time_to_burst = 0;
    var neck_lift = 0;
    var launch_radius = 0;
    var launch_volume = 0;

    var burst_volume = (4.0/3.0) * Math.PI * Math.pow(burst_diameter / 2.0, 3);

    if(target_burst_altitude_set) {
        launch_volume = burst_volume * Math.exp((-target_burst_altitude) / adm);
        launch_radius = Math.pow((3*launch_volume)/(4*Math.PI), (1/3));
    } else if(target_ascent_rate_set) {
        var a = gravity_accel * (rho_air - rho_gas) * (4.0 / 3.0) * Math.PI;
        var b = -0.5 * Math.pow(target_ascent_rate, 2) * drag_coeff * rho_air * Math.PI;
        var c = 0;
        var d = - (payload_mass + balloon_mass) * gravity_accel;

        var f = (((3*c)/a) - (Math.pow(b, 2) / Math.pow(a,2)) / 3.0);
        var g = (((2*Math.pow(b,3))/Math.pow(a,3)) -
                 ((9*b*c)/(Math.pow(a,2))) + ((27*d)/a)) / 27.0;
        var h = (Math.pow(g,2) / 4.0) + (Math.pow(f,3) / 27.0);

        if(h <= 0)
            throw "expect exactly one real root";

        var R = (-0.5 * g) + Math.sqrt(h);
        var S = Math.pow(R, 1.0/3.0);
        var T = (-0.5 * g) - Math.sqrt(h);
        var U = Math.pow(T, 1.0/3.0);
        launch_radius = (S+U) - (b/(3*a));
    }

    var launch_area = Math.PI * Math.pow(launch_radius, 2);
    var launch_volume = (4.0/3.0) * Math.PI * Math.pow(launch_radius, 3);
    var density_difference = rho_air - rho_gas;
    var gross_lift = launch_volume * density_difference;
    neck_lift = (gross_lift - balloon_mass) * 1000;
    var total_mass = payload_mass + balloon_mass;
    var free_lift = (gross_lift - total_mass) * gravity_accel;
    ascent_rate = Math.sqrt(free_lift / (0.5 * drag_coeff * launch_area * rho_air));
    var volume_ratio = launch_volume / burst_volume;
    burst_altitude = -(adm) * Math.log(volume_ratio);
    time_to_burst = (burst_altitude / ascent_rate) / 60.0;

    if(isNaN(ascent_rate)) {
        set_error('target_burst_altitude', "Altitude unreachable for this configuration.");
        return;
    }

    if(burst_diameter >= 10 && ascent_rate < 4.8) {
        set_warning('floater', "configuration suggests a possible floater");
    }

    ascent_rate = ascent_rate.toFixed(2);
    burst_altitude = burst_altitude.toFixed();
    time_to_burst = time_to_burst.toFixed();
    neck_lift = neck_lift.toFixed();
    launch_litres = (launch_volume * 1000).toFixed();
    launch_cf = (launch_volume * 35.31).toFixed(1);
    launch_volume = launch_volume.toFixed(2);

    document.getElementById('ar').innerHTML = ascent_rate + " m/s";
    document.getElementById('ba').innerHTML = burst_altitude + " m";
    document.getElementById('ttb').innerHTML = time_to_burst + " min";
    document.getElementById('nl').innerHTML = neck_lift + " g";
    document.getElementById('lv_m3').innerHTML = launch_volume + " m<sup>3</sup>";
    document.getElementById('lv_l').innerHTML = launch_litres + " L";
    document.getElementById('lv_cf').innerHTML = launch_cf + " ft<sup>3</sup>";
}

var focusedElement = null;


$(document).ready(function() {
    // init page title
    $('#page_title').text("balloon burst calculator");
    $('#page_subtitle').html("<a href='#'>About</a> | <a href='#'>Help</a>");

    // open about/help boxes
    $('#page_subtitle a').click(function() {
        var name = '#' + $(this).text().toLowerCase() + 'box';
        $('section>div:visible').fadeOut('fast', function() {
            $(name).fadeIn();
        });
        return false;
    });

    // transition between about/help box to calc
    $('#aboutbox .close, #helpbox .close').click(function() {
        $('section>div:visible').fadeOut('fast', function() {
            $('#calcbox').fadeIn();
         });
        return false;
    });

    // expands Constants and scrolls the page
    $('.fourth.closed').click(function() {
        var e = $(this).unbind('click');
        var time = 0;
        e.find('.columns:not(:visible)').each(function(i,k) {
            $(k).delay(time).fadeIn();
            time += 250;
        });
        e.removeClass('closed');

        // swing scroll expanded constants into view
        $('html,body').animate({
            scrollTop: e.offset().top
        }, {duraton: 1000, easing: 'swing'});
    });

    // validate input fields, numeric only
    $('input.numeric').keypress(function(event) {
        if(event.which == 0 // arrows and other essential keys
           || event.which == 46 // '.'
           || event.which < 32 // not printable chars + backspace, tab etc
           || (event.which >= 48 && event.which <= 57) // numbers 0-9
           ) return;
        event.preventDefault();

        $(this).stop(true,true).css({'background-color':'#FE727C'}).delay(50).animate({backgroundColor: 'white'}, 100);
    });

    // adjust input field value with mousewheel
    $('input.scrollable').bind('mousewheel', function(event, delta) {
        event.preventDefault();
        var elm = $(this);
        var x = parseFloat(elm.val());
        if(isNaN(x)) return false;
        // different fields can use different step value
        // step value has to be defined on the element by 'rel' attribute
        var step = parseFloat(elm.attr('data-step'));
        // maximum value for the field
        var max = parseFloat(elm.attr('data-max'));
        if(isNaN(step)) step = 5;

        x = x + (step * delta);
        if(x <= 0) return; // no numbers bellow zero
        if(!isNaN(max) && x > max) return;

        x = Math.round(x*100)/100; //round to two decimal places

        elm.val(x);
        elm.change(); // calculate result

        return false;
    })
    .focus(function() { focusedElement = $(this); });


    // adjust value on portable devices with a swipe
    $(document).bind('rotate', function(a, event) {
        if(!focusedElement) return;
        var elm = focusedElement;
        var x = parseFloat(elm.val());
        if(isNaN(x)) return false;
        // different fields can use different step value
        // step value has to be defined on the element by 'rel' attribute
        var step = parseFloat(elm.attr('data-step'));
        // maximum value for the field
        var max = parseFloat(elm.attr('data-max'));

        if(isNaN(step)) step = 5;

        x += step * event.direction.vector;
        if(x <= 0) return; // no numbers bellow zero
        if(!isNaN(max) && x > max) return;

        x = Math.round(x*100)/100; //round to two decimal places

        elm.val(x);
        elm.change(); // calculate result

        return false;
    });

    // enable disabled constants
    $('#burst_diameter_c, #drag_coeff_c').click(function() {
        if($('#burst_diameter_c:checked').length) $('#burst_diameter').removeAttr('disabled');
        else $('#burst_diameter').attr('disabled', 'disabled');

        if($('#drag_coeff_c:checked').length) $('#drag_coeff').removeAttr('disabled');
        else $('#drag_coeff').attr('disabled', 'disabled');
    });

    // calculate result on change
    var ids = ['balloon_model', 'payload_mass_g', 'target_ascent_rate', 'target_burst_altitude', 'gas', 'rho_gas', 'rho_air', 'adm', 'burst_diameter', 'drag_coeff', 'burst_diameter_c', 'drag_coeff_c', 'gravity_accel'];

    $('#' + ids.join(", #")).bind('keyup change',function() {
        calc_update();
    });

    calc_update();
});
