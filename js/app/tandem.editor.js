/** svoc 편집기
 * @requires jquery.js, tandem.js, DOM-util.js
 * @version 2.0
 */
(function($, document, tandem) {
	let undoList = [], redoList = []; // 편집 내역
	
	let $svocEditor, $svocEditorHint, $svocEditorBadge, $svocEditorEmblem,
		$nclsComboBox, $nclsComboBox2, $torComboBox, $gerComboBox, $ptcComboBox, $editCommentBox;
	const keyset = {
		49:'[value="s"]',
		50:'[value="rs"]',
		51:'[value="ss"]',
		52:'[value="v"]',
		53:'[value="o"]',
		54:'[value="io"]',
		55:'[value="do"]',
		56:'[value="ro"]',
		57:'[value="po"]',
		48:'[value="c"]',
		189:'[value="oc"]',
		187:'[value="a"]',
		81:'[value="tor"]',
		87:'[value="to"]',
		69:'[value="ger"]',
		82:'[value="go"]',
		84:'[value="ptc"]',
		89:'[value="ptco"]',
		85:'[value="ptcphr"]',
		65:'[value="phr"]',
		83:'[value="advphr"]',
		68:'[value="adjphr"]',
		70:'[value="conj"]',
		71:'[value="ccls"]',
		72:'[value="pcls"]',
		74:'[value="ncls"]',
		75:'[value="acls"]',
		76:'[value="advcls"]',
		186:'[value="pcl"]',
		90:'[value="mod"]',
		88:'[value="erasing"]',
		67:'[value="comment"]',
		ctrlS:'[value="save"]',
		ctrlZ:'[value="undo"]:not([disabled])',
		ctrlY:'[value="redo"]:not([disabled])',
	};
	
	let modifier, currX = 0, currY = 0;
	
	let settings = {};
	const pseudoMarkTypes = {
		rs: 's', io: 'o', do: 'o', ro: 'o'
	}
	const rcomments = {
		s : 'S', rs: '(진)s', v : 'V', o : 'O', io: 'i.o.', do: 'd.o.', po : '(전)o', ro: '(진)o', 
		to: '(부)o', go: '(동)o', ptco: '(분)o', appo: '동격', 
		c : 'C', oc : 'o.c.', m : 'M', a : 'A'};
	const gcomments = {
		a: '부사적 보충어', ss: '의미상 주어', tor : 'to부정사', ger : '동명사', ptc : '분사', 
		to: 'to부정사 목적어', go: '동명사 목적어', ptco: '분사 목적어', appo: '동격 =>',
		ncls:{
			s:'주어절',o:'목적어절',c:'보어절',oc:'목적보어절',m:'관계절',
			po: '전치사 목적어절', to: 'to부정사 목적어절', go: '동명사 목적어절', ptco: '분사 목적어절', appo: '동격 =>',
			interr: '의문사절 접속사', nrp: '명사적 관계사', nclc: ''
		},
		acls:'형용사절',advcls:'부사절',phr:'전치사구',adjphr:'형용사구',advphr:'부사구',ptcphr:'부사구(분사구문)',ccls:'등위절',pcls:'병렬절',pcl:'삽입절'};
	/**
	 * SVOC 편집기 표시. 
		저장함수 function(svocEncText)와 취소함수 function()를 인자로 받음
	 */
	$.fn.svoceditor = async function(forNew, saveCallback, cancelCallback) {
		settings = {forNew, saveCallback, cancelCallback};	
		if(forNew == 'close') {
			if(typeof $svocEditor != 'undefined') {
				$svocEditor.detach();
			}
			if(typeof $svocEditorHint != 'undefined') {
				$svocEditorHint.detach();
			}
			return this;
		}
		// [편집기 미정의된 상태라면 최초 1회 정의]
		if(typeof $svocEditor == 'undefined') {
			await $.get('https://static.findsvoc.com/css/app/tandem.editor.min.css', (cssResult) =>{
				const editorCss = document.createElement('style');
				editorCss.innerHTML = cssResult;
				document.head.append(editorCss);
			});
//			await $.get('/fragment/tandem/editor_template.html', (result) => {
			await $.get('https://static.findsvoc.com/fragment/tandem/editor_template.min.html', (result) => {
				$svocEditor = $(result).find('#js-edit-toolbar');
				$nclsComboBox = $(result).find('.cls-role-menu');
				$nclsComboBox2 = $(result).find('.cls-conj-menu');
				$torComboBox = $(result).find('.tor-role-menu');
				$gerComboBox = $(result).find('.ger-role-menu');
				$ptcComboBox = $(result).find('.ptc-role-menu');
				$editCommentBox = $(result).find('.edit-comment');
				$svocEditor.find('[data-bs-toggle="tooltip"]').click(function(){
					bootstrap?.Tooltip?.getInstance(this)?.hide();
				}).tooltip({trigger:'hover'});
				const rem = parseFloat(getComputedStyle(document.body).fontSize);
				//=============================================================/
				// 						[단축키 설정]
				$(document).on('keydown', function(e){
					if($(e.target).is('input') 
					&& $(e.target).closest('.edit-comment').length > 0
					&& e.keyCode == 27/*ESC*/) {
						$(e.target.form).find('button:eq(1)').trigger('click');
						return;
					}
					if(!$('.edit-svoc')?.is(':focus')) return;
					if((e.ctrlKey || e.metaKey) && e.keyCode >= 65 && e.keyCode <= 90) {
						if(keyset['ctrl' + e.key.toUpperCase()]) {
							e.preventDefault();
							$svocEditor.find(keyset[`ctrl${e.key.toUpperCase()}`]).trigger('click');
						}else {
							return;
						}
					}
					else if(!$(e.target).is('input') && keyset[e.keyCode] != null){
						$svocEditor.find(keyset[e.keyCode]).trigger('click');
					}
				});		
				//=============================================================/
				// 						[편집 저장]
				$svocEditor.on('click', '[value="save"]', function(){
					var div = this.closest('.edit-svoc').querySelector('.semantics-result');
					$(div).closest('.edit-svoc').addClass('pe-none')
							.find('.svoc-editor-badge')
							.html('<i class="fas fa-spinner fa-spin"></i> 저장중')
							.animate({
								width: '100%'
							});
					// 저장 대상이 아닌 요소(괄호, 줄 구분자, 수식선)는 저장하는 동안 제거.
					while(div.querySelector('.brkt,.line-end,canvas.curved_arrow') != null){
						div.querySelector('.brkt,.line-end,canvas.curved_arrow').remove();
					}
					//----------------
					saveAndClose(div);
					//----------------
				})
				//=============================================================/
				// 						[편집 취소]
				.on('click', '[value="close"]', function(){
					if(confirm('수정내역은 저장되지 않습니다.\n편집모드를 종료하시겠습니까?')) {
						const $editSection = $(this).closest('.edit-svoc');
						const $container = $editSection.find('.semantics-result');
						if(undoList.length > 0) {
							const history = undoList.shift();
							$container.html(history[1]);
							$('.erasing-target').toggleClass('erasing-target');
							$('.mod-start,.mod-indicator').remove();
							
							// canvas 요소는 다시 그려야 함.
							tandem.drawConnections($container[0]);
							
							$container.animate({opacity:0.5},100).animate({opacity:1},100);
						}
						//----------------------
						closeEditor($container);
						//----------------------
					}
				})
				//=============================================================/
				// 			[메뉴 클릭에 따른 상태 및 힌트 메세지 변경]
				.on('click', '[data-mode]:not([disabled])', function() {
					if(this.dataset.mode == 'undo') return true;
					let	sel = getSelection(), range;
					$('.svoc-toolbar .active').add(this).toggleClass('active');
					$('.erasing-target, .comment-target').removeClass('erasing-target comment-target');
					$('.mod-start,.mod-indicator').remove();
					// 버튼 활성화
					if($(this).is('.active')){
						var mode = this.dataset.mode;
						$('.edit-svoc').attr('data-mode', mode);
						switch (mode) {
						case 'role':
						case 'wrap':
							if(!sel.isCollapsed){
								$('.edit-svoc').trigger('mouseup', this.value).attr('data-mode', null);
								$(this).removeClass('active');
							}else{
								$svocEditorHint.text('적용 텍스트를 드래그 하세요.');
							}
							break;
						case 'erasing':
							$svocEditorHint.html('지우려는 태그를 클릭 하세요.<br><h6>하위태그 모두 선택 : shift+클릭</h6>');
							sel.removeAllRanges();
							break;
						case 'mod':
							$svocEditorHint.text('수식어 위치를 클릭 하세요.');
							sel.removeAllRanges();
							break;
						case 'comment':
							$svocEditorHint.text('문법 코멘트를 추가할 요소를 선택하세요.');
							sel.removeAllRanges();
							break;
						case 'cleft':
							if(!sel.isCollapsed) {
								$('.edit-svoc').trigger('mouseup', this.value).attr('data-mode', null);
								$(this).removeClass('active');
							}else {
								$svocEditorHint.text('적용 텍스트를 드래그 하세요.(It is[was]부터 that까지 한 번에)\nthat 대신 who,where 등 가능');
							}
							break;
						default:
							break;
						}
						
						// (단축키로 실행됐을 경우) 현재의 마우스 위치에서 '커서 가리키기' 이벤트 발동
						if(sel.isCollapsed) {
					      let containerElement;
						  if (document.caretPositionFromPoint) {
							range = document.caretPositionFromPoint(currX, currY);
						    containerElement = getLeafNode(range.offsetNode);
						  } else if (document.caretRangeFromPoint) {
							range = document.caretRangeFromPoint(currX, currY);
						    containerElement = range.startContainer;
						  } else {
							console.error("[This browser supports neither document.caretRangeFromPoint"
									 + " nor document.caretPositionFromPoint.]");
							return(false);
						  }
						  while(containerElement.nodeType != 1) {
							containerElement = containerElement.parentNode;
						  }
						  $(containerElement).trigger('mouseover');
						}
					}
					// 버튼 비활성화
					else{
						$('.edit-svoc').attr('data-mode', null);
						$svocEditorHint.empty();
					}
				})
				//============================================================//
				//					편집 내역 되돌아가기							  //
				.on('click', '[value="undo"], [value="redo"]', function(e){
					e.preventDefault();
					if(this.value == 'undo'
					|| (this.value == 'redo' && redoList.length > 0)){
						this.classList.add('active');
						var history = (this.value == 'undo') ? undoList.pop() : redoList.pop();
						var $container = $(`.edit-svoc .semantics-result[data-seq="${history[0]}"]`);
						(this.value == 'undo' ? redoList : undoList)
								.push([$container.attr('data-seq'), $container.html()]);
						$container.html(history[1]);
						$('.erasing-target').toggleClass('erasing-target');
						$('.mod-start,.mod-indicator').remove();
						
						// canvas 요소는 다시 그려야 함.
						tandem.drawConnections($container[0]);
						
						$container.animate({opacity:0.5},100).animate({opacity:1},100);
						
						$('.svoc-toolbar [value="undo"]').prop('disabled', undoList.length == 0);
						$('.svoc-toolbar [value="redo"]').prop('disabled', redoList.length == 0);
						setTimeout(() => {
							this.classList.remove('active');
						}, 50);
					}
				});					
				//=============================================================/
				// 						[마킹 요소 삭제 기능]
				let erasingSets = [], erasingTarget = null, shift = false;
				$(document).on('mouseover', '[data-mode="erasing"] .semantics-result *', function(e, shiftPressed){
					e.stopPropagation();
					var target = e.target;
					erasingTarget = target;
					//----------------
					selectClsAndPhr();
					//----------------
					// 대상이 수식선이라면, 쌍이 되는 수식선들과 수식어,피수식어 해제.
					if($(target).is('.curved_arrow')){
						for(let className of target.classList){
							if(className.indexOf('mfd') > -1){
								// 쌍이 되는 수식선 제거.
								$(this).siblings(`.curved_arrow.${className}`).each(function() {
									erasingSets.push(this);
								});
								// 피수식어 태그 해제.
								erasingSets.push($(`.rcm.mfd-${className.substring(3)}`)[0]);
							}
						}
					}
					
					// 양 옆에 괄호가 있다면 포함.(cmnt-align-start라는 클래스명 제외)
					if(target.previousElementSibling != null
					&& $(target.previousElementSibling).is('[class*="-start"]:not([class*="cmnt-align-start"])')
					&& target.nextElementSibling != null
					&& $(target.nextElementSibling).is('[class*="-end"]')){
						erasingSets.push(target.previousElementSibling);
						erasingSets.push(target.nextElementSibling);
					}
					
					// 괄호를 선택한 경우 반대쪽 괄호와 가운데 컨텐츠 포함.
					if(target.className.indexOf('-start') > -1){
						target = target.nextElementSibling;
						
						//----------------
						selectClsAndPhr();
						//----------------
						if(target != null && target.nextElementSibling != null){
							target = target.nextElementSibling;
							erasingSets.push(target);
						}
					}else if(target.className.indexOf('-end') > -1){
						target = target.previousElementSibling;
						
						//----------------
						selectClsAndPhr();
						//----------------
						if(target != null && target.previousElementSibling != null){
							target = target.previousElementSibling;
							erasingSets.push(target);
						}
					}
					
					// 지정된 제거 대상에게 표식 적용
					erasingSets.forEach(function(elt) {
						elt.classList.add('erasing-target');
					})
					
					// 구,절 표시태그와 성분 표시태그가 겹치는 경우, 겹치는 태그까지 포함.
					function selectClsAndPhr(){
						if(target != null){
							erasingSets.push(target);
							// shift키를 누른 채로 마우스오버 시 자식 태그 모두 포함.
							if(shiftPressed || e.shiftKey){
								for(let elt of target.getElementsByTagName('span')) {
									erasingSets.push(elt);
								}
							}
							if(target.textContent == target.parentElement.textContent) {
								target = target.parentElement;
								erasingSets.push(target);
							}else if(target.children.length > 0 
							&& target.children[0].textContent == target.textContent){
								erasingSets.push(target.children[0]);
							}
						}
					}
				})
				// 삭제 모드일때 삭제 대상에게서 마우스포인터가 떠나면 삭제 대상 리스트 초기화.
				.on('mouseout', '[data-mode="erasing"] .semantics-result *', function(e){
					erasingSets.forEach(function(elt) {
						$(elt).removeClass('erasing-target');
					})
					erasingSets = [];
					erasingTarget = null;
					e.stopPropagation();
				})
				// 쉬프트 키를 누르면 body에 .shift 적용
				.on('keydown keyup', function(e){
					if((e.type == 'keydown' && !shift && e.shiftKey)
					|| (e.type == 'keyup' && shift && !e.shiftKey)) {
						shift = !shift;
						$(document.body).toggleClass('shift', shift);
						if(erasingTarget != null) {
							// 명시적으로 마우스이벤트 발생.
							$(erasingTarget).trigger('mouseout') 
							// (shiftKey는 명시적 이벤트에 전달이 안되므로 파라미터로 전달)
										   .trigger('mouseover', [shift]);
						}
					}
				})
				// 타겟 요소들의 마킹태그를 해제.
				.on('click', '.erasing-target', function(e){
					const container = e.target.closest('.semantics-result') || e.target;
					if(container.closest('[data-mode="erasing"]')){
						pushEditHistory(container);
						erasingSets.forEach(function(elt) {
							// 괄호 태그나 문자가 없는 태그는 바로 삭제.
							if(elt.textContent.length == 0 || elt.matches('.brkt')){
								$(elt).remove();
							}else{
								$(elt).contents().unwrap();
							}
						});
					}
					// 잔류 피수식어 해제
					var $rcmLefts = $(container).find('.rcm');
					$rcmLefts.each(function() {
						for(let className of this.classList){
							if(className.indexOf('mfd') > -1 && $(`[data-mfd="${className.substring(4)}"]`).length == 0){
								$(this).contents().unwrap();
							}
						}
					});
					// 잔류 수식어 data-mfd값 제거
					var $modLefts = $(container).find('[data-mfd]');
					$modLefts.each(function() {
						if($('.rcm.mfd-' + this.dataset.mfd).length == 0){
							delete this.dataset.mfd;
						}
					});
					
					
					
					// shift키를 누른 상태라면 텍스트 블록 선택된 것이 있으면 선택 해제.
					if(e.shiftKey){
						getSelection().removeAllRanges();
					}
					
					refreshDOMs(container);
				})
				// =========================================================== /
				//						성분 지정								   /
				.on('mouseup', '.edit-svoc[data-mode="role"], .edit-svoc[data-mode="wrap"]', function(e, forceRole) {
					e.stopPropagation();
					const val = $svocEditor.find('.active').val();
					const sel = getSelection();
					const container = sel?.anchorNode?.parentElement?.closest('.semantics-result');
					if(!sel.isCollapsed){
						pushEditHistory(container);
						if(this.dataset.mode == 'role') {
							applyRoles(sel, forceRole ? forceRole : val);
						}else if(this.dataset.mode == 'wrap') {
							wrapBracket(sel, forceRole ? forceRole : val);
						}
						// 지정 완료 후 메뉴 활성화 해제
						$('.edit-svoc').attr('data-mode', null);
						$svocEditor.find('.active').removeClass('active');
						$svocEditorHint.empty();
					}
				})
				//=============================================================/
				.on('mouseup', '.edit-svoc[data-mode="cleft"]', function(e) {
					e.stopPropagation();
					const semanticsResult = this.querySelector('.semantics-result');
					semanticsResult.normalize();
					let sel = getSelection();
					if(!sel.isCollapsed){
						const position = sel.anchorNode.compareDocumentPosition(sel.focusNode);
						let backwards = false;
						// position == 0 if nodes are the same
						if (!position && sel.anchorOffset > sel.focusOffset || 
						  position === Node.DOCUMENT_POSITION_PRECEDING)
						  backwards = true; 
			
						if(backwards) {
							sel.setBaseAndExtent(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset);
						}
						let { anchorNode, anchorOffset, focusNode, focusOffset} = sel;
						// 양끝 공백이 있으면 제거합니다.
						while (/^(\s|[.,?!'"])/.test(anchorNode.textContent.substring(anchorOffset))) {
							anchorOffset++;
						}
						while (/(\s|'s|[.,?!'"])$/.test(focusNode.textContent.substring(0, focusOffset))) {
							focusOffset--;
						}
						// 범위 바깥에 단어가 계속된다면 범위 확장
						while(anchorOffset > 0 && /\w/.test(anchorNode.textContent[anchorOffset - 1])) {
							anchorOffset--;
						}
						while(focusOffset < focusNode.textContent.length && /\w/.test(focusNode.textContent[focusOffset])) {
							focusOffset++;
						}
						
						sel.setBaseAndExtent(focusNode, focusOffset, anchorNode, anchorOffset);							
						
						const selMatch = sel.toString().trim()
						.match(/^[iI]t( is| was|'s| had been| has been|'s been|'ll be|'ll have been| will be| will have been| can be| could be| could have been| would be| would have been)[ ,].+\S$/);
						if(selMatch) {
							
							// 이전 상태 히스토리 저장
							pushEditHistory(semanticsResult);
							
							const cleftHead = 'It' + selMatch[1];
							
							// 선택범위 끝에 that이 있으면 that에도 강조구문 처리.
							const conjMatch = selMatch[0].match(/(that|wh(o(se|m)?|e(n|re)|y|at|ich)|how)$/i);
							if(conjMatch) {
								const range2 = new Range();
								range2.setStart(focusNode, focusOffset - conjMatch[0].length);
								range2.setEnd(focusNode, focusOffset);
								range2.surroundContents(createElement({
									el: 'span', class: 'sem cleft'
								}));
							}
							try{
								const range1 = new Range();
								range1.setStart(anchorNode, anchorOffset);
								range1.setEnd(anchorNode, anchorOffset + cleftHead.length);
								
								range1.surroundContents(createElement({
									el: 'span', class: 'sem cleft', dataset: { gc: '강조구문'}
								}));
							}catch(e) {
								alertModal('선택 범위 내의 다른 마킹을 지워주세요.');
								$(semanticsResult).html(undoList.pop());
								return;
							}
							
							
							
							sel.removeAllRanges();
						}else {
							alertModal('"It + be동사 + 강조대상 + that(생략 가능. that 대신 who,where 등 가능)"까지 선택하세요.');
						}
					}
				})
				// ============================================================/
				//					명사절 성분 지정							   /
				.on('click', '.cls-role-menu button', function() {
					const role = this.value;
					const innerElement = createElement({
						el: 'span', class: `sem ${pseudoMarkTypes[role]??role}`
					})
					if(rcomments[role]) innerElement.dataset.rc = rcomments[role];
					const range = $nclsComboBox.data('range'); 
					try {
						range.surroundContents(innerElement);
					} catch (er) {
						innerElement.appendChild(range.extractContents());
						range.insertNode(innerElement);
					}
					const outerElement = createElement({
						el: 'span', class: 'sem ncls'
					});
					if(gcomments.ncls[role]) {
						outerElement.dataset.gc = gcomments.ncls[role];
					}
					$(innerElement).wrap(outerElement);
					
					$nclsComboBox.data('range', null).detach();
					refreshDOMs(innerElement.closest('.semantics-result'));
					
					if(role == 'appo') {
						range.detach();
						getSelection().removeAllRanges();
						$(innerElement).parent().addClass('comment-target').trigger('click');
						$('.edit-comment :text').val('동격 => ');
					}else {
						const rangeRect = range.getClientRects()[0];
						$(document.body).append($nclsComboBox2
						.css('top', `${scrollY + rangeRect.top + rangeRect.height}px`)
						.css('left', `${scrollX + rangeRect.left}px`)
						.data('range', $(innerElement).parent('.ncls')));						
							
						$nclsComboBox2.find('button[value="nclc"]').prop('checked', true);
					}
					
				})// 				명사절 접속사 지정
				.on('click', '.cls-conj-menu button', function() {
					const conj = this.value;
					const $clause = $nclsComboBox2.data('range'); 
					$clause.attr('data-gc', gcomments.ncls[conj]||$clause.attr('data-gc') );
					
					getSelection().removeAllRanges();
					$nclsComboBox2.data('range', null).detach();
					refreshDOMs($clause.closest('.semantics-result')[0]);
				})
				//-------------------------------------------------------------/
				//					부정사,동명사,분사 성분 지정							   /
				.on('click', '.tor-role-menu button,.ger-role-menu button,.ptc-role-menu button', function() {
					const role = this.value;
					const wrapper = this.closest('.tor-role-menu,.ger-role-menu,.ptc-role-menu').className.match(/(\w+)-role-menu/)[1] // 콤보박스 종류 파악
					const $comboBox = {tor:$torComboBox,ger:$gerComboBox,ptc:$ptcComboBox}[wrapper];
					const roleElement = createElement({
						el: 'span', class: `sem ${pseudoMarkTypes[role]??role}`
					})
					if(rcomments[role]) roleElement.dataset.rc = rcomments[role];
					if(['adjphr','advphr'].includes(role) && gcomments[role]) roleElement.dataset.gc = gcomments[role];
					const wrapperElement = $comboBox.data('wrapperEl');
					if(['adjphr','advphr'].includes(role)) {	
						// 괄호를 가진 형용사구,부사구는 바깥으로
						$(wrapperElement).wrap(roleElement);
					}else {
						$(wrapperElement).wrapInner(roleElement);
					}
					
					$comboBox.data('range').detach();
					getSelection().removeAllRanges();
					$comboBox.data('range', null).data('wrapperEl', null).detach();
					refreshDOMs(wrapperElement.closest('.semantics-result'));
				})
				.on('mouseup', function(e) {
					// 명사절, to부정사, 동명사, 분사 역할 지정 박스를 벗어나면 박스를 떼낸다.
					if($nclsComboBox.is(':visible') && !e.target.closest('.cls-role-menu')
					|| $nclsComboBox2.is(':visible') && !e.target.closest('.cls-conj-menu')
					|| $torComboBox.is(':visible') && !e.target.closest('.tor-role-menu')
					|| $gerComboBox.is(':visible') && !e.target.closest('.ger-role-menu')
					|| $ptcComboBox.is(':visible') && !e.target.closest('.ptc-role-menu')) {
						getSelection().removeAllRanges();
						$nclsComboBox.data('range', null).detach();
						$nclsComboBox2.data('range', null).detach();
						$torComboBox.data('range', null).detach();
						$gerComboBox.data('range', null).detach();
						$ptcComboBox.data('range', null).detach();
					}
				})
				
				// =========================================================== /
				//						코멘트 수정							   /
				.on('click', '.edit-svoc:not([data-mode="erasing"]):not([data-mode="mod"]):not([data-mode="comment"]) .sem', function(e){
					$('.edit-comment').remove();
					var target = this;
					/* 마우스 위치 */
				   	var x = (e.type == 'touchstart') ? e.touches[0].clientX : e.clientX;
				   	var y = (e.type == 'touchstart') ? e.touches[0].clientY : e.clientY;
			   		var rects = this.getClientRects();
				   	var isOdd = $(this).is('.odd') ? 1 : 0, isRcm = $(this).is('.rcm') ? 1 : 0;
				   	var toUp = isOdd ? -1 : 1, toLeft = isRcm ? -1 : 1;
				   	var topOrBottm = ['top','bottom'][isOdd], leftOrRight = ['left','right'][isRcm];
				   	
				   	// 클릭한 지점이 rcomment나 gcomment 영역 내부일 경우 편집 상자 표시.
				   	var commentTypes = [{data:'rc',pseudo:'::before'},{data:'gc',pseudo:'::after'}];
				   	for(let type of commentTypes){
				   		var pseudoStyle = getComputedStyle(target, type.pseudo);
						// 코멘트의 위치 및 크기
				   		var pseudoVpos = parseFloat(pseudoStyle[topOrBottm]),
				   			pseudoHpos = parseFloat(pseudoStyle[leftOrRight]),
				   			pseudoWidth = parseFloat(pseudoStyle.width),
				   			pseudoHeight = parseFloat(pseudoStyle.height);
				   		// 해당 코멘트에 실제 내용이 있고, 코멘트 위치나 크기가 있을 경우
				   		if(target.dataset[type.data] != null 
						&& !isNaN(pseudoWidth) && !isNaN(pseudoHeight)) {
							// 코멘트의 4꼭지점 위치
					   		var y1 = rects[isOdd][topOrBottm] + toUp * pseudoVpos;
					   		var	y2 = y1 + toUp * pseudoHeight;
					   		var x1 = rects[isRcm ? rects.length - 1 : 0][leftOrRight] 
					   					+ toLeft * pseudoHpos;
					   		var x2 = x1 + toLeft * pseudoWidth;
					   		
							// 마우스 위치가 코멘트 영역 내부인지 판단
					   		if(Math.min(y1,y2,y) != y && Math.max(y1,y2,y) != y
					   		&& Math.min(x1,x2,x) != x && Math.max(x1,x2,x) != x){
								e.stopPropagation();
					   			const $editText = $editCommentBox.clone(false);
					   			$editText.find('input:text').val(target.dataset[type.data]);
					   			document.body.appendChild($editText[0]);
					   			$editText.css('top', (type.data == 'gc') 
					   				? `${scrollY + Math.max(y1,y2)}px`
					   				: `${scrollY + Math.min(y1,y2) - $editText.height() - 10}px`)
					   				.css('left', `${scrollX + Math.min(x1,x2)}px`)
					   				.find('input:text')[0].focus();
								$(document).on('mousedown', editCommentMenu);
								
					   			$editText.find('form').on('submit',function(ee){
					   				ee.preventDefault();
					   				pushEditHistory(target.closest('.semantics-result'));
					   				var text = $(this).find('input').val().trim();
					   				// 코멘트 길이가 0이면 삭제, 아니면 수정 적용.
					   				if(text.length == 0) delete target.dataset[type.data];
					   				else target.dataset[type.data] = text;
									$(document).off('mousedown', editCommentMenu);
									$editText.remove();
									tandem.checkGCDepth(target.closest('.semantics-result'));
									$('.edit-svoc').focus();
					   			});
					   			$editText.find('button:eq(1)').on('click',function(){
									$(document).off('mousedown', editCommentMenu);
									$editText.remove();
									$('.edit-svoc').focus();		   				
					   			});
								function editCommentMenu(e1){
									if(($editText[0].compareDocumentPosition(e1.target) & 16) != 16){
										$(document).off('mousedown', editCommentMenu);
										$editText.remove();
										$('.edit-svoc').focus();
									}
								}
					   			
					   			break;
					   		}
				   		}
				   	}
				})
				// =========================================================== /
				//						수식 지정								   /
				// 'mod' 상태일 때 수식 시작 화살표 표시
				.on('mouseover', '[data-mode="mod"] .semantics-result *', function(e){
					$('.mod-indicator').remove();
					const wrapperClasses = '.cls,.acls,.ncls,.advcls,.phr,.tor,.ger,.adjphr,.ptc';
					let wrapper = $(this).is(wrapperClasses)
						? this : ($(this).closest(wrapperClasses).length == 0 
							? (this.dataset.lv != null ? this : null)
							: $(this).closest(wrapperClasses)[0]);
					// 이미 수식어이거나 wrapper class에 해당하는 부모가 없으면 제외
					if(wrapper == null || wrapper.textContent.trim().length < 2
							|| wrapper.dataset.mfd != null){
						modifier = null;
						return false;
					}
					e.stopPropagation();
					modifier = wrapper;
					const indicator = document.createElement('div');
					indicator.className = 'mod-indicator';
					indicator.style.position = 'absolute';
					indicator.style.top = `${scrollY + wrapper.getClientRects()[0].top - rem * 3}px`;
					indicator.style.left = `${scrollX + wrapper.getClientRects()[0].left - 0.8 * rem}px`; 
					indicator.textContent = '↑'
					
					document.body.appendChild(indicator);
				})
				// 'mod-end' 상태일 때 수식 종료 화살표 표시
				.on('mousemove', '.edit-svoc .semantics-result', function(e){
					currX = (e.type == 'touchstart') ? e.touches[0].clientX : e.clientX;
				   	currY = (e.type == 'touchstart') ? e.touches[0].clientY : e.clientY;
				   	let sel, range, rect;
				   	if($(e.target).closest('[data-mode="mod-end"] .semantics-result').length > 0) {
					$('.mod-indicator').remove();
					const indicator = document.createElement('div');
					indicator.className = 'mod-indicator';
					indicator.style.position = 'absolute';
				   	if (document.caretPositionFromPoint) {
						range = document.createRange();
						const offsetNode = document.caretPositionFromPoint(currX, currY).offsetNode;
						range.selectNode(getLeafNode(offsetNode));
					} else if (document.caretRangeFromPoint) {
						range = document.caretRangeFromPoint(currX, currY);
					} else {
						console.error("[This browser supports neither document.caretRangeFromPoint"
					 				 + " nor document.caretPositionFromPoint.]");
						return(false);
					}
					if(typeof Selection.prototype.modify === 'function'){
						sel = getSelection();
						sel.removeAllRanges();
						sel.addRange(range);
						sel.modify('move', 'backward', 'word');
						sel.modify('extend', 'forward', 'word');
						if(sel.rangeCount == 0 
						|| sel.toString().trim().match(/\w/) == null){
							sel.removeAllRanges();
							return(false);
						}
						rect = sel.getRangeAt(0).getClientRects()[0];
						sel.removeAllRanges();
						if(rect.y > currY || currY > (rect.y + rect.height)){
							return(false);
						}
					}else if(typeof Range.prototype.expand === 'function') {
						range.expand('word');
						if(range.toString().trim().match(/\w/) == null){
							return(false);
						}
						rect = range.getClientRects()[0];
						range.detach();
						if(rect.y > currY || currY > (rect.y + rect.height)){
							return(false)
						}
					} else {
						console.error('[This browser supports neither Selection.modify nor Range.expand.]');
					}
					e.stopPropagation();
					indicator.style.top = `${scrollY + rect.top - rem * 3}px`;
					indicator.style.left = `${scrollX + rect.right - rem}px`; 
					indicator.textContent = '↓';
					document.body.appendChild(indicator);
					}
				})
				// 'mod' 상태일 때 클릭 시 수식 시작 화살표를 고정하고 'mod-end' 상태로 전환
				.on('click', '[data-mode="mod"] .semantics-result *', function(e){
					if(modifier == null) return false;
					
					e.stopPropagation();
					$('.mod-indicator').toggleClass('mod-indicator mod-start');
					this.closest('.edit-svoc').dataset.mode = 'mod-end';
					$('.semantic-edit-guide-msg').text('피수식어 위치를 클릭 하세요.');
				})
				// 'mod-end' 상태일 때 클릭 시 수식선을 잇고 'mod' 상태로 전환
				.on('click', '[data-mode="mod-end"] .semantics-result', function(e){
					if($('.mod-indicator').length == 0) return false;
					e.stopPropagation();
					$('.mod-start').remove();
					pushEditHistory(this);
					
					var containerSequence = this.dataset.seq;
					var rcmMaxNum = 0;
					// 기존 선행사들의 마지막 넘버링 파악.
					$(this).find('.rcm').each(function() {
						for(let className of this.classList){
							if(className.indexOf('mfd') > -1){
								rcmMaxNum = Math.max(rcmMaxNum, parseFloat(className.split('-')[2]));
							}
						}
					});
					// 수식어 표시
					modifier.dataset.mfd = `${containerSequence}-${rcmMaxNum + 1}`;
					
					// 피수식어 표시
					var rcm = document.createElement('span');
					rcm.className = `sem rcm mfd-${containerSequence}-${rcmMaxNum + 1}`;
					rcm.dataset.gc = '수식';
					// 커서가 위치한 문자열 선택
					var x = (e.type == 'touchstart') ? e.touches[0].clientX : e.clientX;
				   	var y = (e.type == 'touchstart') ? e.touches[0].clientY : e.clientY;
				   	var sel, range;
				   	if (document.caretPositionFromPoint) {
						range = document.createRange();
						const offsetNode = document.caretPositionFromPoint(currX, currY).offsetNode;
						range.selectNode(getLeafNode(offsetNode));
					} else if (document.caretRangeFromPoint) {
						range = document.caretRangeFromPoint(x, y);
					} else {
						console.error("[This browser supports neither document.caretRangeFromPoint"
					 				 + " nor document.caretPositionFromPoint.]");
						return(false);
					}
					sel = getSelection();
					sel.removeAllRanges();
					sel.addRange(range);
					sel.modify('move', 'backward', 'word');
					sel.modify('extend', 'forward', 'word');
					range = sel.getRangeAt(0);
					// extend를 통해 확장선택이 공백을 포함할 수 있어 공백 제거 작업.
					while(range.toString().endsWith(' ')){
						range.setEnd(range.endContainer, range.endOffset - 1);
					}
					// 두 개의 노드에 걸쳐질 경우 위 작업을 거치면 endOffset이 0 됨.
					// 이 때 endOffset을 첫 번째 노드의 끝으로 설정. 
					if(range.endOffset == 0){
						range.setEnd(range.startContainer, range.startContainer.data.length);
					}
					
					// 선행사 마킹 처리
					try{
						range.surroundContents(rcm);
					}catch (er) {
						rcm.appendChild(range.extractContents());
						range.insertNode(rcm);
					}
					sel.removeAllRanges();
					
					modifier = null;
					$('.mod-indicator').remove();
					$('.edit-svoc').attr('data-mode', null);
					$svocEditor.find('[data-mode="mod"].active').removeClass('active');
					$svocEditorHint.empty();
					// this.closest('.edit-svoc').dataset.mode = 'mod';
					// $('.semantic-edit-guide-msg').text('수식어 위치를 클릭 하세요.');
					
					tandem.checkGCDepth(this);
				})
				// =========================================================== /
				//						 gcomment 추가 기능					   /
				.on('click', '.comment-target', function(e) {
					const container = e.target.closest('.semantics-result') || e.target;
					const target = this;
					gCommentCreateHintOff();
					$('.edit-comment').remove();
					// 코멘트 위치
			   		const rects = target.getClientRects(),
				   		isOdd = target.matches('.odd') ? 1 : 0, 
				   		isRcm = target.matches('.rcm') ? 1 : 0,
				   		toUp = isOdd ? -1 : 1, toLeft = isRcm ? -1 : 1,
				   		topOrBottm = ['top','bottom'][isOdd], leftOrRight = ['left','right'][isRcm];
				   	
			   		const pseudoStyle = getComputedStyle(target, '::after');
					// 코멘트의 위치 및 크기
			   		const pseudoVpos = parseFloat(pseudoStyle[topOrBottm]),
			   			pseudoHpos = parseFloat(pseudoStyle[leftOrRight]),
			   			pseudoWidth = parseFloat(pseudoStyle.width),
			   			pseudoHeight = parseFloat(pseudoStyle.height);
					// 코멘트의 4꼭지점 위치
			   		const y1 = rects[isOdd][topOrBottm] + toUp * pseudoVpos,
			   			y2 = y1 + toUp * pseudoHeight,
			   			x1 = rects[isRcm ? rects.length - 1 : 0][leftOrRight] 
			   					+ toLeft * pseudoHpos,
			   			x2 = x1 + toLeft * pseudoWidth;
					
		   			const $editText = $editCommentBox.clone(false);
		   			document.body.appendChild($editText[0]);
		   			$editText.find('input:text').val(target.dataset.gc??'');
		   			$editText.css('top', `${scrollY + Math.max(y1,y2)}px`)
		   				.css('left', `${scrollX + Math.min(x1,x2)}px`)
						.find('input:text')[0].focus();
					$(document).on('mousedown', editCommentMenu);
					
		   			$editText.find('form').on('submit',function(e1){
		   				e1.preventDefault();
						target.classList.remove('comment-target');
						if(container.closest('[data-mode="comment"]')){
							pushEditHistory(container);
						}
						gCommentCreateHintOn();
		   				const text = $(this).find('input').val().trim();
		   				// 코멘트 길이가 0이면 삭제, 아니면 수정 적용.
		   				if(text.length == 0) delete target.dataset.gc;
		   				else target.dataset.gc = text;
						$(document).off('mousedown', editCommentMenu);
						$editText.remove();
						tandem.checkGCDepth(target.closest('.semantics-result'));
						$('.edit-svoc').focus();
						container.closest('.edit-svoc').removeAttribute('data-mode');
						$svocEditor.find('[data-mode="comment"].active').removeClass('active');
						$svocEditorHint.empty();
		   			});
		   			$editText.find('button:eq(1)').on('click',function(){
						$(document).off('mousedown', editCommentMenu);
						$editText.remove();
						gCommentCreateHintOn();
						$('.edit-svoc').focus();		   				
		   			});
		   			
		   			
					function editCommentMenu(e1){
						if(($editText[0].compareDocumentPosition(e1.target) & 16) != 16){
							$(document).off('mousedown', editCommentMenu);
							$editText.remove();
							$('.edit-svoc').focus();
							gCommentCreateHintOn();
						}
					}
				});
				gCommentCreateHintOn();
				
				function gCommentCreateHintOn() {
					$(document).on('mouseover', '[data-mode="comment"] .semantics-result .sem', function(e){
						if(this.dataset.gc == null || this.dataset.gc.length == 0) {
							e.stopPropagation();
							this.classList.add('comment-target');
						}
					}).on('mouseout', '[data-mode="comment"] .semantics-result *', function(){
						$('.comment-target').removeClass('comment-target');
					})
				}			
				
				function gCommentCreateHintOff() {
					$(document).off('mouseover', '[data-mode="comment"] .semantics-result .sem')
							.off('mouseout', '[data-mode="comment"] .semantics-result *');
				}
				$svocEditorHint = $(result).find('.semantic-edit-guide-msg');
				$svocEditorBadge = $(result).find('.svoc-editor-badge');
				$svocEditorEmblem = $(result).find('.svoc-editor-emblem');
			}, 'html');
		}
		
		// [구문분석 div에 .edit-svoc 클래스 추가 후 편집 툴바와 힌트 메세지 표시]
		const $badge = $svocEditorBadge.clone();
		$badge.text(forNew ? 'New' : 'Edit');
		
		this.wrap($('<div class="edit-svoc" tabindex="0"></div>'))
			.before($badge)
			.before($svocEditorEmblem)
			.before($svocEditor)
			.after($svocEditorHint);
		$('.edit-svoc').focus();
		return this;
	}


/**	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-  /
 								Embed functions
	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	- */	
	
	function saveAndClose(div) {
		// DOM 변경을 보장하기 위해 requestAnimationFrame 사용.
		requestAnimationFrame(async function(){
			
			const encSvocText = await tandem.getSvocBytes(div);
			// 원상태로 복구
			tandem.wrapWithBracket(div);
			
			tandem.correctMarkLine(div);
			
			// 편집내역 초기화
			undoList = []; redoList = [];
			$svocEditor.find('[value="undo"], [value="redo"]').prop('disabled', true);
			
			// 인코딩된 결과값을 전송
			const saveResult = settings.saveCallback(encSvocText);
			
			if(saveResult && saveResult.then && saveResult.fail) {
				saveResult.then(function() {
					$('.svoc-editor-badge').html('<i class="fas fa-check"></i> 저장됨');
					_resetEditor();
				}).fail(function() {
					$('.svoc-editor-badge').html('<i class="fas fa-ban"></i> 저장실패');
					closeEditor($(div));
				})
			}else {
				$('.svoc-editor-badge').html('<i class="fas fa-check"></i> 저장됨');
				_resetEditor();
			}
			
			// 에디터를 초기화하고 실패콜백 호출
			function _resetEditor(callback) {
				setTimeout(() => {
					$svocEditorHint.text('');
					$(div).unwrap();
					$svocEditor.find('[value="undo"], [value="redo"]').prop('disabled', true);
					$svocEditor.find('button').removeClass('active').each((_i,btn) => {
						bootstrap?.Tooltip?.getInstance(btn)?.hide();
					});
					$('.svoc-editor-badge,.svoc-editor-emblem').remove();
					$svocEditor.detach();
					$svocEditorHint.detach();
					callback?.call();
				}, 2000);
			}
		});
	}
	
	function closeEditor($div) {
		$svocEditor.find('[value="undo"], [value="redo"]').prop('disabled', true);
		$svocEditor.find('button').removeClass('active').each((_i,btn) => {
			bootstrap?.Tooltip?.getInstance(btn)?.hide();
		});

		$div.unwrap();
		undoList = []; redoList = [];
		$('.svoc-editor-badge,.svoc-editor-emblem').remove();
		$svocEditor.detach();
		$svocEditorHint.detach();
		settings.cancelCallback();			
	}	
	
	/**
	 * 편집 내역 저장
	 * .semantics-result의 seq 데이터값으로 각 문장별 편집내역 구분.
	 */
	function pushEditHistory(container){
		var semSeq = container.dataset.seq;
		undoList.push([semSeq, container.innerHTML]);
		redoList = [];
		$('.svoc-toolbar [value="undo"]').prop('disabled', false);
	}

	/**
	 * 선택 영역에 지정한 성분의 태그로 감싼다.
	 * @param selection 블록선택한 텍스트 영역
	 * @param role 적용할 성분(실제 성분과 오롯이 일치하진 않음. 예: ss = 마크타입 S/rcomment '(의)s')
	 */
	function applyRoles(selection, role) {
		const range = selection.getRangeAt(0);
		const el = document.createElement('span');
		el.className = 'sem ' + (pseudoMarkTypes[role]??role);
		
		// rcomment 기본값 적용 (예전엔 rcomment가 S가 아니라 Subj였으므로, 짧은 버전은 rcomment를 따로 지정했음)
		if(rcomments[role] != null) {
			el.dataset.rc = rcomments[role];
			el.dataset.rcMin = rcomments[role];
		}
		// gcomment 기본값 적용
		if(typeof gcomments[role] == 'string') el.dataset.gc = gcomments[role];
		// 선택 영역이 온전히 노드를 감쌀 경우 지정된 태그로 감싸고
		// 노드를 양분할 경우 갈리는 영역 각각을 태그로 감싼다.
		try {
			range.surroundContents(el);
		} catch (e) {
			el.appendChild(range.extractContents());
			range.insertNode(el);
		}
		range.detach();
		selection.removeAllRanges();
		
		// 만약 to부정사나 분사가 형용사구나 부사구의 부모로 지정되면 부모자식 관계를 뒤집는다.
		if(['tor','ptc'].includes(role) 
		&& el.childElementCount == 1
		&& ['.adjphr','.advphr'].find(c => el.firstElementChild.matches(c))) {
			tandem.swapParentAndChild(el, el.firstElementChild);
		}
		
		const container = $(el).closest('.semantics-result')[0];
		
		refreshDOMs(container);
	}
	
	
	/**
	 * 선택 영역을 괄호로 감싼 후 성분 태그까지 겹쳐서 추가한다.
	 */
	function wrapBracket(selection, wrapper){
		const range = selection.getRangeAt(0);
		const element = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentNode : range.startContainer;
		const sem = element.closest('.sem');
		const container = element.closest('.semantics-result');
		const sameWrapper = sem?.matches(`.sem.${wrapper == 'pcl'?'advcls':wrapper}`);
		switch (wrapper) {
			case 'tor': case 'ger': case 'ptc': case 'ncls': {
				// 선택한 영역이 오롯이 하나의 태그와 일치할 때
				
				if(range.toString().length == sem?.textContent?.length) {
					const wrapperEl = createElement({ el: 'span', class: 'sem ' + wrapper, dataset: { gc: gcomments[wrapper] }});
					// 일치하는 태그가 성분 태그일 경우
					if(sem.matches('.s,.o,.po,.to,.go,.ptco,.c,.oc,.appo,.adjphr,.advphr')) {
						// 품사가 명사절이면 성분 태그 밖에 감싼다.
						if(wrapper == 'ncls') {
							// 기존 성분의 gcomment가 혹시 있으면 없앤다.(명사절의 gcomment와 중복됨)
							if(sem?.dataset?.gc) delete sem.dataset.gc;
							wrapperEl.dataset.gc = gcomments.ncls[Array.from(sem.classList).filter(c => ['s','o','po','to','go','ptco','c','oc','appo'].includes(c))[0]]
							$(sem).wrap(wrapperEl);
						// 그 외(to부정사, 동명사, 분사)엔 성분 태그가 품사를 감싸도록
						}else $(sem).wrapInner(wrapperEl);
					}else {
						if(!sameWrapper) $(sem).wrap(wrapperEl);
						else {
							const $wrapperEl = $(sem).wrapInner(wrapperEl).children().eq(0).unwrap();
							range.selectNode($wrapperEl[0]);
							floatComboBox(range, wrapper, $wrapperEl[0]);
						}
					}
					refreshDOMs(container);
				}
				// 범위가 완전하게 겹쳐지지 않는 경우
				else {
					// to부정사,동명사,분사는 일단 태그를 먼저 표시.
					let wrapperEl;
					if(['tor','ger','ptc'].includes(wrapper)) {
						wrapperEl = createElement({ el: 'span', class: 'sem ' + wrapper, dataset: { gc: gcomments[wrapper] }});
						try {
							range.surroundContents(wrapperEl);
						} catch (er) {
							wrapperEl.appendChild(range.extractContents());
							range.insertNode(wrapperEl);
						}
					}
					refreshDOMs(container);
					floatComboBox(range, wrapper, wrapperEl);
				}
				break;
			}
			case 'acls': case 'advcls': case 'pcl': {
				// 형용사절,부사절,삽입절은 성분을 'M'으로 먼저 표시하고
				const el = document.createElement('span');
				el.className = 'sem m';
				el.dataset.rc = rcomments['m'];
				try {
					range.surroundContents(el);
				} catch (e) {
					el.appendChild(range.extractContents());
					range.insertNode(el);
				}
				
				tandem.trimTextContent(container);
				
				range.selectNode(el);
			}
			default:
				// 품사를 표시한다.
				const el2 = document.createElement('span');
				el2.classList.add('sem', wrapper=='pcl'?'advcls':wrapper);
				if(gcomments[wrapper]) el2.dataset.gc = gcomments[wrapper];
				try {
					range.surroundContents(el2);
				} catch (e) {
					el2.appendChild(range.extractContents());
					range.insertNode(el2);
				}
				range.detach();
				selection.removeAllRanges();
				
				// 만약 to부정사나 분사가 형용사구나 부사구의 부모로 지정되면 부모자식 관계를 뒤집는다.
				if(['adjphr','advphr'].includes(wrapper)
				&& ['.tor','.ptc'].some(c => el2.parentElement.matches(c))
				&& Array.from(el2.parentElement.childNodes).filter(n => n.textContent.length > 0).length === 1) {
					tandem.swapParentAndChild(el2.parentElement, el2);
				}
				
				refreshDOMs(container);
				break;
		}
	}
	
	function getLeafNode(node) {
		if(node.hasChildNodes()) {
			return getLeafNode(node.firstChild);
		}else return node;
	}	
	
	/**
	 * 성분을 묻는 콤보박스 표시
	 */
	function floatComboBox(range, wrapper, wrapperEl) {
		const rangeRect = range.getClientRects()[0];
		// 성분을 묻는 콤보박스를 표시
		$(document.body).append({ncls: $nclsComboBox, tor: $torComboBox, ger: $gerComboBox, ptc: $ptcComboBox }[wrapper]
			.css('top', `${scrollY + rangeRect.top + rangeRect.height}px`)
			.css('left', `${scrollX + rangeRect.left}px`)
			.data('range', range).data('wrapperEl', wrapperEl));		
	}
	
	function refreshDOMs(container) {
		$(container).find('.sem').filter((i,sem)=>
			sem.textContent.length == 0).remove();
			
		tandem.checkPOSDepth(container);
		
		tandem.wrapWithBracket(container);
		
		tandem.splitInners(container);
		
		tandem.trimTextContent(container);
		
		tandem.correctMarkLine(container);
		
		$('.edit-svoc').focus();
	}
}(jQuery, document, tandem));
