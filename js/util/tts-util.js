/**
 * fico(웹, 안드로이드앱)에서 TTS서비스를 이용하는 메소드 집합
 @requires All Platforms except Internet Explorer
 @notsupport Pause & Resume are only works with local voice. So didn't implement them.
 @donot Don't remove all EventListeners on beforeunload Event.
 @author LGM
 
 @param options{lang, pitch, rate, voiceIndex, initSuccessCallback, initFailCallback}
 */
(function($, window, document) {
	/**
	@usage
	1. var tts = new FicoTTS(); //just initialize.. does not guarantee immediate function.
	2. var tts = new FicoTTS(() => tts.openSettings()); // after initialization, the parmeter function can be called.
	3. var tts = new FicoTTS({lang: 'en', pitch: 1.2, ...}) // initialize with options including callback functions.
	 */
	var FicoTTS = function(options) {
		if(typeof options == 'function') {
			options = {initSuccessCallback: options};
		}
		const globalOptions = JSON.parse(localStorage.getItem('FicoTTSOptions'));
		_options = Object.assign({},_options, FicoTTS.defaults, globalOptions, options);
		this.init();
	}
	const _actors = {	
		// Mobile browsers including mobile chrome are not supported.
		// Android Webview
		"en-au-x-aub-network":"Braith", //호주 남자
		"en-au-x-aud-network":"Lachlan", //호주 남자
		"en-au-x-afh-network":"Narelle", //호주 여자
		"en-au-x-auc-network":"Kayla", //호주 여자
		"en-au-x-aua-network":"Abigail", //호주 여자
		"en-gb-x-gbb-network":"Taylor", //영국 남자
		"en-gb-x-gbd-network":"Nicholas", //영국 남자
		"en-gb-x-fis-network":"Keira", //영국 여자
		"en-gb-x-gba-network":"Grace", //영국 여자
		"en-gb-x-gbc-network":"Lauren", //영국 여자
		"en-gb-x-rjs-network":"Peter", //영국 남자
		"en-gb-x-gbg-network":"Libby", //영국 여자
		"en-in-x-ene-network":"Salah", //인도 남자
		"en-in-x-enc-network":"Atika", //인도 여자
		"en-in-x-ena-network":"Farah", //인도 여자
		"en-in-x-ahp-network":"Sayyar", //인도 여자
		"en-in-x-cxx-network":"Bahiya", //인도 여자
		"en-in-x-end-network":"Husam", //인도 남자
		"en-ng-x-tfn-network":"Jenete", //나이지리아 여자
		"en-us-x-sfg-network":"Mary", //미국 여자
		"en-us-x-tpd-network":"James", //미국 남자
		"en-us-x-tpc-network":"Michelle", //미국 여자
		"en-us-x-iob-network":"Josephine", //미국 여자
		"en-us-x-iol-network":"Joe", //미국 남자
		"en-us-x-iom-network":"Paul", //미국 남자
		"en-us-x-iog-network":"Gloria", //미국 여자
		"en-us-x-tpf-network":"Cathy", //미국 여자
	  
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
		"Microsoft Natasha Online (Natural) - English (Australia)":"Natasha", //호주 여자
		"Microsoft Clara Online (Natural) - English (Canada)":"Clara", //캐나다 여자
		"Microsoft Neerja Online (Natural) - English (India)":"Neerja", //인도 여자
		"Microsoft Emily Online (Natural) - English (Ireland)":"Emily", //아일랜드 여자
		"Microsoft Abeo Online (Natural) - English (Nigeria)":"Abeo", //나이지리아 남자
		"Microsoft Rosa Online (Natural) - English (Philippines)":"Rosa", //필리핀 여자
		"Microsoft Leah Online (Natural) - English (South Africa)":"Leah", //남아프리카 여자
		"Microsoft Sonia Online (Natural) - English (United Kingdom)":"Sonia", //영국 여자
		"Microsoft Aria Online (Natural) - English (United States)":"Aria", //미국 여자
		"Microsoft Guy Online (Natural) - English (United States)":"Guy", //미국 남자
		"Microsoft Jenny Online (Natural) - English (United States)":"Jenny", //미국 여자
		
		//Firefox
		 "Microsoft Zira Desktop - English (United States)":"Zira" //미국 여자
	}
	const sampleText = 'Hi. I\'m fico advisor.';
	let voices;
	let utterance;
	let _options;
	FicoTTS.defaults = {
		enabled: true, lang: 'en', pitch: 1, rate: 0.8, voiceIndex: 0, initSuccessCallback: () => {}, initFailCallback: () => {}
	};
	(function() {
		// ANI(App Native Interface)가 구현돼있을 경우 흐름
		if(typeof ANI != 'undefined' && typeof ANI.ttsSpeak != 'undefined') {
			let ANI_Initialized = makeFunc2Callback(() => {
				console.info('initialize success')
				voices = JSON.parse(ANI.getVoices()).filter(v => v.lang.startsWith('en-'));
				window.addEventListener('pagehide', () => this.stop());
				_options.initSuccessCallback();
			});
			this.init = () => {
				ANI.textToSpeechInit(_options.lang,
					ANI_Initialized, 
					makeFunc2Callback(() => {
						console.info('initialize failed')
						_options.initFailCallback();
					}));
				appendModal();
			}
			this.changeOptions = (options) => {
				_options = Object.assign(_options, options);
				localStorage.setItem('FicoTTSOptions', JSON.stringify(_options));				
				ANI.changeTTSOptions(JSON.stringify(options));
			}
			
			this.speak = (text, callback = () => {}) => {
				if(_options.enabled) {
				callback = [makeFunc2Callback(callback)];
				
				ANI.ttsSpeak(text, callback);
				}
			}
			
			this.speakRepeat = (text, loopNum, interval, callback = () => {}) => {
				if(_options.enabled) {
				callback = [makeFunc2Callback(callback)];
				ANI.ttsSpeakRepeat(text, loopNum, interval, callback);
				}
			}
			
			this.speakSample = (idx, rate, pitch) => {
				if(_options.enabled) {
				ANI.ttsSpeakSample(sampleText, idx, rate, pitch, [makeFunc2Callback(()=> {
					ANI.changeTTSOptions(JSON.stringify(_options));
				})]);
				}
			}
			
			this.stop = (callback = () => {}) => {
				callback = [makeFunc2Callback(callback)];
				ANI.ttsStop(callback);
			}
			this.isEnabled = () => _options.enabled;
			
			let waitVoices, voiceTryCount = 0;
			this.openSettings = () => {
				// 아직 불러올 목소리가 없을 경우
				if(voices == null || voices.length == 0) {
					// 타이머 미세팅
					if(waitVoices == null) {
						voiceTryCount = 0; 
						voices = JSON.parse(ANI.getVoices()).filter(v => v.lang.startsWith('en-'));
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
					waitVoices = null;
					showLists();
				}
			}
			// ANI에서 evaluateJavascript 실행이 가능한 형태의 코드로 반환
			const makeFunc2Callback = (func = () => {}) => {
				const randId = Math.random().toString().substring(2);
				window[`TTSCallback${randId}`] = () => {
					delete window[`speakCallback${randId}`];
					func();
				}
				return `window.TTSCallback${randId}();`;
			}
		}
		// Web SpeechSynthesis API 사용 가능한 브라우저일 경우 흐름
		else if('speechSynthesis' in window) {
			let loopNum = 1, loopInterval = 200, loopTimer, endCallback;
			this.init = () => {
				utterance = new SpeechSynthesisUtterance();
				utterance.onend =  function() {
					if(loopNum > 1) {
						loopNum--;
						loopTimer = setTimeout(() => 
							speechSynthesis.speak(utterance)
						,loopInterval);
					}else {
						clearTimeout(loopTimer);
						if(endCallback != null) endCallback();
						endCallback = null;
					}
				}
				if('onvoiceschanged' in speechSynthesis) {
					speechSynthesis.onvoiceschanged = initVoices;
				}else initVoices();
				appendModal();
			}
			this.speak = (text, callback = () => {}) => {
				if(_options.enabled) {
					if(this.initialized == undefined) {
						setTimeout(() => this.speak(text, callback), 250);
						return;
					}
					speechSynthesis.cancel();
					clearTimeout(loopTimer);
					utterance.text = text;
					endCallback = callback;
					
					speechSynthesis.speak(utterance);
				}
			}
			this.speakRepeat = (text, loop, interval, callback = () => {}) => {
				if(_options.enabled) {
					if(speechSynthesis.speaking) speechSynthesis.cancel();
					clearTimeout(loopTimer);
					utterance.text = text;
					loopNum = loop;
					loopInterval = interval;
					endCallback = callback;
					
					speechSynthesis.speak(utterance);
				}
			}
			this.speakSample = (idx, rate, pitch) => {
				if(_options.enabled) {
					utterance.text = sampleText;
					utterance.voice = voices[idx];
					utterance.rate = rate;
					utterance.pitch = pitch;
					if(speechSynthesis.speaking) speechSynthesis.cancel();
					speechSynthesis.speak(utterance);
				}
			}
			this.stop = (callback = (() => {})) => {
				speechSynthesis.cancel();
				clearTimeout(loopTimer);
				callback();
			}
			this.isEnabled = () => _options.enabled;
			this.changeOptions = (options) => {
				_options = Object.assign(_options, options);
				localStorage.setItem('FicoTTSOptions', JSON.stringify(_options));
				utterance.lang = _options.lang;
				utterance.pitch = _options.pitch;
				utterance.rate = _options.rate;
				utterance.voice = voices[_options.voiceIndex];
			}
			let waitVoices, voiceTryCount = 0;
			this.openSettings = () => {
				if(voices == null || voices.length == 0) {
					if(waitVoices == null) {
						voiceTryCount = 0; 
						voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en-'));
						waitVoices = setInterval(this.openSettings, 250);
					}else if(voiceTryCount < 20) {
						voiceTryCount++
					}else {
						voiceTryCount = 0;
						clearInterval(waitVoices);
						waitVoices = null;
						alert('목소리 목록을 가져올 수 없습니다.');
						showLists();
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
				voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en-'));
				utterance.voice = voices[_options.voiceIndex];
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
			if(document.querySelector('#ttsSettings') == null) document.body.insertAdjacentHTML('afterend',
				'<div class="modal fade" id="ttsSettings" data-bs-backdrop="static" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content rounded-8">'
				+ '<style>'
				+ '#ttsSettings input[type=range]::-webkit-slider-thumb {background:var(--fc-purple);}'
				+ '#ttsSettings .form-check-input:checked {'
				+ 'background-color:var(--fc-purple);border-color:var(--fc-purple);}'
				+ '#ttsSettings .btn-check:checked+.btn {'
				+ '-webkit-animation: pulsate-bck 1s linear infinite both;'
				+ 'animation: pulsate-bck 1s linear infinite both;}'
				+ '@-webkit-keyframes pulsate-bck {'
				+ '0% {-webkit-transform: scale(1);transform: scale(1);}'
				+ '50% {-webkit-transform: scale(0.9);transform: scale(0.9);}'
				+ '100% {-webkit-transform: scale(1);transform: scale(1);}'
				+ '}@keyframes pulsate-bck {'
				+ '0% {-webkit-transform: scale(1);transform: scale(1);}'
				+ '50% {-webkit-transform: scale(0.9);transform: scale(0.9);}'
				+ '100% {-webkit-transform: scale(1);transform: scale(1);}}'
				+ '#ttsSettings .form-check-input:focus {'
				+ 'border-color:var(--fc-purple);box-shadow:0 0 0 0.25rem #58517440;'
				+ 'background-image:url("data:image\/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'-4 -4 8 8\'%3e%3ccircle r=\'3\' fill=\'%23847aaf\'/%3e%3c/svg%3e")}'
				+ '#ttsSettings input[type=range]::after {content:attr(data-range);margin-left:10px}'
				+ '</style>'
				+ '<div class="modal-header">'
				+ '<h5 class="modal-title fw-bold text-fc-purple">음성 환경설정</h5>'
				+ '<div class="ms-auto text-align-end form-check form-switch">'
				+ `<input class="form-check-input" type="checkbox" id="ttsToggle" ${_options.enabled?'checked':''}>`
				+ '<label class="form-check-label" for="ttsToggle">음성 켜기</label></div>'
				+ '<button type="button" class="btn-close ms-2" data-bs-dismiss="modal" aria-label="Close" title="닫기"></button>'
				+ '</div>'
				+ `<div class="modal-body${_options.enabled?'':' pe-none opacity-50'}">`
				+ '<label for="ttsList" class="form-label sub-title fs-6">목소리 선택</label>'
				+ '<div class="col-12 mb-3 row g-0" id="ttsList"></div>'
				+ '<label for="ttsRateRange" class="form-label sub-title fs-6">목소리 빠르기 <span class="text-secondary">(기본: 0.8)</span></label>'
				+ `<input type="range" class="form-range" id="ttsRateRange" min="0.1" max="2" step="0.1" data-range="${_options.rate.toFixed(1)}" value="${_options.rate.toFixed(1)}" oninput="this.dataset.range=parseFloat(this.value).toFixed(1)">`
				+ '<label for="ttsPitchRange" class="form-label sub-title fs-6">목소리 높이 <span class="text-secondary">(기본: 1.0)</span></label>'
				+ `<input type="range" class="form-range" id="ttsPitchRange" min="0" max="2" step="0.1" data-range="${_options.pitch.toFixed(1)}" value="${_options.pitch.toFixed(1)}" oninput="this.dataset.range=parseFloat(this.value).toFixed(1)">`
				+ '</div></div></div></div>');
		}
		
		const showLists = () => {
			const select = document.getElementById('ttsList');
			while(select.hasChildNodes()) {
				select.removeChild(select.firstChild);
			}
			for(let i = 0, len = voices.length; i < len; i++) {
				const voice = voices[i];
				select.insertAdjacentHTML('beforeend',
					`<div class="col-3 p-1 p-sm-3"><input value="${i}" id="ttsVoice${i}" name="ttsVoice" type="radio" class="btn-check d-none" ${(i==_options.voiceIndex)?'checked':''}><label for="ttsVoice${i}" class="btn btn-outline-fico position-relative border-0 mx-auto p-1"><img class="rounded-circle w-100" src="https://static.findsvoc.com/images/app/tts/profile/${_actors[voice.name]||'default'}.jpg"><img class="rounded-3 position-absolute bottom-0 end-0 border" style="width:33%" src="https://flagcdn.com/w40/${voice.lang.replace('scotland','GB-SCT').toLowerCase().substring(3)}.png"></label><span class="d-block ps-2 text-fico">${_actors[voice.name]||voice.name}</span></div>`);
			}
			$('#ttsSettings').modal('show');
		}
		$(document)
		// 음성 켜기/끄기
		.on('change', '#ttsToggle', e => {
			$('#ttsSettings').find('.modal-body').toggleClass('pe-none opacity-50', !e.target.checked);
			_options.enabled = e.target.checked;
			if(!_options.enabled) this.stop();
		})
		// 설정값 변경(변경과 동시에 미리 들어보기)
		.on('click change','[name=ttsVoice], #ttsRateRange, #ttsPitchRange', () => {
			this.speakSample(parseInt($('#ttsSettings [name="ttsVoice"]:checked').val()), 
				parseFloat($('#ttsRateRange').val()), parseFloat($('#ttsPitchRange').val()));
		})
		// 변경된 설정값을 전역 적용
		.on('hide.bs.modal', '#ttsSettings', () => {
			this.changeOptions({
				voiceIndex: parseInt($('#ttsSettings [name="ttsVoice"]:checked').val()),
				pitch: parseFloat($('#ttsPitchRange').val()),
				rate: parseFloat($('#ttsRateRange').val())
			});
			this.stop();
		});
		
	}).call(FicoTTS.prototype);
	globalThis.FicoTTS = FicoTTS;
})(jQuery, this, document);
