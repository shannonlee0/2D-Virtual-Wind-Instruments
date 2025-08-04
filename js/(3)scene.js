numSteps = 1;

const canvas = document.getElementById("simulation-surface");
canvas.tabIndex = 0;
canvas.focus();


const rect = canvas.getBoundingClientRect();
const gl = getWebGL(canvas);
    
let scene = new Grid();
console.log(scene);

function getWebGL(canvas) {
    var gl = canvas.getContext('webgl');

    if (!gl) {
        console.log("webGL not supported, so experimental");
        gl = canvas.getContext('experimental-webgl')
    }

    if (!gl) {
        alert('browser doesnt support webgl');
    }
    return gl;
}

function simulate() {
    if (scene.play) {
        for (let i = 0; i < numSteps; i++) {
            scene.step();
        }
    }
}

function update() {
    canvas.focus();
    simulate();
    scene.getDamping(pmlThicknessInstrument);
    scene.mapPressure();

    const size = 4;
    const green = [0, 255, 0];

    // change to circle
    for (let k = micLocation["i"] - (size / 2); k < micLocation["i"] + (size / 2); k++) {
        for (let n = micLocation["j"] - (size / 2); n < micLocation["j"] + (size / 2); n++) {
            this.colorCell(k, n, green);
            console.log("doing");
        }
    }
    draw();
    requestAnimationFrame(update);
}