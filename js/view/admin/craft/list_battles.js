/** /admin/craft/list_battles.html
@author LGM
 */
function pageinit() {

	// 선택한 타이틀을 제외한 나머지의 sortMark를 보이지 않도록 한다.
	$('#battleListDiv .sortMark').hide();
  const sortName = $('#searchFormHidden_list #sortName').val();
	const $currSortMark = $(`.thlink[data-value="${sortName}"]+.sortMark`);
	if($currSortMark.length > 0) {
		$currSortMark.html($('#searchFormHidden_list #asc').val() == 'false' ? '▼' : '▲').show();
	}
	/**
	 * 목록 헤더 컬럼 정렬 기능 처리
	 */
	$('.thlink[data-value]').click(function() {
		const sortName = this.dataset.value;
		const $hiddenSortName = $('#searchFormHidden_list #sortName');
		const $direction = $('#searchFormHidden_list #asc');
		if(sortName == $hiddenSortName.val()) {
			// 정렬방향을 반대로 변경한다.
			$direction.val($direction.val() != 'true');
		}else {
			$hiddenSortName.val(this.dataset.value);
		}
		$('#pageForm').submit();
	});
	
	
	// 페이지 번호를 누르면 해당 페이지로 이동
	$('.page-link').click(function() {
		$('#searchFormHidden_list #page').val(parseInt(this.dataset.pagenum));
		$('#pageForm').submit();
	})
}
