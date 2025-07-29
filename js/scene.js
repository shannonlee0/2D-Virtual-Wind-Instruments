const canvas = document.getElementById("game-surface")
const gl = getWebGL(canvas);
    
var sim = new Grid(canvas);
console.log(sim);

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
    
}