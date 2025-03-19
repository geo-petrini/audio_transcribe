

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
  constructor(options, config, plugins) {
    // this.container = container;
    // this.fileUrl = UrlManager.getFileUrl();
    this.config = config;
    this.waveSurferInstance = null;
    this.plugins = plugins;
    this.options = options;
    this.id = Date.now()
  }

  initialize() {
    //TODO handle all options
    this.waveSurferInstance = WaveSurfer.create({
      container: this.options.container,
      url: 'url' in this.options ? this.options.url : undefined,
      waveColor: 'waveColor' in this.options ? this.options.waveColor : this.config.WAVE_COLOR,
      progressColor: 'progressColor' in this.options ? this.options.progressColor :  this.config.WAVE_COLOR_PROGRESS,
      height: 'height' in this.options ? this.options.height : 90,
      barWidth: 'barWidth' in this.options ? this.options.barWidth :  10,
      barGap: 'barGap' in this.options ? this.options.barGap :  2,
      barRadius: 'barRadius' in this.options ? this.options.barRadius :  4,
      mediaControls: 'mediaControls' in this.options ? this.options.mediaControls :  true,
      interact: 'interact' in this.options ? this.options.interact :  true,
      dragToSeek: 'dragToSeek' in this.options ? this.options.dragToSeek : true,
      plugins: this.plugins,
    });

    return this.waveSurferInstance;
  }

  setBlob(blob){
    this.blob = blob
  }

  getPlayButton() {
    if (!this.playButton) {
      this.playButton = $(`<button class="btn btn-primary">Play</button>`);
      const wavesurfer = this.waveSurferInstance;
      wavesurfer.on("pause", () => {
        this.playButton.text("Play");
      });
      wavesurfer.on("play", () => {
        this.playButton.text("Pause");
      });
      
      this.playButton.on("click", function() {
        if(wavesurfer.paused){
          wavesurfer.play();
        } else{
          wavesurfer.pause();
        }
      });
    }
    return this.playButton;
  }

  // getDownloadButton(blob){
  getDownloadButton(extension){
    if (!this.downloadButton) {
      const wavesurfer = this.waveSurferInstance;
      const recordedUrl = wavesurfer.options.url;
      const filename = `track-${this.id}.${extension}`
      this.downloadButton = `
        <a href="${recordedUrl}" 
        class="btn btn-primary" 
        id="${this.id}-download-button"
        download="${filename}">Download</a>
        `;
    }
    return this.downloadButton;
  }

  getNameInput(){
    if (!this.nameInput){
      this.nameInput = `
      <div class="input-group">
        <div class="input-group-text" id="${this.id}-name-input-addon">Name</div>
        <input id="${this.id}-name-input" type="text" class="form-control" placeholder="track-${this.id}" aria-label="track name input group" aria-describedby="${this.id}-name-input-addon">
      </div>
      `
    }
    return this.nameInput;
  }

  getFilename(){
    //TODO use this.nameInput
    if (this.downloadButton){
      const extension = $(this.downloadButton).attr('download').split('.')[1];
      let inputName = $(`#${this.id}-name-input`).val();
      if (inputName == ''){ inputName=`track-${this.id}` }  //this should never happen
      const filename = `${inputName}.${extension}`;
      return filename;
    } else {
      return;
    }
  }

  static getExtesionFromBlob(blob){
    return blob.type.split(";")[0].split("/")[1] || "webm"
  }

  handleNameInputChange(event){
    //DONE handle empty name
    let inputName = $(`#${this.id}-name-input`).val();
    if (inputName == ''){ 
      inputName=`track-${this.id}`
      $(`#${this.id}-name-input`).val(inputName);
    }

    //set download attribute to new filename
    // if (this.downloadButton){   
    //   const filename = this.getFilename()
    //   $(this.downloadButton).attr('download', filename) //FIXME this does not work, filename is not set
    // }
  }

  getUploadButton(){
    if (!this.uploadButton) {
      const wavesurfer = this.waveSurferInstance;
      const recordedUrl = wavesurfer.options.url;
      this.uploadButton = `
        <button href="${recordedUrl}" 
        class="btn btn-primary" 
        id="${this.id}-upload-button"
        >
          Upload
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M11 14.825V18q0 .425.288.713T12 19t.713-.288T13 18v-3.175l.9.9q.15.15.338.225t.375.063t.362-.088t.325-.225q.275-.3.288-.7t-.288-.7l-2.6-2.6q-.15-.15-.325-.212T12 11.425t-.375.063t-.325.212l-2.6 2.6q-.3.3-.287.7t.312.7q.3.275.7.288t.7-.288zM6 22q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h7.175q.4 0 .763.15t.637.425l4.85 4.85q.275.275.425.638t.15.762V20q0 .825-.587 1.413T18 22zm7-14V4H6v16h12V9h-4q-.425 0-.712-.288T13 8M6 4v5zv16z"/>
            </svg>
          </span>
          <div id="${this.id}-upload-button-spinner" class="spinner-border spinner-border-sm" role="status" style="display: none;"><span class="visually-hidden">Uploading...</span></div>
        </button>
      `;
    }
    return this.uploadButton;
  }  

  async doAjaxSaveTrack(data){
    let payload = data   
    let response;  
    try{
      response = await $.ajax({
        url: '/upload',
        type: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
      });
      return response;
    } catch (error) {
      console.error(error)
    }      

  }  

  async readBlob(blob){
    let track;
    try{
      // track = await new Response(blob).bytes()
      // track = await blob.bytes() //returns a list of bytes
      // track = await blob.text() //returns a list of UTF-8 chars
      var reader = new FileReader();
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        let b64 = reader.result;
        track = b64.split(',')[1]; //remove the mimetype
        console.log(track)
        return track;
      }
    } catch (error){
      console.error()
    }
  }

  handleUpload(event){
    const id = event.target.id.split('-')[0]
    const filename = this.getFilename() //$(`#${id}-name-input`).val()

    $(`#${this.id}-upload-button-spinner`).show()
    var reader = new FileReader();
    reader.readAsDataURL(event.data.blob)
    reader.onloadend = () => {
      let b64 = reader.result;
      let track = b64.split(',')[1]; //remove the mimetype
      // console.log(track)
   
      const data = {
        track: track, //track coming from readBlob is already b64
        type: event.data.blob.type,
        name: filename
      }
      // console.log(data)

      this.doAjaxSaveTrack(data).then( (response) => {
        //DONE close the track and display the track link 
        console.log(response)
        $(`#${id}-status`).append(response)

        if ('url' in response){
          this.waveSurferInstance.destroy()
          $(`#${this.id}-upload-button-spinner`).hide()
          $(`#${this.id}-controls`).remove()
          // $(`#${this.id}`).append(
          //   `<p>${filename.split('.')[0]}</p>`
          // )
          $(`#${this.id}`).append(
            `
            <div class="input-group" role="group">
              <label class="input-group-text">${filename.split('.')[0]}</label>
              <a class="btn btn-primary" href="${response.url}">Open <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 22q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h7.175q.4 0 .763.15t.637.425l4.85 4.85q.275.275.425.638t.15.762V13q0 .425-.288.713T19 14t-.712-.288T18 13V9h-4q-.425 0-.712-.288T13 8V4H6v16h8q.425 0 .713.288T15 21t-.288.713T14 22zm13-2.575v1.225q0 .425-.288.713T18 21.65t-.712-.287T17 20.65V17q0-.425.288-.712T18 16h3.65q.425 0 .713.288t.287.712t-.287.713t-.713.287H20.4l2.25 2.25q.275.275.275.688t-.275.712q-.3.3-.712.3t-.713-.3zM6 20V4z"></path></svg></span></a>
            </div>
            `
          )
        }
      });   
      
    }
    
  
  }

  handleDownload(event){
    //TODO implement
    event.preventDefault();
    const id = event.target.id.split('-')[0]
    const filename = this.getFilename() //$(`#${id}-name-input`).val()
  }

  addButtonsEventListeners(blob){
      $(`#${this.id}-name-input`).on('input', this.handleNameInputChange.bind(this))
      $(`#${this.id}-upload-button`).on('click', null, {blob:blob}, this.handleUpload.bind(this));
      $(`#${this.id}-download-button`).on('click', this.handleDownload.bind(this));
  }
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

