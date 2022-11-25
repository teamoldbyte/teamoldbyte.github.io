/** BootStrap v5.0 기준으로, 화면 사이즈를 통해 기기 판별
@author LGM
@usage devSize.isPhone(), devSize.isTablet(), devSize.isDesktop

참고표: https://getbootstrap.com/docs/5.0/layout/breakpoints/

// X-Small devices (portrait phones, less than 576px)
// No media query for `xs` since this is the default in Bootstrap

// Small devices (landscape phones, 576px and up)
@media (min-width: 576px) { ... }

// Medium devices (tablets, 768px and up)
@media (min-width: 768px) { ... }

// Large devices (desktops, 992px and up)
@media (min-width: 992px) { ... }

// X-Large devices (large desktops, 1200px and up)
@media (min-width: 1200px) { ... }

// XX-Large devices (larger desktops, 1400px and up)
@media (min-width: 1400px) { ... }

------------------------------------------------------
// X-Small devices (portrait phones, less than 576px)
@media (max-width: 575.98px) { ... }

// Small devices (landscape phones, less than 768px)
@media (max-width: 767.98px) { ... }

// Medium devices (tablets, less than 992px)
@media (max-width: 991.98px) { ... }

// Large devices (desktops, less than 1200px)
@media (max-width: 1199.98px) { ... }

// X-Large devices (large desktops, less than 1400px)
@media (max-width: 1399.98px) { ... }

// XX-Large devices (larger desktops)
// No media query since the xxl breakpoint has no upper bound on its width
 * 
 */
(function() {
	
	// ※ 갤럭시 폴드, 폰 가로모드의 경우 데스크탑과 동일한 화면을 이용하므로 제외
	function isPhone() {
		return _matchMedia('(max-width: 575.98px)');
	}
	
	function isWidePhone() {
		return _matchMedia('(min-width: 576px) and (max-width: 767.98px)');
	}
	
	function isTablet() {
		return _matchMedia('(min-width: 768px) and (max-width: 991.98px)');
	}
	
	function isDesktop() {
		return _matchMedia('(min-width: 992px)');
	}
	
	function _matchMedia(query) {
		return window.matchMedia(query).matches;
	}
	
	window['devSize'] = { isPhone, isWidePhone, isTablet, isDesktop };
})();
