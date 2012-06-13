<script>
<scriptACL>
  <execute>anonymous</execute>
  <read>nobody</read>
  <write>nobody</write>
</scriptACL>
<code><![CDATA[

/*
 * This script should be used when registering a new user or when provisioning a new account.
 * The script will consider that it is running an account provisioning scenario if one of the following is true
 * (a) request.parameters["profileStore"] is specified
 * (b) widgets.common/registrationType == "account"
 * (c) request.parameters["registrationType"] == "account"
 * @param login : the login of the user 
 * @param d : the temporary user document containing subscription information
 * @param profileStore : optional. If used, specifies the store where the profile will be created (account provisioning). 
 * If not specified but registrationType == "account" is defined, then we are in an account provisioning
 * scenario. In that case, the value of the profile Store will be obtained from widgets.common.defaultProfileStore. 
 */

var logLevel = request.parameters["logLevel"];
if (logLevel){
	apsdb.log.setLogLevel(logLevel); 
}
 
var widgetsCommon = apsdb.require("widgets.common");
var configuration = widgetsCommon.getConfiguration();
              
// Retrieve the temporary document that contains the user's info, using the documentKey received
// in the e-mail from the unconfirmedRegistrations store
var getUserDocParams = {
	"apsdb.store" : configuration.defaultUnconfirmedRegistrationStore,
	"apsdb.query" : "apsdb.documentKey = \"" + request.parameters["d"] + "\"",
	"apsdb.queryFields" : "*"
}

try {	

	var user = apsdb.callApi("Query", getUserDocParams , null);
	
	if (!(user.result.documents) || (user.result.documents.length == 0)) {
		return {
			status: "failure", 		
			errorDetail: "WRONG_CONFIRMATION_CODE" 	
		}	
	}
	
	// If we were able to retrieve the document, prepare to save the info as a new user			
	// Create the parameters of the SaveUser API from the data contained
	// in the temporary user document
	var response = saveUser();		
		
	if (response.metadata.status == "failure") {
		fail(response);
	}
			
	// If we were able to create a new user, we now need to:
	// 1) Check if we are in a user registration process or an account registration process.
	//    If we are in the latter case, we extend the current script with the account creation script.
	//    The registration process is an account registration process if one of the following is true:
	//    a) request.parameters["profileStore"] is defined
	//    b) configuration.registration == "account" (not "user")
	//	  c) request.parameters["registrationType"] == "account"
	//
	// 2) Delete the temporary user document from the unconfirmedRegistrations store
	// 3) Send a confirmation e-mail (if configured to do so)
	
	if ((configuration.registration == "account") || (request.parameters["profileStore"]) || (request.parameters["registrationType"] == "account")) {
		
		var accountProcess = apsdb.require("widgets.Provisioning.createAccountAndProfile");	
		var resp = accountProcess.handleAccountCreation(request, user, configuration, apsdb, logLevel);		
		if (resp.status == "failure") {		
			deleteUser();
			throw resp;
		}else {
			response = resp;
		}
	}	
	
	// 2) Delete the temporary user document from the unconfirmedRegistrations store
	var deleteResponse = deleteTemporaryUserDoc();						
	
	if (deleteResponse.metadata.status == "failure") {
		fail(deleteResponse, "deleteTempDocument");
	}
	
	// 3) Send confirmation e-mail
	if (configuration.sendEmailOnceRegistrationConfirmed == true) {
		sendEmail();
	}
					
	response = {status : "success", result : response }; 
	return response;
	
	
}catch(exception){
	
	return {
		status: "failure", 		
		errorDetail: exception 	
	}
}

function fail(specificResponse, action) {
	response[specificResponse] = specificResponse;	
}

function saveUser() {

	var params = {
		login: request.parameters["login"],
		password: user.result.documents[0].password,
		email: user.result.documents[0].email,
		name: user.result.documents[0].name,
		groups: user.result.documents[0].finalGroups,			
	}
		
	return apsdb.callApi("SaveUser", params, null);
}

function deleteUser() {

	var params = {
		login: request.parameters["login"],				
	}
		
	return apsdb.callApi("DeleteUser", params, null);
}

function deleteTemporaryUserDoc() {

	var deleteParams = {
		"apsdb.store": configuration.defaultUnconfirmedRegistrationStore,
		"apsdb.documentKey": request.parameters["d"]
	}
	
	return apsdb.callApi("DeleteDocument", deleteParams, null);
}

function sendEmail() {
	
	var tokens = {
	    projectName: configuration.projectName,
	    user: user.result.documents[0].name,	    
	}
	
	var emailSubject = widgetsCommon.parseTemplate(configuration.templatesConfirmed.subject, tokens)
	var emailBody = widgetsCommon.parseTemplate(configuration.templatesConfirmed.body, tokens)
	
	var sendEmailInput = {
		"apsma.from": configuration.adminEmail, 
		"apsma.to": user.result.documents[0].email, 
		"apsma.subject": emailSubject, 
		"apsma.htmlBody": emailBody
	};
	
	return apsdb.callApi("SendEmail", sendEmailInput, null);		
}

]]>
</code>
</script>