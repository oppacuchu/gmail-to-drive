<a name="readme-top"></a>

# Gmail to Google Drive
Archive emails from Gmail directly into a shared Google Drive folder!


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project

I was on the search for a solution to this problem: easily archive emails and then be able to find them on a later date, without having to search through them with Gmail (also let other users search them). After some googling and trying some Gmail add-ons, I decided to write my own add-on based on my specific needs: archive email messages (or whole threads) with relative attachments from Gmail directly into Google Drive, without having to manually download the email and upload it to Drive.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- GETTING STARTED -->
## Getting Started

This is a step-by-step guide to configure the add-on on your account.


### Prerequisites

This add-on works only for Google Workspace accounts (you need access to Google Apps Script) and uploads the files in a Shared drive of Google Drive.


### Installation

Go to [Google Apps Script](https://script.google.com) and create a new Project. Name it how you like.
<br>
Recreate the same file structure as the _Project_ folder and copy all the file contentes into your project files (show the manifest file "appsscript.json" in the editor from the project settings).
<br>
The files should be in the following order (otherwise the files won't be loaded in the correct order):
<ol>
  <li>appsscript.json</li>
  <li>GDrive</li>
  <li>Misc</li>
  <li>Settings</li>
  <li>Cards</li>
  <li>Code</li>
</ol>
Save the project.
<br>
Then go to the deployment button and click <i>Verify Deployment</i> --> Google Workspace add-on type. Once saved, you can install it from the button near Application(s): Gmail after clicking the <i>Verify Deployment</i> button. Allow the permissions if asked and then you should be ready to go!

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- USAGE EXAMPLES -->
## Usage



<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the GNU General Public License v3.0. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
