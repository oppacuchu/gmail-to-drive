/**
 *  Find and return the "ID" attribute of a resource based on its name.
 *  It is useful to have a function which, given the name of a resource, returns the resource's "ID" attribute,
 *  because when we have to create and upload the final files to the desired Google Drive folder, its API
 *  needs the folder "ID" attribute and not the "name" or any other attribute.
 *
 *  @param  {ResourceNameId[]}  resourcesArray  The array containing the resources to be searched in.
 *  @param  {String}            resourceName    The string containing the name of the resource whose "ID" attribute is needed.
 *  @return {String}                            The string containing the "ID" attribute of the passed resource.
 */
function getResourceIdFromName(resourceName, resourcesArray) {
  let resourceId = "";
  resourcesArray.forEach(function(element) {
    // Return the "ID" attribute of the resource as soon as it's found...
    if (resourceName === element.resourceName) {
      resourceId = element.resourceId;
      return resourceId;
    }
  });
  // ... or return an empty string if the name hasn't been found.
  return resourceId;
}

/**
 *  Build and return a sorted list of only the "name" attribute of the passed resources.
 *  It is useful to have a list containing only the names of the resources, without having to filter the resource
 *  attributes each time we need them: for example when we build the "dynamic" suggestions, it's useful to
 *  perform the search on only the names of the folders instead of on all its attributes.
 *  This list is also used to display the static suggestions (the static list of folder names).
 *
 *  @param  {ResourceNameId[]}  resourcesArray  The array containing the resources to be filtered.
 *  @return {String[]}                          The sorted array containing the list of the names of the folders.
 */
function getResourcesNames(resourcesArray) {
  let resourceNames = [];
  for (let i = 0; i < resourcesArray.length; i++) {
    resourceNames.push(resourcesArray[i].resourceName)
  }
  // Return the sorted array of resources names.
  return resourceNames.sort();
}

/**
 *  Build and return a list of only the "name" and "ID" attributes of the passed resources.
 *  The Google Drive queries return all the atribues that can be obtained through
 *  the APIs, but for our needs the "name" and "ID" attribues will be enough.
 * 
 *  @param  {Resource}        resourcesArray  The array containing the resources to be filtered.
 *  @return {ResourceNameId[]}                  The array containing only the name and the ID of the resources that have been passed.
 */
function getResourcesNamesAndIds(resourcesArray) {
  let resourceNamesIds = [];
  for (let i = 0; i < resourcesArray.length; i++) {
    // Get only the name and ID attributes of each resource.
    resourceNamesIds.push({
      // File.title and Drive.name
      "resourceName": resourcesArray[i].title || resourcesArray[i].name,
      "resourceId": resourcesArray[i].id
    })
  }
  return resourceNamesIds;
}

/**
 *  Find, replace and return certain chars in the passed string.
 *  The APIs used to retrieve the sender and recipients of the messages present in the currently open thread
 *  return the requested data in the following structure: name <emailAddress>. If we then want to create a
 *  PDF-file from the HTML-formatted data of the message, the email addresses of both sender and recipients are not
 *  present (I guess because of the parsing that's going on in the final file which reads '<emailAddress>' as an
 *  HTML tag instead of a simple text string, but I'm not sure). But if we replace the "<>" chars of the email
 *  address with other ones (for example with a couple of parenthesis "()"), the email addresses are displayed
 *  correctly, so here we are... 😅 ¯\_(ツ)_/¯
 *
 *  @param  {String}  nameAndEmailAddr The string containing the name and email address to be modified.
 *  @return {String}                   The string containing the modified name and email address.
 */
function modifyEmailAddr(nameAndEmailAddr) {
  // Do a global replacement on the whole string, for each email address.
  nameAndEmailAddr = nameAndEmailAddr.replace(/</g, "(");
  nameAndEmailAddr = nameAndEmailAddr.replace(/>/g, ")");
  return nameAndEmailAddr;
}

/**
 *  Get a name of a file and return it sanitized.
 *  Since we are offering the possibility to the user to insert a custom name for the final messages PDF-file
 *  (and for the eventual attachments folder), we better do a little bit of sanitization on that name before
 *  using it to create the file/folder.
 *  Even tho Google Drive seems to accept all kinds of characters in its files/folders (!?😳), we better do this
 *  sanitization for the forbidden files/folders characters in Windows/MacOs.
 *
 *  @param  {String}  fileNameToSanitize  The string containing the name of the file to be sanitized.
 *  @return {String}                      The string containing the sanitized name of the file.
 */
