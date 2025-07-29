// a vertex shader handles pressing 3d coordinates into 2d
// a fragment shader handles rasterization (converting shapes (triangles)) into pixels (fragments)), determines color of each fragment

// create a new buffer when: vertices have different attributes / sizes; avoid overwriting; etc.

// this is a workaround to using an external file
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
'   gl_FragColor = vec4(fragColor, 1.0);',
'}'
].join('\n');



// stores this function in variable InitDemo
// not hoisted, define before using
// drk why
// onload="InitDemo();"
var InitDemo = function() {
    gridHeight = 3
    gridWidth = 3;

    // initialize webgl
    const canvas = document.getElementById("game-surface")
    const gl = getWebGL(canvas);

    // sets the color of the paint, but doesn't actually paint
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // color buffer stores what color the pixels should be
    // depth buffer stores order (to front, back, etc.)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const program = setup(gl);


    const buffer = gl.createBuffer();

    

    const triangles = calculateGridVertices(canvas);
    console.log(triangles);


    // const gridTest = calculateGridVertices(canvas);

    // drawGrid(gl, program, gridTest, gridVertexBufferObject);
    // gl.useProgram(program);
    // gl.drawArrays(gl.TRIANGLES, 0, gridTest.length / 2);

    

    // now, we've set up graphics card program
    // ready to accept vertices




    // trackThreeClicks(canvas, function(points) {
    //     const triangleVertices = points
    //     drawTriangle(gl, program, triangleVertices);
    //     gl.useProgram(program);
    //     gl.drawArrays(gl.TRIANGLES, 0, 3);
    // });

    // trackTwoClicks(canvas, function(points) {
    //     const vertices = calculateLineVertices(points);
    //     console.log(vertices)
    //     drawLine(gl, program, vertices);
    //     gl.useProgram(program);
    //     gl.drawArrays(gl.TRIANGLES, 0, 6);
    // });

    // all works
    // let vertices = [];
    // const lineVertexBufferObject = gl.createBuffer();

    // trackDragClick(canvas, function(points) {

    //     // right now hardcoding for points.length = 8 to test
    //     console.log(points.length);

    //     // arr1.length = 4, contains two points (4 coordinates)
    //     let arr1 = [];
    //     // calculatedPoints.length = 12, contains six points (12 coordinates)
    //     let calculatedPoints = [];
    //     for (let i = 0; i < points.length / 4; i++) {
    //         arr1 = points.slice(4*i, 4*i + 4);
    //         console.log(arr1)
    //         calculatedPoints = calculateLineVertices(arr1);
    //         console.log(calculatedPoints)
    //         vertices.push(...calculatedPoints);
    //     }

    //     console.log(vertices);

    //     // sets the color of the paint, but doesn't actually paint
    //     gl.clearColor(0.75, 0.85, 0.8, 1.0);

    //     // color buffer stores what color the pixels should be
    //     // depth buffer stores order (to front, back, etc.)
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        


    //     // const newVertices = (calculateLineVertices(points));
    //     // vertices = newVertices
    //     // console.log("vert1: ", vert1);
    //     drawLines(gl, program, vertices, lineVertexBufferObject);
    //     gl.useProgram(program);
    //     gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    //     // requestAnimationFrame(render);
    // });

    // all works

    // function render() {
    //     // update
    //     drawLines(gl, program, vertices);
    //     gl.useProgram(program);
    //     console.log(vertices.length);
    //     gl.drawArrays(gl.TRIANGLES, 0, 12);
        

    //     // continues loop
        
    //     // requestAnimationFrame(render);
        
    // }


    // starts loop
    // requestAnimationFrame(render);






    // main render loop

    // specify which program to use
    // gl.useProgram(program);
    // gl.drawArrays(gl.TRIANGLES, 0, 3);
    // says: 1) we're drawing in triangles (use this 99% of time)
    // 2) how many of these vertices do we skip?
    // 3) how many vertices do we have to draw?
    // uses whichever buffer actively bound

    

};


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

function trackDragClick(canvas, callback) {
    let start = null;
    let end = null;

    canvas.addEventListener("mousedown", function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);
        console.log("clip coordinates:", clipX, clipY)
        
        start = [clipX, clipY];
        console.log(start);
    });

    canvas.addEventListener("mouseup", function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);
        console.log("clip coordinates:", clipX, clipY)
        end = [clipX, clipY];
        console.log(end);

        if (start && end) {
            // canvas.removeEventListener("click", handleClick);
            start.push(...end);
            const points = start;
            console.log(points);
            callback(points);
        }
    });
}

