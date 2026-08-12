import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { initModals } from './modal.js';

const HERO_IDS = {
	ROOT: 'hero',
	SCENE: 'hero-scene',
	CAMERA: 'hero-camera',
	TRACK: 'hero-scene-track',
};

// Tracks the current camera zoom scale so hover effects can be gated.
let currentCameraScale = 1;

const heroSettings = {
	pinDuration: 8000,
	scrub: 1,
	ease: 'power2.inOut',
	shotDuration: 1.2,
	betweenShotPause: 0.35,
	keyboardScrollDuration: 1, // seconds, for arrow/number-key jumps
};

const DESKTOP_CAMERA_SHOTS = [
	{ target: 'overview', zoom: 1, xOffset: 0, yOffset: 0 },     // 1. Full overview
	{ target: 1, zoom: 2.2, xOffset: -40, yOffset: 0 },        // 2. Building 1
	{ target: 2, zoom: 2.4, xOffset: -20, yOffset: 0 },         // 3. Building 2
	{ target: 3, zoom: 2.2, xOffset: -60, yOffset: 200 },     // 4. Building 3 balcony
	{ target: 3, zoom: 2.2, xOffset: -40, yOffset: 0 },       // 5. Building 3 storefront
	{ target: 4, zoom: 2.2, xOffset: -50, yOffset: 0 },          // 6. Building 4
	{ target: 5, zoom: 2.4, xOffset: 20, yOffset: 0 },          // 7. Building 5
	{ target: 6, zoom: 2.2, xOffset: 10, yOffset: 10 },          // 8. Building 6
	{ target: 'overview', zoom: 1, xOffset: 0, yOffset: 0 },     // 9. Full overview
];

const MOBILE_CAMERA_SHOTS = [
	{ target: 'overview', zoom: 1, xOffset: 0, yOffset: 0 },     // 1. Full overview
	{ target: 1, zoom: 4, xOffset: 80, yOffset: 0 },        // 2. Building 1
	{ target: 2, zoom: 4, xOffset: 0, yOffset: 0 },         // 3. Building 2
	{ target: 3, zoom: 4, xOffset: -10, yOffset: 60 },     // 4. Building 3 balcony
	{ target: 3, zoom: 4, xOffset: -10, yOffset: 0 },       // 5. Building 3 storefront
	{ target: 4, zoom: 4, xOffset: 0, yOffset: 0 },          // 6. Building 4
	{ target: 5, zoom: 4, xOffset: 10, yOffset: 0 },          // 7. Building 5
	{ target: 6, zoom: 4, xOffset: 0, yOffset: 10 },          // 8. Building 6
	{ target: 'overview', zoom: 1, xOffset: 0, yOffset: 0 },     // 9. Full overview
];

const HOTSPOT_SELECTOR = '.hotspot';

function getElement(selector, parent = document) {
	return parent.querySelector(selector);
}

function createResizeHandler(callback, delay = 120) {
	let timeoutId = null;

	const handleResize = () => {
		window.clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => callback(), delay);
	};

	window.addEventListener('resize', handleResize);

	return {
		destroy() {
			window.removeEventListener('resize', handleResize);
			window.clearTimeout(timeoutId);
		},
	};
}

function initHotspots() {
	const hotspots = Array.from(document.querySelectorAll(HOTSPOT_SELECTOR));

	hotspots.forEach((hotspot) => {
		const targetId = hotspot.dataset.target;
		const left = hotspot.dataset.left ?? '0';
		const top = hotspot.dataset.top ?? '0';
		const width = hotspot.dataset.width ?? '0';
		const height = hotspot.dataset.height ?? '0';

		hotspot.style.setProperty('--left', `${left}%`);
		hotspot.style.setProperty('--top', `${top}%`);
		hotspot.style.setProperty('--width', `${width}%`);
		hotspot.style.setProperty('--height', `${height}%`);

		hotspot.addEventListener('mouseenter', () => activateLayer(targetId));
		hotspot.addEventListener('mouseleave', () => deactivateLayer(targetId));
		hotspot.addEventListener('focus', () => activateLayer(targetId));
		hotspot.addEventListener('blur', () => deactivateLayer(targetId));
	});
}