class RecordManager {
  constructor(config, recordingsContainer) {
    this.config = config;
    this.recordingsContainer = recordingsContainer //$(recordingsContainer)
    this.recordInstance = null;
  
    this.initialize();
    this.addEventListeners();
  }

  addEventListeners(){
    this.recordInstance.on("record-end", (blob) => {this.displayRecording(blob)});
    this.recordInstance.on("record-progress", (time) => {this.updateProgress(time)});           
  }

  initialize(){
    this.recordInstance = WaveSurfer.Record.create({
      renderRecordedAudio: false,
      scrollingWaveform: true,
      continuousWaveform: false,
      continuousWaveformDuration: 30,
      // mimeType: 'audio/mpeg' #does not work, not all browsers support this codec for MediaRecorderOptions["mimeType"]
    });

    return this.recordInstance;
  }

  getDevices(){
    //BUG devices is undefined, there are some unfulfilled promises somewhere
    this.recordInstance.startMic();
    this.recordInstance.stopMic();
    let devices = WaveSurfer.Record.getAvailableAudioDevices();
    return devices;
  }


  // ---- convenience methods to expose internal recordInstance
  startRecording(options){
    return this.recordInstance.startRecording(options)
  }

  isRecording(){
    return this.recordInstance.isRecording()
  }

