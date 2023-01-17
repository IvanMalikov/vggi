'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iVertexNormalBuffer = gl.createBuffer();
    this.count = 0;
    this.normalCount = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.NormalBufferData = function (normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        this.normalCount = normals.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertexNormal);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribVertexNormal = -1;
    // Location of the uniform specifying a light position for the scene.
    this.iLightPosition = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;
    this.iModelNormalMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(1., 1., 1., 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-4, 4, -4, 4, 0, 4 * 4);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    let matrixInversion = m4.inverse(modelViewProjection)
    let modelNormal = m4.transpose(matrixInversion)


    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelNormalMatrix, false, modelNormal);

    gl.uniform3fv(shProgram.iLightPosition, [Math.sin(Date.now() * 0.01), Math.cos(Date.now() * 0.01), 1])

    surface.Draw();
}
function continiousDraw(){
    draw()
    window.requestAnimationFrame(continiousDraw)
}

function CreateSurfaceData() {
    let vertexList = [];
    let a = 1
    const LIMIT = 9
    let t = -LIMIT
    const INC = 0.25
    while (t < LIMIT) {
        while (a < LIMIT) {
            const v1 = parametric(a, t);
            const v2 = parametric(a + INC, t);
            const v3 = parametric(a, t + INC);
            const v4 = parametric(a + INC, t + INC);
            vertexList.push(v1.x, v1.y, v1.z)
            vertexList.push(v2.x, v2.y, v2.z)
            vertexList.push(v3.x, v3.y, v3.z)
            vertexList.push(v2.x, v2.y, v2.z)
            vertexList.push(v4.x, v4.y, v4.z)
            vertexList.push(v3.x, v3.y, v3.z)
            a += INC
        }
        a = 1
        t += INC
    }
    return vertexList;
}

function CreateSurfaceNormalData() {
    let normals = [];
    let a = 1
    const LIMIT = 9
    let t = -LIMIT
    const INC = 0.25
    while (t < LIMIT) {
        while (a < LIMIT) {
            const v1 = parametric(a, t);
            const v2 = parametric(a + INC, t);
            const v3 = parametric(a, t + INC);
            const v4 = parametric(a + INC, t + INC);
            const v21 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z }
            const v31 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z }
            const v42 = { x: v4.x - v2.x, y: v4.y - v2.y, z: v4.z - v2.z }
            const v32 = { x: v3.x - v2.x, y: v3.y - v2.y, z: v3.z - v2.z }
            let n1 = vec3Cross(v21, v31)
            vec3Normalize(n1)
            let n2 = vec3Cross(v42, v32)
            vec3Normalize(n2)
            normals.push(n1.x, n1.y, n1.z)
            normals.push(n1.x, n1.y, n1.z)
            normals.push(n1.x, n1.y, n1.z)
            normals.push(n2.x, n2.y, n2.z)
            normals.push(n2.x, n2.y, n2.z)
            normals.push(n2.x, n2.y, n2.z)
            a += INC
        }
        a = 1
        t += INC
    }
    return normals;
}
function vec3Cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function vec3Normalize(a) {
    var mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    a.x /= mag; a.y /= mag; a.z /= mag;
}

function parametric(a, t) {
    const a0 = 1
    const c = 1
    const d = 1
    const r = 1
    const theta0 = Math.PI / 2
    let x = r * Math.cos(a) - (r * (a0 - a) + t * Math.cos(theta0) - c * Math.sin(d * t) * Math.sin(theta0)) * Math.sin(a)
    let y = r * Math.cos(a) - (r * (a0 - a) + t * Math.cos(theta0) - c * Math.sin(d * t) * Math.sin(theta0)) * Math.cos(a)
    let z = t * Math.sin(theta0) + c * Math.sin(d * t) * Math.cos(theta0)
    return {
        x: 0.1 * x,
        y: 0.1 * y,
        z: 0.1 * z
    }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribVertexNormal = gl.getAttribLocation(prog, "vertexNormal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelNormalMatrix = gl.getUniformLocation(prog, "ModelNormalMatrix");
    shProgram.iLightPosition = gl.getUniformLocation(prog, "lightPosition");

    surface = new Model('Surface');
    console.log(CreateSurfaceData().length)
    console.log(CreateSurfaceNormalData().length)
    surface.BufferData(CreateSurfaceData());
    surface.NormalBufferData(CreateSurfaceNormalData());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    window.requestAnimationFrame(continiousDraw)
}