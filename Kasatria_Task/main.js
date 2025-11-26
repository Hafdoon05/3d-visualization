// Import Three.js and addons
import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

// CSV Data File - using local file due to CORS restrictions on Google Sheets
const CSV_URL = 'Data Template.csv';

// Global variables
let camera, scene, renderer;
let controls;
let isSignedIn = false;
let peopleData = [];

const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };

// UI Elements
const loginContainer = document.getElementById('login-container');
const userInfo = document.getElementById('user-info');
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

// Handle Google Sign-In Response
function handleGoogleSignIn(response) {
    console.log('handleGoogleSignIn called');

    try {
        if (!response || !response.credential) {
            throw new Error('Invalid response from Google Sign-In');
        }

        // Decode JWT token to get user info
        const payload = parseJwt(response.credential);
        console.log('User signed in:', payload.name);

        // Update UI with user information
        userName.textContent = `Signed in as: ${payload.name}`;
        // Set user profile picture from Google
        if (payload.picture) {
            userPhoto.src = payload.picture;
            userPhoto.style.display = 'block';
        } else {
            userPhoto.style.display = 'none';
        }

        // Hide login, show user info
        loginContainer.classList.add('hidden');
        userInfo.classList.add('visible');

        isSignedIn = true;

        // Load data and initialize visualization
        console.log('Starting data load and initialization...');
        loadDataAndInit();
    } catch (error) {
        console.error('Sign-in error:', error);
        showError('Failed to sign in. Please try again.');
    }
}

// Register the callback with the global bridge
if (window.setAppInitializer) {
    window.setAppInitializer(handleGoogleSignIn);
    console.log('App initializer registered successfully');
} else {
    console.error('Global bridge not available');
}

// Parse JWT token
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    setTimeout(() => {
        errorMessage.classList.remove('visible');
    }, 5000);
}

// Load CSV data and initialize
async function loadDataAndInit() {
    loading.classList.add('visible');

    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch CSV data');
        }

        const csvText = await response.text();
        console.log('CSV text received, length:', csvText.length);
        console.log('First 200 chars:', csvText.substring(0, 200));

        // Parse CSV using PapaParse
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: function (header) {
                // Trim whitespace from headers
                return header.trim();
            },
            complete: function (results) {
                console.log('CSV parsing complete');
                console.log('Raw results.data length:', results.data.length);

                // Filter out empty rows
                peopleData = results.data.filter(row => row.Name && row.Name.trim() !== '');

                console.log(`Loaded ${peopleData.length} people from Google Sheets`);
                console.log('First 3 people:', peopleData.slice(0, 3));

                if (peopleData.length === 0) {
                    console.error('No valid data found in CSV');
                    showError('No valid data found in CSV');
                    loading.classList.remove('visible');
                    return;
                }

                // Initialize Three.js visualization
                init();
                animate();

                loading.classList.remove('visible');
            },
            error: function (error) {
                console.error('CSV parsing error:', error);
                showError('Failed to parse CSV data');
                loading.classList.remove('visible');
            }
        });
    } catch (error) {
        console.error('Data loading error:', error);
        showError('Failed to load data from Google Sheets. Please check your connection.');
        loading.classList.remove('visible');
    }
}

// Get color class based on Net Worth
function getColorClassByNetWorth(netWorth) {
    if (!netWorth) return 'element--gray';

    // Parse net worth (remove dollar signs, commas, spaces and convert to number)
    const cleanValue = String(netWorth).replace(/[$,\s]/g, '');
    const value = parseFloat(cleanValue);

    if (isNaN(value)) {
        console.log('Invalid net worth value:', netWorth);
        return 'element--gray';
    }

    if (value < 100000) {
        return 'element--red'; // Red
    } else if (value < 200000) {
        return 'element--orange'; // Orange
    } else {
        return 'element--green'; // Green
    }
}