function sanitizeFileName(fileNameToSanitize) {
  return fileNameToSanitize.replace(/[&\/\\\|#,+()$~%.'":*?<>{}]/g, '');
}

/**
 *  Display to the user a notification with some explanatory text.
 *  Inform the user with the result of some action that took a while to execute or that blocked the Add-on with
 *  a load indicator.
 *
 *  @param  {String}           text     The string containing the text to be displayed by the notification.
 *  @return {ActionResponse}            The ActionResponse containing a success notification.
 */
function notifyUser(text) {
  return CardService.newActionResponseBuilder()
    // Go back to the root card (the card called by the 'contextualTriggers' or 'homepageTrigger').
    .setNavigation(CardService.newNavigation().popToRoot())
    .setStateChanged(true)
    .setNotification(CardService.newNotification()
      .setText(text))
    .build();
}

/**
 *  Refresh the contextual card.
 *  Update the current contextual card, i.e. execute the onTriggerFunction specified in the gmail
 *  contextualTrigger manifest. This can be achieved through an add-on menu item, but this menu isn't
 *  available on mobile, so we have to make an apposite function that gives users the ability to refresh
 *  the card by re-running the Apps Script trigger function registered in the manifest.
 *
 *  @return {ActionResponse}  The ActionResponse containing the updated card.
 */
function refreshContextualCard() {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation()
      .updateCard(onGmailMessageOpen()))
    .build()
}

/**
 *  Build and return a sorted suggestion response.
 *  In this case, the suggestions are a list of folders, filtered by the text that the user has already entered.
 *  This method assumes the Google Workspace add-on extends Gmail; the add-on only calls this method for cards
 *  displayed when the user has entered a message context.
 *
 *  @param  {Object}                eventObj  The event object containing data associated with this text input widget.
 *  @return {SuggestionsResponse}
 */
function buildSuggestions(eventObj) {
  let userInput = eventObj && eventObj.commonEventObject.formInputs.folderNameInput.stringInputs.value[0].toLowerCase();

  // Filter the address list to those containing the text the user has already entered.
  let suggestionList = [];
  DRIVE_FOLDER_NAMES.forEach(function(folderName) {
    if (folderName.toLowerCase().indexOf(userInput) !== -1) {
      suggestionList.push(folderName);
    }
  });
  suggestionList.sort();
  
  return CardService.newSuggestionsResponseBuilder()
    .setSuggestions(CardService.newSuggestions()
      .addSuggestions(suggestionList))
    .build();  // Don't forget to build the response!
}

/**
 *  Return the name of the final PDF-file.
 *  Have to set the name of the final PDF-file in an external function because it depends on wether the user
 *  entered a value in the 'fileNameInput' textinput and wether we have to save the whole email thread or just a
 *  single message. We can't know both values prior to the user hitting the 'save' button, so we call this function
 *  when we know which email subject we should use (depending on the 'threadMessagesSwitch').
 *
 *  @param  {Object}  eventObj      The event object containing data associated with the 'fileNameInput' string
 *                                  input by the user.
 *  @param  {String}  emailSubject  The string containing the subject of email we're working on.
 *  @return {String}                The string containing the name of the PDF-file.
 */
function setFinalPDFFileName(eventObj, emailSubject) {
  // Set the name of the final PDF-file (which is optional)
  try {
    // If the user has entered a name for the file ...
    let fileNameInput = eventObj.commonEventObject.formInputs.fileNameInput.stringInputs.value[0];
    // ... set that (sanitized) as the final PDF-file name ...
    return sanitizeFileName(fileNameInput);
  } catch (e) {
    // ... otherwise set the name of the final PDF-file as the subject of the passed email massage.
    // We could've used the GmailThread.getFirstMessageSubject() API, but I prefer to make as few API
    // calls as possible to improve overall performance.
    return emailSubject;
  }
}

/**
 *  Persist the user settings choices.
 *  When the user changes the settings values, we have to 'remember' those choices for the next time the user
 *  loads the Add-on (otherwise this value gets restored after a page refresh or a new page load).
 *  That's why we are saving the choices as key-value pairs scoped to one user of a script for future use.
 *
 *  @param  {Object}          eventObj  The event object containing data associated with the settings card inputs.
 *  @return {ActionResponse}            The ActionResponse containing a success notification.
 */
function saveSettings(eventObj) {
  // Check if the user has changed the shared drive.
  if (eventObj.commonEventObject.formInputs.sharedDriveIdInput.stringInputs.value[0] !== PROPERTIES_KEYS.sharedDriveId) {
    // Save the Google Drive shared drive chosen by the user.
  USER_PROPERTIES.setProperty(PROPERTIES_KEYS.sharedDriveId, eventObj.commonEventObject.formInputs.sharedDriveIdInput.stringInputs.value[0]);
  }

  // Check if the THREAD_MESSAGES switch is on:
  try {
    // YES --> the value of the switch is 'true' and the 'userInput' variable exists.
    let userInput = eventObj.commonEventObject.formInputs.threadMessagesSwitch.stringInputs.value;
    // Save the updated value in the USER_PROPERTIES.
    USER_PROPERTIES.setProperty(PROPERTIES_KEYS.saveThread, "true")
  } catch (e) {
    // NO --> the switch is off.
    // Save the updated value in the USER_PROPERTIES.
    USER_PROPERTIES.setProperty(PROPERTIES_KEYS.saveThread, "false")
  }

  // Notify the user when this action is complete.
  return notifyUser("Settings saved ✅");
}
