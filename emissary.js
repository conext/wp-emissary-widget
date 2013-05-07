/* This neat thing stolen from http://stackoverflow.com/a/6271906/320475 */
function parse_rss(url, callback) {
  $.ajax({
    url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent(url),
    dataType: 'json',
    success: function(data) {
      callback(data.responseData.feed);
    }
  });
}

/* Meh. */
function clog(message) {
    console.log("(*) WP Emissary says: " + message);    
}

/* Pull from dropdown, atm. */
function get_current_group() {
    /* temporary, current group ID should be moved into container */
    var e = document.getElementById("group_select");
    var v = e.options[e.selectedIndex].value;   
    return v;
}

function get_feed_for(uri) {
    clog("in get_feed_for(uri), uri = " + uri);
    parse_rss(uri + "?feed=rss2", render_feeds);
}

function handle_resource_response(response) {
    clog("This is what I got:");
    console.log(response);
}

function get_user_groups() {
    osapi.groups.get().execute(function(e) {con
}

/* Fire a request for resources and pass the response to rendering function. */
function get_wp_resources(group_id) {
    if (osapi.resources === undefined) {
        clog("osapi.resources is not defined. This won't work. Missing a <require>, maybe?");
    } else {
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
}

/* Render div with a link to newly created site. */
function render_goto_wp(site_name) {
    clog("in render_goto_wp()");
}

/* Render the "loading" div, with optional message. */
function render_loading(message) {
    clog("in render_loading()");
}

/* Render the create-a-new-site div. */
function render_create() {
    clog("in render_create()");
}
