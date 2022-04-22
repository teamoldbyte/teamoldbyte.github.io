/** 클릭버튼에 의한 화면 회전을 지원.
버튼에 onclick="rotate()" 형식으로 설정
@author LGM
 */
(function(document, screen, bootstrap) {
	const de = document.documentElement;
	let orientation, origin, tooltip;
	
	const rotate = function() {
		const rotateBtn = this.event.currentTarget;
		tooltip = bootstrap.Tooltip.getInstance(rotateBtn);
		
		orientation = screen?.orientation?.type;
		origin = origin || orientation.substring(0,4);
		
		rotateScreen();
	}
	const rotateScreen = function() {
		// 앱에서는 앱 네이티브 인터페이스를 실행하여 회전
		if(typeof ANI != 'undefined' && typeof ANI?.changeOrientation == 'function') {
			ANI?.changeOrientation(orientation.startsWith('portrait'));
		}
		else if(typeof Android != 'undefined' && typeof Android?.changeOrientation == 'function') {
			Android?.changeOrientation(orientation.startsWith('portrait'));
		}
		// 웹에서는 FullScreen API 및 Screen Orientation API를 사용하여 회전
		else if(screen?.orientation != null) {
			
			if(document.webkitRequestFullscreen) { document.webkitRequestFullscreen(); }
			else if (de.requestFullscreen) { de.requestFullscreen(); }
			else if (de.mozRequestFullScreen) { de.mozRequestFullScreen(); }
			else if (de.webkitRequestFullscreen) { de.webkitRequestFullscreen(); }
			else if (de.msRequestFullscreen) { de.msRequestFullscreen(); }
			
			screen.orientation.lock(orientation.startsWith('portrait') ? 'landscape' : 'portrait')
			.then(fin).catch(() => { alert('화면 회전이 지원되지 않습니다.'); fin(); });	
		
		}else alert('화면 회전이 지원되지 않습니다.');
	}
	// 웹에서는 회전 완료 시 FullScreen을 해제한다.
	const fin = () => {
		if(!orientation.startsWith(origin)) document.exitFullscreen();
		if(tooltip != null) setTimeout(() => tooltip.hide(), 1000);
		
	}
	globalThis.rotate = rotate;
})(window.document, window.screen, bootstrap);
