var zoom_list = {
    "1" : 13,
    "5" : 12,
    "10" : 11,
    "15" : 11,
    "25" : 10,
    "50" : 9,
    "100" : 8,
    "500" : 7,
    "2000" : 4,
    "9999" : 1
};

var markers = new Array;
var latlng = new google.maps.LatLng(39.0997265,-94.5785667);
var myOptions = {
  zoom: zoom_list[starting_zoom],
  center: latlng,
  mapTypeId: google.maps.MapTypeId.ROADMAP
};
var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
var infoWindow = new google.maps.InfoWindow();
var search_value = '';

$(document).ready(function() {
    location_search();
});

document.map = map;
function clear_markers() {
    for (i in markers) {
      if (markers[i].setMap !== undefined) {
        markers[i].setMap(null);
      }
    }
    markers.length = 0;
}

function location_search() {
    search_value = $("#locations_search_field").val();
    if (search_value.trim() == '') {
        search_value = starting_location;
    }
    clear_markers();
    var distance = $("#distance_field").val();
    var new_zoom = zoom_list[distance];
    if (new_zoom == undefined) {
        new_zoom = zoom_list[starting_zoom];
    }
    $.getJSON(get_lat_long_url + "?q=" + search_value, function(data) {
        var latitude = data.results[0].geometry.location.lat;
        var longitude = data.results[0].geometry.location.lng;
        map.setZoom(new_zoom);
        map.setCenter(new google.maps.LatLng(latitude, longitude));
        var search_params = {
            "lat" : latitude,
            "long" : longitude,
            "distance" : 9999,
            "location_type" : ""
        };
        var search_url = get_locations_url;
        $.getJSON(search_url, search_params, function(data) {
            $(".location_list").children().remove();
            $.each(data, function() {
                location_info = this;
                var location_marker = new google.maps.Marker({
                    position: new google.maps.LatLng(location_info.latitude, location_info.longitude),
                    title: location_info.name
                });
                location_marker.setMap(map);
                location_marker.location_id = location_info.id;
                markers.push(location_marker);
                google.maps.event.addListener(location_marker, "click", get_location_marker_click_listener(location_info, location_marker));
                render_location(location_info);
            });
        });
    });
}

function render_location(location_info) {
    var template = '<span class="locate pull-left"><a class="_thumbnail" href="#map_canvas"></a></span><address class="media-body"></address>';
    var address_template = '<div><h4 class="name media-heading"></h4><span class="btn btn-info btn-small locate"><a href="#map_canvas"><i class="icon-map-marker"></i></a></span></div>' +
        '<div class="address"></div><div class="phone"></div><div class="url"></div><div class="email"></div><div class="description"></div>';
    var $li = $("<li>", {'class': 'media'}).html(template);
    var $img = '';

    if ($('html').loadTemplate !== undefined && $('#store_template')) {
      render_template(location_info);
    } else {
      if (location_info.image) {
          $img = $('<img>', {
              'src': location_info.image,
              'class': 'media-object'
          });
      } else {
          $img = $('<span>', {
              'class': 'no-image text-center'
          });
      }
      $("address", $li).html(address_template);
      $(".name", $li).text(location_info.name);
      $(".address", $li).html(location_info.address.replace(/\r/g, "<br />"));
      $(".phone", $li).text(location_info.phone);
      if (location_info.url) {
          $(".url", $li).append(
              $("<a>", {
                  "href": location_info.url,
                  "html": location_info.url
              })
          );
      }
      if (location_info.email) {
        $(".email", $li).append(
          $("<a>", {
            "href": "mailto:" + location_info.email,
            "html": location_info.email
          })
        )
      }
      $(".description", $li).text(location_info.description);
      $("._thumbnail", $li).append($img);
      $('.locate', $li).click(function() {
        set_marker(location_info, this);
        return false;
      });
      $(".location_list").append($li);
    }
}

function set_marker(location_info, $clicked_element) {
  var marker = markers.filter(function (marker) {
    if (marker.location_id == location_info.id) {
      return marker;
    }
  })[0];
  google.maps.event.trigger(marker, "click");
  $('html, body').animate(
    {
      scrollTop: $($("a", $clicked_element).attr('href')).offset().top
    }, 500);
}

/**
 * Render using template. See details at: http://codepb.github.io/jquery-template/index.html
 *
 * @param location_info
 */
function render_template(location_info) {
  var $li = $('<li>', {'class': 'media'});

  $li.loadTemplate(
    '#store_template',
    {
      name: location_info.name,
      address: location_info.address.replace(/\r/g, "<br />"),
      phone: location_info.phone,
      url: location_info.url,
      email: location_info.email,
      image: location_info.image,
      description: location_info.description
    },
    {
      success: function () {
        if (location_info.phone) {
          $('#phone', $li).attr('href', 'tel:' + location_info.phone);
        } else {
          $('#phone', $li).closest('.optional').remove();
        }
        if (location_info.email) {
          $('#email', $li).attr('href', 'mailto:' + location_info.email);
        } else {
          $('#email', $li).closest('.optional').remove();
        }
        if (!location_info.description) {
          $('#description', $li).closest('.optional').remove();
        }
        if (!location_info.url) {
          $('#url', $li).closest('.optional').remove();
        }
        $('.locate', $li).click(function() {
          set_marker(location_info, this);
          return false;
        });
      }
    }
  );
  $('.location_list').append($li);
}

function add_location_info_item(location_info, item_name, item_label) {
    if (location_info[item_name] != '') {
        var return_info = $("<span>");
        $(return_info).append("<br />");
        if (item_label) {
            $(return_info).append($("<span>",{
                'class': 'location_' + item_name + '_label',
                html: item_label + ": "
            }));
        }
        $(return_info).append($("<span>",{
            'class': 'location_' + item_name,
            html: location_info[item_name].replace(/\r/g, "<br />")
        }));
        return return_info;
    }
    console.log(location_info[item_name]);
}

function get_location_marker_click_listener(location_info, location_marker) {
    return function() {
        var info_content = "<strong>" + location_info.name + "</strong><br>" +
            location_info.address.replace(/\n/g, '<br />') + "<br>" +
            "<a href='http://maps.google.com/maps?saddr=" + search_value + "&daddr=" + location_info.address.replace(/\r/g, ", ") + "'>Directions</a>";
        if (location_info.url != '') {
            info_content += "<br><strong>Website:</strong> <a href='" + location_info.url + "'>" + location_info.url + "</a>";
        }
        if (location_info.phone != '') {
            info_content += "<br><strong>Phone:</strong> " + location_info.phone;
        }
        if (location_info.description != '') {
            info_content += "<br><i> " + location_info.description + "</i>";
        }

        infoWindow.setContent(info_content);
        infoWindow.open(map, location_marker);

    }
}
