// ====== Smooth Scrolling Setup (Lenis) ======
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smooth: true });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// ====== GSAP ======
gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0, 0);

// Global Mouse tracking for interactions
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2);
});

// ====== Web Audio API (Generative Rave Sound) ======
let audioInitialized = false, audioCtx, analyser, dataArray, isPlaying = false;

function initAudio() {
    if (audioInitialized) return;
    audioInitialized = true;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
    analyser.connect(audioCtx.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    playGenerativeTrack();
}

function playGenerativeTrack() {
    isPlaying = true;
    document.getElementById('audio-status').innerText = 'ON';
    document.getElementById('audio-toggle').classList.add('active');

    const droneOs = audioCtx.createOscillator();
    const droneGain = audioCtx.createGain();
    droneOs.type = 'sine'; droneOs.frequency.setValueAtTime(40, audioCtx.currentTime); 
    droneGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    droneOs.connect(droneGain); droneGain.connect(analyser); droneOs.start();

    const tempo = 125, lookahead = 25.0, scheduleAheadTime = 0.1;
    let nextNoteTime = audioCtx.currentTime + 0.05;

    function playKick(time) {
        if (!isPlaying) return;
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(analyser);
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(1.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time); osc.stop(time + 0.5);
    }

    function scheduler() {
        while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime && isPlaying) {
            playKick(nextNoteTime); nextNoteTime += (60.0 / tempo);
        }
        if (isPlaying) requestAnimationFrame(scheduler);
    }
    scheduler();
    window.currentDrone = droneOs;
}

function stopAudio() {
    isPlaying = false;
    document.getElementById('audio-status').innerText = 'OFF';
    document.getElementById('audio-toggle').classList.remove('active');
    if(window.currentDrone) window.currentDrone.stop();
    audioInitialized = false;
}

document.getElementById('audio-toggle').addEventListener('click', () => {
    if (!audioInitialized || !isPlaying) { initAudio(); if(audioCtx.state === 'suspended') audioCtx.resume(); } 
    else { stopAudio(); }
});
const enterBtn = document.getElementById('enter-circuit-btn');
if (enterBtn) {
    enterBtn.addEventListener('click', () => {
        initAudio(); if(audioCtx.state === 'suspended') audioCtx.resume();
        document.getElementById('war-peace').scrollIntoView({ behavior: 'smooth' });
    });
}

// ====== Three.js Audio-Reactive WebGL Background ======
function initWebGLHero() {
    const canvas = document.getElementById('webgl-canvas');
    if(!canvas) return;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.TorusKnotGeometry(10, 3, 300, 20);
    const count = geometry.attributes.position.count;
    const particles = new THREE.BufferGeometry();
    particles.setAttribute('position', geometry.attributes.position);
    
    // Fallback safe array type for all environments
    const colors = [];
    for(let i=0; i<count*3; i+=3) { colors.push(1.0, 0.05, 0.05); }
    particles.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Points(particles, material);
    scene.add(mesh);

    function animate() {
        requestAnimationFrame(animate);
        let targetX = mouseX * 0.001; let targetY = mouseY * 0.001;
        mesh.rotation.y += 0.05 * (targetX - mesh.rotation.y);
        mesh.rotation.x += 0.05 * (targetY - mesh.rotation.x);
        mesh.rotation.z += 0.002;

        let audioScale = 1;
        if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            let avg = 0; for(let i=0; i<10; i++) avg += dataArray[i]; avg /= 10;
            audioScale = 1 + (avg / 256) * 0.5; material.size = 0.15 + (avg / 256) * 0.2;
        }
        mesh.scale.set(audioScale, audioScale, audioScale);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}