function activateLayer(targetId) {
	// Only lift building tops on the wide/overview shot (scale === 1).
	// When zoomed in the popping effect looks wrong, so skip it.
	if (currentCameraScale !== 1) return;
	const target = document.getElementById(targetId);
	if (!target) return;
	target.classList.add('is-active');
}

function deactivateLayer(targetId) {
	const target = document.getElementById(targetId);
	if (!target) return;
	target.classList.remove('is-active');
}

function getShotPosition(shot, trackNode, sceneNode) {
	if (shot.target === 'overview') {
		const isMobile = window.innerWidth <= 768;
		let desiredX = shot.xOffset ?? 0;
		let desiredY = shot.yOffset ?? 0;

		if (isMobile) {
			const trackWidth = trackNode.offsetWidth;
			const trackHeight = trackNode.offsetHeight;
			const sceneWidth = sceneNode.offsetWidth;
			const sceneHeight = sceneNode.offsetHeight;

			// Center the scene vertically and horizontally on mobile
			desiredX = (sceneWidth / 2) - (trackWidth / 2) + (shot.xOffset ?? 0);
			desiredY = (trackHeight / 2) - (sceneHeight / 2) + (shot.yOffset ?? 0);
		}

		return {
			x: desiredX,
			y: desiredY,
			scale: shot.zoom ?? 1,
		};
	}

	const hotspot = document.querySelector(`.hotspot[data-target="building-${shot.target}"]`);

	if (!hotspot) {
		return {
			x: shot.xOffset ?? 0,
			y: shot.yOffset ?? 0,
			scale: shot.zoom ?? 1,
		};
	}

	const left = parseFloat(hotspot.dataset.left || '0');
	const top = parseFloat(hotspot.dataset.top || '0');
	const width = parseFloat(hotspot.dataset.width || '0');
	const height = parseFloat(hotspot.dataset.height || '0');

	const centerX = left + width / 2;
	const centerY = top + height / 2;
	const trackWidth = trackNode.offsetWidth;
	const trackHeight = trackNode.offsetHeight;
	const sceneWidth = sceneNode.offsetWidth;
	const sceneHeight = sceneNode.offsetHeight;
	const targetX = trackWidth * (centerX / 100);
	const targetY = trackHeight * (centerY / 100);
	const scale = shot.zoom ?? 1;

	let desiredX = sceneWidth / 2 - targetX + (shot.xOffset ?? 0);
	let desiredY = trackHeight - sceneHeight / 2 - targetY + (shot.yOffset ?? 0);

	const minX = sceneWidth / 2 + sceneWidth / (2 * scale) - trackWidth;
	const maxX = sceneWidth / 2 - sceneWidth / (2 * scale);
	const minY = sceneHeight / (2 * scale) - sceneHeight / 2;
	const maxY = trackHeight - sceneHeight / 2 - sceneHeight / (2 * scale);

	if (minX <= maxX) {
		desiredX = Math.max(minX, Math.min(maxX, desiredX));
	}
	if (minY <= maxY) {
		desiredY = Math.max(minY, Math.min(maxY, desiredY));
	}

	return {
		x: desiredX,
		y: desiredY,
		scale: scale,
	};
}

