var audioEnabled = false;

var workletText = `
class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.sampleRate = 1 / dt;

        // event.data is the message sent
        this.port.onmessage = (event) => {
            this.pressure = event.data.pressure
        };
    }
    
    process(inputs, outputs, parameters) {
        // outputs is a pre-built arr of output nodes
        // usually only one node, so typically length of 1
        // each element of outputs is an array of arrays: one array per channel
        // e.g. outputs = [[channel1], [channel2]],
        // where channeln is an array of audio samples

        const output = outputs[0];

        // for each channel
        // why plus plus i ??
        for (let channel = 0; channel < output.length; ++channel) {
            const outputChannel = output[channel];

            // length of output is 128 samples per call to process()
            for (let i = 0; i < outputChannel.length; ++i) {
                outputChannel[i] = this.pressure;
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
            // const mic = {
            //     i: 100,
            //     j: 200
            // };
            pressure = scene.p[mic["i"]][mic["j"]];
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