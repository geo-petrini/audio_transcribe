const REGION_COLOR = "rgba(0, 200,255, 0.3)"
const REGION_COLOR_NEW = "rgba(86, 236, 16, 0.5)"
const REGION_COLOR_SELECTED = "rgba(255, 255, 255, 0.5)"
const WAVE_COLOR = "rgb(83,83,83)"
const WAVE_COLOR_PROGRESS = "rgb(0,182,240)"
const WAVE_COLOR_RECORD = "rgb(240, 80, 0)"
var ws = null
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
  // const ws = WaveSurfer.create({
  // ws.setOptions({
  
  ws = WaveSurfer.create({
    container: "#waveform",
    url: file_url,
    waveColor: WAVE_COLOR,
    progressColor: WAVE_COLOR_PROGRESS,
    height: 90,
    barWidth: 10,
    barGap: 2,
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

  regions.on("region-clicked", (region) => {
    // console.log("Entering region", region);
    openRegionCard(region)
    region.setOptions( {color: REGION_COLOR})
  });  

  regions.on("region-in", (region) => {
    // console.log("Entering region", region);
    openRegionCard(region)
    region.setOptions( {color: REGION_COLOR_SELECTED})
  });

  regions.on("region-out", (region) => {
    // console.log("Exiting region", region);
    closeRegionCard(region)
    region.setOptions( {color: REGION_COLOR})
  });  
});

//   ws.once("interaction", () => {
//     ws.play();
//   });


