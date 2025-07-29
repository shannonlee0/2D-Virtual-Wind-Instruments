var vertexShaderText =
    [
        'precision mediump float;',
        '',
        'attribute vec2 vertPosition;',
        'attribute vec3 vertColor;',
        // a "varying" variable is written in vertex shader, read in fragment shader, and is interpolated across the surface of a triangle
        // i.e. passes interpolated data from vertex to fragment shader
        'varying vec3 fragColor;',
        '',
        'void main()',
        '{',
        '   fragColor = vertColor;',
        // gl_Position is built-in variable in vertex shader, uses clip space coordinates
        // after setting, GPU converts from clip space to normalized device coordinates and maps to 2d screen
        '   gl_Position = vec4(vertPosition, 0.0, 1.0);',
        '}'
    ].join('\n');
var fragmentShaderText =
    [
        'precision mediump float;',
        '',
        // fragColor must match declaration in vertexShaderText
        'varying vec3 fragColor;',
        'void main()',
        '{',
        // gl_FragColor is built-in variable in fragment shader, tells GPU what color current fragment (pixel) should be on screen
        // (R, G, B, opacity)
        // '   gl_FragColor = vec4(fragColor, 1.0);',
        '   gl_FragColor = vec4(fragColor, 1.0);',
        '}'
    ].join('\n');

gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

const program = setup(gl);
const buffer = gl.createBuffer();

function setup(gl) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    // compile shaders from code above
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    // error checking, errors may not be apparent if simply run
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('error compiling vertex shader', gl.getShaderInfoLog(vertexShader));
        return;
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('error compiling fragment shader', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    //
    // vertex and fragment shader now ready to use
    //

    // program is a linked pair of shaders (vertex, fragment) that runs on GPU
    // tell webgl these are the shaders we want to use together
    const program = gl.createProgram();

    // webgl remembers that vertexShader is a vertex shader, etc. so matches automatically
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader)

    // from program takes attached shaders, links them into a complete GPU pipeline
    gl.linkProgram(program);

    // error checking
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('error linking program', gl.getProgramInfoLog(program));
        return;
    }

    // catches additional errors in linked shader program (only do in testing, bc costly)
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('error validating program', gl.getProgramInfoLog(program));
        return;
    }

    return program;
}

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

function drawCell(gl, program, vertices, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

    gl.vertexAttribPointer(
        positionAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
    );

    gl.vertexAttribPointer(
        colorAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT,
    )

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);
}