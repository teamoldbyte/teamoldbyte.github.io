/** 화면을 구성하는 이펙트 처리
@author LGM
 */
(function($,document,window,ScrollReveal) {
	$(function(){
		console.info('style effects ready')
		// [activates Bootstrap tooltips] --------------------------------------
		$('body').tooltip({
			selector:'[data-toggle="tooltip"],[data-bs-toggle="tooltip"]', 
			trigger:'hover'});
		$(document).on('click', '[data-toggle="tooltip"], [data-bs-toggle="tooltip"]', function(){
			$(this).tooltip('hide');
		}); 
		/* [activates Scroll Reveals] --------------------------------------- */
		ScrollReveal({duration: 1000, reset: false, viewOffset:{top:0,bottom:0},
			// opacity, transform 스타일 속성은 z-index 값을 0으로 만드는 것과 같아서 써머노트 등과 충돌이 있으므로,
			// 등장 효과 끝난 후 제거하도록 한다.
			afterReveal: function(el) { el.style.visibility = ''; el.style.opacity = ''; el.style.transform = ''; el.style.transition = ''; }});
		ScrollReveal().reveal('.sr-showup', {delay: 100, distance: '20px', 
			viewOffset:{top:50,bottom:50},
			beforeReveal: function(el) { $(el).animate({opacity:1}); }});
		ScrollReveal().reveal('.sr-slideup', {delay: 400, interval: 100, opacity: 1, distance: '100%'});
		/* ------------------------------------------------------------------ */	
	})
	// [Bootstrap Validation]---------------------------------------------------
	$(document).on('submit', '.needs-validation', function(event) {
		if(!this.checkValidity()) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.classList.add('was-validated');
	});
	
	/* [bouncing on click button] ------------------------------------------- */
	$.fn.bounce = function() {
		this.each(function() {
			let orgTransform = getComputedStyle(this).transform;
			orgTransform = (orgTransform != null && orgTransform.includes('matrix'))? (orgTransform + ' ') : '';
			const scaleArr = [orgTransform + 'scale3d(1, 1, 1)', orgTransform + 'scale3d(1.25, 0.75, 1)',
							orgTransform + 'scale3d(0.75, 1.25, 1)', orgTransform + 'scale3d(1.15, 0.85, 1)',
							orgTransform + 'scale3d(0.95, 1.05, 1)', orgTransform + 'scale3d(1.05, 0.95, 1)'];
							
			this.animate({"transform" : scaleArr, "-webkit-transform" : scaleArr}, 600);
		})
		return this;
	}
	$(document).on('click','a,button,.btn', function() {
		$(this).bounce();
	})
	/* ---------------------------------------------------------------------- */
	
	/* [Firework Effect]----------------------------------------------- */
	function _setParticuleDirection(p, distance) {
		const angle = anime.random(0, 360) * Math.PI / 180;
		const value = anime.random(Math.ceil(distance/3), distance);
		const radius = [-1, 1][anime.random(0, 1)] * value;
		return {
			x: p.x + radius * Math.cos(angle),
			y: p.y + radius * Math.sin(angle)
		}
	}

	function _createParticule(x,y, ctx, size, distance, colors) {
		const p = {};
		p.x = x;
		p.y = y;
		p.color = colors[anime.random(0, colors.length - 1)];
		p.radius = anime.random(Math.ceil(size * 0.5), size);
		p.endPos = _setParticuleDirection(p, distance);
		p.draw = function() {
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
			ctx.fillStyle = p.color;
			ctx.fill();
		}
		return p;
	}

	function _renderParticule(anim) {
		for (let i = 0, len = anim.animatables.length; i < len; i++) {
			anim.animatables[i].target.draw();
		}
	}

	function _animateParticules(x, y, ctx, size, particles, distance, colors) {
		const particules = [];
		for (let i = 0; i < particles; i++) {
			particules.push(_createParticule(x, y, ctx, size, distance, colors));
		}
		anime.timeline().add({
			targets: particules,
			x: function(p) { return p.endPos.x; },
			y: function(p) { return p.endPos.y; },
			radius: 0.1,
			duration: anime.random(1200, 1800),
			easing: 'easeOutExpo',
			update: _renderParticule
		});
	}
	
	let firworksObserver = new MutationObserver(list => {
		list.filter(mu => mu.removedNodes.length > 0).forEach(mu => {
			if(Array.from(mu.removedNodes).filter(node => node.matches('.fireworks')))
				firworksObserver.disconnect();
		})
	})
	/** 폭죽 효과 표시
	사용: showFireworks(element) or showFireworks(options)
	주의: element에는 position이 설정돼 있어야 함.
	options:
		target: 폭죽을 나타낼 부모 요소(폭죽은 부모요소와 동일한 크기로 범위를 가짐)
		particles: 하나의 폭죽에서 터져나갈 파편 수
		size: 파편 하나의 최대 크기(px)
		distance: 파편이 퍼지는 최대거리(px)
		interval: 폭죽이 터지는 시간 간격(ms)
		count: 폭죽이 동시에 터지는 최대갯수
		time: 폭죽효과가 유지되는 총 시간(ms)
		boundary: 폭죽효과 표시 경계(부모요소 대비 %, px)
	 */
	function showFireworks(options) {
		let canvasEl, render;
		if(options != null && options['nodeType'] == 1) options.target = options;
		const target = options && options.target || document.body;
		
		const particles = options && options.particles || 50,
			  size = options && options.size || 32,
			  distance = options && options.distance || 180,
			  colors = options && options.colors || ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C'],
			  interval = options && options.interval || 100,
			  count = options && options.count || 2,
			  time = options && options.time || 3000;
			  
		canvasEl = document.createElement('canvas');
		canvasEl.className = 'fireworks';
		canvasEl.style.position = 'absolute';
		canvasEl.style.top = options && options.top || 0;
		canvasEl.style.left = options && options.left || 0;
		canvasEl.style.width = options && options.width || '100%';
		canvasEl.style.height = options && options.height || '100%';
		canvasEl.style.zIndex = 1073;
		
		target.appendChild(canvasEl);
		canvasEl.width = canvasEl.getBoundingClientRect().width * 2;
		canvasEl.height = canvasEl.getBoundingClientRect().height * 2;
		
		firworksObserver.observe(target,{ attributes: false, childList: true, subtree: false });
		
		canvasEl.getContext('2d').scale(2, 2);
		const ctx = canvasEl.getContext('2d');
		let totalTime = 0, delays = [];
		while(totalTime < time) {
			totalTime += anime.random(interval * 0.5, interval);
			delays.push(totalTime);
		}
		render = anime({duration:Infinity, update: () => ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)});
		render.play();
		
		for(let i = 0, len1 = delays.length; i < len1; i++) {
			setTimeout(() => {
				for(let j = 0, len2 = anime.random(1, count); j < len2; j++) {
					_animateParticules(
						anime.random(distance, canvasEl.width / 2 - distance), 
						anime.random(distance, canvasEl.height / 2 - distance),
						ctx, size, particles, distance, colors
					);
				}
			}, delays[i]);
		}
		
		setTimeout(() => {render.pause(); canvasEl.remove();}, delays[delays.length - 1] + 1800);
	}
	
	window['showFireworks'] = showFireworks;
})(jQuery, document, window, ScrollReveal);
