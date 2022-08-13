/** Egg의 소비 및 획득에 대한 화면 처리
 * @author LGM
 */
(function($, document, window){
	
	let eggTray = [], eggConfirmed = false, newEggColors = [], bucketLevel = 1, bucketSize = 1;
	// 회원용 에그획득 확인뱃지
	const eggConfirm = { el: 'span', style: 'padding: 0.33rem;',
		className: 'egg-confirm position-absolute top-0 start-100 translate-middle bg-danger border border-light rounded-circle'
	}
	
	// 신규 에그 획득 모달
	const newEggModal = { el: 'div', id: 'newEggModal', className: 'modal', tabIndex: '-1', 'data-bs-backdrop': 'static', style: { zIndex: 1071, background: 'radial-gradient(circle, white 25%, #fff4)' }, children: [
		{ el: 'div', className: 'modal-dialog modal-dialog-centered overflow-hidden m-0', style: 'max-width: 100%', children: [
			{ el: 'div', className: 'modal-content bg-transparent border-0', children: [
				{ el: 'div', className: 'modal-header border-0 d-block text-center' },
				{ el: 'div', className: 'modal-body w-100 text-center', style: 'min-height: 77vmin', children: [
					{ el: 'span', className: 'circle-dark', 
					style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '70vmin', height: '70vmin', backgroundColor: 'var(--fc-purple)', borderRadius: '37vmin', zIndex: 1 }
					, children: [ { el: 'object', data: 'https://static.findsvoc.com/images/app/egg/new-title.svg',
						style: { position: 'absolute', top: '3vmin', left: '37.5%', width: '25%', height: '20%', zIndex: 2, overflow: 'visible'}}] 
					},
					{ el: 'span', className: 'circle-dark-dashed', style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', borderRadius: '37vmin', backgroundColor: 'transparent', border: '2vmin dashed var(--fc-purple)', width: '76vmin', height: '76vmin' }
					}
				]},
				{ el: 'div', className: 'modal-footer d-block border-0 text-center', children: [
					{ el: 'button', className: 'btn btn-fico rounded-5 col-md-2 col-4 fs-5 fw-bold js-verify-btn', 'data-bs-dismiss': 'modal', onclick: () => location.assign('/mypage'), textContent: '확인하기' },
					{ el: 'button', className: 'btn btn-outline-fico rounded-5 col-md-2 col-4 fs-5 fw-bold', 'data-bs-dismiss': 'modal', textContent: '닫기'}
				]}
			]}
		]}
	]};
	let eggsAllConfirmed = true, newEggAnim;
	// 비회원용 비닐봉지
	let plasticBagPaths;

	// 에그를 획득하는 버튼 위치에서 에그가 생성되도록.
	let clickedOffset = {x: 0, y: 0};
	$(document).on('mousedown', jqEvent => {
		clickedOffset = {x:jqEvent.clientX, y:jqEvent.clientY};
	})
	/*.on('submit', 'form', function(e) {
		if(e.isDefaultPrevented()) return;
		// 동기방식의 submit에 대한 동작
		document.activeElement.blur();
		e.preventDefault();
		this.style.opacity = '50%';
		this.style.pointerEvents = 'none';
		setTimeout(()=>throwEggs([createEgg(0)],()=>this.submit()),100)
	})*/
	.ajaxComplete((jqEvent, jqXHR, options) => {
		if(jqXHR.responseJSON != undefined 
		&& ((jqXHR.responseJSON.eggList != null && jqXHR.responseJSON.eggList.length > 0)
			|| (jqXHR.responseJSON.eggResponse != null && jqXHR.responseJSON.eggResponse.eggList.length > 0))) {
			let eggs = [];
			newEggColors = [];
			(jqXHR.responseJSON.eggList || jqXHR.responseJSON.eggResponse.eggList).forEach(json => {
				for(let i = 0, len = json.eggNum; i < len; i++) {
					if(eggTray[json.eggColor] == 0) {
						newEggColors.push(json.eggColor);
					}
					eggTray[json.eggColor]++;
					eggs.push(createEgg(json.eggColor));
				}
			});
			// 브라우저에 트레이 동기화
			window.localStorage.setItem('fico_egg_tray', JSON.stringify(eggTray));
			// 메뉴에 표시
			eggConfirmed = false;
			window.localStorage.setItem('fico_egg_confirmed', false);
			presentEggConfirm();
			throwEggs(eggs);
		}
	})
	.on('hide.bs.modal', '#newEggModal', function() {
		eggsAllConfirmed = true;
		if(newEggAnim != null) {
			newEggAnim.pause();
			newEggAnim = null;
		}
	})
	
	
	function createEgg(colorIndex) {
		return createElement({ 
			el: 'img', src: `https://static.findsvoc.com/images/app/egg/min/${colorIndex+1}.png`, 
			style: {
				position: 'fixed', zIndex: 1071, left: `${clickedOffset.x - 25}px`, top: `${clickedOffset.y - 25}px`
			}
		});
	}
	function createNewEgg(colorIndex) {
		return createElement({
			el: 'div', className: 'new-obj', style: { position: 'absolute', left: '50%', top: 'calc(50% + 4vmin)', width: '37.5vmin', height: '50vmin', 
				maxWidth: '50vmin', zIndex: 1071, maxHeight: '50vmin', transformOrigin: 'center', opacity: 0, transform: 'translate(-50%,-50%)',
				borderRadius: '50% 50% 50% 50%/60% 60% 40% 40%',
				background: `center/ 102% 101% url(https://static.findsvoc.com/images/app/egg/egg-${colorIndex+1}.png) no-repeat`
			}
		});
	}
	
	function createBucket(level) {
		return createElement({
			el: 'img', id: 'egg_tray', src: `https://static.findsvoc.com/images/app/egg/bucket/bucket-${level}.svg`,
			onclick: () => window.location.assign('/mypage'), 'data-bs-toggle': 'tooltip', title: '마이페이지로 가서 에그 확인',
			style: {
				position: 'fixed', left: `${window.innerWidth}px`, top: `${window.innerHeight - 150}px`, zIndex: 1072,
				width: '70px', height: '70px', cursor: 'pointer'
			}
		});
	}
	
	function createNewBucket(level) {
		return createElement({
			el: 'img', className: 'new-obj', src: `https://static.findsvoc.com/images/app/egg/bucket/bucket-${level}.svg`,
			style: {
				position: 'absolute', left: '50%', top: 'calc(50% + 4vmin)', maxWidth: '50vmin', zIndex: 1071,
				maxHeight: '50vmin', transformOrigin: 'center', opacity: 0, transform: 'translate(-50%,-50%)'
			}
		});
	}

	function createPlasticBag() {
		return createElement({
			el: 'img', id: 'plasticbag_container', src: 'https://static.findsvoc.com/images/app/egg/bucket/plasticbag.svg',
			onclick: () => window.location.assign('/membership'), 'data-bs-toggle': 'tooltip', 
			title: [ '깨진 에그가 아까워..→', '에그를 받아내는 방법 없나?→', '비닐봉지 말고 없나?→', '에그가 왜 깨지죠?→', '아직 회원이 아니군요?'][Math.floor(Math.random() * 5)],
			style: {
				position: 'fixed', right: '10px', top: `${window.innerHeight - 180}px`, width: '50px', height: '50px', zIndex: 1072,
				pointerEvents: 'auto', cursor: 'pointer'
			}
		});
	}
	
	function createCrashed() {
		return createElement({
			el: 'img', src: 'https://static.findsvoc.com/images/app/egg/bucket/egg-crashed.svg',
			style: {
				position: 'fixed', right: '0px', top: `${window.innerHeight - 27.5}px`, width: '76.2px', height: '27.5px',
				transformOrigin: 'bottom', transform: 'scaleY(0)'
			}
		});	
	}
		
	let egg_timeline;
	function throwEggs(eggArray, callback) {
		const bucket = bucketLevel > 0 ? createBucket(bucketLevel) : createPlasticBag();
		document.body.appendChild(bucket);
		bucket.onmouseover =  () => {bucket.dataset.pause = true};
		bucket.onmouseout = () => {delete bucket.dataset.pause};
		let bucketTooltip;
		// 에그 트레이 등장
		anime({
			targets: bucket,
			left: [window.innerWidth, window.innerWidth - 70],
			duration: 500,
		});

		eggArray.forEach(egg => document.body.appendChild(egg));
		// 에그 애니메이션
		egg_timeline = anime.timeline({
			targets: eggArray,
			delay: anime.stagger(200)
		});
		// 에그 순차적 등장
		egg_timeline.add({
			duration: 500,
			scale: [0,1],
			translateY: [10, -10],
			easing: 'cubicBezier(0,2,1,2)',
			rotateZ: {
				value: [anime.stagger(75, {start: 15}), anime.stagger(75, {start: 75})],
				easing: 'linear'
			}
		})
		// 에그 발사
		.add({
			duration: 2000,
			left: {
				value: function() {return window.innerWidth - 56 + anime.random(-4,4)},
				easing: 'linear'
			},
			top: [
				{value: clickedOffset.y/2, easing: 'cubicBezier(0,0,0,1)', duration: 1000},
				{value: window.innerHeight - 145, easing: 'cubicBezier(0,0,1,0)', duration: 1000}
			],
			rotateZ: {
				value: anime.stagger(150, {start: 1200}),
				easing: 'cubicBezier(0,.5,.5,1)'
			},
			scale: {
				value: .3,
				easing: 'cubicBezier(.5,0,1,.5)'
			},
			begin: () => {
				// 회원용 트레이에 담기는 애니메이션
				if(eggTray.length > 0) {
					setTimeout(() => {
						anime({
							targets: bucket,
							translateY: [5, 0],
							delay: anime.stagger(200),
							duration: 200,
							loop: eggArray.length,
							easing: 'easeOutExpo'
						})
					}, 2000);
				}
				// 비회원에겐 비닐봉지가 채워짐과 동시에 툴팁 표시
				else {
					setTimeout(() => {
						bucketTooltip = new bootstrap.Tooltip(bucket);
						bucketTooltip.show();
					}, 1900);
					anime({
						targets: '#plasticBagPath',
						d: {
							value: [plasticBagPaths[0],plasticBagPaths[1]]
						},
						delay: 1900,
						duration: 500
					});
				}
			},
			complete: () => {
				// 회원일 경우 에그가 다 담기고 에그와 에그 트레이 철수
				if(eggTray.length > 0) {
					// 버킷 레벨 새로 정의
					const prevLevel = bucketLevel;
					let eggTotal = 0;
					for(let i = 0; i < 9; i++) {
						eggTotal += eggTray[i];
					}
					_setBucket(eggTotal);

					// 새로 획득한 에그가 있거나 버킷이 바뀌었으면 표시
					if(newEggColors.length > 0 || prevLevel < bucketLevel) {
						if(document.getElementById('newEggModal') == null)
							document.body.appendChild(createElement(newEggModal));
						$('#newEggModal .modal-body .new-obj').remove();
						
						const newEggs = [];
						newEggColors.forEach(newEggColor => {
							const newEgg = createNewEgg(newEggColor);
							$('#newEggModal .modal-body').append(newEgg);
							newEggs.push(newEgg);
						});
						if(prevLevel < bucketLevel) {
							const newBucket = createNewBucket(bucketLevel);
							$('#newEggModal .modal-body').append(newBucket);
							newEggs.push(newBucket);
						}
						$('#newEggModal').modal('show');
						anime({
							targets: '#newEggModal .circle-dark object',
							scale: [0,1],
							duration: 1200
						})
						newEggAnim = anime({
							targets: '#newEggModal .circle-dark-dashed',
							rotateZ: 360,
							duration: 8000,
							loop: true,
							easing: 'linear'
						})
						newEggs.forEach((v,i) => {
							setTimeout(() => {
								if(i == 0)
									showFireworks({
										target: $('#newEggModal .modal-body')[0],
										particles: 20, 
										time: 1000 * newEggs.length + 2000, 
										distance: 100,
										interval: 200, 
										size: 15
									});
								anime({
									targets: v,
									duration: 1000,
									scale: [0,1],
									opacity: [0,1],
									complete: () => {
										if(i + 1 != newEggs.length) {
											v.remove();
										}
									}
								})
							}, 500 +  1000 * i);
						})
						eggsAllConfirmed = false;
						anime({
							targets: '#newEggModal .modal-footer .js-verify-btn',
							loop: true,
							scale: [1, 1.05],
							direction: 'alternate',
							easing: 'linear',
							duration: 1000,
							delay: 500
						})
					}
					let eggEndInterval = setInterval(() => {
						if(bucket.dataset.pause == null && eggsAllConfirmed) {
							clearInterval(eggEndInterval);
							anime({ 
								targets: [eggArray, bucket],
								left: [window.innerWidth], 
								duration: 1000,
								easing: 'easeInElastic',
								delay: 400,
								complete: () => {
									eggArray.forEach(egg=>egg.remove());
									bucket.remove();
								}
							})
							if(typeof callback == 'function') callback.call();
						}
					}, 100);
				}
			}
		})
		// 비회원일 경우
		if(eggTray.length == 0) {
			
			// 0.5초 뒤 순차적으로 에그 자유낙하
			egg_timeline.add({
				delay: anime.stagger(200, {start: 500}),
				duration: 500,
				top: window.innerHeight,
				easing: 'cubicBezier(1,0,1,0)',
				begin: () => {
					// 비닐봉지 구멍내기
					anime({
						targets: '#plasticBagPath',
						delay: 500,
						duration: 500,
						easing: 'cubicBezier(1,0,1,0)',
						d: {
							value: plasticBagPaths[2]
						}
					})
					const crashedArray = [];
					for(let i = 0, len = eggArray.length; i < len; i++) {
						crashedArray.push(createCrashed());
					}
					$(document.body).append(crashedArray);
					// 깨진 에그 표현
					anime.timeline({
						targets: crashedArray,
					}).add({
						delay: anime.stagger(200, {start: 700}),
						duration: 1000,
						scaleY: [0, 2, 0],
						scaleX: [0, 1, 0.5],
						opacity: [1, 1, 0],
						easing: 'cubicBezier(0,1,0,1)',
						complete: () => crashedArray.forEach(crashed=>crashed.remove())
					});
				},
				complete: () => {
					eggArray.forEach(egg=>egg.remove());
					let eggEndInterval = setInterval(() => {
						if(bucket.dataset.pause == null) {
							clearInterval(eggEndInterval);
							anime({ 
								targets: bucket,
								left: window.innerWidth, 
								duration: 500, 
								delay: 500,
								complete: () => {
									bucketTooltip.dispose();
									bucket.remove();
								}
							})
							if(typeof callback == 'function') callback.call();
						}
					}, 100)
				}
			})
		}
		
	}
	
	/** 에그 획득에 따른 메뉴 뱃지추가
	 */
	function presentEggConfirm() {
		if(!eggConfirmed) {
			document.querySelectorAll('.nav-link[href="/mypage"] .icon,[data-bs-target="#mobileDropdown"] .navbar-toggler-icon').forEach(m => {
				if(m.querySelector('.egg-confirm') == null) {
					m.appendChild(createElement(eggConfirm));
				}
			})
		}		
	}
	
	/** 트레이의 총 에그 수에 따라 버킷을 설정
	@param eggTotal 에그 총 갯수(-1이면 비회원)
	 */
	function _setBucket(eggTotal) {
		// 회원인 경우 버킷 레벨과 버킷 사이즈 설정
		if(eggTotal > -1) {
			bucketLevel = 1; bucketSize = 1;
			let _quotient = eggTotal;
			while(_quotient >= 9) {
				_quotient /= 3;
				bucketSize *= 3;
				bucketLevel++;
			}
			bucketLevel = Math.max(1, bucketLevel);			
		}else bucketLevel = 0;
	}
	
	function getBucketLevel() {
		return bucketLevel;
	}
	function getBucketSize() {
		return bucketSize;
	}
	
	/** 비회원이면 트레이를 []으로, 회원이면 로그인 직후 세션 트레이값으로 설정
	마이페이지 방문 여부 설정
	@param accountTray 세션의 트레이 
	@param balance 골드량
	@caller workbook_layout
	 */
	function setEggTray(accountTray, balance) {
		// 회원인 경우 세션의 트레이값 조회
		if(accountTray != null && accountTray.length > 0) {
			// 로그인 직후면 세션의 트레이 사용
			if(document.referrer.includes('/auth/login')) {
				eggTray = JSON.parse(accountTray);
				eggTray[9] = parseInt(balance);
				window.localStorage.setItem('fico_egg_tray', JSON.stringify(eggTray));
				if(window.localStorage.getItem('fico_egg_confirmed') == null) {
					eggConfirmed = true;
					window.localStorage.setItem('fico_egg_confirmed', true);
				}
			}
			// 로그인 직후가 아닐 경우 브라우저에 저장된 트레이 사용
			else {
				const storedTray = window.localStorage.getItem('fico_egg_tray');
				if(storedTray != null) {
					eggTray = JSON.parse(storedTray);
				}
				// 만약 브라우저에 저장된 값이 없을 경우 세션의 트레이 사용
				else {
					eggTray = JSON.parse(accountTray);
					eggTray[9] = parseInt(balance);
					window.localStorage.setItem('fico_egg_tray', JSON.stringify(eggTray));
				}
				// 마이페이지 방문여부 확인
				if(location.pathname.includes('/mypage')) {
					eggConfirmed = true;
					window.localStorage.setItem('fico_egg_confirmed', true);
				}else {
					const storedConfirmation = window.localStorage.getItem('fico_egg_confirmed');
					if(storedConfirmation != null) {
						eggConfirmed = JSON.parse(storedConfirmation);
					}
				}
				presentEggConfirm();
			}
			let eggTotal = 0;
			for(let i = 0; i < 9; i++) {
				eggTotal += eggTray[i];
			}
			_setBucket(eggTotal);
		}
		// 비회원은 항상 []
		else {
			$.getJSON('https://static.findsvoc.com/data/egg/plasticbag-anim-paths.json', json => {
				plasticBagPaths = json;
			})
			if(window.localStorage.getItem('fico_egg_tray') != null) {
				window.localStorage.removeItem('fico_egg_tray');
			}
			eggTray = [];
			_setBucket(-1);
		}
		
	}
	window['eggManager'] = { setEggTray, getBucketLevel, getBucketSize };
}).call(this, jQuery, document, this);