  isPaused(){
    return this.recordInstance.isPaused();
  }

  pauseRecording(){
    return this.recordInstance.pauseRecording()
  }

  resumeRecording(){
    return this.recordInstance.resumeRecording()
  }
  
  stopRecording(){
    return this.recordInstance.stopRecording()
  }

  updateProgress(time) {
    //TODO check if progress exists
    const formattedTime = secondsToTimestamp(time/1000);
    $("#progress").text(formattedTime);
    $("#progress").val(formattedTime);
  }  

  displayRecording(blob){
    const url = URL.createObjectURL(blob)
    // const hover = new HoverManager(this.config)  //TODO try to add it again but before fix the dragToSeek issue below
    const timeline = new TimelineManager(this.config)
    const plugins = [timeline.timelineInstance]

    //FIXME dragToSeek does not work, the  mediaControls max time equals what has been reproduced and not the actual track time, blob issue?
    const waveSurferManager = new WaveSurferManager({url:url, container:this.recordingsContainer}, this.config, plugins);
    //dirty workaround to assign the container after getting the id from WaveSurferManager
    // let container = `<div id="${waveSurferManager.id}"></div>`
    // $(this.recordingsContainer).append( container )
    // waveSurferManager.options.container = `#${waveSurferManager.id}`
    //end of dirty workaround

    const waveSurfer = waveSurferManager.initialize();
    // waveSurfer.loadBlob(blob) //this works the same as the option {url:url} but then wavesurfer.options.url does not work
    
    const downloadButton = waveSurferManager.getDownloadButton( WaveSurferManager.getExtesionFromBlob(blob) )
    const uploadButton = waveSurferManager.getUploadButton()
    const nameInput = waveSurferManager.getNameInput()

    $(this.recordingsContainer).append( 
      `
     <div id="${waveSurferManager.id}">
        <div id="${waveSurferManager.id}-controls" class="row justify-content-start">
          <div class="col-4">${nameInput}</div>
          <div class="col">
            <div class="btn-group" role="group">
              ${downloadButton}
              ${uploadButton}
            </div>
          </div>
          <div class="col">
            <div id="${waveSurferManager.id}-status"></div>
          </div>
        </div>
      </div>
      `
     );
     waveSurferManager.addButtonsEventListeners(blob)
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
    this.ws = null;
    this.dragStopCallback = null;
    this.suspendEvents = false; //TODO use a real on / off mechanism
  }

  addEventListeners() {
    this.regionsInstance.on("region-created", (region) => {
      this.renderRegionCard(region);
    });

    this.regionsInstance.on("region-updated", (region) => {
      this.updateRegionCard(region);
    });

    this.regionsInstance.on("region-click", (region) => {
      if (this.suspendEvents){
        return;
      }
      this.openRegionCard(region)
      region.setOptions( {color: this.color.REGION_COLOR})
    });

    this.regionsInstance.on("region-in", (region) => {
      if (this.suspendEvents){
        return;
      }            
      this.openRegionCard(region)
      region.setOptions({ color: this.config.REGION_COLOR_SELECTED });
    });

    this.regionsInstance.on("region-out", (region) => {
      if (this.suspendEvents){
        return;
      }            
      this.closeRegionCard(region)
      region.setOptions({ color: this.config.REGION_COLOR });
    });
  }

