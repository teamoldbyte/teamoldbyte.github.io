/**
 * 텍스트형 pdf를 인식하여 텍스트를 추출
 * @param pdfData 실제 파일의 blob 데이터
 * @param callback 인식된 텍스트를 처리할 콜백함수
 */
function textualPdfToText(pdfData, callback, onProgress, previewCanvas){
  var pdfjsReady = function(){
    // Loaded via <script> tag, create shortcut to access PDF.js exports.
    var pdfjsLib = window['pdfjs-dist/build/pdf'];
  
    // The workerSrc property shall be specified.
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist/build/pdf.worker.min.js';
  
    // Using DocumentInitParameters object to load binary data.
    var loadingTask = pdfjsLib.getDocument({data: pdfData});
    loadingTask.promise.then(function(pdf) {
      var pages = [];
      var pageLength = pdf.numPages;
      for(var pageNumber = 1; pageNumber <= pageLength; pageNumber++){
        pages.push(pageNumber);
      }
      return Promise.all(pages.map(function(pageNumber){
        return pdf.getPage(pageNumber).then(function(page) {
          return page.getTextContent().then(function(textContent){
            if(textContent.items != null){
              var page_text = "", last_item = null;
              var items = textContent.items, itemsLen = items.length;
              for(var i = 0; i < itemsLen; i++){
                var item = items[i];
                // 이전 문장이 있고 이전 문장이 ' '로 끝나지 않는다면
                if(last_item != null && last_item.str[last_item.str.length - 1] != ' '){
                  var itemX = item.transform[5], lastX = last_item.transform[5],
                    itemY = item.transform[4], lastY = last_item.transform[4];
                  // 수평상 이전 문장보다 앞이면 줄바꿈, 커서 초기화
                  if(itemX < lastX){
                    page_text += "\r\n";
                  
                  // 수평상 위치는 이전 문장보다 뒤이고,
                  // 수직상 위치가 다르고, 이전 문장에 영어문장성분이 없을 경우
                  }else if(itemY != lastY && 
                  (last_item.str.match(/^(\s?[a-zA-Z])$|^(.+\s[a-zA-Z])$/) == null)){
                    page_text += ' ';
                  }
                }
                page_text += item.str;
                last_item = item;
              }
              return page_text + '\n\n';
            }
			if(onProgress)
			  onProgress({
				status: 'recognizing', progress: pageNumber / pageLength
			  });
          }, function(e){
            console.error(e);
          });
        }, function(e){
          console.error(e);
        });
      })).then(async function(resultPages){
        // pdf에 미리 등록된 텍스트 정보가 있으면 표시
        if(resultPages.join().match(/\w/g)?.length > 0){
          callback(resultPages.join());
        }
        // 텍스트 정보가 없으면 이미지로써 인식
        else{
          await Promise.all(pages.map(function(pageNumber){
            return pdf.getPage(pageNumber).then(function(page) {
              var viewport = page.getViewport({scale: 1.0});
            
              // Prepare canvas using PDF page dimensions
              var canvas = previewCanvas || document.createElement('canvas');
              var context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              // Render PDF page into canvas context
              var renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              var renderTask = page.render(renderContext);
              return renderTask.promise.then(async function () {
                // OCR 처리 코드. 텍스트 인식 후 한글 제거 체크박스가 체크돼있으면 한글제거를 후처리함.--------
                // text: 결과 텍스트
                return worker.recognize(canvas.toDataURL('image/png'))
                             .then(function({data}){
                               return data;
                             }, function(e){
                               console.error(e);
                             });
                //await worker.terminate();
              }, function (reason) {
                // PDF loading error
                console.error(reason);
              });
            }, function(e){
              console.error(e);
            });
          })).then(function(resultPages){
            callback(resultPages);
          }, function(e){
            console.error(e);
          })
        }
      }, function(e){
        console.error(e);
      });
      
    }, function (reason) {
      // PDF loading error
      console.error(reason);
    });
  }
  function callLibrary(){
    if(typeof pdfjsLib == 'undefined'){
      checkOCRLibrary('https://cdn.jsdelivr.net/npm/pdfjs-dist/build/pdf.min.js', callLibrary);
    }else if(typeof Tesseract == 'undefined'){
      checkOCRLibrary('https://cdn.jsdelivr.net/npm/tesseract.js/dist/tesseract.min.js', callLibrary);
    }else{
      initTesseract(pdfjsReady, onProgress);
    }
  }
  callLibrary();
}

/**
 * 워드프로세서 문서에서 텍스트를 추출
 * @param docData .doc, .docx 파일의 바이너리 데이터
 * @param callback 인식된 텍스트를 처리할 콜백함수
 */
function docxToText(docData, callback){
  var docjsReady = function(){
    mammoth.extractRawText({arrayBuffer:docData}).then(function(resultObj){
      callback(resultObj.value);
    })
  }
    
  if(typeof mammoth == 'undefined'){
    checkOCRLibrary('https://cdn.jsdelivr.net/npm/mammoth/mammoth.browser.min.js', docjsReady);
  }else{
    docjsReady();
  }
}

/**
 * 이미지에서 텍스트를 추출
 * @param imgData .doc, .docx 파일의 바이너리 데이터
 * @param callback 인식 결과를 처리할 콜백함수
 * @param onProgress 처리 중 진행상태를 처리할 함수
 */
function imgToText(imgData, callback, onProgress){
  var imgjsReady = function(){
                     worker.recognize(imgData).then(function({data}){
                       callback(data);
                     });
                   };
  
  var callLibrary = function(){
    if(typeof Tesseract == 'undefined'){
      checkOCRLibrary('https://cdn.jsdelivr.net/npm/tesseract.js/dist/tesseract.min.js', callLibrary);
    }else{
      initTesseract(imgjsReady, onProgress);
    }
  }
  callLibrary();
}

/**
 * Tesseract 초기화.
 * @param callback Tesseract.js 초기화 작업 후 실행할 콜백 함수
 * @param onProgress 처리 중 진행상태를 처리할 함수
 */
function initTesseract(callback, onProgress){
  var tessReady = function(){
	if(typeof Tesseract == 'undefined') {
	  checkOCRLibrary('https://cdn.jsdelivr.net/npm/tesseract.js/dist/tesseract.min.js', tessReady);
    }  
    else if(typeof worker == 'undefined'){
      let worker = Tesseract.createWorker({
                 logger: onProgress,
				 workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js/dist/worker.min.js',
				 corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core/tesseract-core.wasm.js'
               });
      (async () => {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
          tessjs_create_hocr: '0',
          tessjs_create_tsv: '0',
        });
        callback();
      })();
    } else {
      callback();
  }};

  tessReady();
}

/**
 * OCR 처리를 위한 라이브러리가 로드되었는지 체크
 * @param url 라이브러리 경로
 * @param callback 라이브러리가 로드된 후 실행할 콜백 함수
 */
function checkOCRLibrary(url, callback){
  var libraryJs = document.createElement('script');
  libraryJs.type = 'text/javascript';
  libraryJs.src = url;
  document.body.appendChild(libraryJs);
  libraryJs.onload = callback  
}