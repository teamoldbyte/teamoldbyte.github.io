/** membership/add_free_membership.html
 * @author LGM
 */
function pageinit() {
	let visitoIdInput = document.getElementById('visitorId');
	visitoIdInput.value = Cookies.get('VID');
	// 지역 입력란을 누르면 주소 검색창 펼치기
	$('.js-get-location').on('click', function() {
		// 권한 확인이 가능한 브라우저의 경우
		if(navigator['permissions']) {
			console.info('verifing permissions...')
			navigator.permissions.query({ name: 'geolocation' })
			.then((result) => {
				// 권한 거부일 경우
				if(result.state == 'denied') {
					//alertModal('위치 권한을 허용 또는 재설정 해주세요.\n권한 설정은 주소 표시줄의 자물쇠<i class="fas fa-lock"></i> 버튼을 눌러 주세요.')
					openDaumAddr();
				}else {
					getAddrFromGPS();
				}
			})
		}else getAddrFromGPS();

	})
	$('.edit-region').on('click', openDaumAddr);
	
	function getAddrFromGPS() {
		console.info('getting Position...')
		navigator.geolocation.getCurrentPosition(({coords: {latitude, longitude}}) => {
			$.ajax({
				url: 'https://dapi.kakao.com/v2/local/geo/coord2regioncode.json',
				data: {
					y: latitude,
					x: longitude
				},
				headers: {
					'Authorization' : 'KakaoAK 7d0e8787308a28ba88c228ea24ba2910'
				},
				success: ({documents: [item1]}) => {
					// item1은 법정동, item2는 행정동
					$('input[name="addr"]').val(`${item1.region_1depth_name} ${item1.region_2depth_name}`);
					$('input[name="addr1"]').val(item1.region_1depth_name);
					$('input[name="addr2"]').val(item1.region_2depth_name);
					$('input[name="addr3"]').val(item1.region_3depth_name);
					
					$('.js-get-location,.get-location-hint').slideUp(200);
					$('.edit-region').show().prop('disabled', true);
					$('.btn-signup').prop('disabled', false);
				}
			})
		},
		function error(e) {
			console.error(`ERROR(${e.code}):${e.message}`)
			openDaumAddr();
		}, {enableHighAccuracy: true});		
	}
	
	function openDaumAddr() {
		$('.js-get-location,.get-location-hint').slideUp(200);
		const $this = $('input[name="addr"]').show();
		const wrapper = $('#addrWrapper').get(0);
        // 현재 scroll 위치를 저장해놓는다.
		const currentScroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
		new daum.Postcode({
            oncomplete: function(data) {
				$this.val(`${data.sido} ${data.sigungu}`);
				$('input[name="addr1"]').val(data.sido);
				$('input[name="addr2"]').val(data.sigungu);
				$('input[name="addr3"]').val(data.bname);
				$this.prop('disabled', false);
				$(wrapper).hide();
                
				// 우편번호 찾기 화면이 보이기 이전으로 scroll 위치를 되돌린다.
				document.body.scrollTop = currentScroll;
				$('.btn-signup').prop('disabled', false);
			},
			// 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분. iframe을 넣은 element의 높이값을 조정한다.
			onresize : function(size) {
				$(wrapper).css('height',size.height+'px');
			},
			width : '100%',
			height : '100%'
		}).embed(wrapper);

        // iframe을 넣은 element를 보이게 한다.
		$this.prop('disabled', true);
		$(wrapper).show();		
	}
	
	// 주소 검색창 닫기
	$('#btnFoldWrap').on('click', function() {
		$('input.edit-region').prop('disabled', false)
		$('#addrWrapper').hide();
	})	
	
	// 가입 단계 진행.(마지막엔 submit)
	let phase = 1;
	$('.btn-signup').on('click', function(e) {
		const $currPhase = $('#signupForm .collapse').eq(phase - 1),
			$nextPhase = $('#signupForm .collapse').eq(phase);
		
		if(!Array.from($currPhase[0].querySelectorAll('input,select')).every(input => input.checkValidity())) {
			$('#signupForm').addClass('was-validated');
			return;
		}
		if($nextPhase.length > 0) {
			$('#signupForm').removeClass('was-validated');
			$currPhase.add($nextPhase).collapse('toggle');
			if($nextPhase.next('.collapse').length == 0) {
				$nextPhase.find('input').blur();
				this.type = 'submit';
				this.textContent = '완료하고 크래프트로 이동';
				this.disabled = true;
				e.stopImmediatePropagation();
				e.preventDefault();
			}
			phase++;
		}
	})
	
	// 가입 완료 시 나이 정보를 저장
	$('#signupForm').submit(function() {
		const name = $('#name').val();
		const age = new Date().getFullYear() - parseInt($('#birthYear').val()) + 1;

		localStorage.setItem('FM_NAME', name);
		localStorage.setItem('FM_AGE', age);
	})
}
