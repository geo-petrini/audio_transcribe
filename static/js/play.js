const regions = WaveSurfer.Regions.create(); // Initialize regions plugin
var dragStopCallback = null;

$(document).ready(function () {
  // let file_url = "{{url_for('default.track', filename=track.local_name)}}";
  let file_url = getFileUrl();
  var toggle_regions_create = false;

  const timeline = WaveSurfer.Timeline.create({
    height: 11,
    timeInterval: 10,
    primaryLabelInterval: 60,
    style: {
      fontSize: "10px",
      color: "#ffffff",
    },
  }); // Initialize timeline plugin
  const hover = WaveSurfer.Hover.create({
    lineColor: "#ffffff",
    lineWidth: 2,
    labelBackground: "#555",
    labelColor: "#fff",
    labelSize: "11px",
  }); // Initialize hover plugin
  const ws = WaveSurfer.create({
    container: "#waveform",
    waveColor: "rgb(83,83,83)",
    progressColor: "rgb(0,182,240)",
    url: file_url,
    height: 90,
    // Set a bar width
    barWidth: 10,
    // Optionally, specify the spacing between bars
    barGap: 2,
    // And the bar radius
    barRadius: 4,
    mediaControls: true,
    interact: true,
    dragToSeek: true,
    plugins: [regions, hover, timeline],
  });

  ws.on("ready", () => {
    loadRegions();
    $("#waveform-spinner").hide();
  });

  regions.on("region-created", (region) => {
    // console.log("Created region", region);
    renderRegionCard(region);
    // $("#add_section_help_1").hide(100);
    // $("#add_section_help_2").show(100);
    if (dragStopCallback) {
      dragStopCallback();
    }
  });

  //TODO update to regions.on("region-update", updateRegionCard)
  regions.on("region-update", (region) => {
    // console.log("Updating region", region);
    updateRegionCard(region);
  });

  regions.on("region-updated", (region) => {
    // console.log("Updated region", region);
    updateRegionCard(region);
  });

  regions.on("region-in", (region) => {
    // console.log("Entering region", region);
  });
});

//   ws.once("interaction", () => {
//     ws.play();
//   });


// manage events on buttons
$(document).ready(function () {
  $("#add_section_button").click(function () {
    dragStopCallback = regions.enableDragSelection({
      color: "rgba(0, 200,255, 0.3)",
    });
    // $("#add_button").hide(100);
    $("#add_section_button").hide(100);
    // $("#add_section_help_1").show(100);
  });


  $("#add_description_button").click(function () {
    saveDescription()
  });

  loadDescription()
});

function getFileUrl() {
  let loc = $(location).attr("href");

  let protocol = loc.split("://")[0];
  let site = loc.split("://")[1].split("/")[0];
  let route = loc.split("://")[1].split("/")[1];
  let resource = loc.split("://")[1].split("/")[2];

  return "".concat(protocol, "://", site, "/", "track", "/", resource);
}

function createRegion(json) {
  // the creation of a new region triggers the event regions.on-create
  // console.log(`creating new region from ${json}`)
  region = regions.addRegion({
    start: json.start,
    end: json.end,
    id: json.id,
    color: "rgba(0, 200,255, 0.3)",
    drag: false,
    resize: true,
  });
  region.setOptions({ content: json.title }); //for some reason setting the content during construction produces an html element that breaks the object
  updateRegionCard(region);
}

function renderRegionCards() {
  //TODO loop all regions.getRegions()
}

function renderRegionCard(region) {
  $("#regions-container").append(`
    <div id="${region.id}">
      <div class="card">
        <div class="card-header">
          <strong>Time frame</strong>: <span id="${region.id}-start">${secondsToTimestamp(region.start)}</span>
           - 
          <span id="${region.id}-end">${secondsToTimestamp(region.end)}</span>, 
          <strong>Duration</strong>: <span id="${region.id}-duration">${secondsToTimestamp(region.end - region.start)}</span>
        </div>
        <div class="card-body">
          <!--<h5 class="card-title">Title</h5>-->
          <p class="card-text">
            <div class="form-floating">
              <input type="text" class="form-control" id="${region.id}-content" value="${region.content}" oninput="updateRegionContent('${region.id}');">
              <label for="${region.id}-content">Title</label>
            </div>
          </p>
          <div class="form-floating">
            <textarea id="${region.id}-comment" class="form-control" aria-label="With textarea"></textarea>
            <label for="${region.id}-comment">Comment</span>
          </div>
          <a id="${region.id}-save" href="#" class="btn btn-primary" onclick="saveRegion('${region.id}');">Save</a>
        </div>
      </div>
    </div>
    `);
}

