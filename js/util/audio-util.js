/**
 * WebAudio API를 이용하여 오디오 파일에 대한 제어를 한다.
 * 재생, 파형, 신서사이즈 등의 활용이 가능하다.
 *
 * @param callback 오디오 재생 완료 시 호출할 함수
 * @author LGM
 */
 
(function(window) {
	// define online and offline audio context
	
	const audioCtx = new AudioContext();
	
	let source;
	
	const cachedArrayBufferMap = {};
	
	// use XHR to load an audio track, and
	// decodeAudioData to decode it and OfflineAudioContext to render it
	
	function load(src) {
	  const request = new XMLHttpRequest();
	
	  request.open('GET', src, true);
	
	  request.responseType = 'arraybuffer';
	
	  request.onload = () => {
	    cachedArrayBufferMap[src] = request.response;
	  }
	  request.send();
	}
	
	function play(src) {
		const srcToPlay = src || Object.keys(cachedArrayBufferMap).slice(-1)[0];
		audioCtx.decodeAudioData(cachedArrayBufferMap[srcToPlay].slice(), (buff) => {
			// Create a source node from the buffer
			source = audioCtx.createBufferSource();
			source.buffer = buff;
			// Connect to the final output node (the speakers)
			source.connect(audioCtx.destination);
			// 오디오를 딜레이 없이 즉시 pausedAt 시점부터 재생
			source.start(0);
		})
	}
	
	window['WebAudioJS'] = {play, load};
})(window);
