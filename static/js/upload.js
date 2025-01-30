const WAVE_COLOR = "rgb(83,83,83)";
const WAVE_COLOR_PROGRESS = "rgb(0,182,240)";
const WAVE_COLOR_RECORD = "rgb(240, 80, 0)";
let ws
// Initialize the Record plugin
let record = WaveSurfer.Record.create({
    renderRecordedAudio: false,
    scrollingWaveform: true,
    continuousWaveform: false,
    continuousWaveformDuration: 30, // optional
})
const timeline = WaveSurfer.Timeline.create({
    height: 11,
    timeInterval: 10,
    primaryLabelInterval: 60,
    style: {
      fontSize: "10px",
      color: "#ffffff",
    },
  }); // Initialize timeline plugin

$(document).ready(function () {
    if (ws) {
        ws.destroy();
    }

    // Create a new Wavesurfer instance
    ws = WaveSurfer.create({
        container: "#recording",
        waveColor: WAVE_COLOR_RECORD,
        progressColor: WAVE_COLOR_PROGRESS,
        height: 90,
        barWidth: 10,
        barGap: 2,
        barRadius: 4,
    });   
    ws.registerPlugin(record) 
    ws.registerPlugin(timeline) 
});


$(document).ready(function () {
    //TODO refactor

    // pauseButton.style.display = "none";
    // recButton.textContent = "Record";    
    const pauseButton = document.querySelector("#pause");
    pauseButton.onclick = () => {
      if (record.isPaused()) {
        record.resumeRecording();
        pauseButton.textContent = "Pause";
        return;
      }
    
      record.pauseRecording();
      pauseButton.textContent = "Resume";
    };
    
    const micSelect = document.querySelector("#mic-select");
    {
      // Mic selection
      WaveSurfer.Record.getAvailableAudioDevices().then((devices) => {
        devices.forEach((device) => {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.text = device.label || device.deviceId;
          micSelect.appendChild(option);
        });
      });
    }
    // Record button
    const recButton = document.querySelector("#record");
    
    recButton.onclick = () => {
      if (record.isRecording() || record.isPaused()) {
        record.stopRecording();
        recButton.textContent = "Record";
        pauseButton.style.display = "none";
        return;
      }
    
      recButton.disabled = true;
    
      // reset the wavesurfer instance
    
      // get selected device
      const deviceId = micSelect.value;
      record.startRecording({ deviceId }).then(() => {
        recButton.textContent = "Stop";
        recButton.disabled = false;
        pauseButton.style.display = "inline";
      });
    };
});
 


// Render recorded audio
record.on("record-end", (blob) => {
    createDownloadSection(blob)
});

record.on("record-progress", (time) => {
    updateProgress(time);
});

function createDownloadSection(blob){
    //TODO use jquery for consistence
    //TODO add an input field to give a name to the recording
    //TODO add an upload button 
    //TODO remove the recording once the upload is done
    const container = document.querySelector("#recordings");
    const recordedUrl = URL.createObjectURL(blob);

    // Create wavesurfer from the recorded audio
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

    const wavesurfer = WaveSurfer.create({
      container,
      url: recordedUrl,
      waveColor: WAVE_COLOR,
      progressColor: WAVE_COLOR_PROGRESS,
      height: 90,
      barWidth: 10,
      barGap: 2,
      barRadius: 4,
      mediaControls: true,
      interact: true,
      dragToSeek: true,
      plugins: [ hover, timeline],
    });

    // Play button
    const button = container.appendChild(document.createElement("button"));
    button.textContent = "Play";
    button.classList.add("btn")
    button.classList.add("btn-primary")
    button.onclick = () => wavesurfer.playPause();
    wavesurfer.on("pause", () => (button.textContent = "Play"));
    wavesurfer.on("play", () => (button.textContent = "Pause"));

    // Download link
    const link = container.appendChild(document.createElement("a"));
    Object.assign(link, {
      href: recordedUrl,
      download: "recording." + blob.type.split(";")[0].split("/")[1] || "webm",
      textContent: "Download recording",
    });
}


function updateProgress(time){
    //TODO use jquery for consistence
    // time will be in milliseconds, convert it to mm:ss format
    const formattedTime = [
        Math.floor((time % 3600000) / 60000), // minutes
        Math.floor((time % 60000) / 1000), // seconds
    ]
    .map((v) => (v < 10 ? "0" + v : v))
    .join(":");
    const progress = document.querySelector("#progress");
    progress.textContent = formattedTime;
}


