import GIF from "gif.js";
import type { AnimationEffect, ImageCount, GridInfo, BgColor } from "@/types";

const OUTPUT_WIDTH = 540;
const OUTPUT_HEIGHT = 1200;
const PREVIEW_WIDTH = 200;
const SCALE = OUTPUT_WIDTH / PREVIEW_WIDTH;
const FPS = 15;

/** GIF 투명 처리용 크로마키 (이미지에 거의 안 나오는 색) */
const GIF_CHROMA_KEY = 0xff00ff;
const GIF_CHROMA_KEY_CSS = "#ff00ff";
// public/gif.worker.js 는 위 색과 일치하는 픽셀을 투명 팔레트 인덱스로 강제 매핑하도록 패치됨 (원본 gif.js는 양자화 후 투명이 깨짐)

const RAIN_SEED = 99;
const RAIN_DROP_COUNT = 22;

export function getGridInfo(count: number): GridInfo {
	if (count <= 1) return { cols: 1, rows: 1 };
	if (count <= 2) return { cols: 2, rows: 1 };
	if (count <= 4) return { cols: 2, rows: 2 };
	if (count <= 6) return { cols: 3, rows: 2 };
	if (count <= 9) return { cols: 3, rows: 3 };
	if (count <= 12) return { cols: 4, rows: 3 };
	return { cols: 4, rows: 4 };
}

function coverDraw(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	x: number,
	y: number,
	s: number,
) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(x, y, s, s);
	ctx.clip();

	const imgRatio = img.width / img.height;
	let dw: number, dh: number;
	if (imgRatio > 1) {
		dh = s;
		dw = s * imgRatio;
	} else {
		dw = s;
		dh = s / imgRatio;
	}
	ctx.drawImage(img, x + (s - dw) / 2, y + (s - dh) / 2, dw, dh);
	ctx.restore();
}

function drawGrid(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	count: number,
	grid: GridInfo,
	w: number,
	h: number,
	s: number,
	g: number,
	offsetX: number,
	offsetY: number,
) {
	const gridW = grid.cols * s + (grid.cols - 1) * g;
	const gridH = grid.rows * s + (grid.rows - 1) * g;
	const baseX = (w - gridW) / 2 + offsetX;
	const baseY = (h - gridH) / 2 + offsetY;

	for (let i = 0; i < count; i++) {
		const col = i % grid.cols;
		const row = Math.floor(i / grid.cols);
		const x = baseX + col * (s + g);
		const y = baseY + row * (s + g);
		coverDraw(ctx, img, x, y, s);
	}
}

function drawTiles(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	w: number,
	h: number,
	s: number,
	g: number,
	offsetX: number,
	offsetY: number,
) {
	const step = s + g;
	const cols = Math.ceil(w / step) + 2;
	const rows = Math.ceil(h / step) + 2;

	for (let r = -1; r < rows; r++) {
		for (let c = -1; c < cols; c++) {
			const x = c * step + offsetX;
			const y = r * step + offsetY;
			coverDraw(ctx, img, x, y, s);
		}
	}
}

interface FrameCtx {
	ctx: CanvasRenderingContext2D;
	img: HTMLImageElement;
	count: ImageCount;
	frame: number;
	totalFrames: number;
	w: number;
	h: number;
	s: number;
	g: number;
	bg: BgColor;
}

function clearFrame(ctx: CanvasRenderingContext2D, w: number, h: number, bg: BgColor) {
	if (bg === "transparent") {
		ctx.clearRect(0, 0, w, h);
	} else {
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, w, h);
	}
}

/**
 * 투명 GIF: 캔버스 RGBA를 불투명 RGB로 바꾸고, 완전 투명은 크로마키(#ff00ff)로 채움.
 * (마젠타 위에 globalAlpha로 그리면 색이 섞여 잔상만 분홍/마젠타로 남는 문제 방지)
 */
function flattenTransparentFrameForGif(ctx: CanvasRenderingContext2D, w: number, h: number) {
	const id = ctx.getImageData(0, 0, w, h);
	const d = id.data;
	const cr = 255;
	const cg = 0;
	const cb = 255;
	for (let i = 0; i < d.length; i += 4) {
		const a = d[i + 3] / 255;
		const inv = 1 - a;
		d[i] = Math.round(d[i] * a + cr * inv);
		d[i + 1] = Math.round(d[i + 1] * a + cg * inv);
		d[i + 2] = Math.round(d[i + 2] * a + cb * inv);
		d[i + 3] = 255;
	}
	// 알파 합성 후에도 남는 분홍/마젠타 테두리 → 크로마키로 스냅 (GIF 1색 투명 한계)
	for (let i = 0; i < d.length; i += 4) {
		const r = d[i];
		const g = d[i + 1];
		const b = d[i + 2];
		const dr = r - 255;
		const dg = g;
		const db = b - 255;
		const distSq = dr * dr + dg * dg + db * db;
		const magentaAxis = r >= 195 && b >= 195 && g <= 130 && r + b - 2 * g >= 120;
		if (distSq <= 42 * 42 || magentaAxis) {
			d[i] = 255;
			d[i + 1] = 0;
			d[i + 2] = 255;
		}
	}
	ctx.putImageData(id, 0, 0);
}