// Initialize Three.js scene
function init() {
    // Camera setup
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

    scene = new THREE.Scene();

    console.log(`Starting to create ${peopleData.length} tiles...`);

    // Create elements from people data
    for (let i = 0; i < peopleData.length; i++) {
        const person = peopleData[i];

        // Debug first person
        if (i === 0) {
            console.log('First person data:', person);
            console.log('Available keys:', Object.keys(person));
        }

        // Get country code (first 2 letters, uppercase)
        const countryCode = person.Country ? person.Country.substring(0, 2).toUpperCase() : '??';
        const age = person.Age || '?';
        const photoUrl = person.Photo || '';
        const name = person.Name || 'Unknown';
        const interest = person.Interest || '';

        // Create element div with color class
        const element = document.createElement('div');
        const colorClass = getColorClassByNetWorth(person['Net Worth']);
        element.className = `element ${colorClass}`;

        // Build tile structure
        element.innerHTML = `
            <div class="tile-header">
                <span class="tile-country">${countryCode}</span>
                <span class="tile-age">${age}</span>
            </div>
            <div class="tile-photo-wrapper">
                <img src="${photoUrl}" class="tile-photo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23333%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23666%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Photo%3C/text%3E%3C/svg%3E'" alt="${name}" />
            </div>
            <div class="tile-name">${name}</div>
            <div class="tile-interest">${interest}</div>
        `;

        // Create CSS3D object
        const objectCSS = new CSS3DObject(element);
        objectCSS.position.x = Math.random() * 4000 - 2000;
        objectCSS.position.y = Math.random() * 4000 - 2000;
        objectCSS.position.z = Math.random() * 4000 - 2000;
        scene.add(objectCSS);

        objects.push(objectCSS);
    }

    console.log(`Created ${objects.length} CSS3D objects`);

    // Calculate layout positions
    console.log('Calculating layout positions...');
    calculateTableLayout();
    calculateSphereLayout();
    calculateHelixLayout();
    calculateGridLayout();

    // Renderer setup
    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Controls setup
    controls = new TrackballControls(camera, renderer.domElement);
    controls.minDistance = 500;
    controls.maxDistance = 6000;
    controls.addEventListener('change', render);

    // Button event listeners
    document.getElementById('table').addEventListener('click', function () {
        setActiveButton('table');
        transform(targets.table, 2000);
    });

    document.getElementById('sphere').addEventListener('click', function () {
        setActiveButton('sphere');
        transform(targets.sphere, 2000);
    });

    document.getElementById('helix').addEventListener('click', function () {
        setActiveButton('helix');
        transform(targets.helix, 2000);
    });

    document.getElementById('grid').addEventListener('click', function () {
        setActiveButton('grid');
        transform(targets.grid, 2000);
    });

    // Window resize handler
    window.addEventListener('resize', onWindowResize);

    // Start with table layout
    transform(targets.table, 2000);
}

// Set active button styling
function setActiveButton(buttonId) {
    document.querySelectorAll('#menu button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(buttonId).classList.add('active');
}

// Calculate TABLE layout (20 columns × 10 rows)
function calculateTableLayout() {
    const cols = 20;
    const rows = 10;

    for (let i = 0; i < objects.length; i++) {
        const object = new THREE.Object3D();

        const col = i % cols;
        const row = Math.floor(i / cols);

        object.position.x = (col * 160) - 1520; // Center the grid
        object.position.y = -(row * 200) + 900;
        object.position.z = 0;

        targets.table.push(object);
    }
}

// Calculate SPHERE layout
function calculateSphereLayout() {
    const vector = new THREE.Vector3();
    const l = objects.length;

    for (let i = 0; i < l; i++) {
        const phi = Math.acos(-1 + (2 * i) / l);
        const theta = Math.sqrt(l * Math.PI) * phi;

        const object = new THREE.Object3D();
        object.position.setFromSphericalCoords(1000, phi, theta);

        vector.copy(object.position).multiplyScalar(2);
        object.lookAt(vector);

        targets.sphere.push(object);
    }
}

// Calculate HELIX layout (double helix - DNA style)
function calculateHelixLayout() {
    const radius = 900;                 // Larger radius for better visibility
    const verticalSpacing = 15;         // Tighter vertical spacing
    const rotationPerStep = 0.175;      // Rotation angle per step (in radians)

    for (let i = 0; i < objects.length; i++) {
        const strand = i % 2;                           // 0 or 1 (which strand)
        const t = Math.floor(i / 2);                   // step along helix
        const angle = t * rotationPerStep;             // rotation step
        const offset = strand * Math.PI;               // second strand shifted 180°

        // Calculate position using sine/cosine for circular motion
        const x = Math.sin(angle + offset) * radius;
        const z = Math.cos(angle + offset) * radius;
        const y = -t * verticalSpacing + 450;          // vertical position

        const object = new THREE.Object3D();
        object.position.set(x, y, z);

        // Make elements face outward from the helix center
        const lookAtVector = new THREE.Vector3(x * 2, y, z * 2);
        object.lookAt(lookAtVector);

        targets.helix.push(object);
    }
}

// Calculate GRID layout (5×4×10)
function calculateGridLayout() {
    const gridX = 5; // 5 columns
    const gridY = 4; // 4 rows
    const gridZ = 10; // 10 layers

    for (let i = 0; i < objects.length; i++) {
        const object = new THREE.Object3D();

        const x = i % gridX;
        const y = Math.floor(i / gridX) % gridY;
        const z = Math.floor(i / (gridX * gridY));

        object.position.x = (x * 450) - 900;
        object.position.y = -(y * 450) + 675;
        object.position.z = (z * 1000) - 4500;

        targets.grid.push(object);
    }
}

// Transform objects to target positions
function transform(targets, duration) {
    TWEEN.removeAll();

    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const target = targets[i];

        new TWEEN.Tween(object.position)
            .to({
                x: target.position.x,
                y: target.position.y,
                z: target.position.z
            }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();

        new TWEEN.Tween(object.rotation)
            .to({
                x: target.rotation.x,
                y: target.rotation.y,
                z: target.rotation.z
            }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }

    new TWEEN.Tween(this)
        .to({}, duration * 2)
        .onUpdate(render)
        .start();
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
}

// Render scene
function render() {
    renderer.render(scene, camera);
}
