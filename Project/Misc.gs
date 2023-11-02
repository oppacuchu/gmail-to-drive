/**
 *  Build and return a fixed footer containing action button(s).
 *  Since multiple cards have a "save" button, it is helpful to have this function return a footer
 *  containing a "save" button which will trigger a function passed to this method.
 *
 *  @param  {String}        functionName  The name of the function to be executed when the button gets clicked.
 *  @return {FixedFooter}                 The fixed footer containing the button(s).
 */
function cardFooter(functionName) {
  return CardService.newFixedFooter().setPrimaryButton(
    CardService.newTextButton()
      .setText("save 💾")
      .setAltText("save")
      // TODO: disable "save" button when the folderNameInput Text Input is empty
      //.setDisabled(false)
      .setOnClickAction(CardService.newAction().setFunctionName(functionName))
  )
}

/**
 *  Build and return a card to be displayed by the add-on's gmail contextualTrigger 'onTriggerFunction' call.
 *  This function is called as soon as the user opens an email thread.
 *  Previously this function used to build a card for each folder: the user had to open the card and
 *  then save the mail through the following section. But since the n° of folders will be in the hundreds,
 *  I didn't know how to paginate them or load them as the user kept scrolling down.
 *  So I have opted instead to create a single card with one section, in which the user has to select a folder
 *  from the suggestions or input the folder name manually (the suggestions will still appear as the user is typing).
 *  After the user has selected/entered a valid folder, he can upload the PDF-file created from the currently
 *  open thread by pressing the "save" button in the footer of the add-on's card.
 *
 *  @param  {Object}  eventObj  The event object containing data associated with the
 *                              manifest's gmail contextualTrigger 'onTriggerFunction' call.
 *  @return {Card}              The card to be displayed by the add-on's gmail
 *                              contextualTrigger 'onTriggerFunction' call.
 */
function onGmailMessageOpen(eventObj) {
  return CardService.newCardBuilder()
    .setName("contextualCard")
    .addSection(
      CardService.newCardSection()
        // Create the text input in which the user can type/select the desired Google Drive folder.
        .addWidget(
          CardService.newTextInput()
            .setFieldName("folderNameInput")
            .setTitle("Folder *")
            .setHint("❕❗Field required❗❕ Enter the *exact* name of the desired folder.")
            // Set static suggestions for the text input.
            .setSuggestions(CardService.newSuggestions()
              .addSuggestions(getResourcesNames(getResourcesNamesAndIds(getDriveFolders())))
            )
            // Set suggestion action for the text input (build "dynamic" suggestions as the user is typing).
            .setSuggestionsAction(CardService.newAction().setFunctionName("buildSuggestions"))
            // TODO: function to disable "save" button when the folderNameInput Text Input is empty
            //.setOnChangeAction(CardService.newAction().setFunctionName("checkIfPresent"))
        )
        // Set "refresh" button that updates this card (to update the "fileNameInput" static suggestions)
        .addWidget(
          CardService.newTextButton()
            .setText("Refresh Card")
            .setAltText("Refresh card")
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName("refreshContextualCard")))
        .setHeader("Destination folder 📂")
    )
    // Create the text input in which the user can type the name of the file that will be created.
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextInput()
            .setFieldName("fileNameInput")
            .setTitle("File name")
            .setHint("Optional: enter the name of the generated PDF-file.")
        )
        .setHeader("File name 📌")
    )
    // Create the text input in which the user can type the email addresses to be notified.
    .addSection(
      CardService.newCardSection()
        // Get the email addresses ...
        .addWidget(
          CardService.newTextInput()
            .setFieldName("emailToInput")
            .setTitle("E-Mail addresses")
            .setHint("Optional: enter the email addresses (separated by comma ,) to notify.")
        )
        // ... the email object ...
        .addWidget(
          CardService.newTextInput()
            .setFieldName("emailObjectInput")
            .setTitle("E-Mail header")
            .setHint("Optional: enter the subject of the email.")
        )
        // ... and the body of the email to be sent.
        .addWidget(
          CardService.newTextInput()
            .setFieldName("emailBodyInput")
            .setTitle("E-Mail body")
            .setHint("Optional: enter the body of the email.")
            .setMultiline(true)
        )
        .setHeader("E-Mail notification 📧")
    )
    // Settings section (go to settings card).
    .addSection(
      CardService.newCardSection()
        .addWidget(SETTINGS_WIDGET)
    )
    // Set the "save" button.
    .setFixedFooter(cardFooter("generatePDFFile"))
  .build()
}

/**
 *  Build and return a card to be displayed by the add-on's gmail homepageTrigger 'runFunction' call.
 *  This function is called when the user opens the add-on in the Gmail homepage (without opening an e-mail message first).
 *  It shows a brief explanation of the add-on's functionality and allows the user to go to the add-on's settings card to
 *  change its settings.
 *
 *  @param  {Object}  eventObj  The event object containing data associated with the
 *                              manifest's gmail homepageTrigger 'runFunction' call.
 *  @return {Card}              The card to be displayed by the add-on's gmail
 *                              homepageTrigger 'runFunction' call.
 */
