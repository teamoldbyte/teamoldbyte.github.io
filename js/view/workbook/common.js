/** /layout/workbook_layout.html
@author LGM 
 */
function initLayout(csrf, loggedIn) {
	// 로그인 전용 버튼은 비로그인 상태에서 동작하지 않도록 설정
	$(document).on('click', '.login-required', function(e) {
		if(!loggedIn) {
			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();
			if(confirm('fico 멤버십이 필요합니다.\n로그인 화면으로 이동하시겠습니까?')) location.assign('/auth/login');
			return false;
		}		
	}).on('show.bs.modal', '.modal', function(e) {
		if(!loggedIn && e.relatedTarget != null && e.relatedTarget.matches('.login-required'))
			e.preventDefault();
	})
	if(!localStorage.getItem('generativeNotePromotionViewed')) {
		alertModal('영어학습을 더 효율적으로!<br>'
			+ '새로운 기능 <b class="text-danger">AI 노트 생성</b> 서비스를 지금 만나보세요.<br><br>'
			+ '워크북 지문 상세보기 페이지에서 <b class="text-danger">AI 노트 생성</b> 버튼을 클릭하면<br>'
			+ 'AI가 자동으로 문장 노트와 지문 노트를 작성해드립니다.<br><br>'
			+ '이제 분석과 정리는 AI에게 맡기고, 학습의 본질에 집중하세요.', localStorage.setItem('generativeNotePromotionViewed', 'true'));
	}
	
	if(csrf) {
		// POST 방식 전송에 대해 csrf 설정
		$(document).ajaxSend((_event, jqXHR, options)=>{
			if(options.type == 'POST' 
			&& (options.url.startsWith('/') || options.url.startsWith(location.origin))){
				jqXHR.setRequestHeader(csrf.headerName, csrf.token);
			}
		});
		// 첫 로그인인 사용자에겐 튜토리얼을 진행한다.
		if(loggedIn && !localStorage.getItem('tutorialEnds')) {
			$.ajax({dataType: 'script', cache: true, url:'https://static.findsvoc.com/js/app/tutorials.min.js'});
		}
	}
}
