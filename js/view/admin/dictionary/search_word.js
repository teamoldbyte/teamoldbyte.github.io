/**
 * 
 */
function pageinit() {
	$('#searchWordForm').on('submit', function(e) {
		e.preventDefault();
		const title = $('#keywordDiv input').val().trim();
		if(title.length == 0) return;
		$.getJSON(`/adminxyz/word/search/${title}`, function(word) {
			$('#searchResult').collapse('show').data('wordId',word.wid);
			$('#searchResult .title').text(word.title);
			$('#searchResult .level').text(word.level);
			$('#searchResult .level-input').val(word.level);
			const senseList = word?.senseList;
			$('#searchResult .empty-list').toggle(word == null);
			$('#searchResult .one-word-unit-section').toggle(word != null);
			$('#searchResult .one-word-unit-section .title-section').siblings().remove();
			$('#searchResult .one-word-unit-section')
			.append(createElement(Array.from(senseList, sense => {
				return { 
					el: 'div', className: 'one-part-unit-section row g-3 mb-1', children: [
						{ el: 'div', className: 'col-2 text-end pe-5 lh-lg',  children: [ 
							{ el: 'span', className: 'part', textContent: sense.partType }
						]},
						{ el: 'div', className: 'col-8 text-center',  children: [ 
							{ el: 'input', type: 'text', className: 'meaning form-control', value: sense.meaning, 
								'data-org': sense.meaning, maxLength: 100, oninput: function() {
								$(this).closest('.one-part-unit-section').find('.js-edit-meaning,.js-edit-cancel').show();
							}},
						]},
					{ el: 'div', className: 'col-2 text-center',  children: [ 
						{ el: 'button', type: 'button', className: 'js-edit-meaning btn btn-fico fas fa-check col-6 h-100',
							style: 'display:none;',
							onclick: function() {
								const $input = $(this).closest('.one-part-unit-section').find('input');
								const meaning = $input.val();
								const command = { senseId: sense.sid, meaning};
								$.ajax({
									url: '/adminxyz/dictionary/sense/edit',
									type: 'POST',
									data: command,
									success: (editedMeaning) => {
										alert(`뜻이 수정되었습니다.\n: ${editedMeaning}`);
										$input[0].dataset.org = editedMeaning;
									},
									error: () => alertModal('수정이 실패했습니다.')
								})
						}},
						{ el: 'button', type: 'button', className: 'js-edit-cancel btn btn-outline-fico fas fa-times col-6 h-100',
							style: 'display:none;',
							onclick: function() {
								const $input = $(this).closest('.one-part-unit-section').find('input');
								$input.val($input.data('org'));
								$(this).hide();
								$(this).siblings('.js-edit-meaning').hide();
						}}
					]}
				]}
			}).concat([
				{ el: 'label', className: 'add-new-sense-label mt-5 mb-3', textContent: '뜻 추가'},
				{ el: 'div', className: 'add-new-sense-section row g-3', children: [
					{ el: 'div', className: 'col-2', children: [
						{ el: 'select', className: 'form-select', children: [
							{ el: 'option', value: 'n.', textContent: '명사'},
							{ el: 'option', value: 'ad.', textContent: '부사'},
							{ el: 'option', value: 'v.', textContent: '동사'},
							{ el: 'option', value: 'vt.', textContent: '타동사'},
							{ el: 'option', value: 'vi.', textContent: '자동사'},
							{ el: 'option', value: 'prep.', textContent: '전치사'},
							{ el: 'option', value: 'conj.', textContent: '접속사'},
							{ el: 'option', value: 'a.', textContent: '형용사'},
							{ el: 'option', value: 'abbr.', textContent: '약어'},
							{ el: 'option', value: 'pron.', textContent: '대명사'},
							{ el: 'option', value: 'aux.', textContent: '조동사'},
							{ el: 'option', value: 'num.', textContent: '수사'},
							{ el: 'option', value: 'ordi.', textContent: '서수'},
							{ el: 'option', value: 'int.', textContent: '감탄사'},
							{ el: 'option', value: 'det.', textContent: '한정사'}
						]},
					]},
					{ el: 'div', className: 'col-8', children: [
						{ el: 'input', type: 'text', className: 'form-text form-control mt-0', placeholder: '뜻을 입력하세요.', maxLength: 100,
						onclick: function() {
							$(this).closest('.add-new-sense-section').find('.js-add-meaning,.js-add-cancel').show();
						}},
					]},
					{ el: 'div', className: 'col-2', children: [
						{ el: 'button', type: 'button', className: 'js-add-meaning btn btn-fico fas fa-check col-6 h-100',
						style: 'display:none;', onclick: function() {
							const $partSelect = $(this).closest('.add-new-sense-section').find('select');
							const $input = $(this).closest('.add-new-sense-section').find('input');
							if($input.val().trim() == 0) return;
							const command = {wordId: word.wid, partType: $partSelect.val(), meaning: $input.val().trim()}
							$.ajax({
								url: '/adminxyz/dictionary/sense/add',
								type: 'POST',
								data: command,
								success: (addedSense) => {
									alert(`뜻이 추가되었습니다.\n: ${addedSense.partType} ${addedSense.meaning}`);
									$('.add-new-sense-label').before(createElement(
										{ el: 'div', className: 'one-part-unit-section row g-3 mb-1', children: [
											{ el: 'div', className: 'col-2 text-end pe-5 lh-lg',  children: [ 
												{ el: 'span', className: 'part', textContent: addedSense.partType }
											]},
											{ el: 'div', className: 'col-8 text-center',  children: [ 
												{ el: 'input', type: 'text', className: 'meaning form-control', value: addedSense.meaning, 
													'data-org': addedSense.meaning, maxLength: 100, oninput: function() {
													$(this).closest('.one-part-unit-section').find('.js-edit-meaning,.js-edit-cancel').show();
												}},
											]},
											{ el: 'div', className: 'col-2 text-center',  children: [ 
												{ el: 'button', type: 'button', className: 'js-edit-meaning btn btn-fico fas fa-check col-6 h-100',
													style: 'display:none;',
													onclick: function() {
														const $senseInput = $(this).closest('.one-part-unit-section').find('input');
														const meaning = $senseInput.val().trim();
														const editCommand = { senseId: addedSense.sid, meaning: meaning};
														$.ajax({
															url: '/adminxyz/dictionary/sense/edit',
															type: 'POST',
															data: editCommand,
															success: (editedMeaning) => {
																alert(`뜻이 수정되었습니다.\n: ${editedMeaning}`);
																$senseInput[0].dataset.org = editedMeaning;
															},
															error: () => alertModal('수정이 실패했습니다.')
														})
												}},
												{ el: 'button', type: 'button', className: 'js-edit-cancel btn btn-outline-fico fas fa-times col-6 h-100',
													style: 'display:none;', onclick: function() {
														const $senseInput = $(this).closest('.one-part-unit-section').find('input');
														$senseInput.val($senseInput.data('org'));
														$(this).hide();
														$(this).siblings('.js-edit-meaning').hide();
												}}
											]}
										]}
									))
								},
								error: () => alertModal('수정이 실패했습니다.')
							})							
						}},
						{ el: 'button', type: 'button', className: 'js-add-cancel btn btn-outline-fico fas fa-times col-6 h-100',
						style: 'display: none;',
						onclick: function() {
							$(this).hide();
							$(this).closest('.add-new-sense-section').find('.js-add-meaning').hide();
							$(this).closest('.add-new-sense-section').find('input').val('');
						}}
					]},
				]}
			])))
		}).fail((xhr, status) => {
			if(status == 'parsererror') {
				$('#searchResult').collapse('show');
				$('#searchResult .title').text(title);
				$('#searchTitle, #saveTitle').val(title);
				$('#searchResult .empty-list').show();
				$('#searchResult .one-word-unit-section').hide();
			}else alertModal('에러가 발생했습니다.\n'+xhr.responseJSON.exception);
		})
	});
	
	$('.level').on('click', function() {
		$('#searchResult').find('.level, .level-input, .js-level-edit, .js-level-cancel').toggle();
		$('#searchResult .level-input').val($(this).text()).focus();
	})
	
	$('.js-level-edit').on('click', function() {
		const $levelText = $('#searchResult .level');
		const $levelInput = $('#searchResult .level-input');
		
		const inputValue = parseInt($levelInput.val().trim());
		if(Number.isNaN(inputValue) || inputValue > 10000 || inputValue < 0) {
			alertModal('0~10,000 숫자를 입력해 주세요.')
			$levelInput.focus();
			return;
		}
		
		const wordId = parseInt($('#searchResult').data('wordId'));
	
		$.ajax({
			type: 'POST',
			url: '/adminxyz/dictionary/level/edit',
			data: { wordId: wordId, level: inputValue},
			success: function() {
				alertModal('단어 난이도가 수정되었습니다.');
				$levelText.text(inputValue);
				$('#searchResult').find('.level, .level-input, .js-level-edit, .js-level-cancel').toggle();
			},
			error: function() {
				alertModal('에러가 발생했습니다.\n'+xhr.responseJSON.exception);
			}
		})
	});
	
	$('.js-level-cancel').on('click', function() {
		$('#searchResult').find('.level, .level-input, .js-level-edit, .js-level-cancel').toggle();
	});
	
	$('#register').on('click', function() {
		const searchTitle = $('#searchTitle').val().trim();
		const saveTitle = $('#saveTitle').val().trim();
		$.getJSON(`/adminxyz/unword/add/${searchTitle}/${saveTitle}`, function() {
			alertModal(`단어 ${title}(이)가 등록되었습니다.`);
			$('#alertModal').on('hide.bs.modal', () => location.reload());
		}).fail((xhr, status) => {
			if(status == 'parsererror') {
				alertModal(`단어 ${title}(이)가 등록되었습니다.`);
				$('#alertModal').on('hide.bs.modal', () => location.reload());
			}else alertModal('에러가 발생했습니다.\n'+xhr.responseJSON.exception);
		});
	})
}
