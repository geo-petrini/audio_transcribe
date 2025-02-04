const WAVE_COLOR = "rgb(83,83,83)";
const WAVE_COLOR_PROGRESS = "rgb(0,182,240)";
const WAVE_COLOR_RECORD = "rgb(240, 80, 0)";
let ws;

// Initialize plugins
const record = WaveSurfer.Record.create({
    renderRecordedAudio: false,
    scrollingWaveform: true,
    continuousWaveform: false,
    continuousWaveformDuration: 30,
});

const timeline = WaveSurfer.Timeline.create({
    height: 11,
    timeInterval: 10,
    primaryLabelInterval: 60,
    style: {
        fontSize: "10px",
        color: "#ffffff",
    },
});

$(document).ready(function () {
    initializeWaveSurfer();
    setupPauseButton();
    setupMicSelect();
    setupRecordButton();
});

function initializeWaveSurfer() {
    if (ws) ws.destroy();

    ws = WaveSurfer.create({
        container: "#recording",
        waveColor: WAVE_COLOR_RECORD,
        progressColor: WAVE_COLOR_PROGRESS,
        height: 90,
        barWidth: 10,
        barGap: 2,
        barRadius: 4,
    });

    ws.registerPlugin(record);
    ws.registerPlugin(timeline);
}

function setupPauseButton() {
    const pauseButton = $("#pause");

    pauseButton.on("click", function () {
        if (record.isPaused()) {
            record.resumeRecording();
            pauseButton.text("Pause");
        } else {
            record.pauseRecording();
            pauseButton.text("Resume");
        }
    });
}

function setupMicSelect() {
    const micSelect = $("#mic-select");

    WaveSurfer.Record.getAvailableAudioDevices().then((devices) => {
        devices.forEach((device) => {
            micSelect.append(
                `<option value="${device.deviceId}">${device.label || device.deviceId}</option>`
            );
        });
    });
}

function setupRecordButton() {
    const recButton = $("#record");
    const pauseButton = $("#pause");

    recButton.on("click", function () {
        if (record.isRecording() || record.isPaused()) {
            record.stopRecording();
            recButton.text("Record");
            pauseButton.hide();
        } else {
            recButton.prop("disabled", true);
            const deviceId = $("#mic-select").val();

            record.startRecording({ deviceId }).then(() => {
                recButton.text("Stop");
                recButton.prop("disabled", false);
                pauseButton.show();
            });
        }
    });
}

record.on("record-end", handleRecordEnd);
record.on("record-progress", updateProgress);

function handleRecordEnd(blob) {
    createDownloadSection(blob);
}

function createDownloadSection(blob) {
  const container = $("#recordings"); 
  const waveSurferManager = new WaveSurferManager(blob);
  waveSurferManager.getWavesurfer(container);  
  
  container.append( waveSurferManager.getPlayButton() );
  container.append( waveSurferManager.getDownloadButton() );
  container.append( waveSurferManager.getNameInput() );
}

function OLD_createDownloadSection(blob) {
    const container = $("#recordings");
    const recordedUrl = URL.createObjectURL(blob);

    const wavesurfer = WaveSurfer.create({
        container: container[0],
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
        plugins: [
            WaveSurfer.Timeline.create({
                height: 11,
                timeInterval: 10,
                primaryLabelInterval: 60,
                style: { fontSize: "10px", color: "#ffffff" },
            }),
            WaveSurfer.Hover.create({
                lineColor: "#ffffff",
                lineWidth: 2,
                labelBackground: "#555",
                labelColor: "#fff",
                labelSize: "11px",
            }),
        ],
    });

    // Play button
    const playButton = $(`<button class="btn btn-primary">Play</button>`);
    playButton.on("click", () => wavesurfer.playPause());
    container.append(playButton);

    wavesurfer.on("pause", () => playButton.text("Play"));
    wavesurfer.on("play", () => playButton.text("Pause"));

    // Download link
    const downloadLink = $(
        `<a href="${recordedUrl}" class="btn btn-primary" download="recording.${blob.type.split(";")[0].split("/")[1] || "webm"}">Download recording</a>`
    );
    container.append(downloadLink);
}

function updateProgress(time) {
    const formattedTime = formatTime(time);
    $("#progress").text(formattedTime);
}

function formatTime(milliseconds) {
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    return [minutes, seconds]
        .map((v) => (v < 10 ? "0" + v : v))
        .join(":");
}


class WaveSurferManager {
  constructor(url) {
    this.url = url;
    this.wavesurfer = null;
    this.playButton = null;
    this.downloadButton = null
    this.nameInput = null;
    this.id = Date.now()
  }

  getWavesurfer(container) {
    if (!this.wavesurfer) {
      const recordedUrl = URL.createObjectURL(this.url);
      this.wavesurfer = WaveSurfer.create({
        container: container[0],
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
        plugins: [
            WaveSurfer.Timeline.create({
                height: 11,
                timeInterval: 10,
                primaryLabelInterval: 60,
                style: { fontSize: "10px", color: "#ffffff" },
            }),
            WaveSurfer.Hover.create({
                lineColor: "#ffffff",
                lineWidth: 2,
                labelBackground: "#555",
                labelColor: "#fff",
                labelSize: "11px",
            }),
        ],
    });
    }
  }

  getPlayButton() {
    if (!this.playButton) {
      this.playButton = $(`<button class="btn btn-primary">Play</button>`);
      const wavesurfer = this.wavesurfer;
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

  getDownloadButton(){
    if (!this.downloadButton) {
      const recordedUrl = URL.createObjectURL(this.url);
      this.downloadButton = $( `<a href="${recordedUrl}" class="btn btn-primary" download="recording.${this.url.type.split(";")[0].split("/")[1] || "webm"}">Download recording</a>`);
    }
    return this.downloadButton;
  }

  getNameInput(){
    if (!this.nameInput){
      this.nameInput = $(`
            <div class="form-floating">
              <textarea id="${this.id}-name-input" class="form-control" aria-label="With textarea"></textarea>
              <label for="${this.id}-comment">Name</span>
            </div>        
        `)
    }
    return this.nameInput;
  }
  
}