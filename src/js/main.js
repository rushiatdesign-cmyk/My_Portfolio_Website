import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const HERO_IDS = {
	ROOT: 'hero',
	SCENE: 'hero-scene',
	CAMERA: 'hero-camera',
	TRACK: 'hero-scene-track',
};

const heroSettings = {
	pinDuration: 8000,
	scrub: 1,
	ease: 'power2.inOut',
	shotDuration: 1.2,
	betweenShotPause: 0.35,
};

const CAMERA_SHOTS = [
	{ target: 1, zoom: 2.2, yOffset: 180 },
	{ target: 2, zoom: 2.2, yOffset: 180 },
	{ target: 3, zoom: 2.6, yOffset: -120 },
	{ target: 3, zoom: 2.2, yOffset: 180 },
	{ target: 4, zoom: 2.2, yOffset: 180 },
	{ target: 5, zoom: 2.2, yOffset: 180 },
	{ target: 6, zoom: 2.2, yOffset: 180 },
	{ target: 1, zoom: 1, yOffset: 0 },
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
	const hotspot = document.querySelector(`.hotspot[data-target="building-${shot.target}"]`);

	if (!hotspot) {
		return { x: 0, y: 0, scale: 1 };
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
		x: sceneWidth / 2 - targetX,
		y: sceneHeight / 2 - targetY + shot.yOffset,
		scale: shot.zoom,
	};
}

function createHeroScrollScene(rootNode, cameraNode, trackNode) {
	if (!rootNode || !cameraNode || !trackNode) return null;

	gsap.registerPlugin(ScrollTrigger);

	const sceneNode = document.getElementById(HERO_IDS.SCENE);
	if (!sceneNode) return null;

	gsap.set(cameraNode, {
		scale: 1,
		transformOrigin: '50% 50%',
	});

	gsap.set(trackNode, {
		x: 0,
		y: 0,
	});

	const timeline = gsap.timeline({
		scrollTrigger: {
			trigger: rootNode,
			start: 'top top',
			end: `+=${heroSettings.pinDuration}`,
			scrub: heroSettings.scrub,
			pin: true,
			anticipatePin: 1,
			invalidateOnRefresh: true,
		},
	});

	CAMERA_SHOTS.forEach((shot, index) => {
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
			},
			label
		);

		if (index !== CAMERA_SHOTS.length - 1) {
			timeline.to({}, { duration: heroSettings.betweenShotPause }, `>-${heroSettings.betweenShotPause * 0.5}`);
		}
	});

	return {
		refresh() {
			ScrollTrigger.refresh();
		},
	};
}



function initHeroSection() {
    const root = getElement(`#${HERO_IDS.ROOT}`);
const camera = getElement(`#${HERO_IDS.CAMERA}`);
const track = getElement(`#${HERO_IDS.TRACK}`);

if (!root || !camera || !track) return;

const scrollScene = createHeroScrollScene(
    root,
    camera,
    track
);

if (!scrollScene) return;

window.__heroResizeHandler = createResizeHandler(() => {
    scrollScene.refresh();
});
}

window.addEventListener('DOMContentLoaded', () => {
	initHotspots();
	initHeroSection();
});
