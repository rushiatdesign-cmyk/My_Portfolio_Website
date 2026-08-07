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

const CAMERA_SHOTS = [
	{ target: 'overview', zoom: 1, xOffset: 0, yOffset: 0 },     // 1. Full overview
	{ target: 1, zoom: 3, xOffset: -40, yOffset: 10 },        // 2. Building 1
	{ target: 2, zoom: 2.8, xOffset: 10, yOffset: 10 },         // 3. Building 2
	{ target: 3, zoom: 2.8, xOffset: -10, yOffset: 110 },     // 4. Building 3 balcony
	{ target: 3, zoom: 2.8, xOffset: -10, yOffset: 10 },       // 5. Building 3 storefront
	{ target: 4, zoom: 2.8, xOffset: 10, yOffset: 10 },          // 6. Building 4
	{ target: 5, zoom: 3, xOffset: 20, yOffset: 10 },          // 7. Building 5
	{ target: 6, zoom: 3, xOffset: 10, yOffset: 10 },          // 8. Building 6
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

function getShotPosition(shot, sceneNode) {
	if (shot.target === 'overview') {
		return {
			x: shot.xOffset ?? 0,
			y: shot.yOffset ?? 0,
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
	const sceneWidth = sceneNode.offsetWidth;
	const sceneHeight = sceneNode.offsetHeight;
	const targetX = sceneWidth * (centerX / 100);
	const targetY = sceneHeight * (centerY / 100);

	return {
		x: sceneWidth / 2 - targetX + (shot.xOffset ?? 0),
		y: sceneHeight / 2 - targetY + (shot.yOffset ?? 0),
		scale: shot.zoom ?? 1,
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
		if (timeline) {
			timeline.scrollTrigger?.kill();
			timeline.kill();
			timeline = null;
		}

		const initialShot = getShotPosition(CAMERA_SHOTS[0], sceneNode);

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
				},
			},
		});

		for (let index = 1; index < CAMERA_SHOTS.length; index += 1) {
			const shot = CAMERA_SHOTS[index];
			const camera = getShotPosition(shot, sceneNode);
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
					onUpdate() {
						// Keep currentCameraScale in sync so activateLayer can gate the hover.
						const matrix = new DOMMatrix(window.getComputedStyle(cameraNode).transform);
						currentCameraScale = matrix.a; // 'a' is the X scale component
						// If we zoomed in, immediately remove any active building-top lift.
						if (currentCameraScale > 1) {
							document.querySelectorAll('.scene__layer.is-active').forEach(el => el.classList.remove('is-active'));
						}
					},
				},
				label
			);

			if (index !== CAMERA_SHOTS.length - 1) {
				timeline.to({}, { duration: heroSettings.betweenShotPause }, `>-${heroSettings.betweenShotPause * 0.5}`);
			}
		}

		timeline.addLabel('shot-0', 0);
	}

	function getNearestShotIndex(progress) {
		const totalDuration = timeline.duration();
		const currentTime = progress * totalDuration;

		let nearestIndex = 0;
		let nearestDelta = Infinity;

		for (let index = 0; index < CAMERA_SHOTS.length; index += 1) {
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
		const clampedIndex = Math.max(0, Math.min(CAMERA_SHOTS.length - 1, index));
		const st = timeline.scrollTrigger;
		if (!st) return;

		const labelTime = timeline.labels[`shot-${clampedIndex}`] ?? 0;
		const totalDuration = timeline.duration();
		const targetProgress = totalDuration === 0 ? 0 : labelTime / totalDuration;
		const targetScroll = st.start + targetProgress * (st.end - st.start);

		isKeyboardJumping = true;
		currentShotIndex = clampedIndex;

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

	build();

	return {
		refresh() {
			build();
			ScrollTrigger.refresh();
		},
		destroy() {
			window.removeEventListener('keydown', handleKeydown);
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

window.addEventListener('DOMContentLoaded', () => {
	initHotspots();
	initHeroSection();
	initModals();
});