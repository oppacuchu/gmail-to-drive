/**
 *  Return the formatted email message and the eventual folder for non-image attachments.
 *  This is the function responsible for building the structure of the message that will be in the final PDF-file.
 *  Here we are getting all the impotant info from the passed email message (such as subject, date, sender, body...)
 *  and building the HTML template which will end up in the final PDF-file.
 *  Structure of the returned object:
 *    {
 *      "outputMessage":     <HTMLFormattedMessage>{String},
 *      "attachmentsFolder": <newlyCreatedGoogleDriveFolderForNonImageAttachments>{Folder}
 *    }
 *
 *  @param  {GmailMessage}  inputMessage      The Gmail message we're working on.
 *  @param  {String}        outputMessage     The string containing the content of the email message.
 *  @param  {Folder}        attachmentsFolder The Google Drive folder that contains the eventual non-image attachments.
 *  @param  {String}        destinationFolder The string containing the name of the destination folder.
 *  @param  {String}        finalPDFName      The string containing the name of the final PDF-file.
 *  @return {Object}                          The object containing the string with the content of the email message
 *                                            (outputMessage) and the eventual Google Drive folder that was created
 *                                            in the meantime for the non-image attachments.
 */
function generatePDFStructure(inputMessage, outputMessage, attachmentsFolder, destinationFolder, finalPDFName) {
  // Build the template of the outputMessage.
  outputMessage +=
    "<b>" + inputMessage.getSubject() + "</b><br>" +
    "From: <i>" + modifyEmailAddr(inputMessage.getFrom()) + "</i><br>" +
    "Date: " + Utilities.formatDate(inputMessage.getDate(), "CET", "dd-MM-yyyy HH:mm:ss") + "<br>";

  // Only add Cc, Bcc and ReplyTo recipients if present.
  inputMessage.getCc().length ?
    outputMessage += "Cc: <i>" + modifyEmailAddr(inputMessage.getCc()) + "</i><br>" : "";
  inputMessage.getBcc().length ?
    outputMessage += "Ccn: <i>" + modifyEmailAddr(inputMessage.getBcc()) + "</i><br>" : "";
  inputMessage.getReplyTo().length ?
    outputMessage += "Reply to: <i>" + modifyEmailAddr(inputMessage.getReplyTo()) + "</i><br>" : "";
  
  let inputMessageBody = inputMessage.getBody();
  // Get only the <body>...</body> content of the message (if there's a body): this way we avoid strange formattings.
  // Otherwise use all the content, since likely there won't be any fancy formatting.
  let inputMessageContent = !inputMessageBody.includes("<body ") ? inputMessageBody :
    inputMessageBody.substring(inputMessageBody.indexOf("<body "), inputMessageBody.indexOf("</body>") + 7);
  
  outputMessage +=
    "To: <i>" + modifyEmailAddr(inputMessage.getTo()) + "</i><br><br>" + inputMessageContent + "<br>";

  // Now we have to deal with the attachments of the inputMessage.
  inputMessage.getAttachments().forEach(function(attachment, index) {
    // If the attachment is an image, add it after the email body in an appropriate <img> tag...
    if (attachment.getContentType().includes("image")) {
      outputMessage +=
        '<img src="data:' + attachment.getContentType() + ';base64,' +
        Utilities.base64Encode(attachment.getBytes()) + '" style="width: 100%; object-fit: contain" /><br><br>';
    } else {
      // ... otherwise, we have to create a new folder for the final PDF-file and all the non-image attachments.
      if (!attachmentsFolder) {
        // Create the folder only once (the first time we encounter a non-image attachment) and only if there isn't
        // already a folder that was created on a previous call of the function.
        attachmentsFolder = DriveApp
          .getFolderById(getResourceIdFromName(destinationFolder, DRIVE_FOLDERS_NAMES_AND_IDS))
          .createFolder(finalPDFName);
      };

      // Create and add a link after the 'inputMessage' body for the attachments quick-view.
      outputMessage +=
        '<br><u>Attachments:</u><br><a href="' + attachmentsFolder.createFile(attachment).getUrl() +
        '">' + attachment.getName() + '</a><br>';
    };
  });

  return { outputMessage: outputMessage, attachmentsFolder: attachmentsFolder };
}

/**
 *  Build a PDF file from the currently open Gmail thread.
 *  Our goal with this whole add-on is the following: generate a PDF-file containing all the messages
 *  from the currently open thread.
 *  So, after we get all the messages of the thread, we have to save for each message its attributes
 *  (sender, recipients, date, body...) and then "push" all of them into a string (with a little bit of HTML
 *  sprinkled in there for formatting), which will then be transformed into a Blob and finally retrieved as a PDF-file.
 *  As for the attachments, we'll attach only the images to the messages PDF-file (righ under the body of each message).
 *  If the thread has messages that contain non-image attachments, we're going to create a new folder which
 *  is going to contain the messages PDF-file and all the attachments of all the messages of the thread. For
 *  these type of messages we're going to add a link after the message body, so the user can quickly view
 *  these attachments in a new tab.
 *  In the end, we send an email notification to the user entered email addresses (if any).
 *
 *  @param  {Object}           eventObj The event object containing data associated with the card's "save" button
 *                                      action call.
 *  @return {ActionResponse}            The ActionResponse containing a success notification.
 */
