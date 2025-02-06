//TODO integrate and try

class WaveSurferConfig {
  constructor() {
    this.REGION_COLOR = "rgba(0, 200, 255, 0.3)";
    this.REGION_COLOR_NEW = "rgba(86, 236, 16, 0.5)";
    this.REGION_COLOR_SELECTED = "rgba(255, 255, 255, 0.5)";
    this.WAVE_COLOR = "rgb(83,83,83)";
    this.WAVE_COLOR_PROGRESS = "rgb(0,182,240)";
    this.WAVE_COLOR_RECORD = "rgb(240, 80, 0)";
  }
}

class WaveSurferManager {
  constructor(container, config, plugins) {
    this.container = container;
    this.fileUrl = UrlManager.getFileUrl();
    this.config = config;
    this.waveSurferInstance = null;
    this.plugins = plugins;
  }

  initialize() {
    this.waveSurferInstance = WaveSurfer.create({
      container: this.container,
      url: this.fileUrl,
      waveColor: this.config.WAVE_COLOR,
      progressColor: this.config.WAVE_COLOR_PROGRESS,
      height: 90,
      barWidth: 10,
      barGap: 2,
      barRadius: 4,
      mediaControls: true,
      interact: true,
      dragToSeek: true,
      plugins: this.plugins,
    });

    return this.waveSurferInstance;
  }

  // addEventListeners() {
  //   this.waveSurferInstance.on("ready", () => {
  //     loadRegions();
  //     $("#waveform-spinner").hide();
  //   });    
  // }
}

class HoverManager {
  constructor(config) {
    this.config = config;
    this.hoverInstance = null;
  
    this.initialize();
  }

  initialize(){
    this.hoverInstance = WaveSurfer.Hover.create({
      lineColor: "#ffffff",
      lineWidth: 2,
      labelBackground: "#555",
      labelColor: "#fff",
      labelSize: "11px",
    });
  }
}


class TimelineManager {
  constructor(config) {
    this.config = config;
    this.timelineInstance = null;

    this.initialize();
  }

  initialize(){
    this.timelineInstance = WaveSurfer.Timeline.create({
      height: 11,
      timeInterval: 10,
      primaryLabelInterval: 60,
      style: {
        fontSize: "10px",
        color: "#ffffff",
      },
    });
  }
}

class RegionsManager {
  constructor(config) {
    this.config = config;
    this.regionsInstance = WaveSurfer.Regions.create();
  }

  addEventListeners() {
    this.regionsInstance.on("region-created", (region) => {
      this.renderRegionCard(region);
    });

    this.regionsInstance.on("region-updated", (region) => {
      this.updateRegionCard(region);
    });

    this.regionsInstance.on("region-click", (region) => {
      this.handleRegionClick(region);
    });

    this.regionsInstance.on("region-in", (region) => {
      region.setOptions({ color: this.config.REGION_COLOR_SELECTED });
    });

    this.regionsInstance.on("region-out", (region) => {
      region.setOptions({ color: this.config.REGION_COLOR });
    });
  }

  TODO_renderRegionCard(region) {
    const regionContainer = document.getElementById("regions-container");
    const regionCard = document.createElement("div");
    regionCard.id = `region-${region.id}`;
    //TODO complete with the remaining html
    regionCard.innerHTML = `
        <div class="region-card">
          <p>Region ID: ${region.id}</p>
          <p>Start: ${region.start.toFixed(2)}s</p>
          <p>End: ${region.end.toFixed(2)}s</p>
        </div>
      `;
    regionContainer.appendChild(regionCard);
  }

  renderRegionCard(region) {
    //TODO refactor as class
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

  updateRegionCard(region) {
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

  handleRegionClick(region) {
    console.log(`Region clicked: ${region.id}`);
    region.setOptions({ color: this.config.REGION_COLOR_SELECTED });
  }

  createRegion(json) {
    // the creation of a new region triggers the event regions.on-create
    // console.log(`creating new region from ${json}`)
    let region = this.regionsInstance.addRegion({
      start: json.start,
      end: json.end,
      id: json.native_id,
      color: this.config.REGION_COLOR,
      drag: false,
      resize: true,
    });
    region.setOptions({ content: json.title }); //for some reason setting the content during construction produces an html element that breaks the object
    region.data = {'comments':[]} // prepare comments array
    loadComments(region);
    updateRegionCard(region);
    // this.regionsInstance.trigger("region-updated", region); //FIX event not triggered, trigger not a valid function

  } 

  async doAjaxLoadRegions() {
    let data;
    try{
      data = await $.ajax({
        url: UrlManager.getFileUrl().concat("/regions"),
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json"
      });
      return data;
    } catch (error) {
      console.error(error)
    }
  } 

  createRegions(data){
    data.forEach(regionData => this.createRegion(regionData));
    // for (const regionData of data){
    //   this.createRegion( regionData )
    // }
  }
        
  loadRegions(){
    this.doAjaxLoadRegions().then( (data) => this.createRegions(data) )
    for (const region of this.regionsInstance.regions){
      // loadComments(region);
      // updateRegionCard(region);      
    }
  }


  loadComments(region){
    // TODO use async promise
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
     
}
      
class UIManager {
  static bindButtonEvents(regionManager) {
    document.getElementById("add_section_button").addEventListener("click", () => {
      regionManager.regions.enableDragSelection({
        color: regionManager.config.REGION_COLOR_NEW,
      });
      document.getElementById("add_section_button").style.display = "none";
    });

    document.getElementById("save_description_button").addEventListener("click", () => {
      UIManager.saveDescription();
    });
  }

  static saveDescription() {
    const description = document.getElementById("description_input").value;
    console.log(`Description saved: ${description}`);
  }
}

class UrlManager {
  static getFileUrl() {
    const loc = window.location.href;
    const protocol = loc.split("://")[0];
    const site = loc.split("://")[1].split("/")[0];
    const resource = loc.split("://")[1].split("/")[2];
    return `${protocol}://${site}/track/${resource}`;
  }
}



$(document).ready(function () {
  initialize()
});

function initialize(){
  const config = new WaveSurferConfig();

  const hover = new HoverManager(config)
  const timeline = new TimelineManager(config)
  const regionsManager = new RegionsManager(config);

  const plugins = [hover.hoverInstance, timeline.timelineInstance, regionsManager.regionsInstance]

  const waveSurferInitializer = new WaveSurferManager("#waveform", config, plugins);
  const waveSurfer = waveSurferInitializer.initialize();

  regionsManager.addEventListeners();

  waveSurfer.on("ready", () => {
    regionsManager.loadRegions();
    $("#waveform-spinner").hide();
  });  
  

  UIManager.bindButtonEvents(regionsManager);

  waveSurfer.on("ready", () => {
    console.log("WaveSurfer is ready");
  });
}


function secondsToTimestamp(seconds, full=false) {
  const date = new Date(null);
  date.setSeconds(seconds);
  if (full){
    return "".concat(date.toISOString().slice(0, 10), " ", date.toISOString().slice(11, 19));
  }
  return date.toISOString().slice(11, 19);
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