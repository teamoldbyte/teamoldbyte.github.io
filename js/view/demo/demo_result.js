/** /demo/demo_result.html
 @author LGM
 */
 async function pageinit(sentenceList){
	const partTypeMap = {
		'n.':'명사', 'v.':'동사','vt.':'타동사','vi.':'자동사','a.':'형용사','ad.':'부사','prep.':'전치사','conj.':'접속사','int.':'감탄사', 'abbr.': '약어', 'pron.': '대명사',
		'NP.' : '명사구', 'phrasal-v.': '구동사', 'VP.' : '동사구', 'PP.': '전치사구', 'ADP.': '부사구', 'AJP.': '형용사구'
	}
	
	const originalList = Array.from(sentenceList);
	sentenceList.reverse(); // 등록시간 역순으로 정렬
	// 모바일이 아니거나 화면회전 기능을 지원하지 않으면 화면회전 버튼 삭제
	if(!/Mobi/.test(navigator?.userAgent) || !screen.orientation ) {
		$('.js-rotate-btn').remove();
	}
	const tts = new FicoTTS({autoplay: false, initSuccessCallback: () => {
		// 자동재생 조작 금지
		document.querySelector('#ttsSettings .form-switch').remove();
	}});	
	const $results = $('.result-section');
	
	let $copySection = $('.one-sentence-unit-section:eq(0)').clone();
	let $transCopyBlock = $copySection.find('.translation-section .ai-translation-block:eq(0)');
	let $wordCopySection = $copySection.find('.one-word-unit-section:eq(0)');
	let $partCopySection = $copySection.find('.one-part-unit-section:eq(0)');
	let $fingerCopyBlock = $copySection.find('.one-sentence-unit-block:eq(0)');




	function decodeSentence(bytes) {
		return JSON.parse(pako.inflateRaw(bytes, { to: 'string'}));
	}
	function encodeSentence(sentence) {
		return pako.deflateRaw(JSON.stringify(sentence));
	}
	if(typeof idb == 'undefined') {
		await $.getScript('https://cdn.jsdelivr.net/npm/idb@7/build/umd-with-async-ittr.js');
	}
	if(typeof pako == 'undefined') {
		await $.getScript('https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js');
	}
	const DB_NAME = 'findsvoc-idb';	// url 호스트별로 유일한 데이터베이스명을 가집니다.
	let DB_VERSION = 2;	// 데이터베이스 버전
	const storeName = 'DemoTodaySentence';

	const databases = await indexedDB.databases();
	
	// 현재의 idb를 탐색
	databases.forEach(({name, version}) => (name == DB_NAME) && (version >= DB_VERSION) && (DB_VERSION = version))
	idb.openDB(DB_NAME, DB_VERSION, {
		// 버전 업그레이드가 필요할 경우 데모 문장 저장소도 생성.
		upgrade(db) {
			createObjectStoreForTodaySentence(db);
		}
	}).then(async db => {
		if(db.objectStoreNames.contains(storeName)) {
			// idb에 지난 날짜에 분석한 문장들은 삭제, 오늘 분석한 문장들은 표시 목록에 추가
			db.transaction(storeName, 'readwrite').store.openCursor().then(cursor => {
				const idbSentenceList = [];
				const today = Date.parse(new Date().toDateString());
				(function readOrDelete(cursorParam) {
					if(cursorParam) {
						if(Date.parse(cursorParam.value.date) < today) {
							cursorParam.delete();
						}else {
							idbSentenceList.push(decodeSentence(cursorParam.value.data));
						}
						cursorParam.continue().then(readOrDelete);
					}else {
						idbSentenceList.reverse();
						sentenceList = sentenceList.concat(idbSentenceList);
						renderSentences();
						showStepBlock($('#step-1'))
					}
				})(cursor);
			});
			// 방금 분석한 문장을 idb에 저장
			const tx = db.transaction(storeName, 'readwrite');
			await Promise.all(Array.from(originalList, sentence => {
				return tx.store.add({date: new Date().toDateString(), data: encodeSentence(sentence)});
			}).concat([tx.done]))
		}else {
			// 데모 문장 저장소가 없을 경우 생성
			db.close();
			idb.openDB(DB_NAME, ++DB_VERSION, {
				upgrade(db) {
					createObjectStoreForTodaySentence(db);
				}
			})
		}
	});
	function createObjectStoreForTodaySentence(db) {
		const newstore = db.createObjectStore(storeName, { autoIncrement: true});
		newstore.createIndex('date', 'date'); // 날짜
		newstore.createIndex('data', 'data'); // 실제 Sentence
	}
	
	// 다음 버튼을 누르면 현재 블럭은 삭제되고, 다음 블럭이 나타난 후 타이핑 애니메이션 재생
	$('.next-step-btn').on('click', function(e) {
		const $blockUnit = $(this).closest('.step-block-unit');
		$(this).closest('.next-btn-section').remove();
		if($blockUnit.next().length > 0) {
			$blockUnit.addClass('position-absolute slide-out-bck-center');
			$blockUnit.next().show(0,function() {
				$(this).css('display','')
				setTimeout(() => {
					$blockUnit.addClass('collapse').children('.text-section').remove();
					if($blockUnit.is('#step-4')) $blockUnit.remove();
					else if($blockUnit.is('#step-5')) {
						$blockUnit.find('.add-section').hide();
						$blockUnit.find('.empty-list').collapse('show');
					}
				}, 50);
				showStepBlock($(this));
			}).addClass('slide-in-right');
		}else {
			alertModal('<div class="logo-section text-center">'
			+ '<img class="logo" alt="logo" width="150" height="150" src="https://static.findsvoc.com/images/logo/main_logo_headonly.svg">'
			+ '<img class="logo position-absolute start-50 anim-talking" alt="logo" width="150" height="150" src="https://static.findsvoc.com/images/logo/main_logo_headonly.svg">'
			+ '</div><div class="demo-lastmsg"></div>', () => { 
				$blockUnit.addClass('collapse').children('.text-section').remove();
				$blockUnit.find('.related-list').html('<div class="empty-list one-block note-text row g-0"><div class="my-auto add-icon login-required" role="button"><span class="note-text text-gray-400">인덱스 핑거는 멤버십 회원에게 제공됩니다.</span></div></div>')
				$('.one-sentence-unit-section:eq(0) .step-block-unit').removeClass('position-absolute slide-out-bck-center slide-in-right').collapse('show');
				$('.one-sentence-unit-section:eq(0) .origin-sentence-section .fold-icon').addClass('expanded');
				$('.step-block-unit>.ai-translation-block').remove();
				$('.one-sentence-unit-section').slice(1).add('#navBtns').slideDown();
			})
		}
	});
	$(document).on('shown.bs.modal', '#alertModal', function(){
		if(this.querySelector('.demo-lastmsg')){
			new Typewriter(this.querySelector('.demo-lastmsg'), {
				delay: 40, cursor: ''
			}).typeString('<b class="text-danger">독해력 향상</b>을 위해서는 비법도 엄청난 노력이 필요한 것이 아닙니다.<br>'
			+ '<span class="app-name-text">fico</span>는 독해력 강화에 필요한 리소스들을 마련합니다.<br><br>'
			+ '시간과 노력으로 학습한 나의 영어 문장들을<br>'
			+ '인생의 일기처럼 어딘가 기록해야 한다면<br>'
			+ '단연코 <b class="text-danger">fico</span> 워크북</b>입니다.')
			.callFunction(() => $('.logo.anim-talking').remove()).start();
		}
	})
	
	function showStepBlock($block) {
		const stepHtmlString = $block.find('.body-text')[0].outerHTML;
		const guideTextTypewriter = new Typewriter($block.find('.body-text').empty().css('visibility','visible')[0], {
			cursorClassName: 'd-none', delay: 40, 
		});
		switch(true) {
			case $block.is('#step-1'): {
				// 구문분석 다음 해석을 시간차를 두고 표시
				$('.one-sentence-unit-section:eq(0)').find('.origin-sentence-section,.result-semantic-section:eq(0),.ai-translation-block:eq(0)').css('opacity','0');
				anime.timeline({
					duration: 500,
					delay: 1000,
					easing: 'linear'
				}).add({
					targets: $('.one-sentence-unit-section:eq(0) .origin-sentence-section')[0],
					opacity: [0, 1]
				}).add({
					targets: $('.one-sentence-unit-section:eq(0) .result-semantic-section:eq(0)')[0],
					opacity: [0, 1],
					changeBegin: () => {
						$('.one-sentence-unit-section .semantics-result:eq(0)').css('visibility','hidden');
					},
					duration: 100,
					complete: anim => {
						const htmlString = $('.one-sentence-unit-section .semantics-result:eq(0)').html();
						new Typewriter($(anim.animatables[0].target).find('.semantics-result')[0], {cursor: '', delay: 20})
						.callFunction(() => {
							$(anim.animatables[0].target).find('.semantics-result:eq(0)').css('visibility','visible');
						}).typeString(htmlString).callFunction(() => tandem.correctMarkLine($(anim.animatables[0].target).find('.semantics-result')[0]))
						.callFunction(() => {
							anime({
								targets: $('.one-sentence-unit-section:eq(0) .ai-translation-block:eq(0)')[0],
								changeBegin: anim => {
									$(anim.animatables[0].target).find('.translation-text').text(sentenceList[0].korList[0].kor)
								},
								opacity: [0, 1],
								delay: 2000,
								complete: () => {
									$block.children('.text-section').slideDown().promise().done(() => {
										anime({
											targets: $block.children('.text-section').find('.title')[0],
											changeBegin: (anim) => {
												anim.animatables[0].target.style.transformOrigin = 'left';
												anim.animatables[0].target.style.visibility = 'visible'
											},
											scaleX: [0,1],
											duration: 500,
											delay: 500,
											complete: () => {
												guideTextTypewriter
												.pauseFor(500).callFunction(() => {
													const line = createElement({el: 'div', class: 'line row g-0'});
													$block.find('.body-text').append(line);
													new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
													.pasteString('<span class="dot col-auto">• </span>')
													.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(0)').html()+'</div>')
													.pauseFor(500).callFunction(() => {
														const line = createElement({el: 'div', class: 'line row g-0'});
														$block.find('.body-text').append(line);
														new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
														.pasteString('<br><span class="dot col-auto">• </span>')
														.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(1)').html()+'</div>')
														.pauseFor(500).callFunction(() => {
															const line = createElement({el: 'div', class: 'line row g-0'});
															$block.find('.body-text').append(line);
															new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
															.pasteString('<br><span class="dot col-auto">• </span>')
															.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(2)').html()+'</div>')
															.pauseFor(500).callFunction(showNextBtn).start();
														}).start();
													}).start();	
												}).start();
											}
										});
									})
								}
							});
						}).start();
					}
				});
				break;
			}
			case $block.is('#step-2'): {
				anime({
					targets: Array.from($block.find('.one-word-unit-section').css('opacity','0')),
					opacity: [0,1],
					easing: 'linear',
					duration: 500,
					delay: anime.stagger(800, {start:500}),
					complete: () => {
						$block.children('.text-section').slideDown().promise().done(() => {
							anime({
								targets: $block.children('.text-section').find('.title')[0],
								changeBegin: (anim) => {
									anim.animatables[0].target.style.transformOrigin = 'left';
									anim.animatables[0].target.style.visibility = 'visible'
								},
								scaleX: [0,1],
								duration: 500,
								delay: 500,
								complete: () => {
									guideTextTypewriter
									.pauseFor(500).callFunction(() => {
										const line = createElement({el: 'div', class: 'line row g-0'});
										$block.find('.body-text').append(line);
										new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
										.pasteString('<span class="dot col-auto">• </span>')
										.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(0)').html()+'</div>')
										.pauseFor(500).callFunction(() => {
											const line = createElement({el: 'div', class: 'line row g-0'});
											$block.find('.body-text').append(line);
											new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
											.pasteString('<br><span class="dot col-auto">• </span>')
											.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(1)').html()+'</div>')
											.pauseFor(500).callFunction(() => {
												const line = createElement({el: 'div', class: 'line row g-0'});
												$block.find('.body-text').append(line);
												new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
												.pasteString('<br><span class="dot col-auto">• </span>')
												.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(2)').html()+'</div>')
												.pauseFor(500).callFunction(showNextBtn).start();
											}).start();
										}).start();	
									}).start();
								}
							})
						});
						
					}
				});
				break;
			}
			case $block.is('#step-3'): {
				anime({
					targets: Array.from($block.find('.ai-translation-block').css('opacity', '0')),
					opacity: [0,1],
					easing: 'linear',
					duration: 800,
					delay: anime.stagger(800, {start:500}),
					complete: () => {
						$block.children('.text-section').slideDown().promise().done(() => {
							anime({
								targets: $block.children('.text-section').find('.title')[0],
								changeBegin: (anim) => {
									anim.animatables[0].target.style.transformOrigin = 'left';
									anim.animatables[0].target.style.visibility = 'visible'
								},
								scaleX: [0,1],
								duration: 500,
								delay: 500,
								complete: () => {
									guideTextTypewriter
									.pauseFor(500).callFunction(() => {
										const line = createElement({el: 'div', class: 'line row g-0'});
										$block.find('.body-text').append(line);
										new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
										.pasteString('<span class="dot col-auto">• </span>')
										.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(0)').html()+'</div>')
										.pauseFor(500).callFunction(() => {
											const line = createElement({el: 'div', class: 'line row g-0'});
											$block.find('.body-text').append(line);
											new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
											.pasteString('<br><span class="dot col-auto">• </span>')
											.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(1)').html()+'</div>')
											.pauseFor(500).callFunction(() => {
												const line = createElement({el: 'div', class: 'line row g-0'});
												$block.find('.body-text').append(line);
												new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
												.pasteString('<br><span class="dot col-auto">• </span>')
												.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(2)').html()+'</div>')
												.pauseFor(500).callFunction(showNextBtn).start();
											}).start();
										}).start();	
									}).start();
								}
							})				
						});
					}
				});
				break;
			}
			case $block.is('#step-4'): {
				const eng = $block.closest('.one-sentence-unit-section').find('.origin-sentence .sentence-text').text()
				tandem.getSvocBytes($('#step-1 .semantics-result:eq(0)').get(0))
				.then(svocBytes => {
					tandem.showSemanticAnalysis(eng, svocBytes, $block.find('.try-edit'))
					.then(semantics => {
						$(semantics).svoceditor(false, jQuery.noop, jQuery.noop)
						.then(([editor]) => {
							$(editor).closest('.edit-svoc').find('.navigation-btns>.btn-group').last().css('visibility','hidden');
						});
						(new Promise((resolve) => setTimeout(resolve,1500))).then(() => {
							$block.children('.text-section').slideDown().promise().done(() => {
								anime({
									targets: $block.children('.text-section').find('.title')[0],
									changeBegin: (anim) => {
										anim.animatables[0].target.style.transformOrigin = 'left';
										anim.animatables[0].target.style.visibility = 'visible'
									},
									scaleX: [0,1],
									duration: 500,
									delay: 500,
									complete: () => {
										guideTextTypewriter
										.pauseFor(500).callFunction(() => {
											const line = createElement({el: 'div', class: 'line row g-0'});
											$block.find('.body-text').append(line);
											new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
											.pasteString('<span class="dot col-auto">• </span>')
											.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(0)').html()+'</div>')
											.pauseFor(500).callFunction(() => {
												const line = createElement({el: 'div', class: 'line row g-0'});
												$block.find('.body-text').append(line);
												new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
												.pasteString('<br><span class="dot col-auto">• </span>')
												.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(1)').html()+'</div>')
												.pauseFor(500).callFunction(() => {
													const block = $(stepHtmlString).find('.block:eq(0)')[0];
													block.style.opacity = '0';
													$block.find('.body-text').append(document.createElement('br'),block)
													anime({
														targets: block,
														easing: 'linear',
														duration: 500,
														delay: 500,
														opacity: [0,1],
														complete: showNextBtn
													})
												}).start();
											}).start();	
										}).start();	
									}
								});				
							});
						});
					})
				})
				break;
			}
			case $block.is('#step-5'): {
				$block.find('.empty-list').collapse('hide');
				const $addSection = $block.find('.add-section').show();
				const $summernote = $addSection.find('.text-input').val(`<p></p><h3 class="text-secondary" style="position: absolute; right: 2rem; opacity: 0.5;">노트 작성 예시</h3><span style="font-size: 16px;"><b><font color="#630000">▮ 직역</font></b></span><br><b><br></b><table class="table table-bordered"><tbody><tr><td><p style="text-align: center;">A social media program<br></p></td><td><p style="text-align: center;">is not merely the fulfillment<br></p></td><td><p style="text-align: center;">of a vague need<br></p></td><td><p style="text-align: center;">to manage a "presence"<br></p></td><td><p style="text-align: center;">on popular social networks<br></p></td><td><p style="text-align: center;">because "everyone else is doing it."<br></p></td></tr><tr><td><p style="text-align: center;">소셜 미디어 프로그램은<br></p></td><td><p style="text-align: center;">그저 충족하는 것이 아니다<br></p></td><td><p style="text-align: center;">모호한 필요성의<br></p></td><td><p style="text-align: center;">존재를 관리하는<br></p></td><td><p style="text-align: center;">인기있는 소셜 네트워크에서<br></p></td><td><p style="text-align: center;">다른 모든 사람들이 하고 있기 때문에<br></p></td></tr></tbody></table><b> </b>소셜 미디어 프로그램은 "다른 모든 사람들이 하고 있기 때문에" 인기있는 소셜 네트워크에서 "존재"를 관리해야 하는 막연한 필요성을 그저 충족시키는 것이 아닙니다.<br><br><br><b><span style="font-size: 16px;"><font color="#630000">▮ 기본 구조​</font></span></b><br><br>A social media program / is not merely the fulfillment<b></b><br>소셜 미디어 프로그램은 / 그저 충족하는 것이 아니다&nbsp;<br><br><b><font color="#630000">[어휘]</font></b><br>• merely&nbsp;: 한낱, 그저, 단지&nbsp;<br>• fulfillment : 이행, 수행, 실천, 성취<br><br><b><font color="#630000">[문법]</font></b><br>• 위 문장은 주어, 동사, 보어(SVC)로 이루어진 2형식 문장입니다.<br>&nbsp; &nbsp;보어(C)는 주어(S)가 '누구, 무엇'인지 혹은 주어의 상태, 성질 등이 '어떤지'를 설명합니다.<br><br>A book <font color="#ff0000">is not merely</font> a collection of words on a page.<br>책은 단지 페이지에 있는 단어들의 모음이 아니다.<br><b>&nbsp; &nbsp; &nbsp; &nbsp;</b><br>A painting <font color="#ff0000">is not merely</font> a combination of colors on a canvas.<br>그림은 단지 캔버스 위의 색들의 조합이 아니다.<br><br><br><b><font color="#630000"><span style="font-size: 16px;">▮ 확장 구조​</span></font></b><br><br><table class="table table-bordered"><tbody><tr><td><p style="text-align: center;">A social media program<br></p></td><td><p style="text-align: center;">is not merely the fulfillment<br></p></td><td><p style="text-align: center;">of a vague need<br></p></td><td><p style="text-align: center;">to manage a "presence"<br></p></td><td><p style="text-align: center;">on popular social networks<br></p></td></tr><tr><td><p style="text-align: center;">소셜 미디어 프로그램은<br></p></td><td><p style="text-align: center;">그저 수행하는 것이 아니다<br></p></td><td><p style="text-align: center;">모호한 필요성의<br></p></td><td><p style="text-align: center;">존재를 관리하는<br></p></td><td><p style="text-align: center;">인기있는 소셜 네트워크에서<br></p></td></tr></tbody></table><br><font color="#630000">[어휘]</font><br>• vague : 희미한, 모호한, 애매한&nbsp;<br>• manage : 관리하다<br>• presence : 존재<br><br><b><font color="#630000">[문법]</font></b><br>•<b> </b>a vague need <font color="#ff0000">to manage</font> a "presence"<br>   to부정사의 형용사적 용법으로 명사 need를 수식하고 있습니다.<br><br>I am looking for a book <font color="#ff0000">to read </font>on my vacation.<br>나는 방학에 읽을 책을 찾고 있다.<br><br>The class needs a teacher <font color="#ff0000">to instruct</font> them in Spanish.<br>그 반은 그들을 스페인어로 가르칠 선생님이 필요하다.<br><br><p></p> 
<div style="text-align: right;"> <i><b style=""><font color="#21104a">provided by fico ssam note service</font></b></i> 
</div>`);
				// Summernote 에디터 설정------
				openSummernote($summernote);
				// -------------------------
				(new Promise((resolve) => setTimeout(resolve,1500))).then(() => {
					$block.children('.text-section').slideDown().promise().done(() => {
						anime({
							targets: $block.children('.text-section').find('.title')[0],
							changeBegin: (anim) => {
								anim.animatables[0].target.style.transformOrigin = 'left';
								anim.animatables[0].target.style.visibility = 'visible'
							},
							scaleX: [0,1],
							duration: 500,
							delay: 1500,
							complete: () => {
								guideTextTypewriter
								.pauseFor(500).callFunction(() => {
									const line = createElement({el: 'div', class: 'line row g-0'});
									$block.find('.body-text').append(line);
									new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
									.pasteString('<span class="dot col-auto">• </span>')
									.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(0)').html()+'</div>')
									.pauseFor(500).callFunction(() => {
										const line = createElement({el: 'div', class: 'line row g-0'});
										$block.find('.body-text').append(line);
										new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
										.pasteString('<br><span class="dot col-auto">• </span>')
										.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(1)').html()+'</div>')
										.pauseFor(500).callFunction(() => {
											const block = $(stepHtmlString).find('.block:eq(0)')[0];
											block.style.opacity = '0';
											$block.find('.body-text').append(document.createElement('br'),block)
											anime({
												targets: block,
												easing: 'linear',
												duration: 500,
												delay: 500,
												opacity: [0,1],
												complete: showNextBtn
											})
										}).start();
									}).start();	
								}).start();
							}
						})
					});
				});
				break;
			}
			case $block.is('#step-6'): {
				new Typewriter($block.find('.related-list')[0], { cursor: '', delay: 40})
				.callFunction(() => $block.find('.related-list').addClass('show'))
				.pauseFor(500).changeDelay(40).typeString('<div class="water-mark" style="top: 1.5rem;">예시 입력 문장</div>')
				.pauseFor(1000).changeDelay(20).typeString('<div class="svoc-section row g-0 position-relative"><div class="svoc-block col"><div class="semantics-result" data-seq="3"><span class="sem s inner" data-rc="S">He</span> <span class="sem v inner" data-rc="V">thought</span> <span class="brkt ncls cls-start" data-lv="1">[</span><span class="sem ncls" data-lv="1"><span class="sem o outer" data-rc="O" data-lv="1">that <span class="sem ger" data-gc="동명사"><span class="sem s inner" data-rc="S">knowing these things</span></span> <span class="sem v inner" data-rc="V">would ensure</span> <span class="sem o inner" data-rc="O">his success</span></span></span><span class="brkt  ncls cls-end" data-lv="1">]</span>.</div></div></div>')
				.callFunction(() => tandem.correctMarkLine($block.find('.related-list .semantics-result:eq(0)')[0]))
				.pauseFor(500).changeDelay(40).typeString('<div class="water-mark">인덱스 핑거 예시</div>')
				.pauseFor(1000).changeDelay(20).typeString(`<div class="finger-section one-block"><div class="svoc-section row position-relative"><div class="svoc-block col"><div class="semantics-result" data-seq="8" style="line-height: 1rem; padding-bottom: 29.05px;"><span class="sem s inner cmnt-align-center" data-rc="S">I</span> <span class="sem v inner cmnt-align-center" data-rc="V">heard</span> <span class="brkt ncls cls-start" data-lv="1">[</span><span class="sem ncls cmnt-align-center" data-lv="1"><span class="sem o outer cmnt-align-center" data-rc="O" data-lv="1">that <span class="sem ger cmnt-align-center" data-gc="동명사"><span class="sem s inner cmnt-align-center" data-rc="S">completing a sand painting</span></span> <span class="sem v inner cmnt-align-center" data-rc="V">can take</span> <span class="sem o inner cmnt-align-center" data-rc="O">hours</span>, even days</span></span><span class="brkt  ncls cls-end" data-lv="1">]</span>.<span class="sem line-end" style="line-height: 26.775px;">
</span></div></div></div><div class="trans-block mt-2">모래 그림을 완성하는 데 몇 시간, 심지어 며칠이 걸린다고 들었습니다.</div></div>`)
				.callFunction(() => tandem.correctMarkLine($block.find('.related-list .semantics-result:eq(1)')[0]))
				.pauseFor(1000).typeString(`<div class="finger-section one-block"><div class="svoc-section row position-relative"><div class="svoc-block col"><div class="semantics-result" data-seq="10" style="line-height: 1rem; padding-bottom: 29.05px;"><span class="sem s inner cmnt-align-center" data-rc="S">Einstein</span> <span class="sem v inner cmnt-align-center" data-rc="V">thought</span> <span class="brkt ncls cls-start" data-lv="1">[</span><span class="sem ncls cmnt-align-center" data-lv="1"><span class="sem o outer cmnt-align-center" data-rc="O" data-lv="1">that <span class="sem ger cmnt-align-center" data-gc="동명사"><span class="sem s inner cmnt-align-center" data-rc="S">using violence</span></span> <span class="sem tor cmnt-align-center" data-gc="to부정사">to restore peace</span> <span class="sem v inner cmnt-align-center" data-rc="V">was</span> <span class="sem c inner cmnt-align-center" data-rc="C">paradoxical</span></span></span><span class="brkt  ncls cls-end" data-lv="1">]</span>.<span class="sem line-end" style="line-height: 26.775px;">
</span></div></div></div><div class="trans-block mt-2">아인슈타인은 평화를 회복하기 위해 폭력을 사용하는 것이 역설적이라고 생각했습니다.</div></div>`)
				.callFunction(() => tandem.correctMarkLine($block.find('.related-list .semantics-result:eq(2)')[0]))
				.pauseFor(1000).typeString(`<div class="finger-section one-block"><div class="svoc-section row position-relative"><div class="svoc-block col my-auto"><div class="semantics-result" data-seq="19"><span class="sem s inner" data-rc="S">I</span> <span class="sem v inner" data-rc="V">think</span> <span class="brkt ncls cls-start" data-lv="2">[</span><span class="sem ncls" data-lv="2"><span class="sem o outer" data-rc="O" data-lv="2">that <span class="sem ger" data-gc="동명사"><span class="sem s inner" data-rc="S">killing <span class="sem rcm mfd-19-1" data-gc="수식">somebody</span></span></span> <span class="brkt acls cls-start" data-lv="1">[</span><span class="sem acls" data-mfd="19-1" data-rc="M" data-gc="관계사" data-lv="1"><span class="sem m outer" data-rc="M" data-lv="1"><span class="sem s inner" data-rc="S">that</span> <span class="sem v inner" data-rc="V">hit</span> <span class="sem o inner" data-rc="O">you</span></span></span><span class="brkt  acls cls-end" data-lv="1">]</span> <span class="sem v inner" data-rc="V">is</span> <span class="sem c inner" data-rc="C">just too extreme</span></span></span><span class="brkt  ncls cls-end" data-lv="2">]</span>.</div></div></div><div class="trans-block mt-2">당신을 때린 사람을 죽이는 것은 너무 극단적이라고 생각합니다.</div></div>`)
				.callFunction(() => tandem.correctMarkLine($block.find('.related-list .semantics-result:eq(3)')[0]))
				.callFunction(() => {
					$block.children('.text-section').slideDown().promise().done(() => {
						anime({
							targets: $block.children('.text-section').find('.title')[0],
							changeBegin: (anim) => {
								anim.animatables[0].target.style.transformOrigin = 'left';
								anim.animatables[0].target.style.visibility = 'visible'
							},
							scaleX: [0,1],
							duration: 500,
							delay: 500,
							complete: () => {
								guideTextTypewriter
								.pauseFor(500).callFunction(() => {
									const line = createElement({el: 'div', class: 'line row g-0'});
									$block.find('.body-text').append(line);
									new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
									.pasteString('<span class="dot col-auto">• </span>')
									.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(0)').html()+'</div>')
									.pauseFor(500).callFunction(() => {
										const line = createElement({el: 'div', class: 'line row g-0'});
										$block.find('.body-text').append(line);
										new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
										.pasteString('<br><span class="dot col-auto">• </span>')
										.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(1)').html()+'</div>')
										.pauseFor(500).callFunction(() => {
											const line = createElement({el: 'div', class: 'line row g-0'});
											$block.find('.body-text').append(line);
											new Typewriter(line, { cursor: '', delay: 40, wrapperClassName: 'row g-0'})
											.pasteString('<br><span class="dot col-auto">• </span>')
											.pauseFor(500).typeString('<div class="col">'+$(stepHtmlString).find('.line:eq(2)').html()+'</div>')
											.pauseFor(500).callFunction(showNextBtn).start();
										}).start();
									}).start();	
								}).start();
							}
						});
					});
				}).start();
				break;
			}
			default: break;
		}

		function showNextBtn() {
			setTimeout(() => {
				$block.find('.next-btn-section').css('visibility','visible').bounce();
			}, 500);
		}
	}
	function renderSentences() {
		const sentenceListLen = sentenceList.length;
		for(let i = 0; i < sentenceListLen; i++){
			
			const sentence = sentenceList[i];
			let $sectionClone;
			if(i > 0) {
				$sectionClone = $copySection.clone().hide();
				$sectionClone.find('#step-1 .ai-translation-block,#step-4,.step-block-unit>.text-section').remove();
				$sectionClone.find('.step-block-unit').css('display','').addClass('collapse');
				$results.append($sectionClone);
			}else {
				$sectionClone = $('.one-sentence-unit-section:eq(0)');
				$sectionClone.find('.step-block-unit')
			}
			$sectionClone.data('sentenceId', sentence.sentenceId).attr('id','sentence' + (i+1))
			.on('click', '.origin-sentence-section', function(e) {
				if(e.target.closest('[class*="js-tts"]')) return;
				$sectionClone.children('.collapse').collapse('toggle');
				$(this).find('.fold-icon').toggleClass('expanded');
			})
			.find('.collapse-btn').each(function() {
				this.dataset.bsTarget = `#sentence${i+1} ${this.dataset.collapseSelector}`;
				this.setAttribute('aria-controls',`#sentence${i+1} ${this.dataset.collapseSelector}`);
			})
			$('.result-survey-section [name="svocId"]').val(sentence.svocList[0].svocId);
			
			// 1. 원문 표시--------------------------------------------------------
			$sectionClone.find('.origin-sentence').append(createElement(
			[
				{ el: 'span', className: 'numbering-text print-removed', textContent: (i + 1) },
				{ el: 'span', className: 'sentence-text', textContent: sentence.text },
				{ el: 'div', className: 'd-inline-block', children: [
					{ el: 'button', type: 'button', className: 'btn text-fc-purple ms-2 p-0 material-icons-outlined border-0 fs-3 js-tts-play', 
						'data-bs-toggle': 'tooltip', title: '재생/중지', 'data-active': 'on', textContent: 'play_circle'
					}/*,
					{ el: 'button', id: 'ttsSetting', class: 'btn d-inline w-auto text-fc-purple m-0 p-0 ps-2 material-icons-outlined fs-3 border-0 shadow-none bg-transparent js-tts-setting',
					'data-bs-toggle': 'tooltip', title: '음성 설정', textContent: 'tune' }*/
				]}			
			]));
			// 2. SVOC 표시------------------------------------------------
			const text = sentence.text, svocList = sentence.svocList,
				svocListLen = svocList?.length;
			tandem.showSemanticAnalysis(text, svocList[0].svocBytes, $sectionClone.find('.svoc-block'));
			
			// 3. 해석 표시 
			
			const korList = sentence.korList;
			if(korList != null && korList.length > 0) {
				const korListLen = korList.length,
					$aiTransSection = $sectionClone.find('.ai-translation-section')
												   .show().empty();
				for(let j = 0; j < korListLen; j++) {
					const $transBlock = $transCopyBlock.clone();
					$aiTransSection.append($transBlock);
					$transBlock.find('.translation-text').text(korList[j].kor);
				}
				$aiTransSection.find('.ai-translation-block').first().show();
			}
			// 4. 단어 표시 
			const wordList = sentence.wordList;
			if(wordList != null && wordList.length > 0) {
				const wordListLen = wordList.length,
					$wordSection = $sectionClone.find('.word-section .one-block').empty();
				for(let j = 0; j < wordListLen; j++) {
					const word = wordList[j], $wordBlock = $wordCopySection.clone();
					$wordBlock.find('.one-part-unit-section').remove();
					
					// 단어의 품사별 뜻 표시
					$wordSection.append($wordBlock);
					$wordBlock.find('.title').text(word.title).attr('data-playing','off').click(function(e){
							e.stopPropagation();
							const on = this.dataset.playing == 'on';
							if(on) {
								stopAllTTS();
							}else {
								stopAllTTS(this);
								this.dataset.playing = 'on';
								anime({ targets: this, opacity: [0,1,0,1], easing: 'linear', loop: true})
								tts.speakRepeat(word.title, 2, 500, () => {
									anime.remove(this);
									this.style.opacity = 1;
									this.dataset.playing = 'off';
								});
							}
					});
					const senseList = word.senseList;
					if(senseList == null) continue;
					var senseListLen = senseList.length;
					
					for(let k = 0; k < senseListLen; k++) {
						const sense = senseList[k]; $partBlock = $partCopySection.clone();
						
						$wordBlock.append($partBlock);
						$partBlock.find('.part').text(sense.partType).attr('title', partTypeMap[sense.partType]);
						$partBlock.find('.meaning').text(sense.meaning);
					}
				}
			}
			
			// 5. 유사 문장 표시 
			const fingerList = sentence.fingerList;
			if(fingerList != null && fingerList.length > 0) {
				const fingerListLen = fingerList.length;
				$fingerSection = $sectionClone.find('.index-finger-sentence-section .sentence-section');
				   
				for(let j = 0; j < fingerListLen; j++) {
					const finger = fingerList[j], $fingerBlock = $fingerCopyBlock.clone();
					$fingerSection.append($fingerBlock);
					$fingerBlock.find('.eng').text(finger.eng);
					$fingerBlock.find('.score').text(finger.score);
				}
			}
		}
	}

	// [렌더링 완료 - 로딩 이미지 제거]-----------------------------------------------
	$('#loadingModal').on('hidden.bs.modal', function() {
		$('.result-survey-section').fadeIn(1000);
	});
	setTimeout(() => $('#loadingModal').modal('hide'), 1000);
	
	$(document)
	// 구문분석 영역 펼쳐지면 분석 렌더링 새로고침
	.on('shown.bs.collapse', '#step-1', function() {
		$(this).find('.semantics-result:visible').each((_,el) => {
			tandem.correctMarkLine(el);
		})
	})
	// [번역 영역 펼치고 접기]------------------------------------------------------- 
	.on('click', '.open-kor-btn,.ai-translation-section', function() {
		const $transSection = $(this).closest(".translation-section");
		const $elements = $transSection.find(".ai-translation-block:not(:first)");
		const $foldBtn = $transSection.find('.open-kor-btn');
		$elements.collapse($foldBtn.is('.active') ? 'hide' : 'show');
		$foldBtn.find('.fold-icon').toggleClass('expanded',!$foldBtn.is('.active')); 
		$foldBtn.toggleClass('active');
	})
	// TTS 재생
	.on('click', '.js-tts-play, .js-tts-play-sentence', function(e) {
		e.stopPropagation();
		const on = this.dataset.playing == 'on';
		if(on) {
			stopAllTTS();
		}else {
			stopAllTTS(this);
			const text = this.closest('.origin-sentence').querySelector('.sentence-text').textContent;

			this.dataset.playing = 'on';
			this.textContent = 'stop_circle';
			tts.speakRepeat(text, 2, 500, () => {
				this.dataset.playing = 'off';
				this.textContent = 'play_circle';
			});
			
		}
	})
	.on('click', '.js-tts-setting', function(e) {
		e.stopPropagation();
		stopAllTTS();
		tts.openSettings();
	})
	function stopAllTTS(except) {
		tts.stop();
		document.querySelectorAll('[class*="js-tts-play"][data-playing="on"],.title[data-playing="on"]').forEach(playBtn => {
			if(except == playBtn) return;
			if(playBtn.matches('.title')) {
				anime.remove(playBtn);
				playBtn.style.opacity = 1;
			}else {
				playBtn.textContent = 'play_circle';
			}
			playBtn.dataset.playing = 'off';
		})
	}	
	
	// [피코의 문장출처 표시]
	const now = new Date(),
		oneJan = new Date(now.getFullYear(),0,1),
		numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000)),
		numberOfweeks = Math.ceil(( now.getDay() + 1 + numberOfDays) / 7);
	$.getJSON('https://static.findsvoc.com/data/sentence/sources.json?week='
	+ encodeURI([now.getFullYear(),numberOfweeks].join('-')), titles => {
		const $titleList = $('.sentence-source-list'),
			shuffled = titles.sort((a, b) => Math.random() - 0.5),
			titleCount = titles.length;
		for(let i = 0, len = 5; i < len; i++) {
			const $sentenceUnit = $('<div class="d-inline-block mw-100 badge rounded-pill text-white bg-pink-500 me-1 text-base text-truncate nanumbarungothic"> \
								<span class="title text-white"></span></div>');
			$sentenceUnit.appendTo($titleList)
						 .find('.title').text('#' + titles[i]);
		}
	});
	
	
	// [워크북 표지 클릭시 워크북 인덱스 이동] --------------------------------------------
	$('.book').click(function() {
		location.href = "/workbook";
	});
	
	
} //end of ready
/**
 * 은은하게 올라오는 효과
 */
function showUp($element) {
	$element.css('opacity','0').css('top','10px').show(0,function() {
		$(this).animate({opacity: 1, top: 0}, 500);
	});
}
