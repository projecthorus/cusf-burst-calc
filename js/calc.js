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
function sanity_check_inputs(mb, mp, mp_set, tar, tba, tar_set, tba_set) {
    if(tar_set && tba_set) {
        set_error('tar', "Specify either target burst altitude or target ascent rate!");
        set_error('tba', "Specify either target burst altitude or target ascent rate!");
        return 1;
    } else if(!tar_set && !tba_set) {
        set_error('tar', "Must specify at least one target!");
        set_error('tba', "Must specify at least one target!");
        return 1;
    }

    if(tar_set && tar < 0) {
        set_error('tar', "Target ascent rate can't be negative!");
        return 1;
    } else if(tar_set && tar > 10) {
        set_error('tar', "Target ascent rate is too large! (more than 10m/s)");
        return 1;
    }

    if(tba_set && tba < 10000) {
        set_error('tba', "Target burst altitude is too low! (less than 10km)");
        return 1;
    } else if(tba_set && tba > 40000) {
        set_error('tba',
            "Target burst altitude is too high! (greater than 40km)");
        return 1;
    }

    if(!mp_set) {
        set_error('mp', "You have to enter a payload mass!");
        return 1;
    } else if(mp < 10) {
        set_error('mp', "Mass is too small! (less than 10g)");
        return 1;
    } else if(mp > 20000) {
        set_error('mp', "Mass is too large! (over 20kg)");
        return 1;
    }

    return 0;

}

function sanity_check_constants(rho_g, rho_a, adm, ga, bd, cd) {
    if(!rho_a || rho_a < 0) {
        set_error('rho_a',"You need to specify a valid air density. (0<Ad)");
        return 1;
    }
    if(!rho_g || rho_g < 0) {
        set_error('rho_g',"You need to specify a valid gas density. (0<Gd)");
        return 1;
    }
    if(rho_g > rho_a) {
        set_error('rho_g',"Air density is less the gas density.");
        return 1;
    }
    if(!adm || adm < 0) {
        set_error('adm',"You need to specify a valid air density model. (0<Adm)");
        return 1;
    }
    if(!ga || ga <= 0) {
        set_error('ga',"You need to specify a valid gravitational acceleration. (0<Ga)");
        return 1;
    }
    if(!cd || cd < 0 || cd > 1) {
        set_error('cd',"You need to specify a valid drag coefficient. (0≤Cd≤1)");
        return 1;
    }
    if(!bd || bd <= 0) {
        set_error('bd',"You need to specify a valid burst diameter. (0<Bd)");
        return 1;
    }

    return 0;
}

function find_rho_g() {
    var gas = document.getElementById('gas').value;
    var rho_g;

    switch(gas) {
        case 'he':
            rho_g = 0.1786;
            document.getElementById('rho_g').value = rho_g;
            document.getElementById('rho_g').disabled = "disabled";
            break;
        case 'h':
            rho_g = 0.0899;
            document.getElementById('rho_g').value = rho_g;
            document.getElementById('rho_g').disabled = "disabled";
            break;
        case 'ch4':
            rho_g = 0.6672;
            document.getElementById('rho_g').value = rho_g;
            document.getElementById('rho_g').disabled = "disabled";
            break;
        default:
            document.getElementById('rho_g').disabled = "";
            rho_g = get_value('rho_g');
            break;
    }

    return rho_g;
}

function find_bd(mb) {
    var bds = new Array();

    // From Kaymont Totex Sounding Balloon Data
    bds["k200"] = 3.00;
    bds["k300"] = 3.78;
    bds["k350"] = 4.12;
    bds["k450"] = 4.72;
    bds["k500"] = 4.99;
    bds["k600"] = 6.02;
    bds["k700"] = 6.53;
    bds["k800"] = 7.00;
    bds["k1000"] = 7.86;
    bds["k1200"] = 8.63;
    bds["k1500"] = 9.44;
    bds["k2000"] = 10.54;
    bds["k3000"] = 13.00;
    // 100g Hwoyee Data from http://www.hwoyee.com/images.aspx?fatherId=11010101&msId=1101010101&title=0
    bds["h100"] = 2.00;
    // Hwoyee data from http://www.hwoyee.com/base.asp?ScClassid=521&id=521102
    bds["h200"] = 3.00;
    bds["h300"] = 3.80;
    bds["h350"] = 4.10;
    bds["h400"] = 4.50;
    bds["h500"] = 5.00;
    bds["h600"] = 5.80;
    bds["h750"] = 6.50;
    bds["h800"] = 6.80;
    bds["h950"] = 7.20;
    bds["h1000"] = 7.50;
    bds["h1200"] = 8.50;
    bds["h1500"] = 9.50;
    bds["h1600"] = 10.50;
    bds["h2000"] = 11.00;
    bds["h3000"] = 12.50;
    // PAWAN data from
    // http://randomaerospace.com/Random_Aerospace/Balloons.html
    bds["p100"] = 1.6;
    bds["p350"] = 4.0;
    bds["p600"] = 5.8;
    bds["p800"] = 6.6;
    bds["p900"] = 7.0;
    bds["p1200"] = 8.0;
    bds["p1600"] = 9.5;
    bds["p2000"] = 10.2;

    var bd;

    if($('#bd_c:checked').length) bd = get_value('bd');
    else bd = bds[$('#mb').val()];

    return bd;
}