function gmailHomepage(eventObj) {
  // Build card header.
  let cardHeader = CardService.newCardHeader()
    .setTitle("From Gmail to Google Drive❕")
    .setSubtitle("... in a few clicks 💪🏼");
  // Build card description.
  let cardDescription = CardService.newCardSection()
    // Show the user a description of the add-on's functionality.
    .addWidget(
      CardService.newTextParagraph()
        .setText("Questo componente aggiuntivo consente il salvataggio dei messaggi e-mail \
in un unico file PDF, salvato nella cartella di Google Drive desiderata.<br>Gli eventuali allegati di tipo \
immagine verranno aggiunti sotto ogni messaggio, mentre gli altri tipi di allegati verranno salvati in una \
cartella creata su misura per ospitare sia gli allegati stessi che il file PDF contenente i messaggi della \
conversazione. Verrà inoltre aggiunto un link sotto ogni messaggio per la visualizzazione rapida di questi \
allegati 📎.<br>É inoltre possibile inviare una notifica via e-mail.")
    )
    .setHeader("Description 💬")
    .setCollapsible(true);
  // Build the add-on's settings card section.
  let addOnSettings = CardService.newCardSection()
    .addWidget(SETTINGS_WIDGET);
  // Build the card.
  let card = CardService.newCardBuilder()
    // Set the name of this card.
    .setName("homepageCard")
    // Set card header.
    .setHeader(cardHeader)
    // Set card description.
    .addSection(cardDescription)
    // Settings card of the add-on.
    .addSection(addOnSettings);
  // Return the builded card.
  return card.build();
}

/**
 *  Build a "settings card" and navigate to it.
 *  In this method we create a card that contains various settings that affect the add-on's functionality,
 *  which can be changed by the user. When this method gets called, it navigates the user to this card from
 *  wherever the user was before. The "settings card" is pushed onto the current card stack, which allows
 *  the user to change the desired settings and then go back to where he was.
 *
 *  @param  {Object}  eventObj  The event object containing data associated with the function call.
 *  @return {ActionResponse}    The response object that shows the "settings card" to the user.
 */
function settingsCard(eventObj) {
  let cardHeader = CardService.newCardHeader()
    .setTitle("Settings 🔧")
    .setSubtitle("Edit the settings of the app");
  // Build the Google Drive shared folder select input.
  let dropdownGroup = CardService.newSelectionInput()
    .setFieldName("sharedDriveIdInput")
    .setTitle("Google Drive folder")
    .setType(CardService.SelectionInputType.DROPDOWN);
  // Populate the select options items.
  SHARED_DRIVES_NAMES_AND_IDS.forEach(function(drive) {
    // Set the value of the input if the user has already set it before.
    if (USER_PROPERTIES.getProperty(PROPERTIES_KEYS.sharedDriveId) == drive.resourceId) {
      dropdownGroup.addItem(drive.resourceName, drive.resourceId, true);
    } else {
      dropdownGroup.addItem(drive.resourceName, drive.resourceId, false);
    }
  });
  let cardSettings = CardService.newCardSection()
    // Let the user choose the Google Drive shared folder in which we have to save the files.
    .addWidget(dropdownGroup)
    // Instruct the user that he has to refresh the card on shared folder change in order to update the static suggestions.
    .addWidget(CardService.newTextParagraph()
      .setText("<font color='#ff0000'><b>Warning</b></font>❗<br>\
<u>Update</u> the card with the <i>save</i> button after changing the Google Drive folder."))
    // Add a divider between the individual settings.
    .addWidget(CardService.newDivider())
    // Switch for choosing if we have to save the whole thread or just the single email message.
    .addWidget(
      CardService.newDecoratedText()
        .setTopLabel("Thread")
        .setText("Save all the messages of the thread")
        //.setBottomLabel("bottom label")
        .setWrapText(true)
        .setSwitchControl(CardService.newSwitch()
          .setFieldName("threadMessagesSwitch")
          .setValue("save_whole_thread")
          // Get the value saved in the USER_PROPERTIES.
          .setSelected(THREAD_MESSAGES))
        .setStartIcon(CardService.newIconImage()
          .setAltText("emailIcon")
          .setIcon(CardService.Icon.EMAIL)
          .setImageCropType(CardService.ImageCropType.CIRCLE))
    )
  // Build the settings card.
  let card = CardService.newCardBuilder()
    .setName("settingsCard")
    .setHeader(cardHeader)
    .addSection(cardSettings)
    .setFixedFooter(cardFooter("saveSettings"))
    .build();
  // Create a Navigation object to push the card onto the stack.
  let nav = CardService.newNavigation().pushCard(card);
  // Return a built ActionResponse that uses the navigation object.
  return CardService.newActionResponseBuilder()
    // Set the response to a Navigation action.
    .setNavigation(nav)
    // Build the current action response and validate it.
    .build();
}
