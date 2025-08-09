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

// source location
let source = {
    i: Math.trunc(gridHeight / 2),
    j: Math.trunc(gridWidth / 4)
}

// microphone location
let mic = {
    i: Math.trunc(25 * resolution),
    j: Math.trunc(50 * resolution)
}

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

        this.geometry = initializeGeometry(this);

        this.damping = initializeDamping(this);
        this.getDamping(pmlThicknessBoundary);
        
        this.play = false;
        this.frame = 0;
    }

    stepPressure() {
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                let div_v = (this.vx[i + 1][j] - this.vx[i][j] + this.vy[i][j + 1] - this.vy[i][j]) / dx
                if (!this.geometry[i][j]) {
                    this.p[i][j] = ((-RHO * C * C * div_v * dt) + this.p[i][j]) / (1 + this.damping[i][j]);
                }
            }
        }
    }

    stepVelocity() {
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                let grad_p_x = (this.p[i][j] - this.p[i-1][j]) / dx
                let grad_p_y = (this.p[i][j] - this.p[i][j-1]) / dx

                this.vx[i][j] = (-1 / RHO * dt * grad_p_x + this.vx[i][j]) / (1 + this.damping[i][j]);
                this.vy[i][j] = (-1 / RHO * dt * grad_p_y + this.vy[i][j]) / (1 + this.damping[i][j]);
            }
        }
    }

    colorCell(i, j, choice) {
        this.color[i][j] = choice;
    }

    mapPressure() {
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                if (!this.geometry[i][j]) {
                    this.colorCell(i, j, pressureToColor(this.p[i][j]));
                }
            }
        }
    }

    drawInstrument(i, j) {
        const white = [1, 1, 1];
        if (i >= 0 && i < this.height && j >= 0 && j < this.width) {
            this.geometry[i][j] = true;
            this.colorCell(i, j, white);
        }

        // push to moves queue
        if (moves.length == 0 || moves[moves.length - 1][0] != i || moves[moves.length - 1][1] != j) {
            moves.push([i, j]);
        }
    }

    drawAir(i, j) {
        const black = [0, 0, 0];
        this.colorCell(i, j, black);
        this.geometry[i][j] = false;
    }

    step() {
        this.getDamping(pmlThicknessInstrument);
        this.stepVelocity();
        this.stepPressure();
        this.frame++;
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

    reset() {
        const newScene = new Grid(gridHeight, gridWidth);
        scene = newScene;
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
    let p = [];
    let vx = [];
    let vy = [];
    for (let i = 0; i < height; i++) {
        p[i] = [];
        vx[i] = [];
        vy[i] = [];
        for (let j = 0; j < width; j++) {
            p[i][j] = 0;
            vx[i][j] = 0;
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