/* google sheets parameters*/
var CLIENT_ID = 'not set';
var API_KEY = 'not set';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var signedinElement = document.getElementById('signed-in');
var signedoutElement = document.getElementById('signed-out');
var contentElement = document.getElementById('content');

var eventTypeValues = [];
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
    appendContent(contentElement, 'p', JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  clearContent();
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
  }
}
// Function to clear the content div
function clearContent(){
  contentElement.innerHTML = '';
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
      window.eventTypeValues = range.values;
      eventTypeSelect = addCreateEventFields();
      for (i = 0; i < range.values.length; i++) {
        var row = range.values[i];
        optionElement = appendContent(eventTypeSelect, 'OPTION', row[0]);
        optionElement.value = i;
      }
      lastOptionElement = appendContent(eventTypeSelect, 'OPTION', "Add New Event Type...");
      lastOptionElement.value = range.values.length;
      listUpcomingEvents();
    } else {
      appendContent(contentElement, 'P', 'No data found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit">event-types sheet</a>.');
    }
  }, function(response) {
    appendContent(contentElement, 'P', 'Error: ' + response.result.error.message);
  });
}
/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents() {
  gapi.client.calendar.events.list({
    'calendarId': '50be3j70c5a3rn6t55tii9r4g4@group.calendar.google.com',
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 250,
    'orderBy': 'startTime'
  }).then(function(response) {
    var events = response.result.items;
    // add calendar holder
    calendarHolder = appendContent(contentElement, 'form');
    calendarHolder.id = 'calendar-holder';
    calendarHolder.onkeypress = stopReturnSubmit(calendarHolder);
    calendarFieldset = appendContent(calendarHolder, 'fieldset');
    appendContent(calendarFieldset, 'legend', 'Upcoming events:');
    eventBucketHolder = appendContent(calendarFieldset, 'div');
    eventBucketHolder.id = 'event-bucket-holder';

    // create buckets for event types
    for (i = 0; i < eventTypeValues.length; i++) {
      var thisEventTypeName = eventTypeValues[i][0];
      var thisEventTypeID = thisEventTypeName.toLowerCase().replace(/\W/g, '-');
      thisEventTypeHolder = appendContent(eventBucketHolder, 'div');
      thisEventTypeHolder.id = thisEventTypeID;
      thisEventTypeHolder.className = "event-bucket";
      appendContent(thisEventTypeHolder, 'label', thisEventTypeName);
    }
    otherTypeHolder = appendContent(eventBucketHolder, 'div');
    otherTypeHolder.id = "other-events";
    otherTypeHolder.className = "event-bucket";
    appendContent(otherTypeHolder, 'label', 'Other Events');

    if (events.length > 0) {
      for (i = 0; i < events.length; i++) {
        var event = events[i];
        // check if bucket exist for current event
        var calendarEventTypeID = event.summary.toLowerCase().replace(/\W/g, '-');
        var calendarEventTypeHolder = document.getElementById(calendarEventTypeID);
        var otherType = false;
        if(typeof(calendarEventTypeHolder) == 'undefined' || calendarEventTypeHolder == null){
          calendarEventTypeHolder = otherTypeHolder; // set bucket to other if it doesn't
          otherType = true;
        }
        eventHolder = appendContent(calendarEventTypeHolder, 'div')
        eventHolder.id = event.id;
        eventHolder.className = "event";
        if(otherType){
          appendContent(eventHolder, 'p', event.summary);
        }
        dateLine = appendContent(eventHolder, 'p');
        linkTag = appendContent(dateLine, 'a', getFormattedDate(new Date(event.start.dateTime)));
        linkTag.href = event.htmlLink;
        var startDate = new Date(event.start.dateTime);
        var endDate = new Date(event.end.dateTime);
        appendContent(eventHolder, 'p', startDate.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'}));
        appendContent(eventHolder, 'p', ((endDate-startDate)/(1000 * 60)).toString() + " mins");
        attendeeCount = 0;
        if(event.attendees != null){
          attendeeCount = event.attendees.length;
        }
        appendContent(eventHolder, 'p', attendeeCount.toString());
        modifyButton = appendContent(eventHolder, 'button', "Modify");
        modifyButton.className = "event-button";
        modifyButton.type = "button";
        cancelButton = appendContent(eventHolder, 'button', "Cancel");
        cancelButton.className = "event-button";
        cancelButton.type = "button";

      }
    } else {
      appendContent(calendarHolder, 'pre', 'No upcoming events found.');
    }
  });
}
function stopReturnSubmit(e){
  var key = e.charCode || e.keyCode || 0;
  if (key == 13) {
    e.preventDefault();
  }
}
// Function that adds fields to contentElement for creating events
function addCreateEventFields(){
  // add form
  var formWrapper = appendContent(contentElement, 'FORM');
  formWrapper.id = "create-event-form";
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Create New Event')
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div')
  contentHolder.id = 'content-holder'
  // add Event Type
  var eventTypeHolder = appendContent(contentHolder, 'div')
  eventTypeHolder.className = "form-item";
  var eventTypeLabel = appendContent(eventTypeHolder, "label", 'Event Type:');
  eventTypeLabel.for = "event-type-select";
  appendContent(eventTypeHolder, 'br');
  var eventTypeSelect = appendContent(eventTypeHolder, 'SELECT');
  eventTypeSelect.addEventListener("change", eventTypeChanged);
  eventTypeSelect.id = "event-type-select";
  // Add Date
  var dateHolder = appendContent(contentHolder, 'div')
  dateHolder.className = "form-item";
  var dateLabel = appendContent(dateHolder, "label", 'Date:');
  dateLabel.for = "date-picker";
  appendContent(dateHolder, 'br');
  var datePicker = appendContent(dateHolder, 'input');
  datePicker.type = "date";
  datePicker.id = "date-picker";
  datePicker.min = getDate();
  // Add Start Time
  var startTimeHolder = appendContent(contentHolder, 'div')
  startTimeHolder.className = "form-item";
  var startTimeLabel = appendContent(startTimeHolder, "label", 'Start Time:');
  startTimeLabel.for = "start-time";
  appendContent(startTimeHolder, 'br');
  var startTimePicker = appendContent(startTimeHolder, 'input');
  startTimePicker.type = "time";
  startTimePicker.id = "start-time";
  startTimePicker.step = "900"
  startTimePicker.addEventListener("change", calculateEndTime)
  // Add End Time
  var endTimeHolder = appendContent(contentHolder, 'div')
  endTimeHolder.className = "form-item";
  var endTimeLabel = appendContent(endTimeHolder, "label", 'End Time:');
  endTimeLabel.for = "end-time";
  appendContent(endTimeHolder, 'br');
  var endTimePicker = appendContent(endTimeHolder, 'input');
  endTimePicker.type = "time";
  endTimePicker.id = "end-time";
  endTimePicker.step = "900"
  // Add Max Attendees
  var attendeesHolder = appendContent(contentHolder, 'div')
  attendeesHolder.className = "form-item";
  var attendeesLabel = appendContent(attendeesHolder, "label", 'Max Attendees:');
  attendeesLabel.for = "attendees-input";
  appendContent(attendeesHolder, 'br');
  var attendeesInput = appendContent(attendeesHolder, 'input');
  attendeesInput.type = "number";
  attendeesInput.id = "attendees-input";
  // add zoom link
  var linkLabel = appendContent(fieldSetWrapper, "label", 'Zoom Link:');
  linkLabel.for = "link-input";
  appendContent(fieldSetWrapper, 'br');
  var linkInput = appendContent(fieldSetWrapper, 'input');
  linkInput.id = "link-input";
  // add buttons
  var buttonWrapper = appendContent(fieldSetWrapper, "div")
  buttonWrapper.id = "button-wrapper";
  var editButton = appendContent(buttonWrapper, "button", 'Edit Event Type')
  editButton.id = "edit-type-button";
  editButton.className = "form-button";
  editButton.type = "button";
  editButton.addEventListener("click", addEditTypeFields);
  var createButton = appendContent(buttonWrapper, "button", 'Create Event')
  createButton.id = "create-button";
  createButton.className = "form-button";
  createButton.type = "button";
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
// Function to fprmat provided date as mm/dd/yyyy
function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');

    return month + '/' + day + '/' + year;
}
// Function to update fields from defaults
function eventTypeChanged(){
  eventTypeSelect = document.getElementById("event-type-select");
  eventTypeValue = eventTypeSelect.value;


  if(eventTypeSelect.value < eventTypeValues.length){
    var row = eventTypeValues[eventTypeValue]
    document.getElementById("attendees-input").value = row[3] ;
    document.getElementById("link-input").value = row[4] ;
    calculateEndTime();
  } else if (eventTypeSelect.value == eventTypeValues.length){
    addNewTypeFields();
  }
}
// Function that adds fields to contentElement for adding new event types
function addNewTypeFields(){
  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = appendContent(signedinElement,"div")
  blockerDiv.id="blocker";
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM');
  formWrapper.id = "new-type-form";
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Add New Event Type')
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div')
  contentHolder.id = 'new-content-holder'
  // add Title
  var eventTypeHolder = appendContent(contentHolder, 'div')
  eventTypeHolder.className = "form-item";
  var eventTypeLabel = appendContent(eventTypeHolder, "label", 'Title:');
  eventTypeLabel.for = "event-type-name";
  appendContent(eventTypeHolder, 'br');
  var eventTypeInput = appendContent(eventTypeHolder, 'input');
  eventTypeInput.id = "event-type-name";
  // Add Run Time
  var runTimeHolder = appendContent(contentHolder, 'div')
  runTimeHolder.className = "form-item";
  var runTimeLabel = appendContent(runTimeHolder, "label", 'Run Time:');
  runTimeLabel.for = "run-time-input";
  appendContent(runTimeHolder, 'br');
  var runTimeInput = appendContent(runTimeHolder, 'input');
  runTimeInput.type = "number";
  runTimeInput.id = "run-time-input";
  // Add Max Attendees
  var attendeesHolder = appendContent(contentHolder, 'div')
  attendeesHolder.className = "form-item";
  var attendeesLabel = appendContent(attendeesHolder, "label", 'Max Attendees:');
  attendeesLabel.for = "new-attendees-input";
  appendContent(attendeesHolder, 'br');
  var attendeesInput = appendContent(attendeesHolder, 'input');
  attendeesInput.type = "number";
  attendeesInput.id = "new-attendees-input";
  // add description
  var descLabel = appendContent(fieldSetWrapper, "label", 'Description:');
  descLabel.for = "desc-input";
  appendContent(fieldSetWrapper, 'br');
  var descInput = appendContent(fieldSetWrapper, 'input');
  descInput.id = "desc-input";
  appendContent(fieldSetWrapper, 'br');
  // add zoom link
  var linkLabel = appendContent(fieldSetWrapper, "label", 'Zoom Link:');
  linkLabel.for = "new-link-input";
  appendContent(fieldSetWrapper, 'br');
  var linkInput = appendContent(fieldSetWrapper, 'input');
  linkInput.id = "new-link-input";
  // add buttons
  var buttonWrapper = appendContent(fieldSetWrapper, "div")
  buttonWrapper.id = "button-wrapper";
  var cancelTypeButton = appendContent(buttonWrapper, "button", 'Cancel')
  cancelTypeButton.id = "cancel-button";
  cancelTypeButton.className = "form-button";
  cancelTypeButton.type = "button";
  cancelTypeButton.addEventListener("click", removeBlocker);
  var createTypeButton = appendContent(buttonWrapper, "button", 'Add New Event Type')
  createTypeButton.id = "new-type-button";
  createTypeButton.className = "form-button";
  createTypeButton.type = "button";
  createTypeButton.addEventListener("click", addNewType());
}
// Function that adds fields to contentElement for editing event types
function addEditTypeFields(){

  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = appendContent(signedinElement,"div")
  blockerDiv.id="blocker";
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM');
  formWrapper.id = "new-type-form";
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Edit Event Type')
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div')
  contentHolder.id = 'new-content-holder'
  // add Title
  var eventTypeHolder = appendContent(contentHolder, 'div')
  eventTypeHolder.className = "form-item";
  var eventTypeLabel = appendContent(eventTypeHolder, "label", 'Title:');
  eventTypeLabel.for = "event-type-name";
  appendContent(eventTypeHolder, 'br');
  var eventTypeInput = appendContent(eventTypeHolder, 'input');
  eventTypeInput.id = "event-type-name";
  // Add Run Time
  var runTimeHolder = appendContent(contentHolder, 'div')
  runTimeHolder.className = "form-item";
  var runTimeLabel = appendContent(runTimeHolder, "label", 'Run Time:');
  runTimeLabel.for = "run-time-input";
  appendContent(runTimeHolder, 'br');
  var runTimeInput = appendContent(runTimeHolder, 'input');
  runTimeInput.type = "number";
  runTimeInput.id = "run-time-input";
  // Add Max Attendees
  var attendeesHolder = appendContent(contentHolder, 'div')
  attendeesHolder.className = "form-item";
  var attendeesLabel = appendContent(attendeesHolder, "label", 'Max Attendees:');
  attendeesLabel.for = "new-attendees-input";
  appendContent(attendeesHolder, 'br');
  var attendeesInput = appendContent(attendeesHolder, 'input');
  attendeesInput.type = "number";
  attendeesInput.id = "new-attendees-input";
  // add description
  var descLabel = appendContent(fieldSetWrapper, "label", 'Description:');
  descLabel.for = "desc-input";
  appendContent(fieldSetWrapper, 'br');
  var descInput = appendContent(fieldSetWrapper, 'input');
  descInput.id = "desc-input";
  appendContent(fieldSetWrapper, 'br');
  // add zoom link
  var linkLabel = appendContent(fieldSetWrapper, "label", 'Zoom Link:');
  linkLabel.for = "link-input";
  appendContent(fieldSetWrapper, 'br');
  var linkInput = appendContent(fieldSetWrapper, 'input');
  linkInput.id = "link-input";
  // add buttons
  var buttonWrapper = appendContent(fieldSetWrapper, "div")
  buttonWrapper.id = "button-wrapper";
  var cancelTypeButton = appendContent(buttonWrapper, "button", 'Cancel')
  cancelTypeButton.id = "cancel-button";
  cancelTypeButton.className = "form-button";
  cancelTypeButton.type = "button";
  cancelTypeButton.addEventListener("click", removeBlocker);
  var createTypeButton = appendContent(buttonWrapper, "button", 'Add New Event Type')
  createTypeButton.id = "new-type-button";
  createTypeButton.className = "form-button";
  createTypeButton.type = "button";
  createTypeButton.addEventListener("click", addNewType());
}
// Function to remove blocker div
function removeBlocker(){
  document.getElementById("event-type-select").selectedIndex = 0;
  eventTypeChanged();
  theBlocker = document.getElementById("blocker");
  theBlocker.remove();
}
function addNewType(){
  console.log("working on it...");
}
// Function to update end time from duration
function calculateEndTime(){
  var eventTypeSelect = document.getElementById("event-type-select");
  eventTypeValue = eventTypeSelect.value;
  var startTimePicker = document.getElementById("start-time");
  var endTimePicker = document.getElementById("end-time");
  var row = eventTypeValues[eventTypeValue]
  var defaultDuration = timeFromMins(parseInt(row[1]));
  endTimePicker.value = addTimes(startTimePicker.value, defaultDuration);
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
