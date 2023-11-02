/**
 *  Return a list of all folders present in the desired Google Drive folder, i.e. the folder
 *  that has the ID specified by the DRIVE_ID constant.
 *  This function is and should only be called once per add-on "runtime" to keep acceptable performance.
 *  If a new folder is added/created in the current Google Drive folder while the add-on in used/open,
 *  the user has to close the add-on and open it again to refresh the list of suggested folders in the 
 *  text input.
 *
 *  @return {Resource[]}  The array containing the list of folders present in the "selected" Google Drive ID. This list
 *                        is made of file resources: https://developers.google.com/drive/api/v2/reference/files#resource.
 */
function getDriveFolders() {
  // Set up the parameters of the query to be performed.
  let queryParameters = {
    corpora: "drive",
    driveId: DRIVE_ID,
    includeItemsFromAllDrives: true,
    maxResults: 69, // ( •_•)>⌐■-■  (⌐■_■)
    orderBy: "modifiedByMeDate desc, recency desc, title_natural desc",
    // Get only the folders that are not in the trash and are in the root folder of the Shared Drive.
    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false and parents in '" + DRIVE_ID + "'",
    supportsAllDrives: true
  };

  // Return the array of folders (Files resources).
  return driveQuery(queryParameters, "Files");
}

/**
 *  Return a list of the user's shared drives.
 *  This function is and should only be called once per add-on "runtime" to keep acceptable performance.
 *  If a new folder is added/created in the current Google Drive folder while the add-on in used/open,
 *  the user has to close the add-on and open it again to refresh the list of suggested folders in the 
 *  text input.
 *
 *  @return {Resource[]}  The array containing the list of the user's shared drives. This list
 *                        is made of drive resources: https://developers.google.com/drive/api/v2/reference/drives#resource.
 */
function getDrives() {
  // Set up the parameters of the query to be performed.
  let queryParameters = {
    maxResults: 69, // ( •_•)>⌐■-■  (⌐■_■)
    // Get only shared drives that are not hidden.
    q: "hidden = false"
  };

  // Return the array of folders (Drives resources).
  return driveQuery(queryParameters, "Drives");
}

/**
 *  Run the Google Drive "list" query and return its result.
 *  Build and execute a Google Drive query on the desired resource to get a list of all of its items.
 *
 *  @param  {Object}              queryParams   The object containing the parameters of the query.
 *  @param  {("Files"|"Drives")}  resource      The string containing the resource to be queried.
 *  @return {Resource[]}                        The array containing the list of resources returned by the query
 *                                              (for example https://developers.google.com/drive/api/v2/reference/files/list).
 */
function driveQuery(queryParams, resource) {
  let resources = [];
  let nextPageToken = "";
  let queryResponse;

  // The API calls are made in a loop because the max n° of folders that we can get from one single call is 100.
  // So we have to keep making the calls until the are no more folders to get (until the nextPageToken is empty).
  do {
    // Set the page token of the query.
    queryParams.pageToken = nextPageToken || "";
    // Perform the query, based on the passed resource.
    switch (resource) {
      case "Files":
        queryResponse = Drive.Files.list(queryParams);
        break;
      case "Drives":
        queryResponse = Drive.Drives.list(queryParams);
        break;
    }
    // Push the result of ther query into the array that will be returned at the end.
    Array.prototype.push.apply(resources, queryResponse.items);
    // Set the nextPageToken for the eventual next call.
    nextPageToken = queryResponse.nextPageToken;
  } while (nextPageToken); // Keep performing the loop until the nextPageToken isn't empty.

  // Return the array of folders (resources).
  return resources;
}

/**
 *  Insert the passed file into the passsed Google Drive folder.
 *  This function uses the base "createFile" API
 *  (https://developers.google.com/apps-script/reference/drive/folder#createFile(BlobSource).
 *  If we'll ever need to use the other "createFile" APIs, we'll have to create new functions (I guess
 *  it'll be good to have one function for each API).
 *
 *  @param  {String}     folderId   The string containing the "ID" attribute of the folder in which the
 *                                  file needs to be created.
 *  @param  {BlobSource} file       The blob containing the data for the new file to be created.
 *  @return {File}                  The created file in Google Drive.
 */
function uploadFileToDriveFolder(folderId, file) {
  return DriveApp.getFolderById(folderId).createFile(file);
}
