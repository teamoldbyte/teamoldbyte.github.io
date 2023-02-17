/**
 * WebAudio API를 이용하여 오디오 파일에 대한 제어를 한다.
 * 재생, 파형, 신서사이즈 등의 활용이 가능하다.
 *
 * @param callback 오디오 재생 완료 시 호출할 함수
 * @author LGM
 */
/*(function(window) {
	// define online and offline audio context
	
	let audioCtx;
	
	let source;
	
	const cachedArrayBufferMap = {};
	
	// use XHR to load an audio track, and
	// decodeAudioData to decode it and OfflineAudioContext to render it
	
	async function load(src) {
	  const request = new XMLHttpRequest();
	
	  request.open('GET', src, true);
	
	  request.responseType = 'arraybuffer';
	
	  request.onload = () => {
	    cachedArrayBufferMap[src] = request.response;
	    return Promise.resolve();
	  }
	  request.send();
	}
	
	function play(src) {
		audioCtx = audioCtx || new AudioContext();
		const srcToPlay = src || Object.keys(cachedArrayBufferMap).slice(-1)[0];
		audioCtx.decodeAudioData(cachedArrayBufferMap[srcToPlay].slice(), (buff) => {
			// Create a source node from the buffer
			source = audioCtx.createBufferSource();
			source.buffer = buff;
			// Connect to the final output node (the speakers)
			source.connect(audioCtx.destination);
			// 오디오를 딜레이 없이 즉시 pausedAt 시점부터 재생
			if (source.start) {
				source.start(0);
			} else if (source.play) {
				source.play(0);
			} else if (source.noteOn) {
				source.noteOn(0);
			}else console.error('cannot play')
		})
	}
	
	window['WebAudioJS'] = {play, load};
})(window);*/
// 2023.02.16 코드 리팩토링
(function(window) {
	let audioCtx;
	const cachedBuffers = {};

	async function load(src) {
		if (cachedBuffers[src]) {
			return;
		}
		const response = await fetch(src);
		const arrayBuffer = await response.arrayBuffer();
		cachedBuffers[src] = await (audioCtx||(audioCtx=new AudioContext())).decodeAudioData(arrayBuffer);
	}

	function play(src) {
		audioCtx = audioCtx || new AudioContext();
		load(src).then(() => {
			const buffer = cachedBuffers[src];
			if (!buffer) {
				console.error(`Buffer not found for ${src}`);
				return;
			}
			const source = audioCtx.createBufferSource();
			source.buffer = buffer;
			source.connect(audioCtx.destination);
			if (source.start) {
				source.start(0);
			} else if (source.play) {
				source.play(0);
			} else if (source.noteOn) {
				source.noteOn(0);
			} else {
				console.error('Cannot play audio');
			}
		});
	}

	window.WebAudioJS = { play, load };
})(window);
