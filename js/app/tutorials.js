/**
튜토리얼 진행 스크립트.
튜토리얼을 완료하면 localStorage에 "tutorialEnds" 항목을 추가하여 다음 접속부터 표시되지 않도록 한다.
@author LGM
 */
(() => {
	$(document.body).append('<div class="modal fade" id="workbookTutorial" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">'
		+ '<div class="modal-dialog modal-fullscreen m-0">'
		+ '<div class="modal-content fw-bold border-0">'
		+ '<div class="modal-body text-center bg-dark p-0">'
		+ '<button id="closeWorkbookTutorial" type="button" class="position-absolute end-0 p-3 fs-2 btn-close btn-close-white" aria-label="Close"></button>'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.820" data-dimm-y="0.105" data-dimm-w="0.172" data-dimm-h="0.094" src="https://static.findsvoc.com/images/app/tutorial/1.png">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.020" data-dimm-y="0.365" data-dimm-w="0.960" data-dimm-h="0.125" src="https://static.findsvoc.com/images/app/tutorial/2.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.266" data-dimm-y="0.304" data-dimm-w="0.467" data-dimm-h="0.400" src="https://static.findsvoc.com/images/app/tutorial/3.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.010" data-dimm-y="0.770" data-dimm-w="0.980" data-dimm-h="0.150" src="https://static.findsvoc.com/images/app/tutorial/4.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.010" data-dimm-y="0.545" data-dimm-w="0.980" data-dimm-h="0.175" src="https://static.findsvoc.com/images/app/tutorial/5.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.005" data-dimm-y="0.910" data-dimm-w="0.980" data-dimm-h="0.090" src="https://static.findsvoc.com/images/app/tutorial/6.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.840" data-dimm-y="0.915" data-dimm-w="0.160" data-dimm-h="0.090" src="https://static.findsvoc.com/images/app/tutorial/7.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.010" data-dimm-y="0.175" data-dimm-w="0.980" data-dimm-h="0.580" src="https://static.findsvoc.com/images/app/tutorial/8.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.020" data-dimm-y="0.300" data-dimm-w="0.960" data-dimm-h="0.110" src="https://static.findsvoc.com/images/app/tutorial/9.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.005" data-dimm-y="0.625" data-dimm-w="0.980" data-dimm-h="0.410" data-finger-x="25%" data-finger-y="77%" src="https://static.findsvoc.com/images/app/tutorial/10.png" style="display:none;">'
		+ '<img class="tutorial-step w-100 h-100" data-img-loaded="true" data-dimm-x="0.500" data-dimm-y="0.575" data-dimm-w="0.0" data-dimm-h="0.0" style="display:none;"/>'
		+ '<div class="button-dimm rounded pe-none" role="button" style="position:absolute;left:0;top:0;width:100%;height:100%;box-shadow:0 0 0 200vh #0003;"></div>'
		+ '</div>'
		+ '</div></div></div>');

	// 집중 영역 클릭 시 다음 화면으로
	let imgLoadTimer
	$('.button-dimm').click(function() {
		clearInterval(imgLoadTimer);
		const $curr = $('.tutorial-step:visible'),
		$next = $curr.next('.tutorial-step');
		$curr.add($next).toggle();
		$(this).addClass('pe-none').empty();
		
		// 마지막 화면이면 튜토리얼 완료 기록을 남기고 모달을 종료한다.
		if($next.length == 0) {
			localStorage.setItem('tutorialEnds', true);
			$('#workbookTutorial').modal('hide');
			return;
		}
		// 100ms마다 이미지가 로드됐는지 체크 후 다음 화면으로
		checkImgLoadedAndGo($next);
	});
	
	// 이미지가 로드완료됨을 표시
	$('img.tutorial-step[src]').on('load', function() {
		this.dataset.imgLoaded = true;
	})
	// 모달 표시가 완료되면 튜토리얼 진행 시작
	$('#workbookTutorial')
	.on('shown.bs.modal', () => {
		clearInterval(imgLoadTimer);
		// 100ms마다 이미지가 로드됐는지 체크 후 다음 화면으로
		const $first = $('.tutorial-step:eq(0)');
		checkImgLoadedAndGo($first);
	}).on('hidden.bs.modal', () => $('#workbookTutorial').modal('dispose').remove());
	$('#workbookTutorial').modal('show');
	
	// 튜토리얼 임의 종료
	$('#closeWorkbookTutorial').on('click', function() {
		if(!confirm('튜토리얼을 종료하시겠습니까?\n튜토리얼은 "워크북"페이지의 "워크북 작성방법"에서 다시 보실 수 있습니다')) return;
		localStorage.setItem('tutorialEnds', true);
		$('#workbookTutorial').modal('hide');
		return;		
	});
	$('.button-dimm').on('hidden.bs.tooltip', function() {
		$(this).tooltip('dispose');
	});
	
	//--------------------------------------------------------------------------
	// 각 화면별 툴팁 메세지
	const tooltips = ['워크북을 등록해 봅시다. 메뉴를 눌러주세요.',
					'"나의 워크북 만들기" 메뉴로 들어갑니다.',
					'워크북의 커버 이미지를 등록합니다.',
					'목록에 표시될 워크북 타이틀을 입력합니다.',
					'다른 회원들에게 워크북의 내용, 구성 등을 설명하는 내용을 입력합니다.',
					'"다음"을 누르면 워크북의 기타 정보를 입력 후 등록이 완료됩니다. 이제 워크북의 내용을 채워볼까요?',
					'+ 버튼을 눌러 내 워크북에 지문을 추가하러 가봅시다.',
					'분석하고자 하는 지문을 입력합니다. 잘못된 문장을 입력하면 분석이 제대로 되지 않을 수 있습니다.',
					'등록을 완료한 내 워크북을 찾아 봅시다. "나의 서재" 메뉴로 들어갑니다.',
					'"작성 중인 워크북"에 내 워크북이 생겼습니다. 목록이 접혀있다면 "작성 중인 워크북"을 누르면 다시 펼쳐집니다.',
					'튜토리얼이 종료되었습니다. 나만의 워크북을 만들어 문장들을 체계적으로 관리해보세요.'];
					
	// 100ms마다 이미지가 로드됐는지 체크 후 다음 화면으로
	function checkImgLoadedAndGo($targetImg) {
		imgLoadTimer = setInterval(() => {
			if($targetImg[0].dataset.imgLoaded) {
				clearInterval(imgLoadTimer);
				moveDimm($targetImg);
			}
		}, 100);		
	}
	
	function moveDimm($targetImg) {
		const $dimm = $('.button-dimm');
		const oldTooltip = bootstrap.Tooltip.getInstance($dimm[0]);
		oldTooltip?.hide();
		$dimm.offset($targetImg.offset())
			.outerWidth($targetImg.outerWidth())
			.outerHeight($targetImg.outerHeight());
		setTimeout(()=> {
			const imgElem = $targetImg.get(0);
			const btnPos = imgElem.dataset;
			$dimm.animate(
					{
						left: imgElem.offsetLeft + imgElem.offsetWidth * Number(btnPos.dimmX), 
						top: imgElem.offsetTop + imgElem.offsetHeight * Number(btnPos.dimmY), 
						width: imgElem.offsetWidth * Number(btnPos.dimmW), 
						height: imgElem.offsetHeight * Number(btnPos.dimmH)
					}, () => {
					const newTooltip = new bootstrap.Tooltip($dimm[0], {
						placement: imgElem.src.length>0?'auto':'top', trigger: 'manual', html: true, customClass: 'text-lg', 
						title: tooltips[$targetImg.index('.tutorial-step')]
					});
					
					newTooltip.show();
					const fingerX = btnPos.fingerX||'50%', fingerY = btnPos.fingerY||'50%';
		
					$dimm.removeClass('pe-none')
						.append('<span class="material-icons position-absolute text-fc-red" style="'
						+ 'left:' + fingerX + ';top:' + fingerY + ';filter: drop-shadow(2px 2px 4px white);">touch_app</span>')
					if($targetImg.index('.tutorial-step') == 10) {
						$dimm.css('filter','invert(1)'); 
						$targetImg.css('cursor','pointer').click(()=>$dimm.trigger('click'));
					}
				});
		}, 100);
	}
})();