  setWsReference(ws){
    this.ws = ws
  }

  enableCreate(value){
    if (value){
      //DONE disable other events like region-click or region-in region-out
      this.dragStopCallback = this.regionsInstance.enableDragSelection({
        color: this.config.REGION_COLOR_NEW,
      })
      this.suspendEvents = true;
    } else {
      if (this.dragStopCallback){
        this.dragStopCallback();
      }
      this.suspendEvents = false;
    }
  }

  renderRegionCard(region) {
    //TODO refactor as class
    //DONE do not append, insert to the top of the container
    const region_header = `
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
    `

    const region_form = `
      <div id="${region.id}-form" class="input-group mb-3">
        <span class="input-group-text" for="${region.id}-content-form">Title</span>
        <input type="text" class="form-control" id="${region.id}-content-form" value="${region.content}">
        <button type="button" id="${region.id}-save" href="#" class="btn btn-primary");">Save Region <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m12 18l-4.2 1.8q-1 .425-1.9-.162T5 17.975V5q0-.825.588-1.412T7 3h5q.425 0 .713.288T13 4t-.288.713T12 5H7v12.95l5-2.15l5 2.15V12q0-.425.288-.712T18 11t.713.288T19 12v5.975q0 1.075-.9 1.663t-1.9.162zm0-13H7h6zm5 2h-1q-.425 0-.712-.288T15 6t.288-.712T16 5h1V4q0-.425.288-.712T18 3t.713.288T19 4v1h1q.425 0 .713.288T21 6t-.288.713T20 7h-1v1q0 .425-.288.713T18 9t-.712-.288T17 8z"/></svg></span></button>
      </div>    
    `

    const region_comment_form = `
      <div class="input-group mb-3">
        <span class="input-group-text" for="${region.id}-comment">Comment</span>
        <textarea id="${region.id}-comment" class="form-control"></textarea>
        <button type="button" id="${region.id}-save-comment" href="#" class="btn btn-primary">Save Comment <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m12 18l-4.2 1.8q-1 .425-1.9-.162T5 17.975V5q0-.825.588-1.412T7 3h5q.425 0 .713.288T13 4t-.288.713T12 5H7v12.95l5-2.15l5 2.15V12q0-.425.288-.712T18 11t.713.288T19 12v5.975q0 1.075-.9 1.663t-1.9.162zm0-13H7h6zm5 2h-1q-.425 0-.712-.288T15 6t.288-.712T16 5h1V4q0-.425.288-.712T18 3t.713.288T19 4v1h1q.425 0 .713.288T21 6t-.288.713T20 7h-1v1q0 .425-.288.713T18 9t-.712-.288T17 8z"/></svg></span></button>
      </div>      
    `
    const region_card = `
      <div id="${region.id}">
        <div class="accordion-item">
          ${region_header}
          <div id="${region.id}-collapse" class="accordion-collapse collapse" data-bs-parent="#regions-container">
            <div class="accordion-body">
            ${region_form}
            <div id="${region.id}-comments-form-container" class="d-none">
              ${region_comment_form}
              
            </div>
            <div id="${region.id}-comments-container">
            </div>
          </div>
        </div>
      </div>
    `
    if (region.drag == true){
      $("#regions-container").prepend(region_card);
    } else {
      $("#regions-container").append(region_card);
    }
  
    $(`#${region.id}-collapse`).on('shown.bs.collapse', null, {region:region, ws:this.ws}, this.handleRegionToggle);
    $(`#${region.id}-collapse`).on('hide.bs.collapse', null, {region:region, ws:this.ws}, this.handleRegionToggle);
    $(`#${region.id}-save`).on('click', null, {region:region}, this.handleSaveRegion.bind(this));
    $(`#${region.id}-content-form`).on('input', null, {region:region}, this.handleRegionUpdate.bind(this));
    $(`#${region.id}-save-comment`).on('click', null, {region:region}, this.handleSaveComment.bind(this));

    if (region.drag == true){
      this.openRegionCard(region)
    }
  }  