function drawFrameRain(fc: FrameCtx) {
	const { ctx, img, frame, totalFrames, w, h, s, bg } = fc;
	const progress = frame / totalFrames;
	clearFrame(ctx, w, h, bg);

	const rand = pseudoRandom(RAIN_SEED);
	const maxX = Math.max(0, w - s);
	for (let i = 0; i < RAIN_DROP_COUNT; i++) {
		const xPct = rand();
		const phase = rand();
		const x = xPct * maxX;
		const t = (progress + phase) % 1;
		const y = -s + t * (h + s);
		coverDraw(ctx, img, x, y, s);
	}
}

function drawFrameRotate(fc: FrameCtx) {
	const { ctx, img, count, frame, totalFrames, w, h, s, g, bg } = fc;
	const angle = (frame / totalFrames) * Math.PI * 2;
	clearFrame(ctx, w, h, bg);

	if (count === "infinite") {
		const step = s + g;
		const cols = Math.ceil(w / step) + 2;
		const rows = Math.ceil(h / step) + 2;
		for (let r = -1; r < rows; r++) {
			for (let c = -1; c < cols; c++) {
				const cx = c * step + s / 2;
				const cy = r * step + s / 2;
				ctx.save();
				ctx.translate(cx, cy);
				ctx.rotate(angle);
				ctx.beginPath();
				ctx.rect(-s / 2, -s / 2, s, s);
				ctx.clip();
				const imgRatio = img.width / img.height;
				let dw: number, dh: number;
				if (imgRatio > 1) {
					dh = s;
					dw = s * imgRatio;
				} else {
					dw = s;
					dh = s / imgRatio;
				}
				ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
				ctx.restore();
			}
		}
	} else {
		const grid = getGridInfo(count);
		const gridW = grid.cols * s + (grid.cols - 1) * g;
		const gridH = grid.rows * s + (grid.rows - 1) * g;
		const baseX = (w - gridW) / 2;
		const baseY = (h - gridH) / 2;

		for (let i = 0; i < count; i++) {
			const col = i % grid.cols;
			const row = Math.floor(i / grid.cols);
			const cx = baseX + col * (s + g) + s / 2;
			const cy = baseY + row * (s + g) + s / 2;
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(angle);
			ctx.beginPath();
			ctx.rect(-s / 2, -s / 2, s, s);
			ctx.clip();
			const imgRatio = img.width / img.height;
			let dw: number, dh: number;
			if (imgRatio > 1) {
				dh = s;
				dw = s * imgRatio;
			} else {
				dw = s;
				dh = s / imgRatio;
			}
			ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
			ctx.restore();
		}
	}
}

function drawFrameShake(fc: FrameCtx) {
	const { ctx, img, count, frame, totalFrames, w, h, s, g, bg } = fc;
	const progress = frame / totalFrames;
	const shakeX = Math.sin(progress * Math.PI * 6) * s * 0.4;
	clearFrame(ctx, w, h, bg);

	if (count === "infinite") {
		drawTiles(ctx, img, w, h, s, g, shakeX, 0);
	} else {
		const grid = getGridInfo(count);
		drawGrid(ctx, img, count, grid, w, h, s, g, shakeX, 0);
	}
}

function drawFrameFloat(fc: FrameCtx) {
	const { ctx, img, count, frame, totalFrames, w, h, s, g, bg } = fc;
	const progress = frame / totalFrames;
	const floatY = Math.cos(progress * Math.PI * 2) * s * 0.09;
	clearFrame(ctx, w, h, bg);

	if (count === "infinite") {
		drawTiles(ctx, img, w, h, s, g, 0, floatY);
	} else {
		const grid = getGridInfo(count);
		drawGrid(ctx, img, count, grid, w, h, s, g, 0, floatY);
	}
}

