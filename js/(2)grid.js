//

// resolution 1 is 110 x 220
const resolution = 1;
const gridHeight = 110 * resolution;
const gridWidth = 2 * gridHeight;

const C = 343.2;
const RHO = 1.2;
const dt = 0.00000781
const dx = 0.00383;

const pmlThicknessBoundary = 10 * resolution;
const pmlThicknessInstrument = 0;

class Grid {
    constructor(height, width) {
        this.height = height;
        this.width = width;

        // initialize empty grid
        const gridVertices = calculateGridVertices(verticalCoords(this), horizontalCoords(this), this);
        this.coordinates = initializeCoordinates(gridVertices, this);
        this.color = initializeColor(this);

        // initialize grid values
        let values = initializeGridValues(this);
        this.p = values["pressure"];
        this.vx = values["velocityX"];
        this.vy = values["velocityY"];

        // initialize geometry booleans
        this.geometry = initializeGeometry(this);

        // set up damping coefficients
        this.damping = initializeDamping(this);
        this.getDamping(pmlThicknessBoundary);

        // array of {key=i: value=leftmost i-coord, key=j: value=leftmost j-coord, key=length, value=length of tonehole}
        this.toneholes = [];

        this.play = false;
        this.frame = 0;
    }

    stepPressure() {
        // adjust bounds to account for ghost cells
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                let div_v = (this.vx[i][j] - this.vx[i][j - 1] + this.vy[i][j] - this.vy[i - 1][j]) / dx
                if (!this.geometry[i][j]) {
                    this.p[i][j] = ((-RHO * C * C * div_v * dt) + this.p[i][j]) / (1 + this.damping[i][j]);
                }
            }
        }
    }
    
    stepVelocity() {
        // adjust bounds to account for ghost cells and extra cell due to staggered grid
        // vx
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 0; j < this.width - 1; j++) {
                // ?
                let grad_p_x = (this.p[i][j + 1] - this.p[i][j]) / dx
                this.vx[i][j] = (-1 / RHO * dt * grad_p_x + this.vx[i][j]) / (1 + this.damping[i][j]);
            }
        }

        // vy
        for (let i = 0; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                let grad_p_y = (this.p[i + 1][j] - this.p[i][j]) / dx
                this.vy[i][j] = (-1 / RHO * dt * grad_p_y + this.vy[i][j]) / (1 + this.damping[i][j]);
            }
        }
    }

    colorCell(i, j, choice) {
        // can take in [R, G, B] or color name
        const color = getColor(choice);
        this.color[i][j] = color;
    }

    mapPressure() {
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                if (!this.geometry[i][j] && i != mouseI && j != mouseJ) {
                    this.colorCell(i, j, pressureToColor(this.p[i][j]));
                }
            }
        }
    }

    drawInstrument(i, j) {
        if (i >= 0 && i < this.height && j >= 0 && j < this.width) {
            this.geometry[i][j] = true;
            this.colorCell(i, j, "white");
        }

        // push to moves queue
        if (moves.length == 0 || moves[moves.length - 1][0] != i || moves[moves.length - 1][1] != j) {
            moves.push([i, j]);
        }
    }

    drawAir(i, j) {
        this.colorCell(i, j, "black");
        this.geometry[i][j] = false;
    }

    drawToneholes(i, j) {
        if (this.geometry[i][j]) {
            this.colorCell(i, j, "orange");
        }
    }

    toggleTonehole(num) {
        const hole = scene.toneholes[num - 1];
        hole.open = !hole.open;
        console.log(scene.toneholes);

        // if tonehole is opened
        if (hole.open) {
            for (let j = 0; j <= hole.length; j++) {
                this.drawAir(hole.i, hole.j + j);
                this.drawInstrument(hole.i - 2, hole.j + j);
            }
        }

        // if tonehole is closed
        else if (!hole.open) {
            for (let j = 0; j <= hole.length; j++) {
                this.drawInstrument(hole.i, hole.j + j);
                this.drawAir(hole.i - 2, hole.j + j);
                this.colorCell(hole.i, hole.j + j, "orange");
                
            }
        }
    }

    getDamping(thickness) {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.geometry[i][j] == true) {
                    this.getSigmas(i, j, thickness);
                }
            }
        }
    }

    getSigmas(instrumentI, instrumentJ, thickness) {
        // given an instrument cell ij, check every cell located in range of thickness
        // directly edit damping field
        const step = 1 / (thickness + 1);
        for (let i = 0; i <= thickness*2 + 1; i++) {
            for (let j = 0; j <= thickness*2 + 1; j++) {
                const trueIndexI = instrumentI - thickness + i;
                const trueIndexJ = instrumentJ - thickness + j;
                // get label that indicates closeness to outer boundary [0, 1, ..., 1, 0]
                // add one, then multiply by step
                if ((trueIndexI >= 0 && trueIndexI < this.height) && (trueIndexJ >= 0 && trueIndexJ < this.width)) {
                    this.damping[trueIndexI][trueIndexJ] = Math.max(step * Math.min(getLabel(i, thickness) + 1, getLabel(j, thickness) + 1), this.damping[trueIndexI][trueIndexJ]);
                }
            }
        }
    }

    applyMonopole(i, j) {
        this.p[i][j] = amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
    }

    applyDipole(i1, j1, i2, j2) {
        this.p[i1][j1] = -amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
        this.p[i2][j2] = amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
    }
    
    applyClarinet(i, j) {
        // mouth pressure pm, bore pressure bp
        // jet width wj
        // reed gap E [0, hr] (where hr is resting aperture)
        // reed elasticity kr

        let pb = this.p[i][j + 2];
        let wj = 1.2 * 10**(-2);
        let hr = 6 * 10**(-4);
        const kr = 8 * 10**(6);

        // the smaller deltaP, the greater the reed gap
        let deltaP = pm - pb;

        //if (deltaP < 0) { deltaP = 0; }
        //console.log("delta p", deltaP);

        // pressure difference at which reed gap = 0
        const deltaPMax = kr * hr;
        //console.log("delta p max", deltaPMax);

        // reed aperture factor E [0, 1]: factor = 0 -> reed fully closed
        let gapFactor = (1 - (deltaP / deltaPMax));
        //console.log("gap factor", gapFactor);

        // particle velocity due to steady-state Bernoulli equation (incompressible flow assumed)
        const vp = (2 * deltaP / RHO) ** (1/2);

        // calculate volume flow into bore ub to find velocity of bore cells vb
        let ub = wj * hr * gapFactor * vp;

        // let vb = ub / H / dx / (number of drawn excitation cells?)
        let vb = ub / (0.025 * dx * source.height);
    
        for (let n = 0; n < source.height; n++) {
            this.vx[i + n][j] = 1;
            this.geometry[i + n][j] = true;
        }
    }

    crossHatch(mouseI, mouseJ) {
        // why doesnt this stop when hatch is false ?????????
        for (let i = pmlThicknessBoundary; i < gridHeight - pmlThicknessBoundary; i++) {
            if (!this.geometry[i][mouseJ]) {
                this.colorCell(i, mouseJ, "gray");
            }
            
        }

        for (let j = pmlThicknessBoundary; j < gridWidth - pmlThicknessBoundary; j++) {
            if (!this.geometry[mouseI][j]) {
                this.colorCell(mouseI, j, "gray");
            }
        }
    }

    colorConstants(mic, source) {
        // color mic and source
        this.colorCell(mic.i, mic.j, "green");
        for (let n = 0; n < source.height; n++) {
            this.colorCell(source.i + n, source.j, "yellow");
        }
    }

    reset() {
        const newScene = new Grid(gridHeight, gridWidth);
        scene = newScene;
        clarinet();
    }
}