function find_cd(mb) {
    var cds = new Array();

    // From Kaymont Totex Sounding Balloon Data
    cds["k200"] = 0.25;
    cds["k300"] = 0.25;
    cds["k350"] = 0.25;
    cds["k450"] = 0.25;
    cds["k500"] = 0.25;
    cds["k600"] = 0.30;
    cds["k700"] = 0.30;
    cds["k800"] = 0.30;
    cds["k1000"] = 0.30;
    cds["k1200"] = 0.25;
    cds["k1500"] = 0.25;
    cds["k2000"] = 0.25;
    cds["k3000"] = 0.25;
    // Hwoyee data just guesswork
    cds["h100"] = 0.25;
    cds["h200"] = 0.25;
    cds["h300"] = 0.25;
    cds["h350"] = 0.25;
    cds["h400"] = 0.25;
    cds["h500"] = 0.25;
    cds["h600"] = 0.30;
    cds["h750"] = 0.30;
    cds["h800"] = 0.30;
    cds["h950"] = 0.30;
    cds["h1000"] = 0.30;
    cds["h1200"] = 0.25;
    cds["h1500"] = 0.25;
    cds["h1600"] = 0.25;
    cds["h2000"] = 0.25;
    cds["h3000"] = 0.25;
    // PAWAN data also guesswork
    cds["p100"] = 0.25;
    cds["p350"] = 0.25;
    cds["p600"] = 0.3;
    cds["p800"] = 0.3;
    cds["p900"] = 0.3;
    cds["p1200"] = 0.25;
    cds["p1600"] = 0.25;
    cds["p2000"] = 0.25;

    var cd;

    if($('#cd_c:checked').length) cd = get_value('cd');
    else cd = cds[$('#mb').val()];
    return cd;
}

function calc_update() {
    // Reset error status
    clear_errors();

    // Get input values and check them
    var mb = document.getElementById('mb').value;
    var mp = get_value('mp');
    var tar = get_value('tar');
    var tba = get_value('tba');
    var mp_set = 0;
    var tar_set = 0;
    var tba_set = 0;

    if(document.getElementById('mp').value)
        mp_set = 1;
    if(document.getElementById('tar').value)
        tar_set = 1;
    if(document.getElementById('tba').value)
        tba_set = 1;

    if(sanity_check_inputs(mb, mp, mp_set, tar, tba, tar_set, tba_set))
        return;

    // Get constants and check them
    var rho_g = find_rho_g();
    var rho_a = get_value('rho_a');
    var adm = get_value('adm');
    var ga = get_value('ga');
    var bd = find_bd(mb);
    var cd = find_cd(mb);

    if(sanity_check_constants(rho_g, rho_a, adm, ga, bd, cd))
        return;

    // Do some maths
    mb = parseFloat(mb.substr(1)) / 1000.0;
    mp = mp / 1000.0;

    var ascent_rate = 0;
    var burst_altitude = 0;
    var time_to_burst = 0;
    var neck_lift = 0;
    var launch_radius = 0;
    var launch_volume = 0;

    var burst_volume = (4.0/3.0) * Math.PI * Math.pow(bd / 2.0, 3);

    if(tba_set) {
        launch_volume = burst_volume * Math.exp((-tba) / adm);
        launch_radius = Math.pow((3*launch_volume)/(4*Math.PI), (1/3));
    } else if(tar_set) {
        var a = ga * (rho_a - rho_g) * (4.0 / 3.0) * Math.PI;
        var b = -0.5 * Math.pow(tar, 2) * cd * rho_a * Math.PI;
        var c = 0;
        var d = - (mp + mb) * ga;

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
    var density_difference = rho_a - rho_g;
    var gross_lift = launch_volume * density_difference;
    neck_lift = (gross_lift - mb) * 1000;
    var total_mass = mp + mb;
    var free_lift = (gross_lift - total_mass) * ga;
    ascent_rate = Math.sqrt(free_lift / (0.5 * cd * launch_area * rho_a));
    var volume_ratio = launch_volume / burst_volume;
    burst_altitude = -(adm) * Math.log(volume_ratio);
    time_to_burst = (burst_altitude / ascent_rate) / 60.0;

    if(isNaN(ascent_rate)) {
        set_error('tba', "Altitude unreachable for this configuration.");
        return;
    }

    if(bd >= 10 && ascent_rate < 4.8) {
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
    $('#bd_c, #cd_c').click(function() {
        if($('#bd_c:checked').length) $('#bd').removeAttr('disabled');
        else $('#bd').attr('disabled', 'disabled');

        if($('#cd_c:checked').length) $('#cd').removeAttr('disabled');
        else $('#cd').attr('disabled', 'disabled');
    });

    // calculate result on change
    var ids = ['mb', 'mp', 'tar', 'tba', 'gas', 'rho_g', 'rho_a', 'adm', 'bd', 'cd', 'bd_c', 'cd_c', 'ga'];

    $('#' + ids.join(", #")).bind('keyup change',function() {
        calc_update();
    });

    calc_update();
});
