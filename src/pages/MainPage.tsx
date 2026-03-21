import { useEffect, useState } from "react";
import type { AnimationEffect, ImageCount, BgColor } from "@/types";
import BgSelector from "@/components/main/BgSelector";
import ImageUploader from "@/components/main/ImageUploader";
import EffectSelector from "@/components/main/EffectSelector";
import CountSelector from "@/components/main/CountSelector";
import DurationInput from "@/components/main/DurationInput";
import SizeInput from "@/components/main/SizeInput";
import GapInput from "@/components/main/GapInput";
import AnimationPreview from "@/components/main/AnimationPreview";
import DownloadButton from "@/components/main/DownloadButton";

function MainPage() {
	const [bgColor, setBgColor] = useState<BgColor>("#ffffff");
	const [image, setImage] = useState<string | null>(null);
	const [effect, setEffect] = useState<AnimationEffect>("rain");
	const [count, setCount] = useState<ImageCount>(1);
	const [duration, setDuration] = useState(3);
	const [size, setSize] = useState(32);
	const [gap, setGap] = useState(0);

	const layoutLocked = effect === "rain" || effect === "ninja";

	useEffect(() => {
		if (effect === "rain" || effect === "ninja") {
			setCount(1);
			setGap(0);
		}
	}, [effect]);

	return (
		<section className="main-page">
			<div className="main-page-header">
				<h1>PICHANGE</h1>

				<p>사진으로 움직이는 배경화면 만들기</p>
			</div>

			<div className="main-page-section">
				<span className="main-page-section-label">배경</span>
				<BgSelector bgColor={bgColor} onBgColorChange={setBgColor} />
			</div>

			<div className="main-page-section">
				<span className="main-page-section-label">이미지</span>
				<ImageUploader image={image} onImageChange={setImage} />
			</div>

			<div className="main-page-section">
				<span className="main-page-section-label">애니메이션 효과</span>
				<EffectSelector effect={effect} onEffectChange={setEffect} />
			</div>

			<div className="main-page-section">
				<span className="main-page-section-label">이미지 개수</span>
				<CountSelector count={count} onCountChange={setCount} disabled={layoutLocked} />
			</div>

			<div className="main-page-section">
				<span className="main-page-section-label">이미지 크기</span>
				<SizeInput size={size} onSizeChange={setSize} />
			</div>

			<div className="main-page-section">
				<span className="main-page-section-label">이미지 간격</span>
				<GapInput gap={gap} onGapChange={setGap} disabled={layoutLocked} />
			</div>

			<div className="main-page-section">
				<span className="main-page-section-label">애니메이션 속도</span>
				<DurationInput duration={duration} onDurationChange={setDuration} />
			</div>

			<div className="main-page-section">
				<span className="main-page-section-label">미리보기</span>
				<AnimationPreview
					image={image}
					effect={effect}
					count={count}
					duration={duration}
					size={size}
					gap={gap}
					bgColor={bgColor}
				/>
			</div>

			<DownloadButton
				image={image}
				effect={effect}
				count={count}
				duration={duration}
				size={size}
				gap={gap}
				bgColor={bgColor}
			/>
		</section>
	);
}

export default MainPage;
