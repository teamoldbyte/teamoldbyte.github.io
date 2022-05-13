/** 구글 orgchart로 토큰트리를 그리는 모듈
@author LGM
 */
(function($, window){
	/**=============================================================================
	 * 형태소 및 의존성 트리구조를 표시
	 * 
	 * @param tokenList 대상 토큰 리스트
	 * @param container 트리구조 표시 영역이 삽입될 대상
	 * @param setting 차트 표시 옵션 (allowHtml, size, allowCollapse, nodeClass)
	 */
	async function draw(tokenList, container, setting) {
		if (typeof tokenList == 'undefined' || typeof container == 'undefined' || container.length == 0) {
			console.error('Can\'t draw token tree. Either tokenList or container is null.');
			return;
		}
		if (typeof google == 'undefined' || typeof google.visualization == 'undefined') {
			await $.ajax({dataType: 'script', cache: true, url:'https://www.gstatic.com/charts/loader.js'});
		}
		if (!google.visualization || !google.visualization.OrgChart) {
			await google.charts.load('current', { packages: ['orgchart'] });
			google.charts.setOnLoadCallback(async function() {
				await draw(tokenList, container, setting);
			});
		} else {
			var drawSetting = {
				'allowHtml': true, 'size': 'large',
				'allowCollapse': true, 'nodeClass': 'node'
			};
			Object.assign(drawSetting, setting);
			var data = new google.visualization.DataTable();
			data.addColumn('string', 'Index');
			data.addColumn('string', 'Name and Desc');
			data.addColumn('string', 'ToolTip');

			var div = container[0].ownerDocument.createElement('div');
			div.className = 'tokentree-result';
			container.append(div);
			tokenList.forEach(function(token) {
				data.addRow([{
					v: token.tokenIndex.toString(),  // v: 토큰 아이디
					// f: 표시내용. 토큰 라벨 표시
					f: '<span class="node-label">' + token.edgeLabel + '</span>'
						+ '<hr style="padding:0">'
						+ '<div class="node-desc">'
						// 토큰  단어 스펠
						+ '<span class="node-text">' + token.tokenText + '</span><br>'
						// 토큰 단어 품사
						+ '<span class="node-part">(' + token.partOfSpeech + ')</span>'
						+ '<hr style="padding:0">'
						// 토큰 인덱스 번호
						+ '<span class="node-index">' + token.tokenIndex + '</span>'
						// 토큰 범위
						+ '<span class="node-range">(' + token.tokenStart + '~' + token.tokenEnd + ')</span>'
						+ '</div>'
				},
				// 헤드 토큰 아이디
				token.dependencyIndex.toString(), '원형 : ' + token.lemma]);
			});
			// Create the chart.
			var chart = new google.visualization.OrgChart(div);
			// html 태그방식으로 표시하기 위해 allowHtml:true
			chart.draw(data, drawSetting);
		}
	}
	window['tokentree'] = {draw};	
})(jQuery, window);
