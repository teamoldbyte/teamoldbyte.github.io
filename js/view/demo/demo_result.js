/** /demo/demo_result.html
 @author LGM
 */
function pageinit(sentenceList){
	// 모바일이 아니거나 화면회전 기능을 지원하지 않으면 화면회전 버튼 삭제
	if(!/Mobi/.test(navigator?.userAgent) || !screen.orientation ) {
		$('.js-rotate-btn').remove();
	}
	const tts = new FicoTTS({autoplay: false, initSuccessCallback: () => {
		// 자동재생 조작 금지
		document.querySelector('#ttsSettings .form-switch').remove();
	}});	
	const $results = $('.result-section');
	
	let $copySection = $('.one-sentence-unit-section').clone();
	let $transCopyBlock = $copySection.find('.ai-translation-block');
	let $wordCopySection = $copySection.find('.one-word-unit-section');
	let $partCopySection = $copySection.find('.one-part-unit-section');
	let $fingerCopyBlock = $copySection.find('.one-sentence-unit-block');

	const sentenceListLen = sentenceList.length;
	for(let i = 0; i < sentenceListLen; i++){
		
		const sentence = sentenceList[i];
		let $sectionClone;
		if(i > 0) {
			$sectionClone = $copySection.clone();
			$results.append($sectionClone);
		}else {
			$sectionClone = $('.one-sentence-unit-section:eq(0)');
		}
		$('.result-survey-section [name="svocId"]').val(sentence.svocList[0].svocId);
		
		// 1. 원문 표시--------------------------------------------------------
		$sectionClone.find('.origin-sentence').append(createElement(
		[
			{ el: 'span', className: 'numbering-text print-removed', textContent: (i + 1) },
			{ el: 'span', className: 'sentence-text', textContent: sentence.text },
			{ el: 'div', className: 'd-inline-block', children: [
				{ el: 'button', type: 'button', className: 'btn text-fc-purple ms-2 p-0 material-icons-outlined border-0 fs-3 js-tts-play', 
					'data-bs-toggle': 'tooltip', title: '재생/중지', 'data-active': 'on', textContent: 'play_circle'
				},
				{ el: 'button', id: 'ttsSetting', class: 'btn d-inline w-auto text-fc-purple m-0 p-0 ps-2 material-icons-outlined fs-3 border-0 shadow-none bg-transparent js-tts-setting',
				'data-bs-toggle': 'tooltip', title: '음성 설정', textContent: 'tune' }
			]}			
		]));
		// 2. SVOC 표시------------------------------------------------
		const text = sentence.text, svocList = sentence.svocList,
			svocListLen = svocList?.length;
		tandem.showSemanticAnalysis(text, svocList[0].svocBytes, $sectionClone.find('.result-semantic-section'));
		
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
				$wordSection = $sectionClone.find('.word-section').show().empty();
			for(let j = 0; j < wordListLen; j++) {
				const word = wordList[j], $wordBlock = $wordCopySection.clone();
				$wordBlock.find('.one-part-unit-section').remove();
				
				// 단어의 품사별 뜻 표시
				$wordSection.append($wordBlock);
				$wordBlock.find('.title').text(word.title);
				const senseList = word.senseList;
				if(senseList == null) continue;
				var senseListLen = senseList.length;
				
				for(let k = 0; k < senseListLen; k++) {
					const sense = senseList[k]; $partBlock = $partCopySection.clone();
					
					$wordBlock.append($partBlock);
					$partBlock.find('.part').text(sense.partType);
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
	// [렌더링 완료 - 로딩 이미지 제거]-----------------------------------------------
	$('#loadingModal').on('hidden.bs.modal', function() {
		$('.result-survey-section').fadeIn(1000);
	});
	setTimeout(() => $('#loadingModal').modal('hide'), 1000);
	
	// [번역 영역 펼치고 접기]------------------------------------------------------- 
	$(document).on('click', '.open-kor-btn,.ai-translation-section', function() {
		const $transSection = $(this).closest(".translation-section");
		const $elements = $transSection.find(".ai-translation-block:not(:first)");
		const $foldBtn = $transSection.find('.open-kor-btn');
		$elements.collapse($foldBtn.is('.active') ? 'hide' : 'show');
		$foldBtn.find('.fold-icon').toggleClass('expanded',!$foldBtn.is('.active')); 
		$foldBtn.toggleClass('active');
	})
	// TTS 재생
	.on('click', '.js-tts-play, .js-tts-play-sentence', function(e) {
		const on = this.dataset.active == 'on';
		document.querySelectorAll('.js-tts-play').forEach(playBtn => {
			playBtn.dataset.active = 'on';
			playBtn.textContent = 'play_circle';
		})		
		this.dataset.active = on?'off':'on';
		this.textContent = on?'stop_circle':'play_circle';
		if(on) {
			tts.speakRepeat(
			// 모바일일 경우 현재 슬라이드의 문장. 데스크탑일 경우 재생버튼이 속한 문장.
			this.closest('.origin-sentence').querySelector('.sentence-text').textContent,
		 	2, 500, () => {
				this.dataset.active = 'on';
				this.textContent = 'play_circle';
			});
		}else {
			tts.stop();
		}
	})
	.on('click', '.js-tts-setting', function(e) {
		tts.stop();
		document.querySelectorAll('.js-tts-play').forEach(playBtn => {
			playBtn.dataset.active = 'on';
			playBtn.textContent = 'play_circle';
		})
		tts.openSettings();
	})
	
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
	
	// [랜덤 워크북 소개 멘트 표시] --------------------------------------------
	var randNum = Math.floor(Math.random() * 8) + 1;
	showUp($('.random-text-'+randNum));
	
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
