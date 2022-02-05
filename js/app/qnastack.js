/**
@author LGM
 */

/**
@param url 요청 주소
@param jsonCommand 전달 데이터 커맨드 {a:b, c:d}
@param callback 성공시 실행 함수
@param failMsg 실패 시 경고로 표시할 메세지
 */
function postJSON(url, jsonCommand, callback, failMsg) {
	$.ajax({
		url: url, type: 'POST', data: JSON.stringify(jsonCommand),
		contentType: 'application/json', success: callback,
		error: () => alert(failMsg)
	});
}
/*------------------------------------------------------------------------------
						view_passage, list_question
------------------------------------------------------------------------------*/

/* 질문 등록 */
function addQuestion(from, questionCommand, callback) {
	postJSON('/qnastack/question/' + from + '/add', questionCommand, 
			callback, '등록 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.');
}
/* 질문 수정 */
function editQuestion(from, questionCommand, callback) {
	postJSON('/qnastack/question/' + from + '/edit', questionCommand, 
			callback, '수정 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.');
}
/* 질문 삭제 */
function delQuestion(from, questionId, callback) {
	postJSON('/qnastack/question/' + from + '/del', questionId,
			callback, '삭제 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.');
}
/* 답변 등록 */
function addAnswer(answerCommand, callback) {
	postJSON('/qnastack/answer/add', answerCommand,
			callback, '등록 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.');
}
/* 답변 수정 */
function editAnswer(answerCommand, callback) {
	postJSON('/qnastack/answer/edit', answerCommand,
			callback, '수정 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.');
}
/* 답변 삭제 */
function delAnswer(answerId, callback) {
	postJSON('/qnastack/answer/del', answerId,
			callback, '삭제 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.');
}
/* 답변 평가 */
function evaluateAnswer(evaluateCommand, callback) {
	postJSON('/qnastack/answer/evaluate', evaluateCommand,
			callback, '평가 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.');
}