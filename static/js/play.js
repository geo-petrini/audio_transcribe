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
    id: json.native_id,
    color: "rgba(0, 200,255, 0.3)",
    drag: false,
    resize: true,
  });
  region.setOptions({ content: json.title }); //for some reason setting the content during construction produces an html element that breaks the object
  region.data = {'comments':[]} // prepare comments array
  loadComments(region);
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
          <div id="${region.id}-comments-form-container">
            <div class="form-floating">
              <textarea id="${region.id}-comment" class="form-control" aria-label="With textarea"></textarea>
              <label for="${region.id}-comment">Comment</span>
            </div>
          </div>
          <a id="${region.id}-save" href="#" class="btn btn-primary" onclick="saveRegion('${region.id}');">Save Section <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m12 18l-4.2 1.8q-1 .425-1.9-.162T5 17.975V5q0-.825.588-1.412T7 3h5q.425 0 .713.288T13 4t-.288.713T12 5H7v12.95l5-2.15l5 2.15V12q0-.425.288-.712T18 11t.713.288T19 12v5.975q0 1.075-.9 1.663t-1.9.162zm0-13H7h6zm5 2h-1q-.425 0-.712-.288T15 6t.288-.712T16 5h1V4q0-.425.288-.712T18 3t.713.288T19 4v1h1q.425 0 .713.288T21 6t-.288.713T20 7h-1v1q0 .425-.288.713T18 9t-.712-.288T17 8z"/></svg></span></a>
          <a id="${region.id}-save-comment" href="#" class="btn btn-primary float-end" onclick="saveComment('${region.id}');">Save Comment <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m6 17l-2.15 2.15q-.25.25-.55.125T3 18.8V5q0-.825.588-1.412T5 3h12q.825 0 1.413.588T19 5v4.025q0 .425-.288.7T18 10t-.712-.288T17 9V5H5v10h6q.425 0 .713.288T12 16t-.288.713T11 17zm2-8h6q.425 0 .713-.288T15 8t-.288-.712T14 7H8q-.425 0-.712.288T7 8t.288.713T8 9m0 4h3q.425 0 .713-.288T12 12t-.288-.712T11 11H8q-.425 0-.712.288T7 12t.288.713T8 13m9 4h-2q-.425 0-.712-.288T14 16t.288-.712T15 15h2v-2q0-.425.288-.712T18 12t.713.288T19 13v2h2q.425 0 .713.288T22 16t-.288.713T21 17h-2v2q0 .425-.288.713T18 20t-.712-.288T17 19zM5 15V5z"/></svg></span></a>
          <div id="${region.id}-comments-container">
          </div>
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

    $(`#${region.id}-save`).attr("disabled", true);
    $(`#${region.id}-save`).hide();
  }

  resetCommentInputField(region)
  renderRegionComments(region)
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
  if (region.drag == false){
    // region has already been saved
    return null 
  }

  if (region) {
    let payload = {
      start: region.start,
      end: region.end,
      native_id: region.id, //map the region.id as native_id
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

function loadComments(region){
  $.ajax({
    // url: "{{ url_for('default.loadregions', file=track.local_name)}}",
    url: getFileUrl().concat("/region/", region.id, '/comments'),
    type: "GET",
    // data: JSON.stringify(payload),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response, textStatus, jqxhr) {
      // console.log("Data: " + response + " Status: " + textStatus);
      let data = JSON.parse(JSON.stringify(response)); //may not be necessary as response is already a json
      // TODO add comments to region object and then call updateRegionCard to display them
      region.data = {'comments':data}
      updateRegionCard(region)
    },
    error: function (jqxhr, textStatus, errorThrown) {
      console.error("Status: " + textStatus + " Error: " + errorThrown);
      //TODO display error
    },
  });
}

function saveComment(region){
  region = getRegion(region)
  if (region) {
    let comment = $(`#${region.id}-comment`).val()
    if (comment.length == 0){
      return null
    }
    let payload = {text : comment }

    $.ajax({
      url: getFileUrl().concat("/region/", region.id, '/comment'),
      type: "POST",
      data: JSON.stringify(payload),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data, textStatus, jqxhr) {
        console.log("Data: " + data + " Status: " + textStatus);
        $(`#${region.id}-comment`).data('saved', true)
        region.data.comments.push( data )
        updateRegionCard(region)
      },
      error: function (jqxhr, textStatus, errorThrown) {
        console.error("Status: " + textStatus + " Error: " + errorThrown);
        //TODO display error
      },
    }); 
    
  }
}

function resetCommentInputField(region){
  region = getRegion(region)
  if (region) {
    let saved = $(`#${region.id}-comment`).data('saved')
    if (saved){
      let container = $(`#${region.id}-comments-container`)
      let comment = $(`#${region.id}-comment`).val()
      $(`#${region.id}-comment`).val('')
      // container.append(
      //   `<p>${comment}</p>`
      // )
    }
    return true
  } else {
    return false
  }
}

function renderRegionComments(region){
  if (region.data && region.data.comments){
     region.data.comments.forEach( comment => renderRegionComment(region, comment) )
  }
}

function renderRegionComment(region, comment){
  let container = $(`#${region.id}-comments-container`)
  if( $(`#comment-${comment.id}`).length ){
    return null
  } 
  container.append(
    `
    <div id="comment-${comment.id}">
    <p>${comment.text}</p>
    </div>
    `
  )
}