/**
 * Google Cloud Vision API를 이용한 이미지로부터 텍스트 추출
 * @author LGM
 */
class FicoOCR {
	#apiURL = 'https://vision.googleapis.com/v1/images:annotate';
	#apiKey = 'AIzaSyDaB537mMH2usYvkbdWDFqkmVkW8D22yE8'; // this API Key works only on fico
	#imgOrientation = 0;
	#$loadingModal;
	#$resultModal;
	#$textFeedback;
	#preview;
	
	constructor() {(async () => {
		// 파일의 EXIF 정보 추출 라이브러리
		if(typeof EXIF == 'undefined') {
			await $.getScript('https://cdn.jsdelivr.net/npm/exif-js');
		}
		// 특정 영역만 핀치줌 라이브러리
		if(typeof PinchZoom == 'undefined') {
			await $.getScript('https://static.findsvoc.com/js/public/pinch-zoom.js');
		}
		if(typeof Dimmer == 'undefined') {
			await $.getScript('https://static.findsvoc.com/js/public/dimmer.js');
		}
		// 드래그 선택 라이브러리
		if(typeof SelectionArea == 'undefined') {
			await $.getScript('https://cdn.jsdelivr.net/npm/@viselect/vanilla/lib/viselect.cjs.min.js');
		}
		$(document.head).append($(`<style>
			/* 핀치줌 컨테이너 스타일 */
			.pinch-zoom-container {
				background: #000;
			}
			/* 드래그 상자가 올려지는 가상 레이어. 부트스트랩모달의 높이(1060)보다 높아야 함. */
			.selection-area-container { z-index: 1061!important;}
			.selection-area {
			    background: rgba(46, 115, 252, 0.11);
			    border: 2px solid rgba(98, 155, 255, 0.81);
			    border-radius: 0.1em;
			}
			/* 선택 가능 단어 스타일 */
			#ocrResultModal .candidate-text {
			    border: solid 1px #ddd7;
				border-radius: 1px;
			}
			/* 선택이 완료된 단어 스타일 */
			#ocrResultModal .candidate-text.selected-text {border: solid 1px #7f73;}
			/* 추가 선택될 단어 스타일 */
			#ocrResultModal .will-selected {border: solid 2px #0f0!important;}
			/* 선택 제외될 단어 스타일 */
			#ocrResultModal .will-removed {border: solid 2px #f00!important;}
			</style>`));
		// 로딩 모달
		if($('#ocrModal').length == 0) {
			this.#$loadingModal = $(`<div id="ocrModal" class="modal fade" data-bs-backdrop="static" tabindex="-1">
				<div class="modal-dialog modal-dialog-centered d-flex justify-content-center">
				<span class="btn btn-light">
				<span class="spinner-border text-yellow-400" role="status"></span><br>
				<span style="vertical-align: super;">분석 대상이 아닌 한글, 특수문자 등은<br><mark style="background-color:#f9d37a;">⨂</mark>기호로 바뀝니다.</span>
				</span></div></div>`);
			$(document.body).append(this.#$loadingModal);
		}
		// 결과 모달
		if($('#ocrResultModal').length == 0) {
			this.#$resultModal = $(`<div id="ocrResultModal" class="modal fade" data-bs-backdrop="static">
				<div class="modal-dialog modal-lg modal-fullscreen-lg-down modal-dialog-scrollable">
				<div class="modal-content h-100">
				<div class="modal-header row g-0 p-0">
				<div class="modal-title row g-0 bg-fc-purple">
				<span class="title col m-0 p-1 text-center text-white">편집하신 후 <b>완료</b>를 눌러주세요.</span>
				<button type="button" class="btn-close btn-close-white m-0 ms-auto" data-bs-dismiss="modal" title="취소"></button>
				</div>
				<div class="row g-0">
				<input type="radio" id="addArea" class="btn-check" name="selectArea" checked autocomplete="off">
				<label class="btn btn-outline-success col-3 ms-auto" for="addArea"><i class="fas fa-plus-square"></i> 추가</label>
				<input type="radio" id="removeArea" class="btn-check" name="selectArea" autocomplete="off">
				<label class="btn btn-outline-danger col-3" for="removeArea"><i class="fas fa-minus-square"></i> 제거</label>
				<button type="button" id="selectArea" class="btn btn-outline-fico col-3 ms-auto"><i class="fas fa-check-square"></i> 완료</button>
				</div></div>
				<div class="touch-msg bg-dark text-white text-center">두 손가락을 사용하여 스크롤하거나 확대하세요.</div>
				<div class="modal-body bg-dark p-0" style="user-select:none;">
				<img class="img-fluid position-relative pe-none" alt="OCR 이미지" style="filter:brightness(1.3) saturate(2);
				-webkit-filter:brightness(1.3) saturate(2);touch-action:none;user-select:none;-webkit-user-select: none;-webkit-user-drag: none;">
				</div></div></div></div>`);
			$(document.body).append(this.#$resultModal);
		}
		// 터치기기가 아니거나 ios 기기는 '두손가락' 안내 삭제
		if(!(('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))
		|| (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream))  
			this.#$resultModal.find('.touch-msg').remove();
		// OCR 결과창이 표시되면 아이폰을 제외한 기기에  화면 확대 허용.
		this.#$resultModal.on('shown.bs.modal', () => {
			if((/iPad|iPhone|iPod/.test(navigator.userAgent) || window.MSStream)) {
				this.#$resultModal[0].style.touchAction = 'none';
			}
		})
		// OCR 결과창이 닫히면 파일 입력 초기화.
		.on('hidden.bs.modal', () => {
			this.#$resultModal.find('#addArea').prop('checked',true);
			this.#$resultModal.find('.modal-body .candidate-text').remove();
		});
		// [선택 완료. textarea에 값을 옮기고 커서를 제일 앞으로 이동.]
		this.#$resultModal.on('click','#selectArea',() => {
			let text = '', pos = 0;
			this.#$resultModal.find('.modal-body .selected-text').each(function() {
				if(this.offsetLeft < pos) text += '\n';
				text += this.dataset.text + ' ';
				pos = this.offsetLeft;
			});
			this.#$resultModal.modal('hide');
			this.#$textFeedback.call(null,text);
		});
	
		console.info('Fico OCR is ready.')
	})()}
	
	/**
	file을 입력받아 미리보기로 편집가능하게 OCR 실행
	@param file 입력 파일
	@param textFeedback 편집이 완료된 선택 영역의 텍스트를 받아서 실행될 함수
	@param failCallback 인식 실패시 실행될 함수
	 */
	readAsPreview(file, textFeedback, failCallback) {
		$('#ocrModal').modal('show');
		this.#$textFeedback = textFeedback;
		this.imgFile2JSON(file, 
			data => {
				setTimeout(() => {
					$('#ocrModal').modal('hide');
					this.#ocrResultDisplay(data.preview, data.result);
				}, 1000);
			}, 
			() => {
				setTimeout(() => $('#ocrModal').modal('hide'), 1000);
				failCallback?.call();
			}
		);
	}
	
	/**
	file을 입력받아 하나의 문자열을 반환
	 */
	imgFile2Text(file, successCallback, failCallback) {
		const _this = this;
		_this.#readFile(file, fileUri => 
			_this.#callVision(_this.#removePrefix(fileUri), json => 
				successCallback(_this.#joinResults(json)), failCallback
			)
		);
	}
	
	/**
	file을 입력받아 응답 json 중 responses[0].fullTextAnnotation.pages[0] 반환
	 */
	imgFile2JSON(file, successCallback, failCallback) {
		const _this = this;
		// EXIF 정보로부터 이미지 회전값(시계방향) 획득
		EXIF.getData(file, function() {
			switch(EXIF.getTag(this, 'Orientation')) {
				case 3: _this.#imgOrientation = 180; break;
				case 6: _this.#imgOrientation = 90; break;
				case 8: _this.#imgOrientation = 270; break;
				default: _this.#imgOrientation = 0; break;
			}
		});
		_this.#readFile(file, fileUri => 
			_this.#callVision(_this.#removePrefix(fileUri), json =>
				successCallback({preview: _this.imgUri,
								result: _this.#extract1Page(json)}), failCallback
			)
		);
	}
	
	
	/* -	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	- */
	
	// Cloud Vision ajax 호출
	#callVision(content, successCallback, failCallback) {
		$.post({
			url: `${this.#apiURL}?key=${this.#apiKey}`,
			data: JSON.stringify({requests: [{image: {content}, features: [{type: 'TEXT_DETECTION'}]}]}), 
			contentType: 'application/json'
		}).done(successCallback).fail(failCallback);
	}
	#readFile(file, successCallback, failCallback) {
		const _this = this;
		if(file == null || file.size == 0 || file.size > 20000000) {
			alert((file == null || file.size == 0) ? '파일을 선택해 주세요.':'최대 파일 크기는 20MB입니다.');
			failCallback?.call();
		} else {
			const reader = new FileReader();
			reader.onloadend = function(e) {
				_this.imgUri = e.target.result;
				successCallback(e.target.result);
			}
			reader.readAsDataURL(file);
		}				
	}
	#removePrefix(imgUri) {
		return imgUri.replace(/data:image\/\w+;base64,/, '');
	}
	#joinResults(data) {
		return Array.from(data.responses,r => r.fullTextAnnotation?.text).join('\n');
	} 
	#extract1Page(data) {
		return data.responses[0];
	}
	/** OCR 결과(이미지Uri, ocr json 객체)를 화면에 표시 */
	#ocrResultDisplay(previewImg, ocrResult) {
		const pages = ocrResult.fullTextAnnotation?.pages;
		this.#preview = this.#$resultModal.find('.modal-body img')[0];
		if(pages == null || pages?.length == 0) return;
		
		this.#$resultModal.modal('show').one('shown.bs.modal', () => {
			this.#preview.src = previewImg;
		});		
		// 이미지의 렌더링 크기를 측정하기 위해 load를 기다림.
		this.#preview.onload = () => { this.#preview.decode().finally(() => {
			const naturalWidth = this.#preview.naturalWidth, 
				naturalHeight = this.#preview.naturalHeight, 
				imgWidth = this.#preview.width,
				imgHeight = this.#preview.height;
			// 페이지 회전을 확인하기 위한 박스 샘플
			const sampleVertices = pages[0].blocks[0].boundingBox.vertices,
				sample0 = sampleVertices[0], sample1 = sampleVertices[1], 
				sample2 = sampleVertices[2], sample3 = sampleVertices[3];
			// 글자가 똑바로 보이도록 페이지가 회전(시계방향)된 각도 계산
				// 0─1
				// │ │
				// 3─2			
			let angle = 0;
			if(sample3.x < sample0.x && sample0.y < sample1.y && sample1.x > sample2.x
			&& sample2.y > sample3.y && sample3.x < sample1.x && sample3.y < sample1.y) {
				// 3─0
				// │ │
				// 2─1
				angle = 90;
			} else if(sample2.x < sample3.x && sample3.y < sample0.y && sample0.x > sample1.x 
					&& sample1.y > sample2.y && sample2.x < sample0.x && sample2.y < sample0.y) {
				// 2─3
				// │ │
				// 1─0
				angle = 180;
			} else if(sample1.x < sample2.x && sample2.y < sample3.y && sample3.x > sample0.x
					&& sample0.y > sample1.y && sample1.x < sample3.x && sample1.y < sample3.y) {
				// 1─2
				// │ │
				// 0─3
				angle = 270;
			}
			// 이미지 회전(rotate: 시계방향 회전)
			this.#preview.style.transform = `rotate(${-this.#imgOrientation - angle}deg)`;
			const cx2cy = (imgHeight - imgWidth) / 2 * Math.abs(Math.sin(Math.PI / 180 * (-this.#imgOrientation - angle)));
			// 이미지의 회전에 따른 
			this.#preview.style.top = `${-cx2cy}px`;
			this.#preview.style.left = `${cx2cy}px`;
			
			const bounds = [];
			for(let i = 0, len = pages.length; i < len; i++) {
				const page = pages[i], blocks = pages[i].blocks,
					width = page.width, height = page.height;
				for(let i2 = 0, len2 = blocks.length; i2 < len2; i2++) {
					if(blocks[i2].blockType != 'TEXT') continue;
					const paragraphs = blocks[i2].paragraphs;
					for(let i3 = 0, len3 = paragraphs.length; i3 < len3; i3++) {
						const words = paragraphs[i3].words;
						for(let i4 = 0, len4 = words.length; i4 < len4; i4++) {
							const word = words[i4];
							if(word.property?.detectedLanguages.length > 1
							|| word.property?.detectedLanguages[0].languageCode != 'en') {
								continue;
							}
							const boundings = Array.from(word.boundingBox.vertices, v => this.#rotate(width/2,height/2,v.x, v.y, angle)),
							ltBox = boundings[0], rtBox = boundings[1], rbBox = boundings[2], lbBox = boundings[0],
							xMin = Math.min(ltBox.x, rtBox.x, rbBox.x, lbBox.x),
							xMax = Math.max(ltBox.x, rtBox.x, rbBox.x, lbBox.x),
							yMin = Math.min(ltBox.y, rtBox.y, rbBox.y, lbBox.y),
							yMax = Math.max(ltBox.y, rtBox.y, rbBox.y, lbBox.y);
							const bound = document.createElement('div');
							bound.style.position = 'absolute';
							bound.className = 'candidate-text selected-text';
							bound.style.left = `${this.#resizeOffset(imgWidth, naturalWidth, xMin) - 2}px`;
							bound.style.top = `${this.#resizeOffset(imgHeight, naturalHeight, yMin) - 2}px`;
							bound.style.width = `${this.#resizeOffset(imgWidth, naturalWidth, xMax - xMin) + 4}px`;
							bound.style.height = `${this.#resizeOffset(imgHeight, naturalHeight, yMax - yMin) + 4}px`;
							bound.dataset.text = Array.from(word.symbols, s => s.text).join('');
							bounds.push(bound);
						}
					}
				}
			}
			requestAnimationFrame(() =>
				this.#$resultModal.find('.modal-body').append(bounds)
			);
			// [드래그 선택 활성화]
			this.selection = new SelectionArea({
				selectionContainerClass: 'selection-area-container',
			    // Query selectors for elements which can be selected.
			    selectables: ['#ocrResultModal .modal-body>.candidate-text'],
			    boundaries: ['#ocrResultModal .modal-body'],
			    behavior: { overlap: 'keep'}
			});
			this.selection
			.on('start', () => {
				// 이전의 선택 정보 초기화
				this.selection.clearSelection();
				this.dimmer.resize();
				this.#transformCanvas();
			})
			// 드래그 선택 중 클래스명 변경
			.on('move', ({store: {changed: {added, removed}}}) => {
				if(this.#$resultModal.find('#addArea').is(':checked')) {
				    for (const el of added) {
						if(!el.matches('.selected-text'))
				        	el.classList.add('will-selected');
				    }
				    for (const el of removed) {
				        el.classList.remove('will-selected');
				    }
				}else {
				    for (const el of added) {
						if(el.matches('.selected-text'))
				        	el.classList.add('will-removed');
				    }
				    for (const el of removed) {
				        el.classList.remove('will-removed');
				    }
				}
			})
			// 드래그 선택 완료 후 클래스명 변경
			.on('stop', ({store: {selected}}) => {
				if(this.#$resultModal.find('#addArea').is(':checked')) {
				    for (const el of selected) {
				        el.classList.remove('will-selected');
				        el.classList.add('selected-text');
				    }
				}else {
				    for (const el of selected) {
				        el.classList.remove('will-removed');
				        el.classList.remove('selected-text');
				    }
				}
				this.selection.clearSelection();
				//this.dimmer.resize();
				this.dimmer.highlight('.selected-text');
				//this.#transformCanvas();			
			});

			// [Dimm 효과 활성화]
			requestAnimationFrame(() => {
				if(typeof this.dimmer == 'undefined') {
					this.dimmer = new Dimmer({opacity: 0.5, padding: 0, borderRadius: 1,
						parent: this.#$resultModal.find('.modal-body')[0], fadeDuration: 300,
						easing: 'none', transitionDuration: 0});
					requestAnimationFrame(() => {
						this.dimmer.highlight('.selected-text');
					})
				}else {
					this.dimmer.clear();
					this.dimmer.highlight('.selected-text');
				}
			});
			// [터치기기에 한해 핀치줌 활성화]
			if(('ontouchstart' in window ) || ( navigator.maxTouchPoints > 0 ) || ( navigator.msMaxTouchPoints > 0 )) {
				requestAnimationFrame(() => {
					if(typeof this.pz == 'undefined') {
						this.pz = new PinchZoom(this.#$resultModal.find('.modal-body')[0], {
							draggableUnzoomed: false,
							setOffsetsOnce: true,
							onZoomUpdate: (obj, event) => {
								// 핀치줌 중에 드래그 선택은 취소
								this.selection.cancel(true);
							},
							use2d: false,
						});
					}
				})
			}
		})}
	}
	/** [Dimmer] canvas 대상(부모)에 zoom이 적용됨에 따른 canvas 크기와 배율 변화 
	부모에게 적용된 transform 속성은 canvas에 한 번, canvas 내의 그리기 요소에 다시 한 번 추가적용된다.
	따라서 canvas를 부모의 Rect 크기에 맞추고, 그리기 요소에는 transform 값을 반대로 한 번 적용한다.
	*/
	#transformCanvas() {
		this.parentTransform = getComputedStyle(this.#$resultModal.find('.modal-body')[0]).transform.match(/matrix\(([-\.\w\d]+), [-\.\w\d]+, [-\.\w\d]+, ([-\.\w\d]+), ([-\.\w\d]+), ([-\.\w\d]+)\)/)?.slice(1);
		if(this.parentTransform != null) {
			this.dimmer.canvas.width = this.dimmer.parent.getBoundingClientRect().width * 1.5;
			this.dimmer.canvas.height = this.dimmer.parent.getBoundingClientRect().height * 1.5;
			this.dimmer.canvas.getContext('2d').transform(1/parseFloat(this.parentTransform[0]), 0, 0, 1/parseFloat(this.parentTransform[1]), 0, 0);
		}			
	}
	
	/* 시계방향으로 좌표를 회전 */
	#rotate(cx, cy, x, y, angle) {
		const radians = (Math.PI / 180) * angle, cos = Math.cos(radians), sin = Math.sin(radians),
			nx = (cos * (x - cx)) + (sin * (y - cy)) + cx + Math.abs(sin) * (cy - cx),
			ny = (cos * (y - cy)) - (sin * (x - cx)) + cy - Math.abs(sin) * (cy - cx);
		return {x: nx, y: ny};
	}
	/* 이미지상의 좌표를 렌더링된 크기에 맞춰 조절 */
	#resizeOffset(size, naturalSize, offset) {
		return offset * size / naturalSize;
	}		
}
