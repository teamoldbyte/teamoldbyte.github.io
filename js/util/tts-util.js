/**
 * fico(웹, 안드로이드앱)에서 TTS서비스를 이용하는 메소드 집합
 @requires All Platforms except Internet Explorer
 @notsupport Pause & Resume are only works with local voice. So didn't implement them.
 @donot Don't remove all EventListeners on beforeunload Event.
 @author LGM
 
 @param options{autoplay, lang, pitch, rate, voiceIndex, initSuccessCallback, initFailCallback}
 ** autoplay - 자동재생여부. 이 모듈에서 사용하지 않음. 모듈 호출부에서 호출여부 판단시 사용. 값 저장만 모듈이 대신 해줌.
 */
(function($, window, document) {
	/**
	@usage
	1. var tts = new FicoTTS(); //just initialize.. does not guarantee immediate function.
	2. var tts = new FicoTTS(() => tts.openSettings()); // after initialization, the parmeter function can be called.
	3. var tts = new FicoTTS({lang: 'en', pitch: 1.2, ...}) // initialize with options including callback functions.
	 */
	class FicoTTS {
        constructor(options) {
            if (typeof options == 'function') {
                options = { initSuccessCallback: options };
            }
            const globalOptions = JSON.parse(localStorage.getItem('FicoTTSOptions'));
            _options = Object.assign({}, _options, FicoTTS.defaults, globalOptions, options);
            this.init();
        }
    }
	const _actors = {	
		// Mobile browsers including mobile chrome are not supported.
		// Android Webview
		"en-au-x-afh-network":"Narelle", //호주 여자
		"en-au-x-afh-local":"Narelle", //호주 여자
		"en-au-x-aua-network":"Abigail", //호주 여자
		"en-au-x-aua-local":"Abigail", //호주 여자
		"en-au-x-aub-network":"Braith", //호주 남자
		"en-au-x-aub-local":"Braith", //호주 남자
		"en-au-x-auc-network":"Kayla", //호주 여자
		"en-au-x-auc-local":"Kayla", //호주 여자
		"en-au-x-aud-network":"Lachlan", //호주 남자
		"en-au-x-aud-local":"Lachlan", //호주 남자
		"en-gb-x-fis-network":"Keira", //영국 여자
		"en-gb-x-fis-local":"Keira", //영국 여자
		"en-gb-x-gba-network":"Grace", //영국 여자
		"en-gb-x-gba-local":"Grace", //영국 여자
		"en-gb-x-gbb-network":"Taylor", //영국 남자
		"en-gb-x-gbb-local":"Taylor", //영국 남자
		"en-gb-x-gbc-network":"Lauren", //영국 여자
		"en-gb-x-gbc-local":"Lauren", //영국 여자
		"en-gb-x-gbd-network":"Nicholas", //영국 남자
		"en-gb-x-gbd-local":"Nicholas", //영국 남자
		"en-gb-x-gbg-network":"Libby", //영국 여자
		"en-gb-x-gbg-local":"Libby", //영국 여자
		"en-gb-x-rjs-network":"Peter", //영국 남자
		"en-gb-x-rjs-local":"Peter", //영국 남자
		"en-in-x-ahp-network":"Sayyar", //인도 여자
		"en-in-x-ahp-local":"Sayyar", //인도 여자
		"en-in-x-cxx-network":"Bahiya", //인도 여자
		"en-in-x-cxx-local":"Bahiya", //인도 여자
		"en-in-x-ena-network":"Farah", //인도 여자
		"en-in-x-ena-local":"Farah", //인도 여자
		"en-in-x-enc-network":"Atika", //인도 여자
		"en-in-x-enc-local":"Atika", //인도 여자
		"en-in-x-end-network":"Husam", //인도 남자
		"en-in-x-end-local":"Husam", //인도 남자
		"en-in-x-ene-network":"Salah", //인도 남자
		"en-in-x-ene-local":"Salah", //인도 남자
		"en-ng-x-tfn-network":"Jenete", //나이지리아 여자
		"en-ng-x-tfn-local":"Jenete", //나이지리아 여자
		"en-us-x-iob-network":"Josephine", //미국 여자
		"en-us-x-iob-local":"Josephine", //미국 여자
		"en-us-x-iog-network":"Gloria", //미국 여자
		"en-us-x-iog-local":"Gloria", //미국 여자
		"en-us-x-iol-network":"Joe", //미국 남자
		"en-us-x-iol-local":"Joe", //미국 남자
		"en-us-x-iom-network":"Paul", //미국 남자
		"en-us-x-iom-local":"Paul", //미국 남자
		"en-us-x-sfg-network":"Mary", //미국 여자
		"en-us-x-sfg-local":"Mary", //미국 여자
		"en-us-x-tpc-network":"Michelle", //미국 여자
		"en-us-x-tpc-local":"Michelle", //미국 여자
		"en-us-x-tpd-network":"James", //미국 남자
		"en-us-x-tpd-local":"James", //미국 남자
		"en-us-x-tpf-network":"Cathy", //미국 여자
		"en-us-x-tpf-local":"Cathy", //미국 여자
	  
		// MacOS + iOS
		"Alex":"Alex", //미국 남자
		"Daniel":"Daniel", //영국 남자
		"Fiona":"Fiona", //스코틀랜드 여자
		"Fred":"Fred", //미국 남자
		"Karen":"Karen", //호주 여자
		"Moira":"Moira", //아일랜드 여자
		"Rishi":"Rishi", //인도 남자
		"Samantha":"Samantha", //미국 여자
		"Tessa":"Tessa", //남아프리카 여자
		"Veena":"Veena", //인도 여자
		"Victoria":"Victoria", //미국 여자
		
		// Chrome
		"Google US English":"Cathy", //미국 여자
		"Google UK English Female":"Abbie", //영국 여자
		"Google UK English Male":"Alexander", //영국 남자
		
		// Edge
		"Microsoft Abeo Online (Natural) - English (Nigeria)":"Abeo", //나이지리아 남자
		"Microsoft Aria Online (Natural) - English (United States)":"Aria", //미국 여자
		"Microsoft Clara Online (Natural) - English (Canada)":"Clara", //캐나다 여자
		"Microsoft Emily Online (Natural) - English (Ireland)":"Emily", //아일랜드 여자
		"Microsoft Guy Online (Natural) - English (United States)":"Guy", //미국 남자
		"Microsoft Jenny Online (Natural) - English (United States)":"Jenny", //미국 여자
		"Microsoft Leah Online (Natural) - English (South Africa)":"Leah", //남아프리카 여자
		"Microsoft Natasha Online (Natural) - English (Australia)":"Natasha", //호주 여자
		"Microsoft Neerja Online (Natural) - English (India)":"Neerja", //인도 여자
		"Microsoft Rosa Online (Natural) - English (Philippines)":"Rosa", //필리핀 여자
		"Microsoft Sonia Online (Natural) - English (United Kingdom)":"Sonia", //영국 여자
		
		//Firefox
		 "Microsoft Zira Desktop - English (United States)":"Zira" //미국 여자
	}
	const SAMPLE_TEXT = 'Welcome to fico. We are making all of the sentences in reading comprehension.';
	let voices, reOrderedVoices;
	let utterance;
	let _options = {initSuccessCallback: function(){}, initFailCallback: function(){}};
	FicoTTS.defaults = {
		autoplay: true, lang: 'en', pitch: 1, rate: 0.8, voiceIndex: 0
	};
	(function() {
		// ANI(App Native Interface)가 구현돼있을 경우 흐름
		if(typeof ANI != 'undefined' && typeof ANI.ttsSpeak != 'undefined') {
			// ANI에서 evaluateJavascript 실행이 가능한 형태의 코드로 반환
			const makeFunc2Callback = (func) => {
				const randId = Math.random().toString().substring(2);
				window[`TTSCallback${randId}`] = () => {
					delete window[`TTSCallback${randId}`];
					(func||(()=>{})).call(this);
				}
				return `window.TTSCallback${randId}();`;
			}			
			let ANI_Initialized = makeFunc2Callback(() => {
				console.info('initialize success')
				voices = JSON.parse(ANI.getVoices()).filter(v => /^en[-_]/.test(v.lang));
				reOrderedVoices = Array.from(voices).sort((a,b) => a.name.localeCompare(b.name));
				this.changeOptions();
				window.addEventListener('pagehide', () => this.stop());
				if(typeof _options.initSuccessCallback == 'function') _options.initSuccessCallback();
			});
			this.init = () => {
				ANI.textToSpeechInit(_options.lang,
					ANI_Initialized, 
					makeFunc2Callback(() => {
						console.info('initialize failed')
						if(typeof _options.initFailCallback == 'function') _options.initFailCallback();
					}));
				appendModal();
			}
			this.changeOptions = () => {
				ANI.changeTTSOptions(JSON.stringify(Object.assign({}, _options, {voiceIndex: voices.indexOf(reOrderedVoices[_options.voiceIndex])})));
			}
			
			this.speak = (text, ...callback) => {
				if(callback.length > 0) callback = [makeFunc2Callback(callback[0])];
				
				ANI.ttsSpeak(text, callback);
			}
			
			this.speakRepeat = (text, loopNum, interval, ...callback) => {
				if(callback.length > 0) callback = [makeFunc2Callback(callback[0])];
				ANI.ttsSpeakRepeat(text, loopNum, interval, callback);
			}
			
			this.speakSample = (idx, rate, pitch) => {
				ANI.ttsSpeakSample(SAMPLE_TEXT, 
				voices.indexOf(reOrderedVoices[idx]), rate, pitch, [makeFunc2Callback(()=> {
					ANI.changeTTSOptions(JSON.stringify(Object.assign({}, _options, {voiceIndex: voices.indexOf(reOrderedVoices[idx])})));
				})]);
			}
			
			this.stop = (...callback) => {
				if(callback.length > 0) callback = [makeFunc2Callback(callback[0])];
				ANI.ttsStop(callback);
			}
			this.autoEnabled = () => _options.autoplay;
			
			let waitVoices, voiceTryCount = 0;
			this.openSettings = () => {
				// 아직 불러올 목소리가 없을 경우
				if(voices == null || voices.length == 0) {
					// 타이머 미세팅
					if(waitVoices == null) {
						voiceTryCount = 0; 
						voices = JSON.parse(ANI.getVoices()).filter(v => /^en[-_]/.test(v.lang));
						reOrderedVoices = Array.from(voices).sort((a,b) => a.name.localeCompare(b.name));
						waitVoices = setInterval(this.openSettings, 250);
					}
					// 아직 초기화 완료 안됐고 재시도 횟수 20회 미만
					else if(ANI_Initialized in window && voiceTryCount < 20) {
						voiceTryCount++;
					}
					// 재시도 횟수가 20회 이상
					else if(voiceTryCount >= 20){
						voiceTryCount = 0;
						clearInterval(waitVoices);
						waitVoices = null;
						alert('목소리 목록을 가져올 수 없습니다.');
						showLists();
					}
					//재시도 실행
					return false;
				}
				// 불러올 목소리가 있을 경우
				else {
					voiceTryCount = 0;
					clearInterval(waitVoices);
					if(!localStorage.getItem('FicoTTSOptions') && reOrderedVoices.find(v => v.name == 'en-us-x-tpc-network')) {
						_options.voiceIndex = reOrderedVoices.findIndex(v => v.name == 'en-us-x-tpc-network');
						this.changeOptions();
					}
					waitVoices = null;
					showLists();
				}
			}
		}
		// Web SpeechSynthesis API 사용 가능한 브라우저일 경우 흐름
		else if('speechSynthesis' in window) {
			let loopNum = 1, loopInterval = 200, loopTimer, endCallback;
			let seamlessInterval; // Chrome Destop 버전은 15초가 되면 강제로 재생을 멈춘다. 브라우저가 멈추기 전에 임의로 멈추고 곧바로 재생함으로써 끊임없게 들리게 한다.
			this.init = () => {
				appendModal();
				utterance = new SpeechSynthesisUtterance();
				utterance.onend =  function() {
					if(loopNum > 1) {
						loopNum--;
						loopTimer = setTimeout(() => 
							speechSynthesis.speak(utterance)
						,loopInterval);
					}else {
						clearInterval(seamlessInterval);
						seamlessInterval = null;
						clearTimeout(loopTimer);
						if(endCallback != null) endCallback();
						endCallback = null;
					}
				}
				if('onvoiceschanged' in speechSynthesis) {
					speechSynthesis.onvoiceschanged = initVoices;
				}else initVoices();
			}
			this.speak = (text, callback = () => {}) => {
				if(this.initialized == undefined) {
					setTimeout(() => this.speak(text, callback), 250);
					return;
				}
				speechSynthesis.cancel();
				clearTimeout(loopTimer);
				utterance.text = text;
				endCallback = callback;
				
				clearInterval(seamlessInterval);
				speechSynthesis.speak(utterance);
				seamlessInterval = setInterval(() => {
					speechSynthesis.pause();
					speechSynthesis.resume();
				}, 14000);
			}
			this.speakRepeat = (text, loop, interval, callback = () => {}) => {
				clearTimeout(loopTimer);
				if(speechSynthesis.speaking) speechSynthesis.cancel();
				utterance.text = text;
				loopNum = loop;
				loopInterval = interval;
				endCallback = callback;
				
				clearInterval(seamlessInterval);
				speechSynthesis.speak(utterance);
				seamlessInterval = setInterval(() => {
					speechSynthesis.pause();
					speechSynthesis.resume()
				}, 14000);				
			}
			this.speakSample = (idx, rate, pitch) => {
				utterance.text = SAMPLE_TEXT;
				utterance.voice = reOrderedVoices[idx];
				utterance.rate = rate;
				utterance.pitch = pitch;
				clearInterval(seamlessInterval);
				seamlessInterval = null;
				if(speechSynthesis.speaking) speechSynthesis.cancel();
				speechSynthesis.speak(utterance);
			}
			this.stop = (callback = (() => {})) => {
				loopNum = 1;
				clearTimeout(loopTimer);
				clearInterval(seamlessInterval);
				seamlessInterval = null;
				speechSynthesis.cancel();
				callback();
			}
			this.autoEnabled = () => _options.autoplay;
			this.changeOptions = () => {
				utterance.lang = _options.lang;
				utterance.pitch = _options.pitch;
				utterance.rate = _options.rate;
				utterance.voice = reOrderedVoices[_options.voiceIndex];
			}
			let waitVoices, voiceTryCount = 0;
			this.openSettings = () => {
				if(voices == null || voices.length == 0) {
					if(waitVoices == null) {
						voiceTryCount = 0; 
						voices = speechSynthesis.getVoices().filter(v => /^en[-_]/.test(v.lang) && v.name != 'Google UK English Female');
						reOrderedVoices = Array.from(voices).sort((a,b) => a.name.localeCompare(b.name));
						waitVoices = setInterval(this.openSettings, 250);
					}else if(voiceTryCount < 20) {
						voiceTryCount++
					}else {
						voiceTryCount = 0;
						clearInterval(waitVoices);
						waitVoices = null;
						// 음성 목록 초기화 실패 시, 안드로이드 기기지만 앱이 아닌 경우 앱을 설치하라고 모달 표시
						// (안드로이드 브라우저는 시스템 기본을 따르므로 필터링해야 함. 모바일 크롬은 음성 lang값이 en_로 시작해서 필터링됨.) 
						if(/Android/i.test(window.navigator.userAgent)
						&& !/FicoApp/i.test(window.navigator.userAgent)) {
							if(document.querySelector('#appPromotionModal') == null) {
								document.body.appendChild(createElement({
									el: 'div', className: 'modal fade', id: 'appPromotionModal', tabIndex: '-1', role: 'dialog', children: [
										{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
											{ el: 'div', className: 'modal-content rounded-8', children: [
												{ el: 'div', className: 'modal-header', children: [
													{ "el":"h5","class":"modal-title fw-bold text-fc-purple col-9","textContent":"앱을 설치해 보세요."},
													{ "el":"button","type":"button","class":"btn-close ms-2","data-bs-dismiss":"modal","aria-label":"Close","title":"닫기"}
												]},
												{ "el":"div","class":"modal-body","children":[
													{ el: 'div', className: 'row g-0', children: [
														{ el: 'img', className: 'col-auto rounded-8 my-auto', 
														src: 'https://static.findsvoc.com/images/logo/app_logo_square.png', 
														width: '100', height: '100', onclick: function() {
															window.open('market://details?id=com.varxyz.demofico')
														}},
														{ el: 'div', className: 'col-8 col-lg-9 ms-3 my-auto', children: [
															'음성 설정이 지원되지 않습니다.',
															{ el: 'br'},
															{ el: 'span', style: 'font-family: "Open Sans";', textContent: 'Google Play'},
															'에서 ',
															{ el: 'span', className: 'app-name-text', textContent: 'fico'},
															'앱을 설치하면 ',
															{ el: 'br', className: 'd-none d-md-block'},
															{ el: 'b', textContent: '다양한 음성 설정'},
															'이 가능합니다.'
														]}
													]},
													{ el: 'a', href: 'https://play.google.com/store/apps/details?id=com.varxyz.demofico&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1',
													children: [
														{ el: 'img', className: 'w-100 mx-auto d-block', alt: '다운로드하기 Google Play', src: 'https://play.google.com/intl/en_us/badges/static/images/badges/ko_badge_web_generic.png'}
													]}
												]}
											]}
										]}
									]
								}));
							}
							$('#appPromotionModal').modal('show');
						}else
							alert('목소리 목록을 가져올 수 없습니다.');
					}
					return false;
				}else {
					voiceTryCount = 0;
					clearInterval(waitVoices);
					waitVoices = null;
					showLists();
				}
			}
			const initVoices = () => {
				voices = speechSynthesis.getVoices().filter(v => /^en-/.test(v.lang) && v.name != 'Google UK English Female');
				reOrderedVoices = Array.from(voices).sort((a,b) => a.name.localeCompare(b.name));
				utterance.voice = reOrderedVoices[_options.voiceIndex];
				this.initialized = true;
				window.addEventListener('pagehide', () => {this.stop()});
				if(voices.length > 0 && _options.initSuccessCallback != null) 
					_options.initSuccessCallback.call(this);
				else if(voices.length == 0 && _options.initFailCallback != null) 
					_options.initFailCallback.call(this);
			}
			
		}else {
			alert('브라우저에서 지원하는 목소리가 없어서\n "읽어주는 서비스"가 제공되지 않습니다.');
			return;
		}
		
		const appendModal = () => {
			if(document.querySelector('#ttsSettings') == null) 
				document.body.appendChild(createElement({
					"el":"div","class":"modal fade","id":"ttsSettings","tabIndex":"-1",
					"aria-modal":"true","role":"dialog","children":[
						{ "el":"div","class":"modal-dialog modal-dialog-centered","children":[
							{ "el":"div","class":"modal-content rounded-8","children":[
								{ "el":"style","textContent":"#ttsSettings input[type=range]::-webkit-slider-thumb {background:var(--fc-purple);}#ttsSettings .form-check-input:checked {background-color:var(--fc-purple);border-color:var(--fc-purple);}#ttsSettings .btn-check:checked+.btn {-webkit-animation: pulsate-bck 1s linear infinite both;animation: pulsate-bck 1s linear infinite both;}@-webkit-keyframes pulsate-bck {0% {-webkit-transform: scale(1);transform: scale(1);}50% {-webkit-transform: scale(0.9);transform: scale(0.9);}100% {-webkit-transform: scale(1);transform: scale(1);}}@keyframes pulsate-bck {0% {-webkit-transform: scale(1);transform: scale(1);}50% {-webkit-transform: scale(0.9);transform: scale(0.9);}100% {-webkit-transform: scale(1);transform: scale(1);}}#ttsSettings .form-check-input:focus {border-color:var(--fc-purple);box-shadow:0 0 0 0.25rem #58517440;background-image:url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23847aaf'/%3e%3c/svg%3e\")}#ttsSettings input[type=range]::after {content:attr(data-range);margin-left:10px}"},
								{ "el":"div","class":"modal-header","children":[
									{ "el":"h5","class":"modal-title fw-bold text-fc-purple","textContent":"음성 환경설정"},
									{ "el":"div","class":"ms-auto text-align-end form-check form-switch", children: [
										{ "el":"input","type":"checkbox","id":"ttsToggle","class":"form-check-input","checked":_options.autoplay},
										{ "el":"label","class":"form-check-label text-dark","htmlFor":"ttsToggle","textContent":"자동 재생"}
									]},
									{ "el":"button","type":"button","class":"btn-close ms-2","data-bs-dismiss":"modal","aria-label":"Close","title":"닫기"}
								]},
								{ "el":"div","class":"modal-body","children":[
									{ "el":"label","for":"ttsList","class":"form-label sub-title fs-6 text-dark","textContent":"목소리 선택"},
									{ "el":"div","class":"col-12 mb-3 row g-0","id":"ttsList"},
									{"el":"label","for":"ttsRateRange","class":"form-label sub-title fs-6 text-dark","children":[
										"목소리 빠르기 ",{"el":"span","class":"text-secondary","textContent":"(기본: 0.8)"}
									]},
									{ "el":"input","type":"range","class":"form-range","id":"ttsRateRange",
									"min":"0.1","max":"2","step":"0.1","data-range":_options.rate.toFixed(1),"value":_options.rate.toFixed(1),"oninput": function() {
										this.dataset.range = parseFloat(this.value).toFixed(1)
									}},
									{ "el":"label","for":"ttsPitchRange","class":"form-label sub-title fs-6 text-dark","children":[
										"목소리 높이 ",{"el":"span","class":"text-secondary","textContent":"(기본: 1.0)"}
									]},
									{ "el":"input","type":"range","class":"form-range","id":"ttsPitchRange",
									"min":"0","max":"2","step":"0.1","data-range":_options.pitch.toFixed(1),"value":_options.pitch.toFixed(1),"oninput": function() {
										this.dataset.range = parseFloat(this.value).toFixed(1)
									}}
								]}
							]}
						]}
					]}
				));
		}
		
		const showLists = () => {
			const select = document.getElementById('ttsList');
			
			select.replaceChildren(createElement(
				// [Google UK English Female 목소리는 현재(2022.10.13) 남자 목소리로 나오기 때문에 제외.]
				Array.from(voices, (voice,i) => {
				return { el: 'div', class: 'col-3 p-1 p-sm-3', children: [
					{ el: 'input', value: i, id: `ttsVoice${i}`, name: 'ttsVoice', type: 'radio', class: 'btn-check d-none', 'data-v-name': voice.name},
					{ el: 'label', htmlFor: `ttsVoice${i}`, class: 'btn btn-outline-fico position-relative border-0 mx-auto p-1', children: [
						{ el: 'img', class: 'rounded-circle w-100', src: `https://static.findsvoc.com/images/app/tts/profile/${_actors[voice.name]||'default'}.jpg`},
						{ el: 'img', class: 'rounded-3 position-absolute bottom-0 end-0 border', src: `https://flagcdn.com/w40/${voice.lang.replace('scotland','GB-SCT').toLowerCase().substring(3)}.png`, style: 'width:33%'}
					]},
					{ el: 'span', class: 'd-block ps-2 text-fico', textContent: _actors[voice.name]||voice.name}
				]}
			}).sort((a,b) => a.children[0]["data-v-name"].localeCompare(b.children[0]["data-v-name"]))));
			$(select).find(`[name="ttsVoice"]:eq(${_options.voiceIndex})`).prop('checked', true);
			$('#ttsSettings').modal('show');
		}
		$(document)
		// 음성 켜기/끄기
		.on('change', '#ttsToggle', e => {
			_options.autoplay = e.target.checked;
		})
		// 설정값 변경(변경과 동시에 미리 들어보기)
		.on('click change','[name=ttsVoice], #ttsRateRange, #ttsPitchRange', () => {
			this.speakSample(parseInt($('#ttsSettings [name="ttsVoice"]:checked').index('[name="ttsVoice"]')), 
				parseFloat($('#ttsRateRange').val()), parseFloat($('#ttsPitchRange').val()));
		})
		// 변경된 설정값을 전역 적용
		.on('hide.bs.modal', '#ttsSettings', () => {
			const options = {
				voiceIndex: $('#ttsSettings [name="ttsVoice"]:checked').index('[name="ttsVoice"]'),
				pitch: parseFloat($('#ttsPitchRange').val()),
				rate: parseFloat($('#ttsRateRange').val())
			};
			_options = Object.assign(_options, options);
			this.changeOptions();
			this.stop();
			localStorage.setItem('FicoTTSOptions', JSON.stringify(Object.assign({}, _options)));	
		});
		
	}).call(FicoTTS.prototype);
	globalThis.FicoTTS = FicoTTS;
})(jQuery, this, document);