// manage events on buttons
$(document).ready(function () {

  $("#add_section_button").click(function () {
    dragStopCallback = regions.enableDragSelection({
      color: REGION_COLOR_NEW,
    });
    $("#add_section_button").hide(100);
  });


  $("#save_description_button").click(function () {
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
    color: REGION_COLOR,
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
      <div class="accordion-item">
        <div class="accordion-header">
          <button class="accordion-button collapsed d-flex" type="button" data-bs-toggle="collapse" data-bs-target="#${region.id}-collapse" aria-expanded="true" aria-controls="${region.id}-collapse">
            <span class="flex-grow-1"><strong id="${region.id}-content">${region.content}</strong></span>
            <span class="">
              <strong>Time frame</strong>: <span id="${region.id}-start">${secondsToTimestamp(region.start)}</span>
              - 
              <span id="${region.id}-end">${secondsToTimestamp(region.end)}</span>, 
              <strong>Duration</strong>: <span id="${region.id}-duration">${secondsToTimestamp(region.end - region.start)}</span>
            </span>
          </button>        
        </div>
        <div id="${region.id}-collapse" class="accordion-collapse collapse" data-bs-parent="#regions-container">
          <div class="accordion-body">
          <p class="card-text">
            <div class="form-floating">
              <input type="text" class="form-control" id="${region.id}-content-form" value="${region.content}" oninput="updateRegion('${region.id}');">
              <label for="${region.id}-content-form">Title</label>
            </div>
          </p>
          <a id="${region.id}-save" href="#" class="btn btn-primary" onclick="saveRegion('${region.id}');">Save Section <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m12 18l-4.2 1.8q-1 .425-1.9-.162T5 17.975V5q0-.825.588-1.412T7 3h5q.425 0 .713.288T13 4t-.288.713T12 5H7v12.95l5-2.15l5 2.15V12q0-.425.288-.712T18 11t.713.288T19 12v5.975q0 1.075-.9 1.663t-1.9.162zm0-13H7h6zm5 2h-1q-.425 0-.712-.288T15 6t.288-.712T16 5h1V4q0-.425.288-.712T18 3t.713.288T19 4v1h1q.425 0 .713.288T21 6t-.288.713T20 7h-1v1q0 .425-.288.713T18 9t-.712-.288T17 8z"/></svg></span></a>
          <div id="${region.id}-comments-form-container" class="d-none">
            <div class="form-floating">
              <textarea id="${region.id}-comment" class="form-control" aria-label="With textarea"></textarea>
              <label for="${region.id}-comment">Comment</span>
            </div>
            <a id="${region.id}-save-comment" href="#" class="btn btn-primary float-end" onclick="saveComment('${region.id}');">Save Comment <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m6 17l-2.15 2.15q-.25.25-.55.125T3 18.8V5q0-.825.588-1.412T5 3h12q.825 0 1.413.588T19 5v4.025q0 .425-.288.7T18 10t-.712-.288T17 9V5H5v10h6q.425 0 .713.288T12 16t-.288.713T11 17zm2-8h6q.425 0 .713-.288T15 8t-.288-.712T14 7H8q-.425 0-.712.288T7 8t.288.713T8 9m0 4h3q.425 0 .713-.288T12 12t-.288-.712T11 11H8q-.425 0-.712.288T7 12t.288.713T8 13m9 4h-2q-.425 0-.712-.288T14 16t.288-.712T15 15h2v-2q0-.425.288-.712T18 12t.713.288T19 13v2h2q.425 0 .713.288T22 16t-.288.713T21 17h-2v2q0 .425-.288.713T18 20t-.712-.288T17 19zM5 15V5z"/></svg></span></a>
          </div>
          <div id="${region.id}-comments-container">
          </div>
        </div>
      </div>
    </div>
    `);

    $(`#${region.id}-collapse`).on('shown.bs.collapse', null, region, handleRegionToggle);
    $(`#${region.id}-collapse`).on('hide.bs.collapse', null, region, handleRegionToggle);
}

function handleRegionToggle(event){
  let isExpanded = event.currentTarget.classList.contains('show');
  let region = event.data
  let current_time = ws.getCurrentTime()
  if (current_time >= region.start && current_time <= region.end){
    // do nothing
    // this is necessary to avoid recursions 
    // because setting the ws time triggers the region.in event 
    // which itself toggles the section causing a loop
  } else {
    ws.setTime(region.start)
  }
}

function updateRegion(region) {
  region = getRegion(region)
  if (!region){
    return null
  }
  // console.log(`updating ${region_id} with ${value}`);
  let value = $(`#${region.id}-content-form`).val();
  if (region) {
    // this should trigger the region on update event bt apparently it does not
    // both setOptions and setContent work
    // region.setOptions({ content: value });    
    region.setContent(  value );  
    updateRegionCard(region)  
  }

  if (region.drag == false) {
    region.setOptions({ color: REGION_COLOR }); 
  }
  
}

function updateRegionCard(region) {
  $(`#${region.id}-start`).text(secondsToTimestamp(region.start));
  $(`#${region.id}-end`).text(secondsToTimestamp(region.end));
  $(`#${region.id}-duration`).text(
    secondsToTimestamp(region.end - region.start)
  );

  if (region.drag == false) {
    // update the region title and hides/disable the content form textarea
    $(`#${region.id}-content`).text( getRegionTitle(region) )
    $(`#${region.id}-content-form`).attr("disabled", true);
    $(`#${region.id}-content-form`).text( getRegionTitle(region) )
    $(`#${region.id}-content-form`).hide(  )

    //hide and disable the save button
    $(`#${region.id}-save`).attr("disabled", true);
    $(`#${region.id}-save`).hide();

    //display the comment form
    //TODO either refactor the whole page to use d-none or change this element to allow the .show() call
    $(`#${region.id}-comments-form-container`).removeClass("d-none");
    // $(`#${region.id}-comments-form-container`).show()
  } else {
    $(`#${region.id}-content`).text( $(`#${region.id}-content-form`).val()  )
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
        // console.log("Data: " + data + " Status: " + textStatus);
        $("#add_section_button").show(100);
        region.setOptions({ drag: false, resize: false });
        updateRegion(region)
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

function openRegionCard(region){
  $(`#${region.id}-collapse`).collapse('show');
}

function closeRegionCard(region){
  $(`#${region.id}-collapse`).collapse('hide');
}

function secondsToTimestamp(seconds, full=false) {
  const date = new Date(null);
  date.setSeconds(seconds);
  if (full){
    return "".concat(date.toISOString().slice(0, 10), " ", date.toISOString().slice(11, 19));
  }
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
      renderDescription(data)
    },
    error: function (jqxhr, textStatus, errorThrown) {
      console.error("Status: " + textStatus + " Error: " + errorThrown);
      //TODO display error
    },
  });  
}

function saveDescription(){
  let payload = {text : $('#description-textarea').val() }
  $.ajax({
    // url: "{{ url_for('default.saveregion', file=track.local_name)}}",
    url: getFileUrl().concat("/description"),
    type: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data, textStatus, jqxhr) {
      console.log("Data: " + data + " Status: " + textStatus);
      renderDescription(data)
    },
    error: function (jqxhr, textStatus, errorThrown) {
      console.error("Status: " + textStatus + " Error: " + errorThrown);
      //TODO display error
    },
  });
}

function renderDescription(description){
  $('#description-form').hide()
  $('#save_description_button').hide()

  $('#description-content').append( secondsToTimestamp(description.ts, full=true) )
  $('#description-content').append( `<div class="text-pre" id="description-text-full">${description.text}</div>` )
  if (description.text.length > 560){
    $('#description-content').append( `<div class="text-pre" id="description-text-short">${description.text.slice(0, 560)}</div>` )
    $('#description-content').append('<button id="description-text-toggle-button" type="button" class="btn btn-sm" onclick="toggleDescriptionText()">Show more</button>   ')
    $('#description-text-full').hide()
  }

}

function toggleDescriptionText(){
  $('#description-text-short').toggle()
  $('#description-text-full').toggle()

  if ( $('#description-text-full').is(':visible') ){
    $('#description-text-toggle-button').text('Show less')
  }else{
    $('#description-text-toggle-button').text('Show more')
  }
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
      <p class="text-secondary">${secondsToTimestamp(comment.ts, full=true)}</p>
      <p class="text-pre">${comment.text}</p>
      <hr>
    </div>
    `
  )
}