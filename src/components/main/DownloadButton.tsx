import { useCallback, useState } from "react";
import type { AnimationEffect, ImageCount, BgColor } from "@/types";
import { generateGif } from "@/utils/gifGenerator";
import {
	buildAndroidExternalOpenHref,
	getPageUrlToOpen,
	IN_APP_DATA_CANNOT_TRANSFER,
	isAndroidUserAgent,
	isInAppBrowser,
	isMobileDevice,
} from "@/utils/inAppBrowser";

interface DownloadButtonProps {
	image: string | null;
	effect: AnimationEffect;
	count: ImageCount;
	duration: number;
	size: number;
	gap: number;
	bgColor: BgColor;
}

function DownloadButton({
	image,
	effect,
	count,
	duration,
	size,
	gap,
	bgColor,
}: DownloadButtonProps) {
	const [progress, setProgress] = useState<number | null>(null);
	const [inAppModalOpen, setInAppModalOpen] = useState(false);

	const isGenerating = progress !== null;

	const pageUrl = typeof window !== "undefined" ? getPageUrlToOpen() : "";
	const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
	const android = isAndroidUserAgent(ua);
	const externalOpenHref = android && pageUrl ? buildAndroidExternalOpenHref(pageUrl) : pageUrl;

	const closeInAppModal = useCallback(() => setInAppModalOpen(false), []);

	async function copyPageLink() {
		const url = getPageUrlToOpen();
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			window.alert(
				android
					? "페이지 주소를 복사했습니다.\n삼성 인터넷·Chrome 등 주소창에 붙여넣은 뒤 GIF 다운로드를 다시 눌러 주세요."
					: "페이지 주소를 복사했습니다.\nSafari·Chrome 주소창에 붙여넣은 뒤 GIF 다운로드를 다시 눌러 주세요.",
			);
		} catch {
			window.prompt("아래 주소를 복사해 브라우저에서 여세요:", url);
		}
	}

	function triggerFileDownload(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function deliverGifBlob(blob: Blob) {
		const filename = `pichange_${effect}_${duration}s.gif`;

		if (isMobileDevice() && isInAppBrowser()) {
			setInAppModalOpen(true);
			return;
		}

		triggerFileDownload(blob, filename);
	}

	async function handleDownload() {
		if (!image || isGenerating) return;

		try {
			setProgress(0);
			const blob = await generateGif(
				image,
				effect,
				count,
				duration,
				size,
				gap,
				bgColor,
				setProgress,
			);
			await deliverGifBlob(blob);
		} catch (err) {
			console.error("GIF generation failed:", err);
		} finally {
			setProgress(null);
		}
	}

	if (isGenerating) {
		const percent = Math.round(progress * 100);
		return (
			<div className="download-button">
				<div className="download-button-progress">
					<div className="download-button-progress-bar" style={{ width: `${percent}%` }} />
					<span className="download-button-progress-text">생성 중... {percent}%</span>
				</div>
			</div>
		);
	}

	return (
		<div className="download-button">
			<button className="download-button-btn" disabled={!image} onClick={handleDownload}>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round">
					<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				GIF 다운로드
			</button>

			{inAppModalOpen && (
				<div
					className="download-button-mobile-save"
					role="dialog"
					aria-modal="true"
					aria-label="기본 브라우저에서 열기">
					<button
						type="button"
						className="download-button-mobile-save-backdrop"
						aria-label="닫기"
						onClick={closeInAppModal}
					/>
					<div className="download-button-mobile-save-panel">
						<span className="download-button-mobile-save-badge" aria-hidden>
							인앱 브라우저
						</span>
						<p className="download-button-mobile-save-text">
							<strong>카카오톡·인스타</strong> 등 앱 안 브라우저에서는 GIF{" "}
							<strong>파일 다운로드가 막히는</strong> 경우가 많습니다.
						</p>
						<p className="download-button-mobile-save-text-secondary">
							{IN_APP_DATA_CANNOT_TRANSFER} 밖에서 열면 <strong>GIF 다운로드를 다시</strong> 눌러 새로 만들어야
							해요.
							<br />
							<br />
							{android ? (
								<>
									① <strong>「삼성 인터넷에서 열기」</strong> → (없으면 기본 브라우저)
									<br />② 열린 브라우저에서 <strong>GIF 다운로드</strong>를 다시 실행하세요.
								</>
							) : (
								<>
									① <strong>「Safari / Chrome에서 열기」</strong>
									<br />② 열린 브라우저에서 <strong>GIF 다운로드</strong>를 다시 실행하세요.
								</>
							)}
						</p>
						<div className="download-button-mobile-save-actions">
							<a
								href={externalOpenHref || "about:blank"}
								{...(android ? {} : { target: "_blank", rel: "noopener noreferrer" })}
								className="download-button-mobile-save-open">
								{android ? "삼성 인터넷에서 열기" : "Safari / Chrome에서 열기"}
							</a>
							<button
								type="button"
								className="download-button-mobile-save-share"
								onClick={() => void copyPageLink()}>
								페이지 주소 복사
							</button>
						</div>
						<p className="download-button-mobile-save-note">
							버튼이 반응이 없으면 카카오톡 메뉴(⋯)에서 「다른 브라우저로 열기」를 찾아 보세요.
						</p>
						<button
							type="button"
							className="download-button-mobile-save-close"
							onClick={closeInAppModal}>
							닫기
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default DownloadButton;
