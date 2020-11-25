
// window.onload = addFields;
/* google sheets parameters*/
var CLIENT_ID = 'not set';
var API_KEY = 'not set';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var signedinElement = document.getElementById('signed-in');
var signedoutElement = document.getElementById('signed-out');
var contentElement = document.getElementById('content');

var defaultFieldValues = [];
/**
 *  On load, called to load the auth2 library and API client library
 *  as well as the credentials from php.
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
    displaySheetsData();
    var profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
    document.getElementById('username').innerHTML = profile.getName();
    document.getElementById('userimage').src = profile.getImageUrl();
    signedoutElement.style.display = 'none';
    signedinElement.style.display = 'block';
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
 * Function that appends an element to an existing element with
 * an optional text string as its text node.
 *
 * @param {Object} parentElement Object that will contain the object added.
 * @param {string} elementType Type of element to add.
 * @param {string} text Text to be placed in element element. Default is empty.
 */
function appendContent(parentElement, elementType, text = '') {
  var newElement = document.createElement(elementType);
  if(text != ''){
    var textContent = document.createTextNode(text);
    newElement.appendChild(textContent);
  }
  parentElement.appendChild(newElement);
  return newElement;
}
// Function that adds fields to contentElement
function addFields(){
  // add form
  formWrapper = appendContent(contentElement, 'FORM');
  formWrapper.id = "create-event-form";
  formWrapper.onkeypress = function(e) {
    var key = e.charCode || e.keyCode || 0;
    if (key == 13) {
      e.preventDefault();
    }
  }
  // add fieldset
  fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Create New Event')
  // add container div
  contentHolder = appendContent(fieldSetWrapper, 'div')
  contentHolder.id = 'content-holder'
  // add Event Type
  eventTypeHolder = appendContent(contentHolder, 'div')
  eventTypeHolder.className = "form-item";
  eventTypeLabel = appendContent(eventTypeHolder, "label", 'Event Type:');
  eventTypeLabel.for = "event-type-select";
  appendContent(eventTypeHolder, 'br');
  eventTypeSelect = appendContent(eventTypeHolder, 'SELECT');
  eventTypeSelect.addEventListener("change", eventTypeChanged);
  eventTypeSelect.id = "event-type-select";
  // Add Date
  dateHolder = appendContent(contentHolder, 'div')
  dateHolder.className = "form-item";
  dateLabel = appendContent(dateHolder, "label", 'Date:');
  dateLabel.for = "date-picker";
  appendContent(dateHolder, 'br');
  datePicker = appendContent(dateHolder, 'input');
  datePicker.type = "date";
  datePicker.id = "date-picker";
  datePicker.min = getDate();
  // Add Start Time
  startTimeHolder = appendContent(contentHolder, 'div')
  startTimeHolder.className = "form-item";
  startTimeLabel = appendContent(startTimeHolder, "label", 'Start Time:');
  startTimeLabel.for = "start-time";
  appendContent(startTimeHolder, 'br');
  startTimePicker = appendContent(startTimeHolder, 'input');
  startTimePicker.type = "time";
  startTimePicker.id = "start-time";
  startTimePicker.step = "900"
  startTimePicker.addEventListener("change", calculateEndTime)
  // Add End Time
  endTimeHolder = appendContent(contentHolder, 'div')
  endTimeHolder.className = "form-item";
  endTimeLabel = appendContent(endTimeHolder, "label", 'End Time:');
  endTimeLabel.for = "end-time";
  appendContent(endTimeHolder, 'br');
  endTimePicker = appendContent(endTimeHolder, 'input');
  endTimePicker.type = "time";
  endTimePicker.id = "end-time";
  endTimePicker.step = "900"
  // Add Max Attendees
  attendeesHolder = appendContent(contentHolder, 'div')
  attendeesHolder.className = "form-item";
  attendeesLabel = appendContent(attendeesHolder, "label", 'Max Attendees:');
  attendeesLabel.for = "attendees-input";
  appendContent(attendeesHolder, 'br');
  attendeesInput = appendContent(attendeesHolder, 'input');
  attendeesInput.type = "number";
  attendeesInput.id = "attendees-input";
  // add zoom link
  linkLabel = appendContent(fieldSetWrapper, "label", 'Zoom Link:');
  linkLabel.for = "link-input";
  appendContent(fieldSetWrapper, 'br');
  linkInput = appendContent(fieldSetWrapper, 'input');
  linkInput.id = "link-input";
  appendContent(fieldSetWrapper, 'br');
  // add buttons
  buttonWrapper = appendContent(fieldSetWrapper, "div")
  buttonWrapper.id = "button-wrapper";
  editButton = appendContent(buttonWrapper, "button", 'Edit Event Type')
  editButton.id = "edit-type-button";
  editButton.className = "form-button";
  editButton.addEventListener("click", editEventType);
  createButton = appendContent(buttonWrapper, "button", 'Create Event')
  createButton.id = "create-button";
  createButton.className = "form-button";
  return eventTypeSelect;
}
// Function to get current data in yyyymmdd format
function getDate(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1;
  var yyyy = today.getFullYear();
  if(dd<10){
    dd='0'+dd;
  }
  if(mm<10){
    mm='0'+mm;
  }
  yyyymmdd = (yyyy +'-'+ mm + '-' + dd)
  return yyyymmdd;
}
/**
 * Function that loads data from this spreadsheet:
 * https://docs.google.com/spreadsheets/d/1qvA4MoPhvNiN3oZ6R2kquw_i2labIn7QDddxOoNV_7E/edit
 */
