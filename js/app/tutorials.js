		$(document.body).append('<div class="modal fade" id="workbookTutorial" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">\
			<div class="modal-dialog modal-fullscreen">\
			<div class="modal-content fw-bold border-0">\
			<div class="modal-header bg-fc-purple">\
			<h5 class="modal-title text-white">워크북 등록 튜토리얼</h5>\
			</div>\
			<div class="modal-body text-center bg-dark">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/1.png">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/2.png" style="display:none;">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/3.png" style="display:none;">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/4.png" style="display:none;">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/5.png" style="display:none;">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/6.png" style="display:none;">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/7.png" style="display:none;">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/8.png" style="display:none;">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/9.png" style="display:none;">\
			<img class="tutorial-step mh-100 mw-100" src="/images/app/tutorial/10.png" style="display:none;">\
			</div>\
			</div></div></div>');
		$('.tutorial-step').click(function() {
			$(this).add($(this).next('.tutorial-step')).fadeToggle();
		});
		$('#workbookTutorial').modal('show');
