import { useCallback, useState } from "react";
import {
	buildAndroidExternalOpenHref,
	getPageUrlToOpen,
	IN_APP_DATA_CANNOT_TRANSFER,
	isAndroidUserAgent,
	isInAppBrowser,
	isMobileDevice,
} from "@/utils/inAppBrowser";

const SESSION_DISMISS_KEY = "pichange_inapp_entry_notice_dismissed_v1";

function readShouldShowEntryNotice(): boolean {
	if (typeof window === "undefined") return false;
	let dismissed = false;
	try {
		dismissed = sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
	} catch {
		dismissed = false;
	}
	if (dismissed) return false;
	return isMobileDevice() && isInAppBrowser();
}

/**
 * 모바일 + 인앱 브라우저로 처음 들어왔을 때 안내.
 * 「그래도 여기서 계속」으로 닫으면 이 탭 세션 동안은 다시 안 띄움.
 */
function InAppBrowserEntryNotice() {
	const [visible, setVisible] = useState(readShouldShowEntryNotice);

	const pageUrl = typeof window !== "undefined" ? getPageUrlToOpen() : "";
	const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
	const android = isAndroidUserAgent(ua);
	const externalOpenHref = android && pageUrl ? buildAndroidExternalOpenHref(pageUrl) : pageUrl;

	const dismiss = useCallback(() => {
		try {
			sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
		} catch {
			/* ignore */
		}
		setVisible(false);
	}, []);

	const copyPageLink = useCallback(async () => {
		const url = getPageUrlToOpen();
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			window.alert(
				android
					? "주소를 복사했습니다.\n삼성 인터넷 등에 붙여넣어 연 뒤, 사진부터 다시 선택해 주세요."
					: "주소를 복사했습니다.\nSafari 등에 붙여넣어 연 뒤, 사진부터 다시 선택해 주세요.",
			);
		} catch {
			window.prompt("아래 주소를 복사해 브라우저에서 여세요:", url);
		}
	}, [android]);

	if (!visible) return null;

	return (
		<div
			className="download-button-mobile-save in-app-entry-notice"
			role="dialog"
			aria-modal="true"
			aria-label="인앱 브라우저 안내">
			<div className="download-button-mobile-save-backdrop" aria-hidden />
			<div className="download-button-mobile-save-panel">
				<span className="download-button-mobile-save-badge" aria-hidden>
					인앱으로 열림
				</span>
				<p className="download-button-mobile-save-text">
					<strong>카카오톡·인스타</strong> 안에서는 GIF <strong>다운로드가 자주 막혀요.</strong>
					<br />
					가능하면 <strong>삼성 인터넷·Safari·Chrome</strong>에서 이 페이지를 먼저 여세요.
				</p>
				<p className="download-button-mobile-save-text-secondary">
					<strong>{IN_APP_DATA_CANNOT_TRANSFER}</strong>
					<br />
					밖에서 페이지를 열면 <strong>사진·효과 설정을 처음부터</strong> 다시 해야 해요. (지금 창에서 만든 GIF는 다른 앱으로 넘어가지 않습니다.)
				</p>
				<div className="download-button-mobile-save-actions">
					<a
						href={externalOpenHref || "about:blank"}
						{...(android ? {} : { target: "_blank", rel: "noopener noreferrer" })}
						className="download-button-mobile-save-open">
						{android ? "삼성 인터넷에서 열기" : "Safari / Chrome에서 열기"}
					</a>
					<button type="button" className="download-button-mobile-save-share" onClick={() => void copyPageLink()}>
						페이지 주소 복사
					</button>
				</div>
				<p className="download-button-mobile-save-note">
					카카오톡은 ⋯ 메뉴에 「다른 브라우저로 열기」가 있을 수 있어요.
				</p>
				<button type="button" className="download-button-mobile-save-close" onClick={dismiss}>
					그래도 여기서 계속할게요
				</button>
			</div>
		</div>
	);
}

export default InAppBrowserEntryNotice;
