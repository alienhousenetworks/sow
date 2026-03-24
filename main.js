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
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 80);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Group to hold everything
    const group = new THREE.Group();
    scene.add(group);

    // === The "Sound Over War" Particle System ===
    const particleCount = 6000;
    const geometry = new THREE.BufferGeometry();
    
    // Arrays for different states
    const posWar = new Float32Array(particleCount * 3);
    const posSound = new Float32Array(particleCount * 3);
    const currentPos = new Float32Array(particleCount * 3);
    // Colors
    const colors = new Float32Array(particleCount * 3);
    // Base scales
    const sizes = new Float32Array(particleCount);

    const warColor = new THREE.Color(0xff2211); // Aggressive Red/Orange
    const soundColor = new THREE.Color(0x00ffcc); // Harmonious Cyan/Teal

    // Generate states
    for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;

        // --- War State: Chaotic, scattered debris in a large cube/sphere ---
        const rWar = 60 * Math.cbrt(Math.random());
        const thetaW = Math.random() * 2 * Math.PI;
        const phiW = Math.acos(2 * Math.random() - 1);
        posWar[idx] = rWar * Math.sin(phiW) * Math.cos(thetaW) + (Math.random()-0.5)*20;
        posWar[idx+1] = rWar * Math.cos(phiW) + (Math.random()-0.5)*20;
        posWar[idx+2] = rWar * Math.sin(phiW) * Math.sin(thetaW) + (Math.random()-0.5)*20;

        // --- Sound State: Organized, beautiful double helix or torus knot ---
        // Let's make a massive Torus Knot out of particles
        let t = i / particleCount * Math.PI * 2 * 15; // 15 loops
        let p = 3, q = 4; // Knot params
        let rSound = 25 + Math.sin(t * 8) * 4; // Thickness variation
        
        let xS = rSound * (Math.cos(p * t)) * (3 + Math.cos(q * t));
        let yS = rSound * (Math.sin(p * t)) * (3 + Math.cos(q * t));
        let zS = rSound * Math.sin(q * t);
        
        // Add minimal noise to sound state for volume
        posSound[idx] = xS * 0.15 + (Math.random()-0.5)*1.5;
        posSound[idx+1] = yS * 0.15 + (Math.random()-0.5)*1.5;
        posSound[idx+2] = zS * 0.15 + (Math.random()-0.5)*1.5;

        // Init deeply with War pos
        currentPos[idx] = posWar[idx];
        currentPos[idx+1] = posWar[idx+1];
        currentPos[idx+2] = posWar[idx+2];

        // Init colors
        colors[idx] = warColor.r; colors[idx+1] = warColor.g; colors[idx+2] = warColor.b;
        
        sizes[i] = Math.random() * 1.5 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material to handle dynamic sizing and additive blending
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            globalEnergy: { value: 0 },
            pixelRatio: { value: renderer.getPixelRatio() }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float globalEnergy;
            uniform float pixelRatio;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z) * (1.0 + globalEnergy * 2.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                // Soft circle
                vec2 xy = gl_PointCoord.xy - vec2(0.5);
                float ll = length(xy);
                if(ll > 0.5) discard;
                float alpha = smoothstep(0.5, 0.1, ll);
                gl_FragColor = vec4(vColor, alpha * 0.8);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    });

    const particles = new THREE.Points(geometry, material);
    group.add(particles);

    let scrollTint = 0; // 0 = war, 1 = peace/sound

    if (document.querySelector('.war-peace-container')) {
        ScrollTrigger.create({
            trigger: '.war-peace-container',
            start: 'top 90%',
            end: 'top 10%',
            scrub: true,
            onUpdate: (self) => {
                scrollTint = self.progress;
                const c = warColor.clone().lerp(soundColor, scrollTint);
                document.documentElement.style.setProperty('--text-accent', c.getStyle());
            }
        });
    }

    // Raycaster for mouse repulsion
    const raycaster = new THREE.Raycaster();
    const mouseParams = new THREE.Vector2();
    let hitPoint = new THREE.Vector3(0,0,-500);

    // Audio-driven variables
    let bass = 0, mid = 0, treble = 0, energy = 0;
    let time = 0;
    
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;
        material.uniforms.time.value = time;

        const targetX = mouseX * 0.001;
        const targetY = mouseY * 0.001;
        group.rotation.y += 0.02 * (targetX - group.rotation.y);
        group.rotation.x += 0.02 * (targetY - group.rotation.x);

        // Slow cinematic drift
        group.position.y = window.scrollY * -0.015;
        group.rotation.z = window.scrollY * 0.0005;

        // Audio Analysis
        if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            bass=0; mid=0; treble=0;
            for (let i = 0; i < 10; i++) bass += dataArray[i];
            for (let i = 10; i < 40; i++) mid += dataArray[i];
            for (let i = 40; i < 90; i++) treble += dataArray[i];
            bass /= 10 * 255; mid /= 30 * 255; treble /= 50 * 255;
            energy = Math.min(1, bass * 0.55 + mid * 0.35 + treble * 0.25);
            window.SOW_AUDIO = { bass, mid, treble, energy };
        } else {
            energy *= 0.95; // Decay if audio off
        }

        material.uniforms.globalEnergy.value = energy;

        // Mouse projection for 3D repulsion
        mouseParams.x = (mouseX / (window.innerWidth/2));
        mouseParams.y = -(mouseY / (window.innerHeight/2));
        raycaster.setFromCamera(mouseParams, camera);
        raycaster.ray.at(50, hitPoint); // Project 50 units into screen

        // Update Particle Positions manually for morphing & interaction
        const positions = geometry.attributes.position.array;
        const cols = geometry.attributes.color.array;
        
        let tColor = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            
            // Base positions
            let wX = posWar[idx], wY = posWar[idx+1], wZ = posWar[idx+2];
            let sX = posSound[idx], sY = posSound[idx+1], sZ = posSound[idx+2];

            // If audio is playing, add chaotic shake to War, and rhythmic expansion to Sound
            if (energy > 0.01) {
                const shake = energy * 2.0;
                wX += (Math.random()-0.5) * shake;
                wY += (Math.random()-0.5) * shake;
                wZ += (Math.random()-0.5) * shake;

                // Sound state pulses outwards and twists
                const len = Math.sqrt(sX*sX + sY*sY + sZ*sZ);
                const pulse = 1.0 + (bass * 0.3 * Math.sin(time * 5.0 + len * 0.1));
                sX *= pulse; sY *= pulse; sZ *= pulse;
            }

            // Interpolate target based on scrollTint
            let targetX = wX + (sX - wX) * scrollTint;
            let targetY = wY + (sY - wY) * scrollTint;
            let targetZ = wZ + (sZ - wZ) * scrollTint;

            // --- Mouse Repulsion ("Sound Ripple") ---
            const dx = currentPos[idx] - hitPoint.x;
            const dy = currentPos[idx+1] - hitPoint.y;
            const dz = currentPos[idx+2] - hitPoint.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            
            let repulsionForce = 0;
            if (distSq < 400.0) { // Radius of effect
                repulsionForce = (400.0 - distSq) / 400.0; // 0 to 1
            }

            // Mouse interaction pushes particles towards the harmonized "Sound" state AND outwards
            if (repulsionForce > 0) {
                targetX = targetX + (sX - targetX) * repulsionForce;
                targetY = targetY + (sY - targetY) * repulsionForce;
                targetZ = targetZ + (sZ - targetZ) * repulsionForce;

                // Adds radial expansion away from cursor
                targetX += dx * 0.1 * repulsionForce;
                targetY += dy * 0.1 * repulsionForce;
                targetZ += dz * 0.1 * repulsionForce;
            }

            // Spring physics to move current position to target smoothly
            currentPos[idx] += (targetX - currentPos[idx]) * 0.05;
            currentPos[idx+1] += (targetY - currentPos[idx+1]) * 0.05;
            currentPos[idx+2] += (targetZ - currentPos[idx+2]) * 0.05;

            // Color morphing
            const effectiveTint = Math.min(1.0, scrollTint + repulsionForce);
            tColor.copy(warColor).lerp(soundColor, effectiveTint);
            
            // Additive energy flash
            if (energy > 0) {
                tColor.r += energy * 0.3 * tColor.r;
                tColor.g += energy * 0.3 * tColor.g;
                tColor.b += energy * 0.3 * tColor.b;
            }

            cols[idx] = tColor.r; cols[idx+1] = tColor.g; cols[idx+2] = tColor.b;
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if(material.uniforms) material.uniforms.pixelRatio.value = renderer.getPixelRatio();
    });
}


