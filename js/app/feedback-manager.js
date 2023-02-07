/** 관리자용 워크북 피드백 작성 모듈
 * @author LGM
 */
(function(document){
	
	let wfBtnFolded, wfBtn, wfModal, workbookId, ownerId;
	function initWorkbookFeedback(workbookTitle, workbookIdParam, ownerIdParam) {
		workbookId = workbookIdParam;
		ownerId = ownerIdParam;
		
		wfModal = createElement({
			el: 'div', id: 'workBookFeedbackModal', className: 'modal fade', children: [
				{ el: 'div', className: 'modal-dialog modal-lg modal-dialog-centered', children: [
					{ el: 'div', className: 'modal-content', children: [
						{ el: 'div', className: 'modal-header bg-fc-yellow', children: [
							{ el: 'h5', className: 'modal-title fw-bold', textContent: '피드백 전달' },
							{ el: 'button', className: 'btn-close', 'data-bs-dismiss': 'modal' }
						]},
						{ el: 'div', className: 'modal-body', children: [
							{ el: 'div', className: 'row', children: [
								{ el: 'label', className: 'col-1 col-form-label', textContent: '타입' },
								{ el: 'div', className: 'col-11', children: [
									{ el: 'div', className: 'form-check form-check-inline', children: [
										{ el: 'input', className: 'form-check-input', type: 'radio', id: 'wft1', name: 'feedbackType', value: 'add', checked: true, oninput: function() {
											$('.feedback-wid').show();
										}},
										{ el: 'label', className: 'form-check-label', htmlFor: 'wft1', textContent: '이 워크북 작성자에게 전달' }
									]},
									{ el: 'div', className: 'form-check form-check-inline', children: [
										{ el: 'input', className: 'form-check-input', type: 'radio', id: 'wft2', name: 'feedbackType', value: 'add-all', oninput: function(){
											$('.feedback-wid').hide();
										}},
										{ el: 'label', className: 'form-check-label', htmlFor: 'wft2', textContent: '전체 회원들에게 전달' }
									]}
								]}
							]},
							{ el: 'div', className: 'feedback-wid row', children: [
								{ el: 'label', className: 'col-1 col-form-label', textContent: '워크북' },
								{ el: 'div', className: 'col-11', children: [
									{ el: 'input', type: 'text', className: 'form-control-plaintext', value: workbookTitle, readOnly: true}
								]}
							]},
							{ el: 'div', className: 'row', children: [
								{ el: 'label', className: 'col-1 col-form-label', textContent: '본문' },
								{ el: 'div', className: 'col-11', children: [
									{ el: 'textarea', className: 'workbook-feedback-content content form-control', rows: '15',}
								]}
							]}
						]},
						{ el: 'div', className: 'modal-footer', children: [
							{ el: 'button', type: 'button', className: 'btn btn-fico mx-auto', textContent: '등록', onclick: function(){
								const content = $('.workbook-feedback-content').val().trim();
								const feedbackType = $('input[name=feedbackType]:checked').val();
								
								if(content.length) {
									const command = { content };
									if(feedbackType == 'add') {
										Object.assign(command, { workbookId, ownerId });
									}
									$.ajax({
										url: `/adminxyz/workbook/feedback/${feedbackType}`,
										type: 'POST',
										data: command,
										success: function() {
											alertModal('피드백이 등록되었습니다.');
											$('.workbook-feedback-content').val('');
											$(wfModal).modal('hide');
										},
										error: function() {
											alertModal('피드백 등록 중 에러가 발생했습니다.');
										}
									})
								}else {
									return false;
								}
							}}
						]}
					]}
				]}
			]});
		wfBtn = createElement({
		el: 'div', style: {
				position: 'fixed', right: '0', bottom: '25%', width: '50px', zIndex: 2000, height: '70px', border: 'none', background: 'none'
			}, children: [
			{ el: 'button', type: 'button', className: 'bg-transparent border-0', children: [
					{ el: 'i', className: 'fas fa-user-astronaut fa-3x', style: 'color:darkred' }
				], 'data-bs-toggle': 'modal', 'data-bs-target': '#workBookFeedbackModal'
			},
			{ el: 'button', type: 'button', className: 'fas fa-angle-double-right w-100 btn', title: '숨기기', onclick: function() {
				$(this).parent().animate({ right: '-50px'}, () => { $(wfBtnFolded).animate({ right: 0 })})
			}}
		]});
		wfBtnFolded = createElement({
		el: 'button', type: 'button', style: {
				position: 'fixed', right: '-12px', bottom: '25%', padding:'0', width: '5px', zIndex: 2000, height: '70px', border: 'none', background: 'darkred'
			}, onmouseover: function() {
				$(this).animate({ right: '-12px'}, () => { $(wfBtn).animate({ right: 0 })})
			}
		});
		document.body.appendChild(wfModal);
		document.body.appendChild(wfBtn);
		document.body.appendChild(wfBtnFolded);
	}
	
	window = Object.assign(window, { initWorkbookFeedback });
})(document);