function trackTwoClicks(canvas, callback) {
    let count = 0;
    let points = [];
    canvas.addEventListener("click", function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);
        console.log("clip coordinates:", clipX, clipY)
        points.push(clipX, clipY);
        count++;

        if (count == 2) {
            // canvas.removeEventListener("click", handleClick);
            count = 0;
            callback(points);
        }
    });
}

function trackThreeClicks(canvas, callback) {
    let count = 0
    let points = []
    canvas.addEventListener("click", function handleClick(event) {
        // coordinates relative to specific element
        const rect = canvas.getBoundingClientRect();
        const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
        const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

        console.log("clip coordinates:", clipX, clipY)
        points.push(clipX, clipY)

        count++;
        if (count == 3) {
            canvas.removeEventListener("click", handleClick)
            callback(points);
        }
        
    });  
}

function getWebGL(canvas) {
    var gl = canvas.getContext('webgl');

    if(!gl) {
        console.log("webGL not supported, so experimental");
        gl = canvas.getContext('experimental-webgl')
    }

    if (!gl) {
        alert('browser doesnt support webgl');
    }
    return gl;
}

function drawTriangle(gl, program, triangleVertices) {
    // const triangleVertices = 
    // [// x, y            R, G, B
    //     0.0, 0.5,       1.0, 1.0, 0.0,
    //     -0.5, -0.5,     0.7, 0.0, 1.0,
    //     0.5, -0.5,       0.1, 1.0, 0.6
    // ];
    // must be counter clockwise?
    // this is sitting on main computer RAM i.e. CPU-accessible memory, graphics card has no notion of this
    
    // now must attach that list to graphics card (vertex shader)
    
    // create buffer:
    // buffer is chunk of memory on GPU allocated for data (e.g. vertices, colors, normals, etc.)
    // this is how large chunks of data from JS code (CPU) are sent to WebGL (GPU)
    const triangleVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
    // saying: 1) active buffer is an "array buffer" type (stores vertex attributes),
    // 2) binding triangleVertexBufferObject to be active buffer

    // specify the data on the active buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    // saying: 1) array buffer is the type of buffer,
    // 2) we want to use triangleVertices (type is tricky, must be converted to 32-bit floating point as opposed to default 64-bit (in JS?))
    // 3) sending info from CPU to GPU once, never going to be changed afterward (hence "static")
    // this uses whatever buffer last bound (here, triangleVertexBufferObject)

    // inform vertex shader that vertPosition is a pair in triangleVertices
    // and that vertColor is a triplet after that pair
    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    // const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

    // now, specify layout of this attribute
    gl.vertexAttribPointer(
        positionAttribLocation, // attribute location
        2, // number of elements in each attribute (this one is a vec2)
        gl.FLOAT, // type of elements
        gl.FALSE, // is data normalized?
        2 * Float32Array.BYTES_PER_ELEMENT, // size of individual vertex (so graphics card can reinterpret this data)
        0 // offset from the beginning of a single vertex to this attribute (no offsets here)
    );

    // gl.vertexAttribPointer(
    //     colorAttribLocation, // attribute location
    //     3, // number of elements in each attribute (this one is a vec2)
    //     gl.FLOAT, // type of elements
    //     gl.FALSE, // is data normalized?
    //     5 * Float32Array.BYTES_PER_ELEMENT, // size of individual vertex (so graphics card can reinterpret this data)
    //     2 * Float32Array.BYTES_PER_ELEMENT // skips x-, y-values
    // )

    // enable attribute for use
    gl.enableVertexAttribArray(positionAttribLocation);
    // gl.enableVertexAttribArray(colorAttribLocation);
}

function drawLines(gl, program, vertices, buffer) {
    // const lineVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');

    gl.vertexAttribPointer(
        positionAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        2 * Float32Array.BYTES_PER_ELEMENT,
        0
    );

    gl.enableVertexAttribArray(positionAttribLocation);
}

