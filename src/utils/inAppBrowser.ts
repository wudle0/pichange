/**
 * 인앱 브라우저(카카오톡 등) 감지 및 외부 브라우저로 열기용 URL.
 * DownloadButton, InAppBrowserEntryNotice 에서 공통 사용.
 */

export function isMobileDevice(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
	const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
	return uaData?.mobile === true;
}

/** 카카오톡·인스타·페이스북 등 앱 내장 브라우저(WebView) */
export function isInAppBrowser(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;

	if (/KAKAOTALK|KAKAO/i.test(ua)) return true;
	if (/Instagram/i.test(ua)) return true;
	if (/FBAN|FBAV|FBIOS/i.test(ua)) return true;
	if (/Line\//i.test(ua)) return true;
	if (/MicroMessenger/i.test(ua)) return true;
	if (/; wv\)/i.test(ua)) return true;

	return false;
}

export function isAndroidUserAgent(ua: string): boolean {
	return /Android/i.test(ua);
}

export function getPageUrlToOpen(): string {
	if (typeof window === "undefined") return "";
	return window.location.href.split("#")[0];
}

const SAMSUNG_INTERNET_PACKAGE = "com.sec.android.app.sbrowser";

/**
 * Android: 삼성 인터넷 우선. 미설치 시 S.browser_fallback_url 로 https 폴백.
 */
export function buildAndroidExternalOpenHref(pageUrl: string): string {
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

/** 서버에 업로드하지 않아 브라우저·앱마다 데이터가 분리됨 */
export const IN_APP_DATA_CANNOT_TRANSFER =
	"사진·설정·만든 GIF는 서버에 저장하지 않아, 다른 브라우저(삼성 인터넷·Safari 등)로 그대로 옮길 수 없습니다.";