// ====== Helper to init image mapped 3D spheres (Bypassing File:// CORS limitations via Base64 Memory object) ======
function initImageSphere(canvasId, assetKey, triggerSelector) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !SOW_ASSETS || !SOW_ASSETS[assetKey]) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); 
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 25; // Drone view (outside the sphere)

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Using THREE.TextureLoader with Base64 String bypassing file:// CORS entirely
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(SOW_ASSETS[assetKey], (texture) => {
        texture.minFilter = THREE.LinearFilter; 
        texture.magFilter = THREE.LinearFilter; 
        
        // Create a 3D Sphere and map image to the inside/outside
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const geometry = new THREE.SphereGeometry(15, 64, 64);
        geometry.scale(-1, 1, 1);
        
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        function animate() {
            requestAnimationFrame(animate);
            const targetRotY = (mouseX * 0.001);
            const targetRotX = (mouseY * 0.001);
            camera.position.x += 0.05 * (targetRotY * 30 - camera.position.x);
            camera.position.y += 0.05 * (-targetRotX * 30 - camera.position.y);
            camera.lookAt(0,0,0);
            
            // Spin the sphere as a base animation
            sphere.rotation.y += 0.002;
            renderer.render(scene, camera);
        }
        animate();

        // Tie scrolling to massive sphere rotation
        if (triggerSelector) {
            ScrollTrigger.create({
                trigger: triggerSelector,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5,
                onUpdate: (self) => {
                    const prog = self.progress; 
                    camera.position.z = 25 - (prog * 15); 
                    sphere.rotation.y = prog * Math.PI;
                }
            });
        }
    });

    const resizeObserver = new ResizeObserver(() => {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
    resizeObserver.observe(canvas.parentElement);
}

document.addEventListener("DOMContentLoaded", () => {
    
    // Init Audio/WebGL Hero Feature
    initWebGLHero();

    // Init 4 image spheres using Base64 Mem Objects
    initImageSphere('canvas-war', 'war', '.scene-war');
    initImageSphere('canvas-peace', 'peace', '.scene-peace');
    initImageSphere('canvas-what', 'crowd', '#what-it-is');
    initImageSphere('canvas-artists', 'dj', '#artists');

    // --- Custom Cursor ---
    const cursor = document.querySelector('.custom-cursor'), follower = document.querySelector('.custom-cursor-follower');
    let curX = 0, curY = 0, folX = 0, folY = 0;
    gsap.ticker.add(() => {
        curX += (mouseX + window.innerWidth/2 - curX) * 0.5; curY += (mouseY + window.innerHeight/2 - curY) * 0.5;
        gsap.set(cursor, { x: curX, y: curY });
        folX += (mouseX + window.innerWidth/2 - folX) * 0.15; folY += (mouseY + window.innerHeight/2 - folY) * 0.15;
        gsap.set(follower, { x: folX, y: folY });
    });

    const hoverTargets = document.querySelectorAll('.hover-target, button, a, input, textarea');
    hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', () => { cursor.classList.add('hover'); follower.classList.add('hover'); });
        target.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); follower.classList.remove('hover'); });
    });

    // --- SplitType ---
    const splitTexts = document.querySelectorAll('.split-text');
    const splits = [];
    splitTexts.forEach(text => {
        const split = new SplitType(text, { types: 'lines, words, chars' });
        splits.push(split);
        gsap.set(split.chars, { y: 100, opacity: 0 });
    });

    // --- Intro Loader ---
    const tl = gsap.timeline();
    tl.to(".loader-progress", { width: "100%", duration: 1.5, ease: "power2.inOut" })
      .to(".loader .glitch-text", { opacity: 0, scale: 1.2, duration: 0.8, ease: "power2.in" })
      .to(".loader", { yPercent: -100, duration: 1, ease: "power4.inOut" }, "-=0.2")
      .to(splits[0].chars, { y: 0, opacity: 1, stagger: 0.02, duration: 0.8, ease: "back.out(1.7)" }, "-=0.4")
      .fromTo(".hero-subtitle", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .fromTo(".epic-btn", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.5)" }, "-=0.6")
      .fromTo(".navbar", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.8");
    setTimeout(() => { document.body.classList.remove('loading'); }, 2500);

    // --- WAR to PEACE Pinned Transition ---
    const wpContainer = document.querySelector('.war-peace-container');
    if (wpContainer) {
        const peaceScene = document.querySelector('.scene-peace');
        gsap.set(peaceScene, { opacity: 0, scale: 1.1 });
        gsap.set(".scene-war .wp-content", { y: 0, opacity: 1 });
        gsap.set(".scene-peace .wp-content", { y: 100, opacity: 0 });

        const pinnedTl = gsap.timeline({ scrollTrigger: { trigger: wpContainer, start: "top top", end: "+=2000", pin: true, scrub: 1 } });
        pinnedTl.to(".scene-war .wp-content", { y: -100, opacity: 0, duration: 1 })
                .to(peaceScene, { opacity: 1, scale: 1, duration: 2 }, "-=0.5")
                .to(".scene-peace .wp-content", { y: 0, opacity: 1, duration: 1 });
    }

    // --- Standard Scroll Reveals ---
    gsap.utils.toArray('.reveal-up').forEach(el => {
        gsap.fromTo(el, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });

    splits.forEach((split, i) => {
        if(i === 0) return;
        gsap.to(split.chars, { y: 0, opacity: 1, stagger: 0.02, duration: 0.8, ease: "back.out(1.5)", scrollTrigger: { trigger: split.elements[0], start: "top 85%" } });
    });

    // --- 3D Hover Tilt Effect Setup ---
    document.querySelectorAll('.tilt-card').forEach(card => {
        const inner = card.querySelector('.tilt-inner');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const centerX = rect.width / 2, centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;
            gsap.to(inner, { rotateX: rotateX, rotateY: rotateY, duration: 0.5, ease: "power2.out" });
        });
        card.addEventListener('mouseleave', () => { gsap.to(inner, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1, 0.3)" }); });
    });
});

// ====== Form Submission Logic ======
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"; 
function setupForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.submit-btn'), btnText = btn.querySelector('span');
        const originalText = btnText.innerText, msgDiv = form.querySelector('.form-message');
        btn.disabled = true; btnText.innerText = 'Sending...'; msgDiv.innerText = '';
        const dataObj = {}; new FormData(form).forEach((value, key) => dataObj[key] = value); dataObj.formSource = formId;

        fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataObj) })
        .then(() => {
            btn.disabled = false; btnText.innerText = 'Signal Sent';
            msgDiv.innerText = 'Welcome to the circuit.'; msgDiv.style.color = '#00ff44';
            form.reset(); setTimeout(() => { btnText.innerText = originalText; }, 3000);
        }).catch(err => {
            console.error('Form error:', err);
            btn.disabled = false; btnText.innerText = 'Retry';
            msgDiv.innerText = 'Transmission failed.'; msgDiv.style.color = '#cc1111';
        });
    });
}
setupForm('queryForm'); setupForm('artistForm');
