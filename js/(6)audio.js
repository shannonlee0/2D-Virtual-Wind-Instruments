var audioEnabled = false;

var workletText = `
class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.recordedPressure = 0;
        this.smoothedPressure = 0;
        this.phase = 0;
        this.sampleRate = 44800;

        // event.data is the message sent
        this.port.onmessage = (event) => {
            this.recordedPressure = event.data.pressure
        };
        // constructs fs
        this.logged = false;
    }
    
    process(inputs, outputs, parameters) {
        // outputs is a pre-built arr of output nodes
        // usually only one node, so typically length of 1
        // each element of outputs is an array of arrays: one array per channel
        // e.g. outputs = [[channel1], [channel2]],
        // where channeln is an array of audio samples

        const output = outputs[0];

        // to prevent clicks, smooth amplitude and generate sine wave
        const dt = 1.0 / this.sampleRate;
        // zhehao has 0.1
        const smoothing = 0.01


        // for each channel
        // why plus plus i ??
        for (let channel = 0; channel < output.length; ++channel) {
            const outputChannel = output[channel];

            // length of output is 128 samples per call to process()
            for (let i = 0; i < outputChannel.length; ++i) {
                let sample = 0.0;
                this.smoothedPressure += smoothing * (this.recordedPressure - this.smoothedPressure);
                sample = Math.sin(this.phase) * this.smoothedPressure;

                outputChannel[i] = sample;
                console.log("sample:", sample);

                this.phase += dt * 2 * Math.PI * 440;
                if (this.phase > 2 * Math.PI) {
                    this.phase -= 2 * Math.PI;
                }
            }
        }
        return true;

    }
}
    registerProcessor('audio-processor', AudioProcessor);
`

const blob = new Blob([workletText], { type: 'application/javascript' });
const workletURL = URL.createObjectURL(blob);

function toggleAudio() {
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
        if (!window.audioCtx) {
            initializeAudio();
        }
        if (window.audioCtx.state === 'suspended') {
            window.audioCtx.resume();
        }
    }
    else {
        if (window.audioCtx) {
            window.audioCtx.suspend();
        }
    }
}

async function initializeAudio() {
    try {
        // attach to window for global access across scripts
        window.audioCtx = new (window.AudioContext)();

        // wait to add module workletURL
        await window.audioCtx.audioWorklet.addModule(workletURL);

        // where audio-processor is the name of the processor registered
        // and is of the class AudioProcessor
        const workletNode = new AudioWorkletNode(window.audioCtx, 'audio-processor');
        workletNode.connect(window.audioCtx.destination);

        window.audioWorkletNode = workletNode;

        // initial values
        let pressure = 0;
        setInterval(() => {
            // get pressure at mic location, apparently that's all that's needed?
            const micLocation = {
                i: 100,
                j: 200
            };
            pressure = scene.p[micLocation["i"]][micLocation["j"]];
            workletNode.port.postMessage({
                type: "updateScene",
                pressure: pressure});

            // calling itself correctly
        }, 16);

        // passing here fs
        

    } catch (error) {
        console.error("error intializing audio");
    }
}