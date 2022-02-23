/**
 * 세션 타이머. 
 * @requires jQuery,Bootstrap
 * @author LGM
 */
(() => {
const max = 1800 * 1000; // 세션 최대 유지 시간; 밀리초 단위
const userAct = 'keypress.session click.session scroll.session';
let lastAccessdTime, timeleft = max, sessionTimer, detectingUserActs = false;
$.getJSON('/session/valid', valid => {if(valid) {
  lastAccessdTime = new Date().getTime();
  // 25분 뒤 최초 1회 세션 자동연장(=> 기본 55분이 주어짐)
  sessionTimer = setInterval(() => {
	let now = new Date().getTime();
	if(lastAccessdTime + max < now) 
	  sessionExpiredConfirm();
	else if(lastAccessdTime + 1000 * 1500 <= now) {
	  clearInterval(sessionTimer);
	  updateSession();
	  // 타이머 설정
	  sessionTimer = setInterval(() => {
		now = new Date().getTime();
		if(lastAccessdTime + max > now) {
		  timeleft = lastAccessdTime + max - now;
		  // 세션 만료 10분전부터 사용자의 입력 활동이 있으면 세션 자동갱신
		  if(timeleft <= 600000 && !detectingUserActs) {
			detectingUserActs = true;
			$(document).on(userAct, updateSession);
		  }
		  // 세션 만료 5분전 세션 연장 모달 표시
		  else if(timeleft <= 300000) {
			// 세션 유효 시간을 초단위로 표시
			$('#sessionTimeLeft').text(Math.floor(timeleft / 60000) + '분 '
									+ Math.floor(timeleft % 60000 / 1000) + '초');
			
			if(!$('#sessionAlert').is('.show')) {
				$(document).off(userAct);
				$('#sessionAlert').modal('show');
			}
			if(!document.hasFocus()) {
				const orgTitle = document.title;
				document.title = '💢💢세션 경고💢💢';
				alert(new Date().toLocaleTimeString() + '\n경고 메세지를 확인해 주세요.');
				document.title = orgTitle;
			}
		  }
		}else {
		  sessionExpiredConfirm();
		}
	  }, 1000);
	  

	  
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
	  // 연장버튼을 누르면 아직 세션이 유효하면 즉시 세션 갱신 호출
	  .on('click', '#extendSession', () => {
		if(lastAccessdTime + max > new Date().getTime()) updateSession();
		else sessionExpiredConfirm();
	  });
	}
  }, 1000);
  
  // 서버로의 ajax 호출이 있으면 타이머 초기화
  $(document).ajaxComplete((event,xhr,settings) => {
	const ajaxurl = settings.url;
	if(ajaxurl.startsWith('/') || ajaxurl.startsWith('https://www.findsvoc.com') || ajaxurl.startsWith('https://findsvoc.com'))
	  // 세션갱신 호출은 세션의 유효/무효를 반환. 무효일 경우 즉시 타이머 종료
	  if(ajaxurl == '/session/valid') 
		lastAccessdTime = (new Date().getTime()) * (xhr.responseJSON ? 1 : 0)
	  else if(lastAccessdTime + max > new Date().getTime()) {
		lastAccessdTime = new Date().getTime()
	  } else sessionExpiredConfirm()
  });
  
  // 타이머가 만료되면 POST 방식 전송을 막고 로그인 유도
  $.ajaxPrefilter((options, originalOptions, jqXHR) => {
	const ajaxurl = options.url;
	let now = new Date().getTime();
	if(options.type == 'POST' && lastAccessdTime + max <= now
	&& (ajaxurl.startsWith('/') || ajaxurl.startsWith('https://www.findsvoc.com') || ajaxurl.startsWith('https://findsvoc.com'))) {
	  jqXHR.abort();
	  if(confirm('유효 시간이 만료되어 요청을 수행할 수 없습니다. 다시 로그인하시겠습니까?')) {
		location.assign('/auth/login');
	  }
	}
  });
}});

// 세션 자동갱신. 세션이 10분 넘게 남게 되므로 동작 인식 해제.
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
