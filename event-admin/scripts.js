/* google sheets stuff*/
var CLIENT_ID = 'not set';
var API_KEY = 'not set';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "profile email https://www.googleapis.com/auth/spreadsheets";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var signedinElement = document.getElementById('signed-in');
var signedoutElement = document.getElementById('signed-out');
var contentElement = document.getElementById('content');

var defaultFieldValues = [];
/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://gardenlifegame.com/megs_php/getcreds.php');
  xhr.onload = function() {
    if(xhr.responseText.startsWith("0")){
      var creds = JSON.parse(xhr.responseText.substring(2));
      window.API_KEY = creds.developer_key;
      window.CLIENT_ID = creds.client_id;
      gapi.load('client:auth2', initClient);
    } else {
      console.log(xhr.responseText);
      document.getElementById('prompt').innerHTML = "Could not sign in, please try again. If the problem persists, please contact the developer."
    }
  }
  xhr.send();
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function(error) {
    appendPre(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    signedoutElement.style.display = 'none';
    signedinElement.style.display = 'block';
    displaySheetsData();
  } else {
    signedoutElement.style.display = 'grid';
    signedinElement.style.display = 'none';
    contentElement.innerHTML = '';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} text Text to be placed in element element.
 * @param {string} elementType Type of element to add.
 */
function appendContent(parentElement, elementType, text) {
  var newElement = document.createElement(elementType);
  var textContent = document.createTextNode(text);
  newElement.appendChild(textContent);
  parentElement.appendChild(newElement);
  return newElement;
}

/**
 * Loads data from this spreadsheet:
 * https://docs.google.com/spreadsheets/d/1qvA4MoPhvNiN3oZ6R2kquw_i2labIn7QDddxOoNV_7E/edit
 */
function displaySheetsData() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1qvA4MoPhvNiN3oZ6R2kquw_i2labIn7QDddxOoNV_7E',
    range: 'event-types!A2:F',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      window.defaultFieldValues = range.values;
      appendContent(contentElement, 'H2', 'Create New Event');
      eventTypeSelect = appendContent(contentElement, 'SELECT', '');
      eventTypeSelect.id = "event-type-select";
      for (i = 0; i < range.values.length; i++) {
        var row = range.values[i];
        optionElement = appendContent(eventTypeSelect, 'OPTION', row[0]);
        optionElement.value = i;
      }
      lastOptionElement = appendContent(eventTypeSelect, 'OPTION', "Add New Event Type...");
      lastOptionElement.value = range.values.length;
      eventTypeSelect.addEventListener("change", eventTypeChanged);
    } else {
      appendContent(contentElement, 'P', 'No data found.');
    }
  }, function(response) {
    appendContent(contentElement, 'P', 'Error: ' + response.result.error.message);
  });
}
function eventTypeChanged(){
  var eventTypeSelect = document.getElementById('event-type-select');
  if(eventTypeSelect.value < defaultFieldValues.length){
    var row = defaultFieldValues[eventTypeSelect.value]
    console.log("Selected " + row[0]);
  } else if (eventTypeSelect.value == defaultFieldValues.length){
    console.log("Selected Add New Event Type...");
  }
}