// ====== Helper to init image mapped 3D spheres (Bypassing File:// CORS limitations via Base64 Memory object) ======
function initImageSphere(canvasId, assetKey, triggerSelector) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !SOW_ASSETS || !SOW_ASSETS[assetKey]) return;

    const isBackdrop = canvasId === 'canvas-war' || canvasId === 'canvas-peace';
    const scene = new THREE.Scene();
    scene.background = isBackdrop ? new THREE.Color(0x000000) : null;
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, isBackdrop ? 28 : 12, isBackdrop ? 65 : 35);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearAlpha(0);

    // Modern dramatic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xff5555, 1.5);
    dirLight1.position.set(20, 30, 20);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0x5555ff, 1.2);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    const group = new THREE.Group();
    scene.add(group);

    let orbitYaw = 0, orbitPitch = 0;
    let targetYaw = 0, targetPitch = 0;
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0, yawStart = 0, pitchStart = 0;

    // Using THREE.TextureLoader with Base64 String bypassing file:// CORS entirely
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(SOW_ASSETS[assetKey], (texture) => {
        texture.minFilter = THREE.LinearFilter; 
        texture.magFilter = THREE.LinearFilter; 
        
        const radius = isBackdrop ? 22 : 13;
        const geometry = new THREE.SphereGeometry(radius, 64, 64);

        // Improved material with reflection and roughness
        const mapMat = new THREE.MeshStandardMaterial({ 
            map: texture, 
            transparent: true, 
            opacity: 0.96,
            roughness: 0.2,
            metalness: 0.4
        });
        const sphere = new THREE.Mesh(geometry, mapMat);
        group.add(sphere);

        // Glow/backface core
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff3344, transparent: true, opacity: 0.2, side: THREE.BackSide });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.99, 32, 32), glowMat);
        group.add(glow);

        // High-tech intersecting orbital rings
        const ringGeo1 = new THREE.TorusGeometry(radius * 1.15, 0.06, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.4 });
        const ring1 = new THREE.Mesh(ringGeo1, ringMat);
        ring1.rotation.x = Math.PI / 2.2;
        group.add(ring1);

        const ringGeo2 = new THREE.TorusGeometry(radius * 1.3, 0.04, 16, 100);
        const ringMatRed = new THREE.MeshStandardMaterial({ color: 0xff3355, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.3 });
        const ring2 = new THREE.Mesh(ringGeo2, ringMatRed);
        ring2.rotation.y = Math.PI / 3;
        group.add(ring2);

        // Thick wireframe edges
        const edges = new THREE.EdgesGeometry(new THREE.SphereGeometry(radius * 1.005, 32, 32));
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0.15 });
        const edgeLines = new THREE.LineSegments(edges, edgeMat);
        group.add(edgeLines);

        let scrollPos = new THREE.Vector3(0, isBackdrop ? 40 : 22, isBackdrop ? 78 : 48);
        let scrollLook = new THREE.Vector3(0, 0, 0);

        // Presets for "drone view" -> "dome view" -> "front close-up".
        const presetDrone = { pos: new THREE.Vector3(0, isBackdrop ? 52 : 28, isBackdrop ? 92 : 52), look: new THREE.Vector3(0, 0, 0) };
        const presetDome = { pos: new THREE.Vector3(0, isBackdrop ? 38 : 18, isBackdrop ? 78 : 42), look: new THREE.Vector3(0, isBackdrop ? 4 : 2, 0) };
        const presetCloseFront = { pos: new THREE.Vector3(0, isBackdrop ? 3.5 : 1.5, isBackdrop ? 40 : 22), look: new THREE.Vector3(0, 0, 0) };
        const presetOrbit = { pos: new THREE.Vector3(isBackdrop ? 44 : 22, 0.5, isBackdrop ? 55 : 30), look: new THREE.Vector3(0, 0, 0) };

        function lerpVec(a, b, t, out) {
            out.copy(a).lerp(b, t);
            return out;
        }

        function animate() {
            requestAnimationFrame(animate);

            // When not dragging, use the global mouse to gently orbit.
            if (!isDragging) {
                const mouseNX = mouseX / window.innerWidth;
                const mouseNY = mouseY / window.innerHeight;
                targetYaw = mouseNX * 1.1;
                targetPitch = -mouseNY * 0.7;
            }

            orbitYaw += (targetYaw - orbitYaw) * 0.08;
            orbitPitch += (targetPitch - orbitPitch) * 0.08;
            group.rotation.y = orbitYaw;
            group.rotation.x = orbitPitch;

            // Camera position is controlled by scroll, with a small orbit offset.
            const audioEnergy = (window.SOW_AUDIO && window.SOW_AUDIO.energy) ? window.SOW_AUDIO.energy : 0;
            const orbitOffset = new THREE.Vector3(Math.sin(orbitYaw) * 2.2, orbitPitch * 2.0, 0);
            camera.position.copy(scrollPos).add(orbitOffset);
            camera.lookAt(scrollLook);

            // Audio-reactive visual improvements
            edgeLines.material.opacity = 0.10 + audioEnergy * 0.3;
            glow.material.opacity = 0.15 + audioEnergy * 0.2;
            
            // Dynamic ring rotations and pulsing
            ring1.rotation.z += 0.005 + audioEnergy * 0.01;
            ring2.rotation.x -= 0.003 + audioEnergy * 0.01;
            
            const pulseScale = 1 + audioEnergy * 0.05;
            sphere.scale.set(pulseScale, pulseScale, pulseScale);
            edgeLines.scale.set(pulseScale, pulseScale, pulseScale);

            renderer.render(scene, camera);
        }
        animate();

        // Tie scrolling to multi-view camera transitions.
        if (triggerSelector) {
            ScrollTrigger.create({
                trigger: triggerSelector,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.65,
                onUpdate: (self) => {
                    const p = self.progress;

                    // Piecewise blend between view presets.
                    if (p < 0.33) {
                        const t = p / 0.33;
                        lerpVec(presetDrone.pos, presetDome.pos, t, scrollPos);
                        lerpVec(presetDrone.look, presetDome.look, t, scrollLook);
                    } else if (p < 0.66) {
                        const t = (p - 0.33) / 0.33;
                        lerpVec(presetDome.pos, presetCloseFront.pos, t, scrollPos);
                        lerpVec(presetDome.look, presetCloseFront.look, t, scrollLook);
                    } else {
                        const t = (p - 0.66) / 0.34;
                        lerpVec(presetCloseFront.pos, presetOrbit.pos, t, scrollPos);
                        lerpVec(presetCloseFront.look, presetOrbit.look, t, scrollLook);
                    }
                }
            });
        }

        // Drag interaction (tap-drag to rotate the sphere).
        canvas.style.touchAction = 'none';
        canvas.addEventListener('pointerdown', (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            yawStart = targetYaw;
            pitchStart = targetPitch;
        });
        canvas.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            targetYaw = yawStart + dx * 0.005;
            targetPitch = pitchStart + dy * 0.005;
            targetPitch = Math.max(-1.2, Math.min(1.2, targetPitch));
        });
        canvas.addEventListener('pointerup', () => { isDragging = false; });
        canvas.addEventListener('pointercancel', () => { isDragging = false; });
        canvas.addEventListener('dblclick', () => { targetYaw = 0; targetPitch = 0; });
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

    // Init 2 image spheres using Base64 Mem Objects (event-drop and artists only)
    initImageSphere('canvas-what', 'crowd', '#upcoming-events');
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

    // --- WAR to PEACE Pinned Transition (with image parallax) ---
    const wpContainer = document.querySelector('.war-peace-container');
    if (wpContainer) {
        gsap.set(".scene-peace", { opacity: 0, scale: 1.05 });
        gsap.set(".scene-war .wp-content", { y: 0, opacity: 1 });
        gsap.set(".scene-peace .wp-content", { y: 50, opacity: 0 });
        gsap.set(".scene-war .wp-dark-layer", { opacity: 0.9 });
        gsap.set(".scene-peace .wp-dark-layer", { opacity: 0.6 });

        gsap.set(".scene-war .wp-parallax-img", { scale: 1.15, yPercent: -5 });
        gsap.set(".scene-peace .wp-parallax-img", { scale: 1.15, yPercent: 5 });

        const pinnedTl = gsap.timeline({ scrollTrigger: { trigger: wpContainer, start: "top top", end: "+=2500", pin: true, scrub: 1 } });

        pinnedTl.to(".scene-war .wp-content", { y: -50, opacity: 0, duration: 1 })
                .to(".scene-war .wp-dark-layer", { opacity: 0.2, duration: 1 }, "<")
                .to(".scene-war .wp-parallax-img", { scale: 1.3, yPercent: -15, duration: 1.5 }, "<")
                .to(".scene-peace", { opacity: 1, scale: 1, duration: 1.5 }, "-=0.5")
                .to(".scene-peace .wp-parallax-img", { scale: 1.0, yPercent: 0, duration: 1.5 }, "<")
                .to(".scene-peace .wp-content", { y: 0, opacity: 1, duration: 1 }, "-=1.0");
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
