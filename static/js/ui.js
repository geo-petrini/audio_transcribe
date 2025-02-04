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
    constructor(container, url, config) {
      this.container = container;
      this.url = url;
      this.config = config;
      this.waveSurferInstance = null;
    }
  
    initialize() {
      this.waveSurferInstance = WaveSurfer.create({
        container: this.container,
        url: this.url,
        waveColor: this.config.WAVE_COLOR,
        progressColor: this.config.WAVE_COLOR_PROGRESS,
        height: 90,
        barWidth: 10,
        barGap: 2,
        barRadius: 4,
        mediaControls: true,
        interact: true,
        dragToSeek: true,
        plugins: [
          WaveSurfer.Regions.create(),
          WaveSurfer.Hover.create({
            lineColor: "#ffffff",
            lineWidth: 2,
            labelBackground: "#555",
            labelColor: "#fff",
            labelSize: "11px",
          }),
          WaveSurfer.Timeline.create({
            height: 11,
            timeInterval: 10,
            primaryLabelInterval: 60,
            style: {
              fontSize: "10px",
              color: "#ffffff",
            },
          }),
        ],
      });
  
      return this.waveSurferInstance;
    }
  }
  
  class RegionManager {
    constructor(waveSurfer, config) {
      this.waveSurfer = waveSurfer;
      this.config = config;
      this.regions = this.waveSurfer.addPlugin(WaveSurfer.Regions.create());
    }
  
    addEventListeners() {
      this.regions.on("region-created", (region) => {
        this.renderRegionCard(region);
      });
  
      this.regions.on("region-updated", (region) => {
        this.updateRegionCard(region);
      });
  
      this.regions.on("region-click", (region) => {
        this.handleRegionClick(region);
      });
  
      this.regions.on("region-in", (region) => {
        region.setOptions({ color: this.config.REGION_COLOR_SELECTED });
      });
  
      this.regions.on("region-out", (region) => {
        region.setOptions({ color: this.config.REGION_COLOR });
      });
    }
  
    renderRegionCard(region) {
      const regionContainer = document.getElementById("regions-list");
      const regionCard = document.createElement("div");
      regionCard.id = `region-${region.id}`;
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
  
  // Main Application
  window.addEventListener("DOMContentLoaded", () => {
    const config = new WaveSurferConfig();
    const fileUrl = UrlManager.getFileUrl();
    const waveSurferInitializer = new WaveSurferInitializer("#waveform", fileUrl, config);
    const waveSurfer = waveSurferInitializer.initialize();
  
    const regionManager = new RegionManager(waveSurfer, config);
    regionManager.addEventListeners();
  
    UIManager.bindButtonEvents(regionManager);
  
    waveSurfer.on("ready", () => {
      console.log("WaveSurfer is ready");
    });
  });
  