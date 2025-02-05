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

class WaveSurferInitializer {
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
}

class WaveSurferHoverInitializer {
  constructor(config) {
    this.config = config;
    this.instance = null;
  
    this.initialize();
  }

  initialize(){
    this.instance = WaveSurfer.Hover.create({
      lineColor: "#ffffff",
      lineWidth: 2,
      labelBackground: "#555",
      labelColor: "#fff",
      labelSize: "11px",
    });
  }
}


class WaveSurferTimelineInitializer {
  constructor(config) {
    this.config = config;
    this.instance = null;
  }

  initialize(){
    this.instance = WaveSurfer.Timeline.create({
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
    this.wsregions = WaveSurfer.Regions.create();
  }

  addEventListeners() {
    this.wsregions.on("region-created", (region) => {
      this.renderRegionCard(region);
    });

    this.wsregions.on("region-updated", (region) => {
      this.updateRegionCard(region);
    });

    this.wsregions.on("region-click", (region) => {
      this.handleRegionClick(region);
    });

    this.wsregions.on("region-in", (region) => {
      region.setOptions({ color: this.config.REGION_COLOR_SELECTED });
    });

    this.wsregions.on("region-out", (region) => {
      region.setOptions({ color: this.config.REGION_COLOR });
    });
  }

  renderRegionCard(region) {
    const regionContainer = document.getElementById("regions-list");
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

  updateRegionCard(region) {
    const regionCard = document.getElementById(`region-${region.id}`);
    if (regionCard) {
      regionCard.querySelector("p:nth-child(2)").innerText = `Start: ${region.start.toFixed(2)}s`;
      regionCard.querySelector("p:nth-child(3)").innerText = `End: ${region.end.toFixed(2)}s`;
    }
  }

  handleRegionClick(region) {
    console.log(`Region clicked: ${region.id}`);
    region.setOptions({ color: this.config.REGION_COLOR_SELECTED });
  }

  createRegion(json) {
    // the creation of a new region triggers the event regions.on-create
    // console.log(`creating new region from ${json}`)
    region = this.wsregions.addRegion({
      start: json.start,
      end: json.end,
      id: json.native_id,
      color: this.config.REGION_COLOR,
      drag: false,
      resize: true,
    });
    region.setOptions({ content: json.title }); //for some reason setting the content during construction produces an html element that breaks the object
    region.data = {'comments':[]} // prepare comments array
    // loadComments(region);
    // updateRegionCard(region);
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
    // data.forEach(this.createRegion);
    for (const regionData in data){
      this.createRegion( regionData )
    }
  }
        
  loadRegions(){
    this.doAjaxLoadRegions().then( (data) => this.createRegions(data) )
    for (const region of this.wsregions.regions){
      // loadComments(region);
      // updateRegionCard(region);      
    }
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

  const hover = new WaveSurferHoverInitializer(config)
  const timeline = new WaveSurferTimelineInitializer(config)
  const regionsManager = new RegionsManager(config);

  const plugins = [hover.instance, timeline.instance, regionsManager.wsregions]

  const waveSurferInitializer = new WaveSurferInitializer("#waveform", config, plugins);
  const waveSurfer = waveSurferInitializer.initialize();

  regionsManager.addEventListeners();
  regionsManager.loadRegions();

  UIManager.bindButtonEvents(regionsManager);

  waveSurfer.on("ready", () => {
    console.log("WaveSurfer is ready");
  });
}
