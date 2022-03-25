/**
 * 워크북의 조회,추가,수정,삭제와 관한 함수
 * @author LGM
 */

/**
@param url 요청 주소
@param jsonCommand 전달 데이터 커맨드 {a:b, c:d}
@param callback 성공시 실행 함수
@param errCallback 실패 시 실행 함수
 */
function postJSON(url, jsonCommand, callback, errCallback) {
	$.ajax({
		url: url, type: 'POST', data: JSON.stringify(jsonCommand),
		contentType: 'application/json', success: callback,
		error: errCallback
	});
}
/**
@param url 요청 주소
@param command 전달 데이터 커맨드(FormData)
@param callback 성공시 실행 함수
@param errCallback 실패 시 실행 함수
 */
function postForm(url, command, callback, errCallback) {
	$.ajax({
		url: url, type: 'POST', data: command,
		processData: false, contentType: false, success: callback,
		error: errCallback
	});
}
/*------------------------------------------------------------------------------
							index.html
------------------------------------------------------------------------------*/
function subscribeWorkbook(workbookId, callback) {
	$.post('/workbook/subscription/' + workbookId, callback)
	.fail(() => alert('워크북 구독에 실패했습니다. 화면 새로고침 후 다시 시도해 주세요.'));
}

/*------------------------------------------------------------------------------
						add_workbook.html
------------------------------------------------------------------------------*/
function addWorkbook(command) {
	postForm('/workbook/mybook/add', command, workbookId => {
		alert('등록이 완료되었습니다.');
		location.assign('/workbook/mybook/edit/' + ntoa(workbookId));
	}, () => alert('등록에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
}

/*------------------------------------------------------------------------------
						edit_workbook.html
------------------------------------------------------------------------------*/
/** 워크북의 텍스트 타입 정보 수정
	title, price, workBookType, description
 */
function editWorkbookPlainInfo(url, json, callback) {
	postJSON(url, json, callback, () => alert('수정에 실패했습니다.'));
}
/** 워크북의 멀티파트 타입 정보 수정
 */
function editWorkbookMultiInfo(url, form, callback) {
	postForm(url, form, callback, () => alert('수정에 실패했습니다.'));
}
/** 지문 삭제
 */
function deletePassage(command, callback) {
	postJSON('/workbook/mybook/del/passage', command, callback, () => alert('지문삭제에 실패했습니다.'));
}

/** 지문의 샘플정보 변경
 */
function editPassageSample(command, callback) {
	postJSON('/workbook/mybook/edit/passage/sample', command, callback, () => alert('샘플정보 변경에 실패했습니다.'));
}
/*------------------------------------------------------------------------------
							edit_passage.html
------------------------------------------------------------------------------*/
/** 지문 문장 수정(영어 원문)
 */
function editPassageSentece(editPassageCommand, callback, errCallback) {
	postJSON('/workbook/mybook/edit/passage', editPassageCommand, callback, errCallback);
}
/** 지문에서 문장 삭제
 */
function delPassageSentence(command, callback) {
	$.post('/workbook/mybook/del/sentence?passageId='+command.passageId+'&sentenceId='+command.sentenceId, callback)
	.fail(() => alert('문장 삭제에 실패했습니다.'));
	//postJSON('/workbook/mybook/del/sentence', command, callback, () => alert('문장 삭제에 실패했습니다.'));
}
/*------------------------------------------------------------------------------
							view_passage.html
------------------------------------------------------------------------------*/
/**
 * 문장 해석 추가/수정
 */
function editSentenceTrans(korCommand, callback) {
	postJSON('/workbook/sentence/kor/edit', korCommand, callback, () => alert('해석 등록/수정이 실패했습니다.'));
}
/**
 * 문장 해석 삭제
 */
function delSentenceTrans(korTid, callback) {
	postJSON('/workbook/sentence/kor/del', korTid, callback, () => alert('삭제 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.'));
}

/**
 * 지문 노트 추가
 */
function addPassageNote(noteCommand, callback) {
	postJSON('/workbook/passage/note/add', noteCommand, callback, () => alert('노트 등록에 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.'));
}
/**
 * 문장 노트 추가
 */
function addSentenceNote(noteCommand, callback) {
	postJSON('/workbook/sentence/note/add', noteCommand, callback, () => alert('노트 등록에 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.'));
}
/**
 * 지문/문장 노트 수정
 */
function editNote(part, noteCommand, callback) {
	postJSON('/workbook/' + part + '/note/edit', noteCommand, callback, () => alert('수정할 수 없습니다. 페이지 새로고침 후 다시 시도해 주세요.'));
}
/**
 * 지문/문장 노트 삭제
 */
function delNote(part, noteId, callback) {
	postJSON('/workbook/'+ part +'/note/del', noteId, () => { alert('삭제되었습니다.'); callback();}, () => alert('삭제 실패했습니다.'));
}

/* 문장 구문분석 추가 및 편집 */
function editSvoc(svocCommand, callback) {
	postJSON('/workbook/sentence/svoc/edit', svocCommand, callback, () => alert('구문분석 등록에 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.'));
}
/* 문장 구문분석 삭제 */
function delSvoc(svocId, callback) {
	postJSON('/workbook/sentence/svoc/del', svocId, callback, () => alert('삭제 실패했습니다.'));
}