function calculateGridVertices(vCoords, hCoords, grid) {
    const height = grid.height;
    const width = grid.width;
    let triangle = [];
    let topTriangleVertices = [];
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            triangle = [hCoords[j], vCoords[i], hCoords[j + 1], vCoords[i], hCoords[j], vCoords[i + 1]];
            topTriangleVertices.push(...triangle);
        }
    }

    let bottomTriangleVertices = [];
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            triangle = [hCoords[j + 1], vCoords[i], hCoords[j], vCoords[i + 1], hCoords[j + 1], vCoords[i + 1]];
            bottomTriangleVertices.push(...triangle);
        }
    }

    // combine top and bottom: first 6 is top triangle coords, next 6 is bottom triangle coords, etc.
    let vertices = [];
    for (let i = 0; i < topTriangleVertices.length; i++) {
        vertices.push(...topTriangleVertices.slice(6 * i, 6 * i + 6));
        vertices.push(...bottomTriangleVertices.slice(6 * i, 6 * i + 6));
    }
    return vertices;
}

function initializeCoordinates(allVertices, grid) {
    const height = grid.height;
    const width = grid.width;
    // returns coordinates 2d arr: cell-ij = [x1, y1, ..., x6, y6]
    let coordinates = [];
    for (let i = 0; i < height; i++) {
        coordinates[i] = [];
        for (let j = 0; j < width; j++) {
            // each cell's vertices described in chunks of 12
            coordinates[i][j] = allVertices.slice(12 * (width * i + j), 12 * (width * i + j) + 12);
        }
    }
    return coordinates;
}

