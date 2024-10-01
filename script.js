import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

var scene;
var renderer;
var camera;
var group;


scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // blue sky

// grouping objects
group = new THREE.Group();
scene.add(group);

// RENDERER
renderer = new THREE.WebGLRenderer( { antialias : true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
//document.body.appendChild(renderer.domElement);
document.getElementById("map").appendChild(renderer.domElement);

// CAMERA
camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 3000);
camera.position.set( 15,400,700 );
//camera.lookAt(new THREE.Vector3(0,0,0));
scene.add( camera );

// ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);

// LIGHTING
let ambientLight = new THREE.AmbientLight(0xffffff, 1);
ambientLight.position.set(100,250,100);
scene.add(ambientLight);
/*var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(100,250,100);
scene.add(directionalLight);*/

// 3D TEXTS
const textMat = new THREE.MeshBasicMaterial({
    color: 0x1307a8,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
});
// position: x is normal x, z is normal y, and y is normal z (bc of rotation)
createText(
    "La Mortice Sud\nalt. 3169 m",
    14,
    textMat,
    250,350,250
);
createText(
    "La Mortice Nord\nalt. 3186 m",
    14,
    textMat,
    180,350,150
);
createText(
    "Col de Serenne\nalt. 2674 m",
    12,
    textMat,
    20,240,300
);
createText(
    "Col de la Coulette\nalt. 2362 m",
    12,
    textMat,
    -330, 150, -180
);

// HEIGHTMAP DATA
const canvas = document.createElement("canvas");
const canvasSizeW = 1081;
const canvasSizeH = 1081;
canvas.width = canvasSizeW;
canvas.height = canvasSizeH;
const ctx = canvas.getContext("2d");

// image
const img = document.createElement('img');
img.crossOrigin = "Anonymous";
img.src = 'mortice2.png';
img.onload = imgLoaded;

const heightData = [];

async function imgLoaded(e){

    let dataPromise = new Promise(function(resolve) {
        ctx.drawImage(img, 0, 0);
    
        //retrieve color data (red channel)
        const imgd = ctx.getImageData(0, 0, canvasSizeW, canvasSizeH);
        let pix = imgd.data;
        let k = 0;
        
        for (let i = 0; i < canvasSizeH; i++) {
            heightData[i] = [];
            for (let j = 0; j < canvasSizeW; j++) {
                heightData[i][j] = Math.round((pix[k]*100)/255.0); // init: pix[k]/2. here it's a percentage of grey / height
                //heightData[i][j] = Math.round(pix[k]); // init: pix[k]/2. 
                k += 4;
            }
        }
        resolve(heightData);
    });

    dataPromise.then((heightData) => {
        // function to draw path
        drawPath(heightData);
    });
}
// DRAWING A PATH
function drawPath(heightData){
    const lineMat = new THREE.LineBasicMaterial({
        color: 0xec0000
    });
    const points = [];
    points.push(new THREE.Vector3((2-541),(-234+541), 0.1*heightData[2][234]));
    points.push(new THREE.Vector3((118-541), (-382+541), 5*heightData[118][382]));
    points.push(new THREE.Vector3((222-541), (-340+541), 4*heightData[222][340]));
    points.push(new THREE.Vector3((396-541), (-392+541), 2.5*heightData[396][382]));
    points.push(new THREE.Vector3((478-541), (-498+541), 2.5*heightData[478][498]));
    points.push(new THREE.Vector3((620-541), (-800+541), 2.5*heightData[620][800]));
    points.push(new THREE.Vector3((670-541), (-778+541), 2.8*heightData[670][778]));
    points.push(new THREE.Vector3((720-541), (-740+541), 3.5*heightData[700][696])); 
    points.push(new THREE.Vector3((822-541), (-706+541), 4.2*heightData[822][706]));
    points.push(new THREE.Vector3((778-541), (-790+541), 3.8*heightData[778][790]));
    points.push(new THREE.Vector3((448-541), (-796+541), 2.3*heightData[448][796]));
    points.push(new THREE.Vector3((282-541), (-638+541), 2*heightData[282][638]));
    points.push(new THREE.Vector3((114-541), (-492+541), 0.5*heightData[114][492]));
    points.push(new THREE.Vector3((2-541),(-234+541), 0.1*heightData[2][234]));

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geom, lineMat);
    line.rotation.x = -Math.PI/2;
    
    scene.add(line);

}

// MAP
const bumpTexture = new THREE.TextureLoader().load("mortice2.png");
const bumpScale = 470.0; // magnitude of vertex displacement

const uniforms = {
    bumpTexture: {value: bumpTexture},
    bumpScale: {value: bumpScale},
};

const groundMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent,
});

const groundGeo = new THREE.PlaneGeometry(1081, 1081, 300, 300);
const ground = new THREE.Mesh(groundGeo, groundMaterial);
ground.rotation.x = -Math.PI/2;
ground.position.y = -100;
scene.add(ground);



// EXECUTE THE SCRIPT -- NOTHING BEYOND THIS LINE

animate();
window.addEventListener("resize", onWindowResize);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// RESIZE HANDLER
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createText(text, size, textMat, x, y, z) {
    const loader = new FontLoader();
    loader.load( 'Montserrat_Regular.json', function ( font ) {
        const geometry = new TextGeometry( text, {
            font: font,
            size: size,
            depth: 3,
            curveSegments: 8
        } );
        geometry.computeBoundingBox();
        const textMesh = new THREE.Mesh(geometry, textMat);
        textMesh.position.set(x, y, z);
        group.add( textMesh );
    });
}


