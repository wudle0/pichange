import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { AnimationEffect, ImageCount, BgColor } from "@/types";

/** CSS 변수 --duration (csstype의 CSSProperties에 없음) */
type PreviewFrameStyle = CSSProperties & { "--duration": string };
import { getGridInfo, getRainDropLayout } from "@/utils/gifGenerator";

const NINJA_DATA = [
	{ fromLeft: true, yPct: 5, delayPct: 0 },
	{ fromLeft: false, yPct: 42, delayPct: 0.1 },
	{ fromLeft: true, yPct: 75, delayPct: 0.2 },
	{ fromLeft: false, yPct: 22, delayPct: 0.3 },
	{ fromLeft: true, yPct: 55, delayPct: 0.4 },
	{ fromLeft: false, yPct: 88, delayPct: 0.5 },
	{ fromLeft: true, yPct: 35, delayPct: 0.6 },
	{ fromLeft: false, yPct: 12, delayPct: 0.7 },
	{ fromLeft: true, yPct: 65, delayPct: 0.8 },
	{ fromLeft: false, yPct: 48, delayPct: 0.9 },
];

const FRAME_WIDTH = 200;
const FRAME_PADDING = 20;
const CONTENT_WIDTH = FRAME_WIDTH - FRAME_PADDING * 2;
const FRAME_HEIGHT = Math.round((FRAME_WIDTH * 20) / 9);

interface AnimationPreviewProps {
	image: string | null;
	effect: AnimationEffect;
	count: ImageCount;
	duration: number;
	size: number;
	gap: number;
	bgColor: BgColor;
}

function AnimationPreview({
	image,
	effect,
	count,
	duration,
	size,
	gap,
	bgColor,
}: AnimationPreviewProps) {
	const grid = useMemo(() => (typeof count === "number" ? getGridInfo(count) : null), [count]);

	const step = size + gap;

	const infiniteCols = useMemo(
		() => Math.max(1, Math.ceil((CONTENT_WIDTH + gap) / step)),
		[step, gap],
	);
	const infiniteRows = useMemo(
		() => Math.max(1, Math.ceil((FRAME_HEIGHT + gap) / step)),
		[step, gap],
	);

	const rainDrops = useMemo(() => getRainDropLayout(), []);

	const style: PreviewFrameStyle = {
		"--duration": `${duration}s`,
		backgroundColor: bgColor === "transparent" ? "transparent" : bgColor,
	};

	const gridStyle = useMemo(() => {
		if (!grid) return {};
		return {
			gridTemplateColumns: `repeat(${grid.cols}, ${size}px)`,
			gridTemplateRows: `repeat(${grid.rows}, ${size}px)`,
			gap: `${gap}px`,
		};
	}, [grid, size, gap]);

	const infiniteStyle = useMemo(
		() => ({
			gridTemplateColumns: `repeat(${infiniteCols}, ${size}px)`,
			gap: `${gap}px`,
		}),
		[infiniteCols, size, gap],
	);

	function renderGrid() {
		if (!grid || typeof count !== "number") return null;
		return (
			<div className="animation-preview-grid centered" style={gridStyle}>
				{Array.from({ length: count }, (_, i) => (
					<div
						key={i}
						className="animation-preview-grid-cell"
						style={{ width: size, height: size }}>
						<img src={image!} alt="" draggable={false} />
					</div>
				))}
			</div>
		);
	}

	function renderInfinite() {
		const total = infiniteCols * infiniteRows;
		return (
			<div className="animation-preview-grid infinite" style={infiniteStyle}>
				{Array.from({ length: total }, (_, i) => (
					<div
						key={i}
						className="animation-preview-grid-cell"
						style={{ width: size, height: size }}>
						<img src={image!} alt="" draggable={false} />
					</div>
				))}
			</div>
		);
	}

	function renderRainRandom() {
		const maxX = Math.max(0, CONTENT_WIDTH - size);
		const rainEnd = FRAME_HEIGHT + size;
		return (
			<div className="animation-preview-rain-random">
				{rainDrops.map((d, i) => (
					<div
						key={i}
						className="animation-preview-rain-random-item"
						style={
							{
								left: d.xPct * maxX,
								width: size,
								height: size,
								animationDuration: `${duration}s`,
								animationDelay: `${-duration * d.delayPct}s`,
								"--rain-start": `${-size}px`,
								"--rain-end": `${rainEnd}px`,
							} as React.CSSProperties
						}>
						<img src={image!} alt="" draggable={false} />
					</div>
				))}
			</div>
		);
	}

	function renderNinja() {
		const trails = [1, 0.45, 0.25, 0.12];
		const trailGap = duration * 0.008;

		return (
			<div className="animation-preview-ninja">
				{NINJA_DATA.flatMap((n, ni) =>
					trails.map((opacity, ti) => (
						<div
							key={`${ni}-${ti}`}
							className="animation-preview-ninja-item"
							style={
								{
									top: `${n.yPct}%`,
									width: size,
									height: size,
									"--ninja-from": `${n.fromLeft ? -size : FRAME_WIDTH}px`,
									"--ninja-to": `${n.fromLeft ? FRAME_WIDTH : -size}px`,
									"--trail-opacity": opacity,
									animationDelay: `${-(duration * n.delayPct) + trailGap * ti}s`,
									animationDuration: `${duration}s`,
								} as React.CSSProperties
							}>
							<img
								src={image!}
								alt=""
								draggable={false}
								style={n.fromLeft ? { transform: "scaleX(-1)" } : undefined}
							/>
						</div>
					)),
				)}
			</div>
		);
	}

	function renderContent() {
		if (!image) {
			return (
				<div className="animation-preview-empty">
					<span>이미지를 먼저 업로드해주세요</span>
				</div>
			);
		}

		if (effect === "ninja") {
			return renderNinja();
		}

		const isInfinite = count === "infinite";

		if (effect === "rain") {
			return renderRainRandom();
		}

		return isInfinite ? renderInfinite() : renderGrid();
	}

	return (
		<div className="animation-preview">
			<div
				className={`animation-preview-frame ${image ? `effect-${effect}` : ""} ${bgColor === "transparent" ? "is-bg-transparent" : ""}`.trim()}
				style={style}>
				<div className="animation-preview-viewport">{renderContent()}</div>
			</div>
		</div>
	);
}

export default AnimationPreview;
