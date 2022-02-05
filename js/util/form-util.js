/**
 대상 form에 <input type="hidden">을 생성하여 추가
 */
function createHidden($form, name, value) {
  $('<input>').attr({type: 'hidden', name, value}).appendTo($form);
}
// [파일 형식 유효성 검사]
// Invoke HTML5 custom constraints validation to enforce MIME-type as defined in file inputs' `accept` attribute.
void function(){
  const inputPrototype      = HTMLInputElement.prototype;
  // Keep a local reference to out-of-the-box functionality we're about to enhance
  const nativeCheckValidity = inputPrototype.checkValidity;
  // I don't know why, but custom validation only appears to work 
  // if I bind to both these events - even neither triggers it...
  // http://stackoverflow.com/questions/21003342/how-do-i-invoke-custom-constraint-validation-as-part-of-the-native-validation-ev
  // const events              = [ 'change', 'input' ];

  // Pre-validation check, to see if an input is eligible for file type validation.
  function shouldValidate( element ){
    return ( element instanceof HTMLInputElement && 
             element.type === 'file'             &&  
             element.accept                      && 
             element.files                       && 
             element.files.length
    );
  }

  // Our custom validation function
  function validateFileInputType( input ){
    // Convert MIME-type patterns as described in the `accept` attribute
    // into a valid expression to test actual MIME-type against
    const MIMEtype = new RegExp( input.accept.replace( '*', '[^\\/,]+' ) );

    // Ensure each of the input's files' types conform to the above
    return Array.prototype.every.call( input.files, file => MIMEtype.test( file.type));
  }
  
  // Perform `checkValidity` on each input
  function validateInputs(event){
	if(event.target instanceof HTMLInputElement) {
	  event.target.checkValidity();
	}
  }

  // Enhance native `checkValidity` behaviour
  inputPrototype.checkValidity = function(){
    if(shouldValidate(this) && !validateFileInputType(this)) {
	  this.setCustomValidity( '다음 형식의 파일을 등록해 주세요: ' + this.accept );
	  return false;
	}
	this.setCustomValidity('');
    // Hand back to native functionality
    return nativeCheckValidity.apply(this);
  }

  // Bind it up!
  document.documentElement.addEventListener('input', validateInputs);
}();