function drawUnclipped(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	x: number,
	y: number,
	s: number,
	flip?: boolean,
) {
	const imgRatio = img.width / img.height;
	let dw: number, dh: number;
	if (imgRatio > 1) {
		dh = s;
		dw = s * imgRatio;
	} else {
		dw = s;
		dh = s / imgRatio;
	}
	if (flip) {
		ctx.save();
		ctx.translate(x + s / 2, 0);
		ctx.scale(-1, 1);
		ctx.drawImage(img, -dw / 2, y + (s - dh) / 2, dw, dh);
		ctx.restore();
	} else {
		ctx.drawImage(img, x + (s - dw) / 2, y + (s - dh) / 2, dw, dh);
	}
}

function pseudoRandom(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

export function getRainDropLayout(): { xPct: number; delayPct: number }[] {
	const rand = pseudoRandom(RAIN_SEED);
	const drops: { xPct: number; delayPct: number }[] = [];
	for (let i = 0; i < RAIN_DROP_COUNT; i++) {
		drops.push({ xPct: rand(), delayPct: rand() });
	}
	return drops;
}

function drawFrameNinja(fc: FrameCtx) {
	const { ctx, img, frame, totalFrames, w, h, s, bg } = fc;
	clearFrame(ctx, w, h, bg);

	const progress = frame / totalFrames;
	const flyDuration = 0.15;
	const trailOpacities = [0.12, 0.25, 0.45, 1];
	/** 잔상(분신) 진행도 간격 — 작을수록 더 촘촘 */
	const trailOffset = 0.008;
	const rand = pseudoRandom(42);
	const ninjaCount = 10;
	/** 투명 GIF에서는 알파 잔상이 마젠타와 섞여 남음 → 위치만 어긋난 불투명 복제로 통일 */
	const opaqueTrailsOnly = bg === "transparent";

	for (let i = 0; i < ninjaCount; i++) {
		const fromLeft = rand() > 0.5;
		const y = rand() * (h - s);
		const startProgress = rand();

		for (let t = 0; t < trailOpacities.length; t++) {
			let localProgress = progress - startProgress - trailOffset * (trailOpacities.length - 1 - t);
			if (localProgress < 0) localProgress += 1;
			if (localProgress > 1) localProgress -= 1;

			if (localProgress >= 0 && localProgress <= flyDuration) {
				const flyPct = localProgress / flyDuration;
				const x = fromLeft ? -s + flyPct * (w + s) : w - flyPct * (w + s);

				ctx.globalAlpha = opaqueTrailsOnly ? 1 : trailOpacities[t];
				drawUnclipped(ctx, img, x, y, s, fromLeft);
			}
		}
	}

	ctx.globalAlpha = 1;
}

type DrawFn = (fc: FrameCtx) => void;

const DRAW_MAP: Record<AnimationEffect, DrawFn> = {
	rain: drawFrameRain,
	rotate: drawFrameRotate,
	shake: drawFrameShake,
	float: drawFrameFloat,
	ninja: drawFrameNinja,
};

export function generateGif(
	imageSrc: string,
	effect: AnimationEffect,
	count: ImageCount,
	duration: number,
	size: number,
	gap: number,
	bgColor: BgColor,
	onProgress: (p: number) => void,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			const totalFrames = Math.round(duration * FPS);
			const frameDelay = Math.round(1000 / FPS);
			const s = Math.round(size * SCALE);
			const g = Math.round(gap * SCALE);

			const canvas = document.createElement("canvas");
			canvas.width = OUTPUT_WIDTH;
			canvas.height = OUTPUT_HEIGHT;
			const ctx = canvas.getContext("2d");
			if (!ctx) return reject(new Error("Canvas not supported"));

			const gif = new GIF({
				workers: 2,
				quality: 10,
				width: OUTPUT_WIDTH,
				height: OUTPUT_HEIGHT,
				workerScript: "/gif.worker.js",
				repeat: 0,
				transparent: bgColor === "transparent" ? GIF_CHROMA_KEY : null,
				background: bgColor === "transparent" ? GIF_CHROMA_KEY_CSS : undefined,
			});

			const drawFn = DRAW_MAP[effect];

			for (let i = 0; i < totalFrames; i++) {
				drawFn({
					ctx,
					img,
					count,
					frame: i,
					totalFrames,
					w: OUTPUT_WIDTH,
					h: OUTPUT_HEIGHT,
					s,
					g,
					bg: bgColor,
				});
				if (bgColor === "transparent") {
					flattenTransparentFrameForGif(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);
				}
				gif.addFrame(ctx, { copy: true, delay: frameDelay });
			}

			gif.on("progress", onProgress);
			gif.on("finished", resolve);
			gif.render();
		};
		img.onerror = () => reject(new Error("Image load failed"));
		img.src = imageSrc;
	});
}
