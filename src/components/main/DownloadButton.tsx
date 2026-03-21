import { useCallback, useState } from "react";
import type { AnimationEffect, ImageCount, BgColor } from "@/types";
import { generateGif } from "@/utils/gifGenerator";

interface DownloadButtonProps {
	image: string | null;
	effect: AnimationEffect;
	count: ImageCount;
	duration: number;
	size: number;
	gap: number;
	bgColor: BgColor;
}

function isMobileDevice(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
	const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
	return uaData?.mobile === true;
}

/**
 * 카카오톡·인스타·페이스북 등 앱 내장 브라우저(WebView).
 * 여기서는 blob 다운로드/공유가 자주 막히므로 기본 브라우저로 유도한다.
 */
function isInAppBrowser(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;

	if (/KAKAOTALK|KAKAO/i.test(ua)) return true;
	if (/Instagram/i.test(ua)) return true;
	if (/FBAN|FBAV|FBIOS/i.test(ua)) return true;
	if (/Line\//i.test(ua)) return true;
	if (/MicroMessenger/i.test(ua)) return true;
	// Android System WebView (앱 임베드; 단독 Chrome과 구분 어려울 때 보조)
	if (/; wv\)/i.test(ua)) return true;

	return false;
}

function getPageUrlToOpen(): string {
	if (typeof window === "undefined") return "";
	return window.location.href.split("#")[0];
}

function isAndroidUserAgent(ua: string): boolean {
	return /Android/i.test(ua);
}

/** 삼성 인터넷(대다수 국내 안드로이드). 미설치 시 browser_fallback으로 일반 https(기본 브라우저) 열림 */
const SAMSUNG_INTERNET_PACKAGE = "com.sec.android.app.sbrowser";

/**
 * 카카오 인앱 등에서 `target=_blank`는 또 인앱으로 뜨는 경우가 많아,
 * Android는 intent로 외부 앱(삼성 인터넷 우선)을 지정한다.
 */
function buildAndroidExternalOpenHref(pageUrl: string): string {
	try {
		const u = new URL(pageUrl);
		if (u.protocol !== "http:" && u.protocol !== "https:") return pageUrl;
		const scheme = u.protocol.replace(":", "");
		const pathPart = `${u.host}${u.pathname}${u.search}${u.hash}`;
		const fallback = encodeURIComponent(pageUrl);
		return `intent://${pathPart}#Intent;scheme=${scheme};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=${SAMSUNG_INTERNET_PACKAGE};S.browser_fallback_url=${fallback};end`;
	} catch {
		return pageUrl;
	}
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
							{android ? (
								<>
									① 아래 <strong>「삼성 인터넷에서 열기」</strong>를 누르면{" "}
									<strong>삼성 인터넷</strong>으로 이 페이지가 열립니다. (앱이 없으면{" "}
									<strong>기본 브라우저</strong>로 열릴 수 있어요.)
									<br />② 열린 브라우저에서 <strong>GIF 다운로드</strong>를 <strong>한 번 더</strong> 눌러
									주세요. (방금 만든 GIF는 이 창에만 있어서, 밖에서는 다시 생성됩니다.)
								</>
							) : (
								<>
									① 아래 <strong>「Safari / Chrome에서 열기」</strong>를 눌러{" "}
									<strong>기본 브라우저</strong>로 이 페이지를 엽니다.
									<br />② 열린 브라우저에서 <strong>GIF 다운로드</strong>를 <strong>한 번 더</strong> 눌러
									주세요. (방금 만든 GIF는 이 창에만 있어서, 기본 브라우저에서는 다시 생성됩니다.)
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
