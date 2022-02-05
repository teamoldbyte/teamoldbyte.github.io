/**
 * 세션 타이머. 
 * @requires jQuery,Bootstrap
 * @author LGM
 */
(() => {
const max = 1800; // 세션 최대 유지 시간; 초 단위
const userAct = 'keypress.session click.session scroll.session';
let timeleft = max, sessionTimer;
$.getJSON('/session/valid', valid => {if(valid) {
  
  // 타이머 설정
  sessionTimer = setInterval(() => {
	if(timeleft > 0) {
	  timeleft -= 1;
	  // 세션 유효 시간을 초단위로 표시
	  $('#sessionTimeLeft').text(Math.floor(timeleft/60)+'분 '+timeleft%60+'초')
	  // 세션 만료 10분전부터 사용자의 입력 활동이 있으면 세션 자동갱신
	  if(timeleft == 600) {
		$(document).on(userAct, updateSession);
	  }
	  // 세션 만료 5분전 세션 연장 모달 표시
	  if(timeleft == 300) {
		$(document).off(userAct);
		$('#sessionAlert').modal('show');
	  }
	}else {
	  sessionExpiredConfirm();
	}
  }, 1000);
  
  // 서버로의 ajax 호출이 있으면 타이머 초기화
  $(document).ajaxComplete((event,xhr,settings) => {
	const ajaxurl = settings.url;
	if(ajaxurl.startsWith('/') || ajaxurl.startsWith('https://www.findsvoc.com') || ajaxurl.startsWith('https://findsvoc.com'))
	  if(ajaxurl == '/session/valid') 
		timeleft = max * (xhr.responseJSON ? 1 : 0)
	else if(timeleft > 0) 
	  timeleft = max;
  });
  
  // 세션 만료 알림 모달 등록
  $(document.body).append('<div class="modal fade" id="sessionAlert" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">'
		+ '<div class="modal-dialog">'
		+ '<div class="modal-content fw-bold border-0">'
		+ '<div class="modal-header bg-fc-purple">'
		+ '<h5 class="modal-title text-white">이용 안내</h5>'
		+ '</div>'
		+ '<div class="modal-body text-center">'
		+ '<p>로그인 시간이 <span id="sessionTimeLeft" class="text-yellow-500"></span> 남았습니다.<br>로그인 시간을 연장하시겠습니까?</p>'
		+ '<p>로그인 시간을 연장하시려면 아래 연장하기 버튼을 눌러주세요.</p>'
		+ '</div>'
		+ '<div class="modal-footer justify-content-center">'
		+ '<button type="button" class="btn btn-fico" id="extendSession" data-bs-dismiss="modal">연장하기</button>'
		+ '<button type="button" class="btn btn-outline-fico" data-bs-dismiss="modal">취소</button>'
		+ '</div></div></div></div>')
  .on('click', '#extendSession', () => {
	if(timeleft > 0)
	  updateSession();
	else
	  sessionExpiredConfirm();
  })
}});

// 세션 자동갱신
function updateSession() {
  $.getJSON('/session/valid');
  $(document).off(userAct);
}

// 세션 만료. 로그인 페이지로 가거나 현재 페이지에 남기를 선택
function sessionExpiredConfirm() {
  clearInterval(sessionTimer);
  if(confirm('개인정보 보호를 위해\n로그인 후 30분동안 서비스 이용이 없어\n자동 로그아웃 되었습니다.\n\n다시 로그인을 하시려면 확인을 눌러주세요.')) {
	location.assign('/auth/login');
  }else {
	$('#sessionAlert').modal('hide');
  }	
}
})();