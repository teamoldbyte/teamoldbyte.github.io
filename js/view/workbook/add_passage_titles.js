/** /workbook/add_passage_titles.html
 * @author LGM
 */
$(function() {
	// Cache frequently used DOM elements
	const $inputComplete = $('#inputComplete');
	const $newPassageText = $('#newPassageText');
	const $dividedResult = $('#dividedResult');
	const $beforeInput = $('#beforeInput');
	const $afterInput = $('#afterInput');
	const $addBtn = $('#addBtn');
	const $hiddenDivs = $('#hiddenDivs');
	const $passageTitlesForm = $('#passageTitlesForm');

	// [현재 입력된 목차를 한 줄씩 나누기]
	$inputComplete.on('click', async function(e, paramKeyword) {
		const titles = $newPassageText.val().split(/[\n\v]+/g).map(title => title.trim()).filter(title => title.length > 0);
		$dividedResult.empty();
		for (let i = 0, len = titles.length; i < len; i++) {
			const $title = $hiddenDivs.find('.divided-title').clone();
			$title.appendTo($dividedResult);
			$title.fadeIn().find(':text').val(titles[i]).trigger('input');
		}
		$beforeInput.addClass('opacity-50 pe-none');
		$('.before-msg').hide();
		$afterInput.removeClass('d-none opacity-50 pe-none');
	});

	// [현재의 목차를 취소하고 다시 입력]
	$('#resetBtn').on('click', function() {
		$beforeInput.removeClass('opacity-50 pe-none');
		$('.before-msg').show();
		$afterInput.addClass('d-none opacity-50 pe-none');
	});

	// [타이틀 입력]
	$(document).on('input', '.divided-title :text', function() {
		const text = this.value.trim();
		$(this).toggleClass('is-invalid', text.length === 0 || text.length > 100);
		$addBtn.prop('disabled', $passageTitlesForm.find('.is-invalid').length > 0);
	});

	// [타이틀 삭제]
	$(document).on('click', '.js-delete-title-btn', function() {
		confirmModal('삭제하시겠습니까?', () => {
			const $title = $(this).closest('.divided-title');
			$title.fadeOut(function() {
				const $lastInput = $title.siblings('.divided-title').last();
				$title.remove();
				$lastInput.find(':text').trigger('input');
			});
		});
	});

	// [타이틀 추가]
	$(document).on('click', '.js-insert-title-btn', async function() {
		const $new = $hiddenDivs.find('.divided-title').clone();
		$(this).closest('.divided-title').after($new);
		$new.fadeIn().find(':text').trigger('input');
		$addBtn.prop('disabled', true);
	});
});
