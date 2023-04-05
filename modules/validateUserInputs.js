
function validateUserInputs(inputParameters) {
    const urlRegex = /^https?:\/\/.+$/; // Matches URLs starting with http:// or https://
    const nameRegex = /^[A-Za-z ]+$/; // Matches names containing only letters and spaces
    const alphanumericRegex = /^[a-zA-Z0-9].+$/; // matches alphabets and numbers only
  
    if (!inputParameters.addonName || !nameRegex.test(inputParameters.addonName)) {
        throw new Error('Invalid Addon Name: ' + inputParameters.addonName);
    }

    if (!inputParameters.helmURL || !urlRegex.test(inputParameters.helmURL)) {
      throw new Error('Invalid Helm URL: ' + inputParameters.helmURL);
    }
    
    if (!inputParameters.addonVersion || !alphanumericRegex.test(inputParameters.addonVersion)) {
      throw new Error('Invalid Addon Version: ' + inputParameters.addonVersion);
    }
  
    if (!inputParameters.namespace || !nameRegex.test(inputParameters.namespace)) {
      throw new Error('Invalid Namespace: ' + inputParameters.namespace);
    }
  
    return true;
}

export default validateUserInputs;
  