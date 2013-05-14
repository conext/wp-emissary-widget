var current_group; /* for now. */

/* This neat thing stolen from http://stackoverflow.com/a/6271906/320475 */
function parse_rss(url, callback) {
  $.ajax({
    url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent(url),
    dataType: 'json',
    success: function(data) {
        console.log(data);
        if (data.responseData) {
            callback(data.responseData.feed);
        } else {
            clog("Not rendering feed for " + url + " -- there's nothing there.");
        }
    },
  });
}

/* Meh. */
function clog(message) {
    console.log("(*) WP Emissary says: " + message);    
}

/* Pull from dropdown, atm. */
function get_current_group() {
    return current_group; /* todo: cleanup */
}

function get_feed_for(uri) {
    clog("in get_feed_for(uri), uri = " + uri);
    /* 'seed' is a way of getting around Google's cache */
    uri = uri + "?feed=rss2&seed=" + (new Date()).getTime();
    parse_rss(uri, render_feeds);
}

function handle_resource_response(response) {
    clog("This is what I got:");
    console.log(response);
    var res = $.parseJSON(response.resource);
    console.log(res);
    if (res.length > 0) {
        $('.renderable').css('display', 'none');
        $('#c_feeds').css('display', 'block');
        $('#c_feeds').empty();
        res.forEach(function(e) {
            get_feed_for('http://' + e.resource.local_name + '.wordpress.identitylabs.org/');
        });
    } else {
        render_create();
    }
}

function get_user_groups() {
    osapi.groups.get().execute(function(d) {
        clog("in get_user_groups():");
        console.log(d); 
        $('#group_select').empty();
        d.list.forEach(function(e) {
            $('#group_select').append($('<option></option>')
                .attr('value', e.id)
                .text(e.title + " (" + e.description + ")"));  
        });
        /* jmp */
        get_wp_resources();
    });
}

function register_resource() {
    clog("in register_resource().");
}

/* Fire a request for resources and pass the response to rendering function. */
function get_wp_resources(group_id) {
    if (osapi.resources === undefined) {
        clog("osapi.resources is not defined. This won't work. Missing a <require>, maybe?");
    } else {
        clog("asking for " + get_current_group() + "'s resources");
        /* readable, innit? */
        osapi.resources.getResources({
            'groupId': get_current_group()
        }).execute(handle_resource_response);
    }
}

/*
 * render_* calls
 * 
 */

/* Render feeds in their div, hide other divs. */
function render_feeds(feed) {
    clog("in render_feeds():");
    console.log(feed);
    $('.renderable').css('display', 'none');
    $('#c_feeds').css('display', 'block');
    $('#c_feeds').append($('<div></div>')
        .attr('id', $.md5(feed.link))
        .attr('class', 'feed')
        .append($('<a></a>')
            .attr('href', feed.link)
            .attr('class', 'feed_site')
            .attr('target', '_blank')
            .text(feed.title)));

    feed.entries.forEach(function(e) {
        $('#' + $.md5(feed.link)).append(
            $('<p></p>')
            .attr('class', 'site_post')
            .append(
                $('<a></a>')
                .attr('href', e.link)
                .attr('class', 'site_post_link')
                .attr('target', '_blank')
                .html(e.title + " &raquo; "))
            .append(
                $('<span></span>')
                .attr('class', 'site_post_digest')
                .text(e.contentSnippet))
        );
    });
}

/* Render div with a link to newly created site. */
function render_goto_wp(site_name) {
    clog("in render_goto_wp()");
    $('.renderable').css('display', 'none');
    $('#c_go_to_wp').css('display', 'block');
    var uri = 'https://wordpress.identitylabs.org/?conext_redirect=' + site_name;
    $('#new_blog_link').attr('href', uri).text(uri);
    /* Make link disappear after it's clicked. */
    $('#new_blog_link').click(function() {
        clog("Link clicked, waiting 5 seconds and rendering feed view.");
        /* Need to re-init, unfortunately. */
        setTimeout(get_wp_resources(get_current_group()), 5000);
    });
}

/* Render the "loading" div, with optional message. */
function render_loading(message) {
    clog("in render_loading()");
    $('.renderable').css('display', 'none');
    $('#c_loading').css('display', 'block');
}

/* Render the create-a-new-site div. */
function render_create() {
    clog("in render_create()");
    $('.renderable').css('display', 'none');
    $('#c_create').css('display', 'block'); 
}

function emissary_init() {
    clog("What's the word on the street?");

    gadgets.window.adjustHeight(250);
    $('#site_name').bind('keyup change', function() {
        console.log("Change!");
        var p = /^[a-z][a-z1-9]*(-[a-z1-9]+)*$/;
        var v = $('#site_name').val();
        if (v !== '') {
            if (p.test(v)) {
                $('#site_name').attr('class', 'ok');
                $('#create_btn').prop('disabled', false);
            } else {
                $('#site_name').attr('class', 'not_ok');
                $('#create_btn').prop('disabled', true);
            }
        } else {
            $('#site_name').attr('class', '');
        }
    });

    window.addEventListener("message", function(ev) {
        console.log(ev);
        if (ev.data != current_group) {
            /* Clean up input field if something left over (happened). */
            $('#site_name').val('');
    
            current_group = ev.data;
            render_loading();
            get_wp_resources();
        } else {
            clog("no changes required, same group.");
        }
    });      

    top.postMessage("let's go!", "http://portaldev.cloud.jiscadvance.biz");

    $('#create_form').submit(function(e) {
        e.preventDefault();
        var local_name = $('#site_name').val();
        clog("Will create: " + local_name);
        osapi.resources.createResource({
            "groupId": get_current_group(), 
            "obj" : {
                "local_name": local_name,
                "uri": "https://" + local_name + ".wordpress.identitylabs.org"
            }
        }).execute(function(res) { 
            clog("response I got: ");
            console.log(res);
            var res = $.parseJSON(res.resource);
            console.log(res);
            if (res.outcome == "ok") {
                render_goto_wp(local_name);
            } else {
                clog("Not OK.");
                render_goto_wp(local_name);
            }
        });
    });
}

