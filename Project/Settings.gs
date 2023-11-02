/**
 *  Order of files:
 *  1) GDrive
 *  2) Misc
 *  3) Settings
 *  4) Cards
 *  5) Code
 */

/**
 *  Google Drive resource type.
 *
 *  @typedef {Object} Resource
 */

/**
 *  Name and ID of a Google Drive resource.
 *  The structure of the object is as follows:
 *  {
 *    "resourceName": <nameOfTheResource>{String},
 *    "resourceId": <IdOfTheResource>{String}
 *  }
 * 
 *  @typedef  {Object.<String, String>} ResourceNameId
 *  @property {String}                  resourceName    Name of the resource.
 *  @property {String}                  resourceId      ID of the resource.
 */

/**
 *  Map of the keys stored by the Properties service.
 *
 *  @const
 *  @property {String}  sharedDriveId   ID of the Google Drive shared drive in wich we have to save the e-mail.
 *  @property {String}  saveThread      Wether or not to save the whole thread of messages.
 */
const PROPERTIES_KEYS = {
  sharedDriveId: "googleDriveSharedDriveId",
  saveThread: "gmailSaveThreadMessages"
}

/**
 *  User Properties with the key-value pairs scoped to the user.
 *
 *  @const
 *  @type {Properties}
 */
const USER_PROPERTIES = PropertiesService.getUserProperties();

/**
 *  List of the user's shared drives.
 *
 *  @const
 *  @type {Resource[]}
 */
const SHARED_DRIVES = getDrives();

/**
 *  List of user's shared drives with only their "name" and "ID" properties.
 *
 *  @const
 *  @type {ResourceNameId[]}
 */
const SHARED_DRIVES_NAMES_AND_IDS = getResourcesNamesAndIds(SHARED_DRIVES);

/**
 *  ID of the Google Drive shared drive in which the files will be created. The ID of a Google Drive folder is
 *  the last part of the URL link after https://drive.google.com/drive/folders/...
 *  If the property isn't already set (because this is the first time that this add-on is used or because for
 *  some reason this value gets deleted), set the DRIVE_ID as the first shared drive of our shared drive list.
 *  This is because I cannot be bothered (and I wouldn't know how) to implement a check and force the user to
 *  choose a shared drive if there isn't one already selected 😅🤷🏼‍♂️.
 *
 *  @const
 *  @type {String}
 */
const DRIVE_ID = USER_PROPERTIES.getProperty(PROPERTIES_KEYS.sharedDriveId) || SHARED_DRIVES_NAMES_AND_IDS[0].resourceId;

/**
 *  List of folders in which the user will upload the file.
 *
 *  @const
 *  @type {Resource[]}
 */
const DRIVE_FOLDERS = getDriveFolders();

/**
 *  List of folders with only their "name" and "ID" properties.
 *
 *  @const
 *  @type {ResourceNameId[]}
 */
const DRIVE_FOLDERS_NAMES_AND_IDS = getResourcesNamesAndIds(DRIVE_FOLDERS);

/**
 *  List of folders with only their "name" property.
 *
 *  @const
 *  @type {String[]}
 */
const DRIVE_FOLDER_NAMES = getResourcesNames(DRIVE_FOLDERS_NAMES_AND_IDS);

/**
 *  Bool that indicates if we have to save the whole thread or just the single e-mail message.
 *  If the value isn't already set in the USER_PROPERTIES, set it to 'false'.
 * 
 *  @const
 *  @type {Boolean}
 */
const THREAD_MESSAGES = (USER_PROPERTIES.getProperty(PROPERTIES_KEYS.saveThread) === "true");

/**
 *  Create a new DecoratedText through which the user can reach the "settings card".
 *  This DecoratedText will then be included in various card widgets.
 *
 *  @const
 *  @type {DecoratedText}
 */
const SETTINGS_WIDGET = CardService.newDecoratedText()
  .setTopLabel("Settings 🔧")
  .setText("Edit the settings of the add-on")
  //.setBottomLabel("bottom label")
  .setWrapText(true)
  .setOnClickAction(CardService.newAction()
    .setFunctionName("settingsCard"));