function updateRegionContent(region_id) {
  let value = $(`#${region_id}-content`).val();
  // console.log(`updating ${region_id} with ${value}`);
  let region = getRegion(region_id);
  if (region) {
    region.setOptions({ content: value });
    // this triggers the region on update event
  }
}

function updateRegionCard(region) {
  $(`#${region.id}-start`).text(secondsToTimestamp(region.start));
  $(`#${region.id}-end`).text(secondsToTimestamp(region.end));
  $(`#${region.id}-duration`).text(
    secondsToTimestamp(region.end - region.start)
  );

  if (region.drag == false) {
    $(`#${region.id}-content`).attr("disabled", true);
    $(`#${region.id}-content`).val( getRegionTitle(region) )
  }
}

function getRegionTitle(region_id) {
  let region = getRegion(region_id);
  if (region == null) {
    return null;
  }

  if ($(region.content).is("div")) {
    return $(region.content).text();
  }
  return null;
}

function loadRegions() {
  $.ajax({
    // url: "{{ url_for('default.loadregions', file=track.local_name)}}",
    url: getFileUrl().concat("/regions"),
    type: "GET",
    // data: JSON.stringify(payload),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response, textStatus, jqxhr) {
      // console.log("Data: " + response + " Status: " + textStatus);
      let data = JSON.parse(JSON.stringify(response)); //may not be necessary as response is already a json
      data.forEach(createRegion);
    },
    error: function (jqxhr, textStatus, errorThrown) {
      console.error("Status: " + textStatus + " Error: " + errorThrown);
      //TODO display error
    },
  });
}

function saveRegion(region_id) {
  // console.log(`saveRegion ${region_id}`);
  let region = getRegion(region_id);
  if (region) {
    let payload = {
      start: region.start,
      end: region.end,
      id: region.id,
      title: getRegionTitle(region),
    };
    // console.log(`sending ${JSON.stringify(payload)}`)
    $.ajax({
      // url: "{{ url_for('default.saveregion', file=track.local_name)}}",
      url: getFileUrl().concat("/region"),
      type: "POST",
      data: JSON.stringify(payload),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data, textStatus, jqxhr) {
        console.log("Data: " + data + " Status: " + textStatus);
        $("#add_section_button").show(100);
        // $("#add_button").show(100);
        // $("#add_section_help_1").hide(100);
        // $("#add_section_help_2").hide(100);
        // $(`#${region_id}-content`).attr('disabled', true)
        region.setOptions({ drag: false, resize: false });
        updateRegionCard(region);
      },
      error: function (jqxhr, textStatus, errorThrown) {
        console.error("Status: " + textStatus + " Error: " + errorThrown);
        //TODO display error
      },
    });
  }
}

function getRegion(region_id) {
  if (region_id instanceof Object) {
    return region_id;
  }
  for (var region of regions.regions) {
    if (region.id == region_id) {
      return region;
    }
  }
  return null;
}

function getRegionById(region_id) {
  for (var region of regions.regions) {
    if (region.id == region_id) {
      return region;
    }
  }
  return null;
}

function secondsToTimestamp(seconds) {
  const date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().slice(11, 19);
}

function loadDescription(){
  $.ajax({
    url: getFileUrl().concat("/description"),
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response, textStatus, jqxhr) {
      // console.log("Data: " + response + " Status: " + textStatus);
      let data = JSON.parse(JSON.stringify(response)); //may not be necessary as response is already a json
      $('#description-content').val( data.text )
    },
    error: function (jqxhr, textStatus, errorThrown) {
      console.error("Status: " + textStatus + " Error: " + errorThrown);
      //TODO display error
    },
  });  
}

function saveDescription(){
  let payload = {text : $('#description-content').val() }
  $.ajax({
    // url: "{{ url_for('default.saveregion', file=track.local_name)}}",
    url: getFileUrl().concat("/description"),
    type: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data, textStatus, jqxhr) {
      console.log("Data: " + data + " Status: " + textStatus);
    },
    error: function (jqxhr, textStatus, errorThrown) {
      console.error("Status: " + textStatus + " Error: " + errorThrown);
      //TODO display error
    },
  });
}