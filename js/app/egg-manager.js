/** Egg의 소비 및 획득에 대한 화면 처리
 * @author LGM
 */
(function($, document, window){
	
	let eggTray = [], eggConfirmed = false, newEggColors = [];
	// 회원용 트레이
	const trays = [{width: 70, height: 40, top: 130, svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 419"><path fill="#FFD5C0" stroke="#000" stroke-width="3" d="M960.5 170C611-90 666 124 464 87.5 317 51 243 146 431 191c64.3 8.3 114 18 181.5 57-72-39-128.5-48-180.5-54.7-33-7.5-86.3-23.6-113.3-56.6 0 0-123.7-32.7-198.2-71.7C73 4-85-65 75.5 116 188.7 230.7 380 305 380 305s-174.8-80.8-263.3-148.3C153.3 246 390.5 371 458 377c215-1 425-207 642 42l-3-213-136.5-36Z"/></svg>'}]
	// 회원용 에그획득 확인뱃지
	const eggConfirm = '<span class="egg-confirm position-absolute top-0 start-100 translate-middle bg-danger border border-light rounded-circle p-2 fs-5"></span>';
	
	// 신규 에그 획득 모달
	const newEggModal = '<div id="newEggModal" class="modal" data-bs-backdrop="static" tabindex="-1" style="z-index: 1071;background: radial-gradient(circle, white 25%,#fff4);"><div class="modal-dialog modal-dialog-centered overflow-hidden m-0" style="max-width:100%"><div class="modal-content bg-transparent border-0"><div class="modal-header border-0 d-block text-center"></div><div class="modal-body w-100 text-center" style="min-height:77vmin;"><span class="circle-dark" style="position: absolute;left: 50%;top: 50%;transform:translate(-50%,-50%);width: 70vmin;height: 70vmin;background-color: var(--fc-purple);border-radius: 37vmin;z-index: 1;"><svg id="newEggTitle" style="width: 25%;position: absolute;top: 8vmin;z-index: 2;left: 37.5%;overflow: visible;font-size: 45px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 -10 100 22"><path id="newEggTitlePath" fill="transparent" d="M0 20c20-30 80-30 100 0"/><text x="10%" fill="var(--fc-yellow)" textLength="90%"><textPath href="#newEggTitlePath">New</textPath></text></svg></span><span class="circle-dark-dashed" style="position: absolute;left: 50%;top: 50%;transform: translate(-50%,-50%);border-radius: 37vmin;background-color: transparent;border: 2vmin dashed var(--fc-purple);width: 76vmin;height: 76vmin;"></span></div><div class="modal-footer d-block border-0 text-center"><button class="btn btn-fico rounded-5 col-md-2 col-4 fs-5 fw-bold" data-bs-dismiss="modal" onclick="location.assign(\'/mypage\')">확인하기</button><button class="btn btn-outline-fico rounded-5 col-md-2 col-4 fs-5 fw-bold" data-bs-dismiss="modal" >닫기</button></div></div></div></div>';
	let eggsAllConfirmed = true, newEggAnim;
	// 비회원용 비닐봉지
	const plasticBagPaths = ['M 6.00,30.50 C 6.00,30.50 1.50,785.00 1.50,785.00 1.50,785.00 228.50,773.50 250.50,772.00 272.50,770.50 339.50,768.00 366.00,767.00 392.50,766.00 411.00,762.00 430.00,761.50 449.00,761.00 649.50,750.50 649.50,750.50 649.50,750.50 612.00,2.00 612.00,2.00 612.00,2.00 493.50,11.00 493.50,11.00 493.50,11.00 499.50,237.50 499.50,237.50 499.50,237.50 133.50,248.00 133.50,248.00 133.50,248.00 133.50,24.50 133.50,24.50 133.50,24.50 6.00,30.50 6.00,30.50 Z',
	'M 6.00,30.50 C 25.00,404.00 -141.50,646.00 9.00,742.00 9.00,742.00 215.00,818.00 247.00,820.00 279.00,822.00 342.50,813.00 369.00,812.00 395.50,811.00 411.00,797.50 430.00,797.00 449.00,796.50 634.50,694.50 645.00,690.00 787.19,589.77 644.68,314.79 623.00,239.00 621.43,233.51 612.00,2.00 612.00,2.00 612.00,2.00 493.50,11.00 493.50,11.00 493.50,11.00 512.00,194.00 499.50,237.50 417.00,319.00 245.00,336.00 133.50,248.00 133.50,248.00 133.50,24.50 133.50,24.50 133.50,24.50 55.00,28.00 6.00,30.50 Z',
	'M 6.00,30.50 C 6.00,30.50 1.00,714.00 1.00,714.00 1.00,714.00 210.00,706.00 250.00,955.00 270.00,662.00 313.00,628.00 367.00,859.00 386.00,753.00 407.00,822.00 423.00,889.00 428.00,718.00 647.00,686.00 647.00,686.00 647.00,686.00 612.00,2.00 612.00,2.00 612.00,2.00 493.50,11.00 493.50,11.00 493.50,11.00 499.50,237.50 499.50,237.50 499.50,237.50 133.50,248.00 133.50,248.00  133.50,248.00 133.50,24.50 133.50,24.50 133.50,24.50 6.00,30.50 6.00,30.50 Z'];
	const plasticBagSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 651 890"><path id="plasticBagPath" stroke="#000" d="${plasticBagPaths[0]}"/></svg>`;
	// 비회원 에그 깨짐
	const eggCrashed = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 714 258"><defs><radialGradient xmlns="http://www.w3.org/2000/svg" id="egcrash" cx="50%" cy="100%" fx="50%" fy="100%"><stop offset="0%" stop-color="#ffffff00"/><stop offset="100%" stop-color="#fff"/></radialGradient></defs><path fill="url(#egcrash)" stroke="#000" stroke-width="2" d="M-.5 258H715s-153.3-4-168-10.5c-54-26.2 85.3-69.5 78-88.8-7.3-19.4-156.7 65.3-172.5 51.3-15.8-14 51.2-152.7 27-142.5-24.2 10.2-67.8 134.5-103.5 153S271 232.7 250 210 205-2.7 175 0c-30 2.7 23.3 168.7 6 183-17.3 14.3-66-57-66-57s26 61.3 9 67.5c-17 6.2-57.7-48.2-64.5-37.5-6.8 10.7 55.2 61.7 54 76.5C112.3 247.3-.5 258-.5 258ZM527 8.7c-34.7-3.4-35.3 36-5.3 40.6 30 4.7 40-37.3 5.3-40.6ZM43.7 72c-30 31.3 32 32 32 32s-2-63.3-32-32Z"/><path fill="#ffc22b" stroke="#ff4" d="M120.2 257.8c18.4 0 19-32.6 40.4-33 25.4-1.9 35.4 39 95.4 31.5 22.6-7.6 50.7-11.2 69.4 1.3l-205.2.2Zm258-.2c27.6-1.5 56.2-19.5 74.9-16.5 18.7 3 8.5 16.7 8.5 16.7l-83.4-.2Z"/></svg>'

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
		if(jqXHR.responseJSON != undefined && jqXHR.responseJSON.eggList != null && jqXHR.responseJSON.eggList.length > 0) {
			let eggs = [];
			newEggColors = [];
			jqXHR.responseJSON.eggList.forEach(json => {
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
		const egg = document.createElement('img');
		egg.style.position = 'fixed';
		egg.style.zIndex = 1071;
		egg.style.left = `${clickedOffset.x - 25}px`;
		egg.style.top = `${clickedOffset.y - 25}px`;
		egg.src = `https://static.findsvoc.com/images/app/egg/min/${colorIndex+1}.png`		
		return egg;
	}
	function createNewEgg(colorIndex) {
		const egg = document.createElement('img');
		egg.style.position = 'absolute';
		egg.style.left = '50%';
		egg.style.top = 'calc(50% + 4vmin)';
		egg.style.maxWidth = '50vmin';
		egg.style.maxHeight = '50vmin';
		egg.style.transformOrigin = 'center';
		egg.style.opacity = 0;
		egg.style.transform = 'translate(-50%, -50%)';
		egg.style.zIndex = 1071;
		egg.src = `https://static.findsvoc.com/images/app/egg/egg-${colorIndex+1}.png`		
		return egg;
	}
	
	function createTray(tray) {
		const div = document.createElement('div');
		div.id = 'egg_tray';
		div.style.zIndex = 1072;
		div.style.position = 'fixed';
		div.style.left = `${window.innerWidth - tray.width - 10}px`;
		div.style.top = `${window.innerHeight - tray.top}px`;
		div.style.width = `${tray.width}px`;
		div.style.height = `${tray.height}px`;
		div.style.cursor = 'pointer';
		div.onclick = () => window.location.assign('/mypage');
		div.dataset.bsToggle = 'tooltip';
		div.title = '마이페이지로 가서 에그 확인'
		div.innerHTML = tray.svg;
		return div;		
	}

	function createPlasticBag() {
		const bag = document.createElement('div');
		bag.id = 'plasticbag_container';
		bag.style.zIndex = 1072;
		bag.style.position = 'fixed';
		bag.style.right = '10px';
		bag.style.top = `${window.innerHeight - 180}px`;
		bag.style.width = '50px';
		bag.style.height = '50px';
		bag.style.pointerEvents = 'auto';
		bag.style.cursor = 'pointer';
		bag.onclick = () => window.location.assign('/membership');
		bag.innerHTML = plasticBagSvg;
		bag.dataset.bsToggle = 'tooltip';
		bag.title = ['깨진 에그가 아까워..→','에그를 받아내는 방법 없나?→','비닐봉지 말고 없나?→','에그가 왜 깨지죠?→','아직 회원이 아니군요?'][Math.floor(Math.random() * 5)]
		return bag;
	}
	
	function createCrashed() {
		const crashed = document.createElement('div');
		crashed.style.zIndex = 1072;
		crashed.style.transform = 'scaleY(0)'
		crashed.style.position = 'fixed';
		crashed.style.right = '0px';
		crashed.style.top = `${window.innerHeight - 27.5}px`;
		crashed.style.transformOrigin = 'bottom';
		crashed.style.width = '76.2px';
		crashed.style.height = '27.5px';
		crashed.innerHTML = eggCrashed;
		return crashed;		
	}
		
	let egg_timeline;
	function throwEggs(eggArray, callback) {
		const bag = eggTray.length > 0 ? createTray(trays[0]) : createPlasticBag();
		document.body.appendChild(bag);
		bag.onmouseover =  () => {bag.dataset.pause = true};
		bag.onmouseout = () => {delete bag.dataset.pause};
		let bagTooltip;
		// 에그 트레이 등장
		anime({
			targets: bag,
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
				value: function() {return window.innerWidth - 65 + anime.random(-8,8)},
				easing: 'linear'
			},
			top: [
				{value: clickedOffset.y/2, easing: 'cubicBezier(0,0,0,1)', duration: 1000},
				{value: window.innerHeight - 150, easing: 'cubicBezier(0,0,1,0)', duration: 1000}
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
							targets: bag,
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
						bagTooltip = new bootstrap.Tooltip(bag);
						bagTooltip.show();
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
					// 새로 획득한 에그가 있으면 표시
					if(newEggColors.length > 0) {
						if(document.getElementById('newEggModal') == null)
							document.body.insertAdjacentHTML('beforeend', newEggModal);
						$('#newEggModal .modal-body img').remove();
						
						const newEggs = [];
						newEggColors.forEach(newEggColor => {
							const newEgg = createNewEgg(newEggColor);
							$('#newEggModal .modal-body').append(newEgg);
							newEggs.push(newEgg);
						})
						$('#newEggModal').modal('show');
						anime({
							targets: '#newEggTitle',
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
							targets: '#newEggModal .modal-footer button[onclick]',
							loop: true,
							scale: [1, 1.05],
							direction: 'alternate',
							easing: 'linear',
							duration: 1000,
							delay: 500
						})
					}
					let eggEndInterval = setInterval(() => {
						if(bag.dataset.pause == null && eggsAllConfirmed) {
							clearInterval(eggEndInterval);
							anime({ 
								targets: [eggArray, bag],
								left: [window.innerWidth], 
								duration: 1000,
								easing: 'easeInElastic',
								delay: 400,
								complete: () => {
									eggArray.forEach(egg=>egg.remove());
									bag.remove();
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
						if(bag.dataset.pause == null) {
							clearInterval(eggEndInterval);
							anime({ 
								targets: bag,
								left: window.innerWidth, 
								duration: 500, 
								delay: 500,
								complete: () => {
									bagTooltip.dispose();
									bag.remove();
								}
							})
							if(typeof callback == 'function') callback.call();
						}
					}, 100)
				}
			})
		}
		
	}
	
	function presentEggConfirm() {
		if(!eggConfirmed) {
			document.querySelectorAll('.nav-link[href="/mypage"] .icon,[data-bs-target="#mobileDropdown"] .navbar-toggler-icon').forEach(m => {
				if(m.querySelector('.egg-confirm') == null) {
					m.insertAdjacentHTML('beforeend', eggConfirm);
				}
			})
		}		
	}
	
	/** 비회원이면 트레이를 []으로, 회원이면 로그인 직후 세션 트레이값으로 설정
	마이페이지 방문 여부 설정
	@param accountTray 세션의 트레이 
	 */
	function setEggTray(accountTray) {
		// 회원인 경우 세션의 트레이값 조회
		if(accountTray != null && accountTray.length > 0) {
			// 로그인 직후면 세션의 트레이 사용
			if(document.referrer.includes('/auth/login')) {
				eggTray = JSON.parse(accountTray);
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
		}
		// 비회원은 항상 []
		else {
			if(window.localStorage.getItem('fico_egg_tray') != null) {
				window.localStorage.removeItem('fico_egg_tray');
			}
			eggTray = [];
		}
	}
	window['eggManager'] = { setEggTray };
}).call(this, jQuery, document, this);
