/**
 * 세션 타이머. 
 * @requires jQuery,Bootstrap
 * @author LGM
 */
(() => {
const MIN_10 = 600 * 1000, MIN_5 = 300 * 1000, // 10분(사용자 활동 감지 시점), 5분(경고 시점)
	userAct = 'keypress.session click.session scroll.session';
let maxAlive = 1800 * 1000, lastAccessdTime, timeleft = maxAlive, sessionTimer, detectingUserActs = false, focusOutAlerted = false;
$.getJSON('/session/valid', sessionMaxInterval => {if(sessionMaxInterval) {
  lastAccessdTime = new Date().getTime();
  maxAlive = sessionMaxInterval;
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
		+ '<button type="button" class="btn btn-outline-fico" id="closeSessionAlert" data-bs-dismiss="modal">취소</button>'
		+ '</div></div></div></div>')
  // 연장버튼을 누르면 아직 세션이 유효하면 즉시 세션 갱신 호출
  .on('click', '#extendSession', () => {
	if(lastAccessdTime + maxAlive > new Date().getTime()) updateSession();
	else sessionExpiredConfirm();
  })
  // 세션 연장을 취소하면 세션 만료 경고 띄우기
  .on('click', '#closeSessionAlert', () => {
	clearInterval(sessionTimer);
	alert('로그아웃이 되면 작성 중인 내용은 저장되지 않습니다.');
  });
  
  // 25분 뒤 최초 1회 세션 자동연장(=> 기본 55분이 주어짐)
  /* setTimeout(...,1500000)을 안쓰고 setInterval(...,1000) 쓰는 이유:
     OS 로그오프 등의 개입으로 타이머는 언제든 일시중지될 수 있기 때문
   */
  sessionTimer = setInterval(() => {
	timeleft = lastAccessdTime + maxAlive - new Date().getTime();
	if(timeleft <= 0) 
	  sessionExpiredConfirm();
	// 마지막 사용자 활성 시간부터 25분 경과
	else if(timeleft <= MIN_5) {
	  clearInterval(sessionTimer);
	  updateSession();
	  // 초단위의 타이머 새로 설정
	  sessionTimer = setInterval(checkSessionValid, 1000);
	}
  }, 1000);
  
  // 서버로의 ajax 호출이 있으면 타이머 초기화
  $(document).ajaxComplete((_event,xhr,settings) => {
	const ajaxurl = settings.url;
	if(ajaxurl.startsWith('/') || ajaxurl.startsWith('https://www.findsvoc.com') || ajaxurl.startsWith('https://findsvoc.com'))
	  // 세션갱신 호출은 세션의 유효/무효를 반환. 무효일 경우 즉시 타이머 종료
	  if(ajaxurl == '/session/valid') {
		lastAccessdTime = (new Date().getTime()) * (xhr.responseJSON ? 1 : 0);
		if(!xhr.responseJSON) sessionExpiredConfirm();
	  }else if(lastAccessdTime + maxAlive > new Date().getTime()) {
		lastAccessdTime = new Date().getTime()
	  } else sessionExpiredConfirm()
  });
  
  // 타이머가 만료되면 POST 방식 전송을 막고 로그인 유도
  $.ajaxPrefilter((options, _originalOptions, jqXHR) => {
	const ajaxurl = options.url;
	let now = new Date().getTime();
	if(options.type == 'POST' && lastAccessdTime + maxAlive <= now
	&& (ajaxurl.startsWith('/') || ajaxurl.startsWith('https://www.findsvoc.com') || ajaxurl.startsWith('https://findsvoc.com'))) {
	  jqXHR.abort();
	  if(confirm('유효 시간이 만료되어 요청을 수행할 수 없습니다. 다시 로그인하시겠습니까?')) {
		location.assign('/auth/login');
	  }
	}
  });
}});

// 세션 유효시간 체크
function checkSessionValid() {
  timeleft = lastAccessdTime + maxAlive - new Date().getTime();
  if(timeleft > 0) {
	// 세션 만료까지 10분 넘게 남았다면 브라우저 비활성화 경고 대기, 사용자 입력 감지 해제
	if(timeleft > MIN_10) {
	  focusOutAlerted = false;
	  if(detectingUserActs) {
	    detectingUserActs = false;
	    $(document).off(userAct);
	  }
	}
	// 세션 만료 10분전부터 사용자의 입력 활동이 있으면 세션 자동갱신
	else if(!detectingUserActs) {
	  detectingUserActs = true;
	  $(document).on(userAct, updateSession);
	}
	// 사용자 입력 감지 중이고, 세션 만료 5분전 세션 연장 모달 표시
	else if(timeleft <= MIN_5) {
	  // 세션 유효 시간을 초단위로 표시
	  $('#sessionTimeLeft').text(Math.floor(timeleft / 60000) + '분 '
							+ Math.floor(timeleft % 60000 / 1000) + '초');
	  // 브라우저 비활성화 경고가 떠있지 않은 상태에서 브라우저가 비활성화면 경고 표시
	  if(!document.hasFocus() && !focusOutAlerted) {
		// 중복 동작 방지를 위해 타이머 해제
		clearInterval(sessionTimer);
		
		const orgTitle = document.title;
		document.title = '💢💢세션 경고💢💢';
		focusOutAlerted = true;
		alert(new Date().toLocaleTimeString() + '\n경고 메세지를 확인해 주세요.');
		// 사용자가 메세지 확인하는 즉시 타이틀 원래대로, 세션 다시 체크
		document.title = orgTitle;
	
		// 곧바로 세션 체크 후, 타이머 다시 동작
		sessionTimer = setInterval(checkSessionValid, 1000);
	  }
	  // 사용자 입력 감지 해제, 세션연장 모달이 표시되지 않았다면 표시
	  else if(!$('#sessionAlert').is('.show')) {
		$(document).off(userAct);
		$('#sessionAlert').modal('show');
	  }
	}
  }else sessionExpiredConfirm();
}

// 세션 유지시간 설정
function setMaxAlive(num) {
	maxAlive = num * 1000;
}

// 세션 자동갱신. 세션이 10분 넘게 남게 되므로 동작 인식 해제.
function updateSession() {
  $.getJSON('/session/valid');
  $(document).off(userAct);
}

// 세션 만료. 로그인 페이지로 가거나 현재 페이지에 남기를 선택
function sessionExpiredConfirm() {
  clearInterval(sessionTimer);
  $('#sessionAlert')?.modal('hide');
  if(confirm(`개인정보 보호를 위해\n로그인 후 ${parseInt(maxAlive/60000)}분동안 서비스 이용이 없어\n자동 로그아웃 되었습니다.\n\n다시 로그인을 하시려면 확인을 눌러주세요.`)) {
	location.assign('/auth/login');
  }
}

Object.assign(window, {setMaxAlive, sessionExpiredConfirm, updateSession, checkSessionValid})
})();