function generatePDFFile(eventObj) {
  // Activate temporary Gmail scopes, in this case to allow the add-on to read message metadata and content.
  GmailApp.setCurrentMessageAccessToken(eventObj.gmail.accessToken);
  // Check if we need to save the whole thread or just the single message.
  let thread = THREAD_MESSAGES;

  let finalPDFFileName, folderForAttachments, finalPDFFile, folderNameInput, emailsToNotify, emailObject, emailBody;
  // Have to initialize it like this, otherwise the final PDF-file starts with 'undefinedundefined'... ¯\_(ツ)_/¯
  let msg = "<span></span>";
  // Check if the user has entered the name of the destination folder:
  try {
    // YES --> set the variables that will contain the user input data.
    folderNameInput = eventObj.commonEventObject.formInputs.folderNameInput.stringInputs.value[0];
  } catch (e) {
    // NO --> throw an explanative error.
    throw new Error("Enter the name of the destination folder!");
  }

  // Build the final PDF-file based on the 'threadMessagesSwitch'.
  switch (thread) {
    // Use all the messages from the thread.
    case true:
      // Get all the messages of the currently open thread.
      let threadMessages = GmailApp.getThreadById(eventObj.gmail.threadId).getMessages();

      // Set the name of the PDF-file
      finalPDFFileName = setFinalPDFFileName(eventObj, threadMessages[0].getSubject());
      
      // Cycle through each message of the thread to construct the final PDF-file.
      threadMessages.forEach(function(message, index) {
        // Temporary holder for the object returned by the generatePDFStructure() function.
        let formattedMessage = generatePDFStructure(message, msg, folderForAttachments, folderNameInput, finalPDFFileName);
        // Get the HTML formatted message.
        msg += formattedMessage.outputMessage;
        // Get the eventual attachments folder.
        folderForAttachments = formattedMessage.attachmentsFolder;

        // Insert a message divider only if the current message isn't the last one of the thread.
        index != threadMessages.length - 1 ?
          msg +=
            "<br>⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙ ⁙<br><br>" : "";
      });
      break;

    // Use only the single message currently open.
    case false:
      // Get the currently open message.
      let singleMessage = GmailApp.getMessageById(eventObj.gmail.messageId);

      // Set the name of the PDF-file
      finalPDFFileName = setFinalPDFFileName(eventObj, singleMessage.getSubject());

      // Temporary holder for the object returned by the generatePDFStructure() function.
      let formattedMessage = generatePDFStructure(singleMessage, msg, folderForAttachments, folderNameInput, finalPDFFileName);
      // Get the HTML formatted message.
      msg += formattedMessage.outputMessage;
      // Get the eventual attachments folder.
      folderForAttachments = formattedMessage.attachmentsFolder;
      break;
  }

  // Have to create an HtmlOutput object because otherwise we get an error saying we can't transform
  // plain text into a PDF-file 😕.
  const THREAD_PDF_FILE = HtmlService.createHtmlOutput(msg).getBlob().setName(finalPDFFileName).getAs(MimeType.PDF);

  // Finally, upload the file to the desired folder (based on the presence of non-image attachments).
  finalPDFFile = folderForAttachments ?
    uploadFileToDriveFolder(folderForAttachments.getId(), THREAD_PDF_FILE) :
    uploadFileToDriveFolder(getResourceIdFromName(folderNameInput, DRIVE_FOLDERS_NAMES_AND_IDS), THREAD_PDF_FILE);
  
  // Check if the user has entered some emails addresses to be notified:
  try {
    // YES --> set the variables that will contain the emails addresses to be notified...
    emailsToNotify = eventObj.commonEventObject.formInputs.emailToInput.stringInputs.value[0].trim();
    // Check if the user has entered the object of the email notification...
    try {
      emailObject = eventObj.commonEventObject.formInputs.emailObjectInput.stringInputs.value[0].trim();
    } catch (e) {
      // ... otherwise send a predefined text.
      emailObject = "New document";
    }
    // Check if the user has entered the body of the email notification...
    try {
      emailBody = eventObj.commonEventObject.formInputs.emailBodyInput.stringInputs.value[0].trim();
    } catch (e) {
      // ... otherwise send a predefined text.
      emailBody = "A new document has been uploaded to Google Drive. Click here to visualize it:";
    }
    // ... and send an email to those email addresses. 
    GmailApp.sendEmail(emailsToNotify, emailObject, emailBody + "\n\n" + finalPDFFile.getUrl());
  } catch (e) {
    // NO --> don't do anything.
  }
  
  // Notify the user that the file has been created correctly.
  return notifyUser("E-Mail archived correctly ✅");
}