function initializeColor(grid) {
    const height = grid.height;
    const width = grid.width;
    let color = [];
    for (let i = 0; i < height; i++) {
        color[i] = [];
        for (let j = 0; j < width; j++) {
            // default color is black
            const black = [0, 0, 0];
            color[i][j] = black;
        }
    }
    return color;
}

function getVertices(coordinates, color, grid) {
    const height = grid.height;
    const width = grid.width;
    // combine coordinate and color arrays: [x1, y2, R, G, B, ..., x6, y6, R, G, B]
    let vertices = [];
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            for (let k = 0; k < 6; k++) {
                vertices.push(...coordinates[i][j].slice(k*2, k*2 + 2));
                vertices.push(...color[i][j]);
            }
        }
    }
    return vertices;
}

function initializeGridValues(grid) {
    const height = grid.height;
    const width = grid.width;

    // n x m pressure grid
    let p = [];
    for (let i = 0; i < height; i++) {
        p[i] = [];
        for (let j = 0; j < width; j++) {
            p[i][j] = 0;
        }
    }

    // staggered grid: n x (m + 1) vx grid, and an
    let vx = [];
    for (let i = 0; i < height; i++) {
        vx[i] = [];
        for (let j = 0; j < width + 1; j++) {
            vx[i][j] = 0;
        }
    }
    // (n + 1) x m vy grid
    let vy = [];
    for (let i = 0; i < height + 1; i++) {
        vy[i] = [];
        for (let j = 0; j < width; j++) {
            vy[i][j] = 0;
        }
    }

    const values = {
        pressure: p,
        velocityX: vx,
        velocityY: vy
    };

    return values;
}

function initializeGeometry(grid) {
    const height = grid.height;
    const width = grid.width;

    // 2d array of booleans: true indicates solid cell, false indicates air cell
    let geometry = [];
    for (let i = 0; i < height; i++) {
        geometry[i] = [];
        for (let j = 0; j < width; j++) {
            // make boundary "instrument" for damping purposes
            if (i == 0 || i == height - 1 || j == 0 || j == width - 1) {
                geometry[i][j] = true;
            }
            else {
                geometry[i][j] = false;
            }
        }
    }
    return geometry;
}

function initializeDamping(grid) {
    const height = grid.height;
    const width = grid.width;
    let sigma = [];
    for (let i = 0; i < height; i++) {
        sigma[i] = [];
        for (let j = 0; j < width; j++) {
            sigma[i][j] = 0;
        }
    }
    return sigma;
}