function calculateGridVertices(canvas) {
    const rect = canvas.getBoundingClientRect();

    // hardcode width 3
    const width = 3;
    let hCoords = [];
    const hIndent = (rect.right - rect.left) / width;
    for (let i = 0; i < width + 1; i++) {
        hCoords.push(rect.left + hIndent * i);
    }

    // hardcode height 3
    const height = 3;
    let vCoords = [];
    const vIndent = (rect.bottom - rect.top) / height;
    for (let i = 0; i < height + 1; i++) {
        vCoords.push(rect.top + vIndent * i);
    }


    let topTriangleVertices = [];
    let triangle = [];
    for (let i = 0; i < width + 1; i++) {
        for (let j = 0; j < height; j++) {
            triangle = [hCoords[j], vCoords[i], hCoords[j+1], vCoords[i], hCoords[j], vCoords[i+1]];
            topTriangleVertices.push(...triangle);
        }
    }
    
    topTriangleVertices = toClipCoords(topTriangleVertices, canvas);
    console.log(topTriangleVertices);

    let bottomTriangleVertices = [];
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            triangle = [hCoords[j+1], vCoords[i], hCoords[j], vCoords[i+1], hCoords[j+1], vCoords[i+1]];
            bottomTriangleVertices.push(...triangle);
        }
    }
    bottomTriangleVertices = toClipCoords(bottomTriangleVertices, canvas);
    console.log(bottomTriangleVertices);

    let vertices = [];

    for (let i = 0; i < topTriangleVertices.length + bottomTriangleVertices.length; i++) {
        vertices.push(...topTriangleVertices.slice(6*i, 6*i + 6));
        vertices.push(...bottomTriangleVertices.slice(6*i, 6*i + 6));
    }

    console.log("hcoords", toClipCoords(hCoords, canvas));
    console.log("vcoords", toClipCoords(vCoords, canvas));

    // returns array, first 12 is top triangle coords, next 12 is bottom triangle coords, etc.
    
    return vertices;
    
}

function drawCell(gl, program, vertices, buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(program,'vertPosition');

        gl.vertexAttribPointer(
            positionAttribLocation,
            2,
            gl.FLOAT,
            gl.FALSE,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
        );

        gl.enableVertexAttribArray(positionAttribLocation);
}

function drawGrid(gl, program, vertices, buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(program,'vertPosition');

        gl.vertexAttribPointer(
            positionAttribLocation,
            2,
            gl.FLOAT,
            gl.FALSE,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
        );

        gl.enableVertexAttribArray(positionAttribLocation);
}

function toClipCoords(arr, canvas) {
    // arr: even index is x-coord, odd is y-coord (pixel coordinates)
    // clipArr: even index is x-coord, odd is y-coord (clip coordinates)
    const rect = canvas.getBoundingClientRect();
    let index = 0;
    let clip;
    let clipArr = [];
    for (let i = 0; i < arr.length; i++) {
        if (index % 2 == 0) {
            clip = (arr[i] / rect.right) * 2 - 1
        }
        else {
            clip = -((arr[i] / rect.bottom) * 2 - 1)
        }
        clipArr.push(clip);
        index++;
    }
    return clipArr;
}






function calculateLineVertices(points) {
    // given two vertices, output six vertices to describe line segment with thickness th
    // points = (x1, y1, x2, y2)
    // normalize

    if (points.length != 4) {
        console.log('points is not length 4');
    }

    const thickness = 0.02;

    const displacementX = points[2] - points[0];
    const displacementY = points[3] - points[1];
    const magHyp = Math.sqrt((displacementX ** 2) + (displacementY ** 2));

    // [x, y] from origin
    const unitVec = [displacementX / magHyp, displacementY / magHyp];
    const normalVec = [unitVec[1], -1 * unitVec[0]];

    // magnitude of offset is half of thickness
    const offset = [normalVec[0] * (thickness / 2), normalVec[1] * (thickness / 2)];

    // vertices = [x1, y1, x2, y2, x3, y3, x2, y2, x3, y3, x4, y4]
    vertices = [
        points[0] + offset[0],
        points[1] + offset[1],
        points[0] - offset[0],
        points[1] - offset[1],
        points[2] + offset[0],
        points[3] + offset[1],
        points[0] - offset[0],
        points[1] - offset[1],
        points[2] + offset[0],
        points[3] + offset[1],
        points[2] - offset[0],
        points[3] - offset[1],
    ];

    return vertices;
}