/** BootStrap v5.0 기준으로, 화면 사이즈를 통해 기기 판별
@author LGM
@usage devSize.isPhone(), devSize.isTablet(), devSize.isDesktop()

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
	
	
	function isPhone() {
		return window.matchMedia('('+'m'+'a'+'x'+'-'+'w'+'i'+'d'+'t'+'h'+':'+' '+'7'+'6'+'7'+'.'+'9'+'8'+'p'+'x'+')')['m'+'a'+'t'+'c'+'h'+'e'+'s'];
	}
	
	function isTablet() {
		return window.matchMedia('('+'m'+'i'+'n'+'-'+'w'+'i'+'d'+'t'+'h'+':'+' '+'7'+'6'+'8'+'p'+'x'+')'+' '+'a'+'n'+'d'+' '+'('+'m'+'a'+'x'+'-'+'w'+'i'+'d'+'t'+'h'+':'+' '+'9'+'9'+'1'+'.'+'9'+'8'+'p'+'x'+')')['m'+'a'+'t'+'c'+'h'+'e'+'s'];
	}
	
	function isDesktop() {
		return window.matchMedia('('+'m'+'i'+'n'+'-'+'w'+'i'+'d'+'t'+'h'+':'+' '+'9'+'9'+'2'+'p'+'x'+')')['m'+'a'+'t'+'c'+'h'+'e'+'s'];
	}
	
	window['devSize'] = { isPhone, isTablet, isDesktop };
})();