function createHeroScrollScene(rootNode, cameraNode, trackNode) {
	if (!rootNode || !cameraNode || !trackNode) return null;

	gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

	const sceneNode = document.getElementById(HERO_IDS.SCENE);
	if (!sceneNode) return null;

	let timeline = null;
	let currentShotIndex = 0;
	let isKeyboardJumping = false;

	function build() {
		const isMobile = window.innerWidth <= 768;
		const currentShots = isMobile ? MOBILE_CAMERA_SHOTS : DESKTOP_CAMERA_SHOTS;

		if (timeline) {
			timeline.scrollTrigger?.kill();
			timeline.kill();
			timeline = null;
		}

		const initialShot = getShotPosition(currentShots[0], trackNode, sceneNode);

		gsap.set(cameraNode, {
			scale: initialShot.scale,
			transformOrigin: '50% 50%',
		});

		gsap.set(trackNode, {
			x: initialShot.x,
			y: initialShot.y,
		});

		timeline = gsap.timeline({
			scrollTrigger: {
				trigger: rootNode,
				start: 'top top',
				end: `+=${heroSettings.pinDuration}`,
				scrub: heroSettings.scrub,
				pin: true,
				anticipatePin: 1,
				invalidateOnRefresh: true,
				onUpdate: (self) => {
					if (isKeyboardJumping) return;
					currentShotIndex = getNearestShotIndex(self.progress);

					// Track zoom from the shot data instead of reading the DOM every
					// frame. GSAP is the one setting the scale, so we already know it —
					// this avoids a forced style/layout flush on every scroll frame.
					const nextScale = currentShots[currentShotIndex].zoom ?? 1;
					// Only clear lingering hover "lifts" on the frame we first zoom in,
					// not on every frame.
					if (nextScale > 1 && currentCameraScale === 1) {
						document
							.querySelectorAll('.scene__layer.is-active')
							.forEach((el) => el.classList.remove('is-active'));
					}
					currentCameraScale = nextScale;

					updateMobileNavIndicator();
				},
			},
		});

		function updateMobileNavIndicator() {
			const indicator = document.getElementById('mobile-nav-indicator');
			if (indicator) {
				indicator.textContent = `${currentShotIndex + 1} / ${currentShots.length}`;
			}
		}

		for (let index = 1; index < currentShots.length; index += 1) {
			const shot = currentShots[index];
			const camera = getShotPosition(shot, trackNode, sceneNode);
			const label = `shot-${index}`;

			timeline.to(
				trackNode,
				{
					x: camera.x,
					y: camera.y,
					duration: heroSettings.shotDuration,
					ease: heroSettings.ease,
				},
				label
			);

			timeline.to(
				cameraNode,
				{
					scale: camera.scale,
					duration: heroSettings.shotDuration,
					ease: heroSettings.ease,
				},
				label
			);

			if (index !== currentShots.length - 1) {
				timeline.to({}, { duration: heroSettings.betweenShotPause }, `>-${heroSettings.betweenShotPause * 0.5}`);
			}
		}

		timeline.addLabel('shot-0', 0);
	}

	function getNearestShotIndex(progress) {
		const isMobile = window.innerWidth <= 768;
		const currentShots = isMobile ? MOBILE_CAMERA_SHOTS : DESKTOP_CAMERA_SHOTS;

		const totalDuration = timeline.duration();
		const currentTime = progress * totalDuration;

		let nearestIndex = 0;
		let nearestDelta = Infinity;

		for (let index = 0; index < currentShots.length; index += 1) {
			const labelTime = timeline.labels[`shot-${index}`] ?? 0;
			const delta = Math.abs(labelTime - currentTime);
			if (delta < nearestDelta) {
				nearestDelta = delta;
				nearestIndex = index;
			}
		}

		return nearestIndex;
	}

	function goToShot(index) {
		const isMobile = window.innerWidth <= 768;
		const currentShots = isMobile ? MOBILE_CAMERA_SHOTS : DESKTOP_CAMERA_SHOTS;

		const clampedIndex = Math.max(0, Math.min(currentShots.length - 1, index));
		const st = timeline?.scrollTrigger;
		if (!st) return;

		const labelTime = timeline.labels[`shot-${clampedIndex}`] ?? 0;
		const totalDuration = timeline.duration();
		const targetProgress = totalDuration === 0 ? 0 : labelTime / totalDuration;
		const targetScroll = st.start + targetProgress * (st.end - st.start);

		isKeyboardJumping = true;
		currentShotIndex = clampedIndex;

		// Immediately update the indicator so it feels responsive before the animation finishes
		const indicator = document.getElementById('mobile-nav-indicator');
		if (indicator) {
			indicator.textContent = `${currentShotIndex + 1} / ${currentShots.length}`;
		}

		gsap.to(window, {
			scrollTo: { y: targetScroll },
			duration: heroSettings.keyboardScrollDuration,
			ease: 'power2.inOut',
			onComplete: () => {
				isKeyboardJumping = false;
			},
		});
	}

	// Maps keyboard digits '1'-'9' directly to CAMERA_SHOTS indices 0-8,
	// matching the 9-shot spec (1 = overview ... 9 = overview).
	const DIGIT_TO_SHOT_INDEX = {
		Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4,
		Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8,
		Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4,
		Numpad6: 5, Numpad7: 6, Numpad8: 7, Numpad9: 8,
	};

	function handleKeydown(event) {
		const st = timeline?.scrollTrigger;
		if (!st || !st.isActive) return;

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			goToShot(currentShotIndex + 1);
			return;
		}

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goToShot(currentShotIndex - 1);
			return;
		}

		const digitShotIndex = DIGIT_TO_SHOT_INDEX[event.code];
		if (digitShotIndex !== undefined) {
			event.preventDefault();
			goToShot(digitShotIndex);
		}
	}

	window.addEventListener('keydown', handleKeydown);

	// Mobile Navigation Binding
	const mobilePrevBtn = document.getElementById('mobile-nav-prev');
	const mobileNextBtn = document.getElementById('mobile-nav-next');

	const handleMobilePrev = () => {
		// Prevent going back to the first overview (index 0)
		if (currentShotIndex <= 1) return;
		goToShot(currentShotIndex - 1);
	};

	const handleMobileNext = () => {
		const isMobile = window.innerWidth <= 768;
		const currentShots = isMobile ? MOBILE_CAMERA_SHOTS : DESKTOP_CAMERA_SHOTS;
		// If at the final overview, loop back to Building 1
		if (currentShotIndex >= currentShots.length - 1) {
			goToShot(1);
		} else {
			goToShot(currentShotIndex + 1);
		}
	};

	if (mobilePrevBtn) mobilePrevBtn.addEventListener('click', handleMobilePrev);
	if (mobileNextBtn) mobileNextBtn.addEventListener('click', handleMobileNext);

	build();

	const isMobile = window.innerWidth <= 768;
	if (isMobile) {
		// Wait 1.5 seconds to ensure the user sees the initial wide view, then zoom to Building 1
		setTimeout(() => {
			if (currentShotIndex === 0 && window.scrollY < 50) {
				goToShot(1);
			}
		}, 1500);
	}

	return {
		refresh() {
			build();
			ScrollTrigger.refresh();
		},
		destroy() {
			window.removeEventListener('keydown', handleKeydown);
			if (mobilePrevBtn) mobilePrevBtn.removeEventListener('click', handleMobilePrev);
			if (mobileNextBtn) mobileNextBtn.removeEventListener('click', handleMobileNext);
			timeline?.scrollTrigger?.kill();
			timeline?.kill();
		},
	};
}

function initHeroSection() {
	const root = getElement(`#${HERO_IDS.ROOT}`);
	const camera = getElement(`#${HERO_IDS.CAMERA}`);
	const track = getElement(`#${HERO_IDS.TRACK}`);

	if (!root || !camera || !track) return;

	const scrollScene = createHeroScrollScene(root, camera, track);

	if (!scrollScene) return;

	window.__heroResizeHandler = createResizeHandler(() => {
		scrollScene.refresh();
	});

	window.__heroScrollScene = scrollScene;
}

function initScootyAnimation() {
	const scooty = document.getElementById('hero-scooty');
	if (!scooty) return;

	// Fetch the GIF as a raw blob so it is stored in memory.
	fetch(scooty.src)
		.then((res) => res.blob())
		.then((blob) => {
			// Every time the CSS animation loops back to the start, 
			// we generate a brand new Blob URL for the image.
			// This completely bypasses the browser cache and forces the GIF
			// to flawlessly restart from frame 0 without any flickering or network requests!
			scooty.addEventListener('animationiteration', () => {
				scooty.src = URL.createObjectURL(blob);
			});
		});
}

window.addEventListener('DOMContentLoaded', () => {
	initHotspots();
	initHeroSection();
	initScootyAnimation();
	initModals();
});