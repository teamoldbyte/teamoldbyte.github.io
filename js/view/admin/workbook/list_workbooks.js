/** /admin/workbook/list_workbooks.html
@author LGM
 */
function pageinit() {

	// 선택한 타이틀을 제외한 나머지의 sortMark를 보이지 않도록 한다.
	$('#workbookListDiv .sortMark').hide();
	$('.thlink[data-value]').each(function(){
		if(!this.nextElementSibling?.match('.sortMark')) return;
		const sortName = this.dataset.value;
		const sortMark = this.nextElementSibling;
		// 현재 선택한 sortName이 이전과 같다면
		if(sortName == $('#searchFormHidden_list #sortName').val()){
			// 현재 설정된 정렬방향을 가져온다.
			const $direction = $('#searchFormHidden_list #asc');
			
			// 정렬방향을 표시
			if($direction.val() == 'false'){
				sortMark.innerHTML='▲';
			}else{
				sortMark.innerHTML='▼';
			}
			$(sortMark).show();
		}
	})
	/**
	 * 목록 헤더 컬럼 정렬 기능 처리
	 */
	.click(function() {
		const sortName = this.dataset.value;
		const $hiddenSortName = $('#searchFormHidden_list #sortName');
		const $direction = $('#searchFormHidden_list #asc');
		if(sortName == $hiddenSortName.val()) {
			// 정렬방향을 반대로 변경한다.
			$direction.val($direction.val() == 'true' ? 'false' : 'true');
		}else {
			$hiddenSortName.val(this.dataset.value);
		}
		$('#pageForm').submit();
	});
}
