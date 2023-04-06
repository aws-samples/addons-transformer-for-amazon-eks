
function validateUserInputs(inputParameters) {
    const urlRegex = /^oci?:\/\/.+$/; // Matches URLs starting with oci://
    const nameRegex = /^[A-Za-z ]+$/; // Matches names containing only letters and spaces
    const alphanumericRegex = /^[a-zA-Z0-9].-+$/; // matches alphabets and numbers only
  
    if (!inputParameters.addonName || !nameRegex.test(inputParameters.addonName)) {
        throw new Error('Invalid Addon Name: ' + inputParameters.addonName);
    }

    if (!inputParameters.helmURL || !urlRegex.test(inputParameters.helmURL)) {
      throw new Error('Invalid Helm URL: ' + inputParameters.helmURL);
    }
    
    if (!inputParameters.addonVersion || !alphanumericRegex.test(inputParameters.addonVersion)) {
      throw new Error('Invalid Addon Version: ' + inputParameters.addonVersion);
    }
  
    if (!inputParameters.namespace || !alphanumericRegex.test(inputParameters.namespace)) {
      throw new Error('Invalid Namespace: ' + inputParameters.namespace);
    }

    if (!inputParameters.aws_accountid || !alphanumericRegex.test(inputParameters.aws_accountid)) {
      throw new Error('Invalid AWS Account ID: ' + inputParameters.aws_accountid);
    }

    if (!inputParameters.aws_region || !alphanumericRegex.test(inputParameters.aws_region)) {
      throw new Error('Invalid AWS Account ID: ' + inputParameters.aws_region);
    }
  
    return true;
}

export default validateUserInputs;
  