  handleRegionUpdate(event) {
    let region = event.data.region
    this.updateRegion(region)
  }  

  updateRegion(region){
    // console.log(`updating ${region_id} with ${value}`);
    let value = $(`#${region.id}-content-form`).val();
    if (region) {
      // both setOptions and setContent work
      // region.setOptions({ content: value });    
      region.setContent( value );  
      region.setOptions({ color: this.config.REGION_COLOR_NEW }); 
      // this should trigger the region on update event but apparently it does not, so I force the event
      region.emit('update-end');
    }
  
    if (region.drag == false) {
      region.setOptions({ color: this.config.REGION_COLOR }); 
    }
  }

  updateRegionCard(region) {
    $(`#${region.id}-start`).text(secondsToTimestamp(region.start));
    $(`#${region.id}-end`).text(secondsToTimestamp(region.end));
    $(`#${region.id}-duration`).text(
      secondsToTimestamp(region.end - region.start)
    );
  
    if (region.drag == false) {
      // update the region title and hides/disable the content form textarea
      $(`#${region.id}-content`).text( this.getRegionTitle(region) )
      $(`#${region.id}-content-form`).attr("disabled", true);
      $(`#${region.id}-content-form`).text( this.getRegionTitle(region) )
      $(`#${region.id}-content-form`).hide(  )
      $(`#${region.id}-form`).hide(  )
  
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
  
    this.resetCommentInputField(region)
    this.renderRegionComments(region)
  }  

  handleRegionToggle(event){
    // TODO handle event differently if it is triggered by ws or by card click
    let isExpanded = event.currentTarget.classList.contains('show');
    let region = event.data.region
    let ws = event.data.ws
    let current_time = ws.getCurrentTime()
    if (current_time >= region.start && current_time <= region.end){
      // do nothing
      // this is necessary to avoid recursions 
      // because setting the ws time triggers the region.in event 
      // which itself toggles the section causing a loop
    } else {
      if (!isExpanded) {
        ws.setTime(region.start)
      }
    }
  }  

  openRegionCard(region){
    $(`#${region.id}-collapse`).collapse('show');
  }

  closeRegionCard(region){
    $(`#${region.id}-collapse`).collapse('hide');
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
      resize: false,
    });
    region.setOptions({ content: json.title }); //for some reason setting the content during construction produces an html element that breaks the object
    region.data = {'comments':[]} // prepare comments array
    this.loadComments(region);
    region.emit('update-end');  // triggers this.updateRegionCard(region);
    
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
  }

  async doAjaxSaveRegion(region){
    if (region.drag == false){
      // region has already been saved
      console.warn('Invalid action: region has already been saved')
      return null 
    }
    let payload = {
      start: region.start,
      end: region.end,
      native_id: region.id, //map the region.id as native_id
      title: this.getRegionTitle(region),
    };    
    let response;  
    try{
      response = await $.ajax({
        url: UrlManager.getFileUrl().concat("/region"),
        type: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
      });
      return response;
    } catch (error) {
      console.error(error)
    }      

  }

  handleSaveRegion(event){
    this.saveRegion(event.data.region)
    //TODO sort ragion cards
    this.enableCreate(false)
  }

  saveRegion(region){
    this.doAjaxSaveRegion(region).then( (response) => {
      $("#add-section-button").show(100);
      region.setOptions({ drag: false, resize: false });
      this.updateRegion(region)
    });    
  }

  getRegionTitle(region) {
    if (region == null) {
      return null;
    }
  
    if ($(region.content).is("div")) {
      return $(region.content).text();
    }
    return null;
  }  


  async doAjaxLoadComments(region){
    let comments;
    try{
      comments = await $.ajax({
        url: UrlManager.getFileUrl().concat("/region/", region.id, '/comments'),
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json"
      });
      return comments;
    } catch (error){
      if (error.status == 404){

      } else {
        console.error(error)
      }
    }
  }

  loadComments(region){
    this.doAjaxLoadComments(region).then( (comments) => {
      region.data = {'comments':comments}
      // region.emit('update-end');
      this.renderRegionComments(region)
    } );
  }

  handleSaveComment(event){
    this.saveComment(event.data.region)
  }

  async doAjaxSaveComment(region){
    let response;
    let comment = $(`#${region.id}-comment`).val()
    if (comment.length == 0){ return }    
    let payload = {text : comment };
    try {
      response = await $.ajax({
        url: UrlManager.getFileUrl().concat("/region/", region.id, '/comment'),
        type: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json"
      });
      return response;
    } catch (error) {
      //TODO display error
      console.error(error);
    }

  }

  initRegionComments(region){
    if (!region.data){ region.data = {}}
    if (!'comments' in region.data) { region.data[comments] = []}
    if ('comments' in region.data && region.data.comments == null) { region.data.comments = []}
  }

  saveComment(region){
    // FIXME when saving comment the region is not refreshed and the comment input field is not cleared
    this.doAjaxSaveComment(region).then( (response) => {
      if(!response){ return }

      $(`#${region.id}-comment`).data('saved', true)
      this.initRegionComments(region)
      region.data.comments.push( response )
      region.emit('update-end');
    } );    
  }

  resetCommentInputField(region){
    if (region) {
      let saved = $(`#${region.id}-comment`).data('saved')
      if (saved){
        let container = $(`#${region.id}-comments-container`)
        let comment = $(`#${region.id}-comment`).val()
        $(`#${region.id}-comment`).val('')
      }
      return true
    } else {
      return false
    }
  }  

  renderRegionComments(region){
    if (region.data && region.data.comments){
       region.data.comments.forEach( comment => this.renderRegionComment(region, comment) )
    }
  }

  renderRegionComment(region, comment){
    let container = $(`#${region.id}-comments-container`)
    if( $(`#comment-${comment.id}`).length ){
      return null
    } 
    container.append(
      `
      <div id="comment-${comment.id}">
        <p><span class="text-info">${comment.user.username}</span>  <span class="text-secondary">${secondsToTimestamp(comment.ts, true)}</span></p>
        <p class="text-pre">${comment.text}</p>
        <hr>
      </div>
      `
    )
  }  
}
      
