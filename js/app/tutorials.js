/**
튜토리얼 진행 스크립트.
튜토리얼을 완료하면 localStorage에 "tutorialEnds" 항목을 추가하여 다음 접속부터 표시되지 않도록 한다.
@author LGM
 */
(() => {
	$(document.body).append('<div class="modal fade" id="workbookTutorial" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">'
		+ '<div class="modal-dialog modal-fullscreen">'
		+ '<div class="modal-content fw-bold border-0">'
		+ '<div class="modal-body text-center bg-dark p-0">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.838" data-dimm-y="0.040" data-dimm-w="0.142" data-dimm-h="0.052" src="https://static.findsvoc.com/images/app/tutorial/1.png">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.042" data-dimm-y="0.313" data-dimm-w="0.917" data-dimm-h="0.070" src="https://static.findsvoc.com/images/app/tutorial/2.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.266" data-dimm-y="0.259" data-dimm-w="0.467" data-dimm-h="0.340" src="https://static.findsvoc.com/images/app/tutorial/3.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.016" data-dimm-y="0.720" data-dimm-w="0.974" data-dimm-h="0.099" src="https://static.findsvoc.com/images/app/tutorial/4.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.011" data-dimm-y="0.498" data-dimm-w="0.974" data-dimm-h="0.119" src="https://static.findsvoc.com/images/app/tutorial/5.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.005" data-dimm-y="0.859" data-dimm-w="0.990" data-dimm-h="0.067" src="https://static.findsvoc.com/images/app/tutorial/6.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.862" data-dimm-y="0.858" data-dimm-w="0.127" data-dimm-h="0.065" src="https://static.findsvoc.com/images/app/tutorial/7.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.012" data-dimm-y="0.120" data-dimm-w="0.979" data-dimm-h="0.513" src="https://static.findsvoc.com/images/app/tutorial/8.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.030" data-dimm-y="0.247" data-dimm-w="0.923" data-dimm-h="0.059" src="https://static.findsvoc.com/images/app/tutorial/9.png" style="display:none;">'
		+ '<img class="tutorial-step mh-100 mw-100" data-dimm-x="0.012" data-dimm-y="0.571" data-dimm-w="0.953" data-dimm-h="0.336" src="https://static.findsvoc.com/images/app/tutorial/10.png" style="display:none;">'
		+ '<div class="button-dimm" role="button" style="position:absolute;left:0;top:0;width:100%;height:100%;box-shadow:0 0 0 200vh #0003;"></div>'
		+ '</div>'
		+ '</div></div></div>');

	$('.button-dimm').click(function() {
		const $curr = $('.tutorial-step:visible'),
			$next = $curr.next('.tutorial-step');
		$curr.add($next).toggle();
		
		if($next.length == 0) {
			localStorage.setItem('tutorialEnds', true);
			$('#workbookTutorial').modal('hide');
			return;
		}
		moveDimm($next);
	});
	$('#workbookTutorial').on('shown.bs.modal', () => {
		const $first = $('.tutorial-step:eq(0)');
		moveDimm($first);
	}).on('hidden.bs.modal', () => $('#workbookTutorial').modal('dispose').remove()
	).modal('show');
	
	//--------------------------------------------------------------------------
	function moveDimm($targetImg) {
		$('.button-dimm').offset($targetImg.offset())
						.outerWidth($targetImg.outerWidth())
						.outerHeight($targetImg.outerHeight())
						.addClass('pe-none').empty();
		setTimeout(()=> {
			const btnPos = $targetImg.get(0).dataset;
			$('.button-dimm').animate({
				left: $targetImg.offset().left + $targetImg.outerWidth() * Number(btnPos.dimmX), 
				top: $targetImg.offset().top + $targetImg.outerHeight() * Number(btnPos.dimmY), 
				width: $targetImg.outerWidth() * Number(btnPos.dimmW), 
				height: $targetImg.outerHeight() * Number(btnPos.dimmH)
			}, () => $('.button-dimm').removeClass('pe-none')
					.append('<i class="far fa-2x fa-hand-point-up position-absolute start-50 top-50" style="filter: drop-shadow(2px 2px 4px white);"></i>')
			);
		},0);
		
	}
})();