function displaySheetsData() {
  var sheetID = '1qvA4MoPhvNiN3oZ6R2kquw_i2labIn7QDddxOoNV_7E'
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetID,
    range: 'event-types!A2:F',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      window.defaultFieldValues = range.values;
      eventTypeSelect = addFields();
      for (i = 0; i < range.values.length; i++) {
        var row = range.values[i];
        optionElement = appendContent(eventTypeSelect, 'OPTION', row[0]);
        optionElement.value = i;
      }
      lastOptionElement = appendContent(eventTypeSelect, 'OPTION', "Add New Event Type...");
      lastOptionElement.value = range.values.length;
    } else {
      appendContent(contentElement, 'P', 'No data found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit">event-types sheet</a>.');
    }
  }, function(response) {
    appendContent(contentElement, 'P', 'Error: ' + response.result.error.message);
  });
}
// Function to update fields from defaults
function eventTypeChanged(){
  eventTypeSelect = document.getElementById("event-type-select");
  eventTypeValue = eventTypeSelect.value;


  if(eventTypeSelect.value < defaultFieldValues.length){
    var row = defaultFieldValues[eventTypeValue]
    document.getElementById("attendees-input").value = row[3] ;
    document.getElementById("link-input").value = row[4] ;
    calculateEndTime();
  } else if (eventTypeSelect.value == defaultFieldValues.length){
    console.log("Selected Add New Event Type...");
  }
}
// Function to update end time from duration
function calculateEndTime(){
  eventTypeSelect = document.getElementById("event-type-select");
  eventTypeValue = eventTypeSelect.value;
  endTimePicker = document.getElementById("end-time");
  var row = defaultFieldValues[eventTypeValue]
  defaultDuration = timeFromMins(parseInt(row[1]));
  endTimePicker.value = addTimes(startTimePicker.value, defaultDuration);
  console.log(defaultDuration);
}
// Function to convert a time in hh:mm format to minutes
function timeToMins(time) {
  var b = time.split(':');
  return b[0]*60 + +b[1];
}

// Function to convert minutes to a time in format hh:mm
function timeFromMins(mins) {
  function z(n){return (n<10? '0':'') + n;}
  var h = (mins/60 |0) % 24;
  var m = mins % 60;
  return z(h) + ':' + z(m); // Returned value is in range 00  to 24 hrs

}

// Function to add two times in hh:mm format
function addTimes(t0, t1) {
  return timeFromMins(timeToMins(t0) + timeToMins(t1));
}