class UIManager {
  static bindButtonEvents(regionManager) {

    $("#add-section-button").click(() => {
      regionManager.enableCreate(true);
      $("#add-section-button").hide(100);
    });

  }

  static getTrackName(){
    //TODO load from /track/<file>/name
  }
}

class DescriptionManager{
  constructor(config){
    this.addEventListeners()
  }

  addEventListeners(){
    $("#save-description-button").on('click', () => {
      this.saveDescription();
    });
  }

  async doAjaxLoadDescription(){
    let data;
    try {
      data = await $.ajax({
        url: UrlManager.getFileUrl().concat("/description"),
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json"
      });  
      return data;
    } catch (error) {
      console.error(error)
    }   
  }

  loadDescription(){
    this.doAjaxLoadDescription().then( (data) => {
      if(data){ this.renderDescription(data) }
      
    })
  }

  renderDescription(description){
    $('#description-form').hide()
    $('#save-description-button').hide() //not necessary as part of #description-form
    
    $('#description-content').append(`<p><span class="text-info">${description.user.username}</span>  <span class="text-secondary">${secondsToTimestamp(description.ts, true)}</span></p> ` )
    $('#description-content').append( `<div class="text-pre" id="description-text-full">${description.text}</div>` )
    if (description.text.length > 560){
      $('#description-content').append( `<div class="text-pre" id="description-text-short">${description.text.slice(0, 560)}</div>` )
      $('#description-content').append('<button id="description-text-toggle-button" type="button" class="btn btn-sm float-end">Show more</button>   ')
      $('#description-text-full').hide()

      $('#description-text-toggle-button').on('click', this.handleToggleDescriptionText)
    }
  }

  handleToggleDescriptionText(){
    $('#description-text-short').toggle()
    $('#description-text-full').toggle()
  
    if ( $('#description-text-full').is(':visible') ){
      $('#description-text-toggle-button').text('Show less')
    }else{
      $('#description-text-toggle-button').text('Show more')
    }
  }  

