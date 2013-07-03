var current_group; /* for now. */

/* Meh. */
function clog(message) {
    console.log("(*) WP Emissary says: " + message);    
}

/* Silly. */
function get_current_group() {
    return current_group; /* todo: cleanup */
}

function get_feed_for(uri) {
    uri += "?feed=json";
    clog("Pulling feed => " + uri);
    $.ajax({
        url: uri,
        dataType: 'json',
        success: function(data) {
            clog("Got JSON WP feed:");
            console.log(data);
            render_feeds(data);
        },
        error: function(data) {
            clog("ajax call failed:");
            console.log(data);
        }
    });
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

function messagebox(messsage, description) {
    decommission_splash();
    $('#communique').children().hide();
    $('#wpbar').show();
    $('#c_messagebox').show();
    $('#mbox_title').html(messsage);
    $('#mbox_description').html(description);
}

/* Render feeds in their div, hide other divs. */
function render_feeds(feed) {
    clog("in render_feeds():");
    console.log(feed);
    decommission_splash();
    $('.renderable').css('display', 'none');
    $('#c_feeds').css('display', 'block');
    clog("md5 for " + feed.bloginfo.site_url + " will be " + $.md5(feed.bloginfo.site_url));
    $('#c_feeds').append($('<div></div>')
        .attr('id', $.md5(feed.bloginfo.site_url))
        .attr('class', 'feed')
        .append($('<a></a>')
            .attr('href', feed.bloginfo.site_url)
            .attr('class', 'feed_site')
            .attr('target', '_blank')
            .text((feed.bloginfo.title ? feed.bloginfo.title : "(blog with no title)"))));

    if (feed.posts.length == 0) {
        /* Empty feed. */
        $('#' + $.md5(feed.bloginfo.site_url)).append($("<p>No posts.</p>"));
    } else {
        /* Render each post.. or maybe top 3? */
        feed.posts.forEach(function(e) {
            clog("++");
            console.log(e);
            var post_date = new Date(e.date);
            $('#' + $.md5(feed.bloginfo.site_url)).append(
                $('<p></p>')
                .attr('class', 'site_post')
                .append(
                    $('<p></p>')
                    .attr('class', 'post_date')
                    .attr('title', post_date.toISOString())
                    .timeago())
                .append(
                    $('<a></a>')
                    .attr('href', e.permalink)
                    .attr('class', 'site_post_link')
                    .attr('target', '_blank')
                    .html(e.title + " &raquo; "))
                .append(
                    $('<span></span>')
                    .attr('class', 'site_post_digest')
                    .text(e.excerpt.substr(0, 130) + "..."))
            );
        });
    }
}

/* Render div with a link to newly created site. */
function render_goto_wp(site_name) {
    clog("in render_goto_wp()");
    $('.renderable').css('display', 'none');
    $('#c_go_to_wp').css('display', 'block');
    var uri = 'https://wordpress.identitylabs.org/?conext_redirect=' + site_name;
    $('#new_blog_link').attr('href', uri).text('right over here');
    /* Make link disappear after it's clicked. */
    $('#new_blog_link').click(function() {
        clog("Link clicked, waiting 5 seconds and rendering feed view.");
        /* Need to re-init, unfortunately. */
        setTimeout(messagebox("Hold on.", "We'll pull the feed in just a moment."), 2);
        setTimeout(function() {
            $('#c_messagebox').hide();
            get_wp_resources(get_current_group());
        }, 18000);
    });
}

/* Render the create-a-new-site div. */
function render_create() {
    clog("in render_create()");
    decommission_splash();
    $('.renderable').css('display', 'none');
    $('#c_create').css('display', 'block'); 
}

function decommission_splash() {
    clog("Decommissioning splash..");
    $('#splash').hide();
    $('#communique').show();
}

function emissary_init() {
    clog("What's the word on the street?");

    gadgets.window.adjustHeight(295);

    $('#comunique').hide();
    $('#splash').show();

    $('#c_messagebox').hide();
    $('#site_name').bind('keyup change', function() {
        console.log("Change!");
        var p = /^[a-z][a-z1-9]*(-[a-z1-9]+)*$/;
        var v = $('#site_name').val().toLowerCase();
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
        if (!ev.data) { 
            messagebox(
                "No group selected.",
                "Please select a group to work with this application."
            );
        } else if (ev.data != current_group) {
            /* Clean up input field if something left over (happened). */
            $('#site_name').val('');
    
            current_group = ev.data;
            get_wp_resources();
        } else {
            clog("no changes required, same group.");
        }
    });      

    top.postMessage("let's go!", top.location.origin);


    /* Every 10 seconds, if a group is currently displayed, refresh it. */
    setInterval(function() {
        if (get_current_group()) {
            get_wp_resources(get_current_group());
        }
    }, 20000);

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
                messagebox("Something's broken.", "I couldn't create the resource. Try.. try again?");
            }
        });
    });
}