  async doAjaxSaveDescription(){
    let payload = {text : $('#description-textarea').val() }
    let response;

    try {
      response = await  $.ajax({
        // url: "{{ url_for('default.saveregion', file=track.local_name)}}",
        url: UrlManager.getFileUrl().concat("/description"),
        type: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json"
      });
      return response;
    } catch (error) {
      if(error.status == 404){} else { console.error(error) }
    }
  }

  saveDescription(){
    this.doAjaxSaveDescription().then( (response) => {
      this.renderDescription(response)
    });

  }  

  toggleDescriptionText(){
    $('#description-text-short').toggle()
    $('#description-text-full').toggle()
  
    if ( $('#description-text-full').is(':visible') ){
      $('#description-text-toggle-button').text('Show less')
    }else{
      $('#description-text-toggle-button').text('Show more')
    }
  }  

}

class TranscriptionManager{
  constructor() {
    this.eventMap = new Map();
    this.transcription = {}
  }    

  on(event, callback) {
      if (!this.eventMap.has(event)) {
          this.eventMap.set(event, []);
      }
      this.eventMap.get(event).push(callback);
  }

  off(event, callback) {
      if (this.eventMap.has(event)) {
          const callbacks = this.eventMap.get(event).filter(cb => cb !== callback);
          this.eventMap.set(event, callbacks);
      }
  }

  emit(event, ...data) {
      if (this.eventMap.has(event)) {
          this.eventMap.get(event).forEach(callback => {
              callback(...data);
              // setTimeout(() => callback(...data), 0); // not really necessary
          });
      }
  }    

  bindTo(selector){
    $(selector).on('click', null, {}, this.handleTranscriptionEvent.bind(this));
  }

  transcribe(){
    this.emit('transcription-start')
    this.doAjaxTranscribe().then( (response) => {
      this.transcription = response
      this.emit('transcription-end', response)
    });  
  }

  async doAjaxTranscribe(){
    let payload = {
      language: null,
    };    
    let response;  
    try{
      response = await $.ajax({
        url: UrlManager.getFileUrl().concat("/transcribe"),
        type: "GET",
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
      });
      return response;
    } catch (error) {
      console.error(error)
    }
  }      

  handleTranscriptionEvent(event){
    this.transcribe()
  }

  async doAjaxSaveTranscription(transcription){
    let payload = transcription   
    let response;  
    try{
      response = await $.ajax({
        url: UrlManager.getFileUrl().concat("/transcription"),
        type: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
      });
      return response;
    } catch (error) {
      console.error(error)
    }         
  }

  saveTranscription(){
    this.doAjaxSaveTranscription(this.transcription).then( (response) => {
      //TODO return something
      console.debug(`response: ${response}`)
    }); 
  }

  async doAjaxLoadTranscription(){
    let data;
    try{
      data = await $.ajax({
        url: UrlManager.getFileUrl().concat("/transcription"),
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json"
      });
      return data;
    } catch (error) {
      if (error.status == 404){
        console.debug('no transcription for this track')
      } else {
        console.error(error)
      }
      return error
    }
  }

  loadTranscription(){
    this.doAjaxLoadTranscription().then( (response) => {
      console.debug(`response: ${response}`)
      this.transcription = response
      this.emit('transcription-loaded', response)
    }).catch( (reason) => {
      // in this case do not emit the 'transcription-loaded' event
      console.error(`reason: ${reason}`)
    });  
  }

  getTextAt(timestamp){
    if (this.transcription && 'segments' in this.transcription){
      for(let i = 0; i< this.transcription.segments.length; i++){ 
        let segment = this.transcription.segments[i]
        if (segment.start <= timestamp && timestamp <= segment.end ){
          return segment.text
        }
      }
    }      
    return ''
  }

  getSegmentAt(timestamp){
    if (this.transcription && 'segments' in this.transcription){
      for(let i = 0; i< this.transcription.segments.length; i++){ 
        let segment = this.transcription.segments[i]
        if (segment.start <= timestamp && timestamp <= segment.end ){
          return segment
        }
      }
    }      
    return ''
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

function secondsToTimestamp(seconds, full=false) {
  const date = new Date(null);
  date.setSeconds(seconds);
  if (full){
    return "".concat(date.toISOString().slice(0, 10), " ", date.toISOString().slice(11, 19));
  }
  return date.toISOString().slice(11, 19);
}
