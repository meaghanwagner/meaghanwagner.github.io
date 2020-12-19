/* google sheets parameters*/
var CLIENT_ID = 'not set';
var API_KEY = 'not set';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4', 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events';
var sheetID = '1qvA4MoPhvNiN3oZ6R2kquw_i2labIn7QDddxOoNV_7E';
var calendarID = '50be3j70c5a3rn6t55tii9r4g4@group.calendar.google.com';
var valueInputOption = 'RAW';

var promptElement = document.getElementById('prompt');
var signInButton = document.getElementById('authorize_button');
var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var signedinElement = document.getElementById('signed-in');
var signedoutElement = document.getElementById('signed-out');
var contentElement = document.getElementById('content');

var eventTypeSheetsValues = [];
var calendarEvents = [];
var flowsSheetsValues = [];
var currentRow = [];
// Escape key listener for closing popups
document.onkeydown = function(evt) {
  evt = evt || window.event;
  var isEscape = false;
  if ('key' in evt) {
    isEscape = (evt.key === 'Escape' || evt.key === 'Esc');
  } else {
    isEscape = (evt.keyCode === 27);
  }
  if (isEscape) {
    removeBlocker();
  }
};
/**
 *  On load, called to load the auth2 library and API client library
 *  as well as the credentials from php.
 */
function handleClientLoad() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://meaghanwagner.com/php/getcreds.php');
  xhr.onload = function() {
    richTextInit();
    if(xhr.responseText.startsWith('0')){
      var creds = JSON.parse(xhr.responseText.substring(2));
      window.API_KEY = creds.developer_key;
      window.CLIENT_ID = creds.client_id;
      gapi.load('client:auth2', initClient);
    } else {
      console.log(xhr.responseText);
      promptElement.innerHTML = 'Could not sign in, please try again. If the problem persists, please contact the developer.';
    }
  }
  xhr.send();
}
// Function to make textareas rich text based on class
function richTextInit(){
  tinymce.remove();
  tinymce.init({
    selector: 'textarea.rich-text',
    autosave_ask_before_unload: false,
    powerpaste_allow_local_images: true,
    plugins: [
      'a11ychecker advcode advlist anchor autolink codesample fullscreen help image imagetools tinydrive',
      ' lists link media noneditable powerpaste preview',
      ' searchreplace table tinymcespellchecker visualblocks wordcount'
    ],
    toolbar:
      'insertfile a11ycheck undo redo | bold italic | forecolor backcolor | codesample | alignleft aligncenter alignright alignjustify | bullist numlist | link image tinydrive',
    spellchecker_dialog: true,
    spellchecker_whitelist: ['Ephox', 'Moxiecode'],
    tinydrive_demo_files_url: '/docs/demo/tiny-drive-demo/demo_files.json',
    tinydrive_token_provider: function (success, failure) {
      success({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huZG9lIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.Ks_BdfH4CWilyzLNk8S2gDARFhuxIauLa8PwhdEQhEo' });
    },
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    mobile: {
      menubar: true,
      toolbar1: 'insertfile a11ycheck undo redo | bold italic | forecolor backcolor',
      toolbar2: 'codesample | alignleft aligncenter alignright alignjustify | bullist numlist',
      toolbar3: 'link image tinydrive',
      height: '60vh'
    }
  });
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
    displayEventTypeData();
    var profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
    document.getElementById('username').innerHTML = profile.getName();
    document.getElementById('userimage').src = profile.getImageUrl();
    promptElement.innerHTML = 'Checking if signed in...';
    signInButton.style.display = 'none'
    signedoutElement.style.display = 'none';
    signedinElement.style.display = 'block';
  } else {
    promptElement.innerHTML = 'Please use the button below to sign in:';
    signInButton.style.display = 'inline-block'
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
 * @param {string} text Text to be placed in element. Default is empty.
 * @param {string} idText ID of new element. Default is empty.
 * @param {string} classText className of new element. Default is empty.
 */
function appendContent(parentElement, elementType, text = '', idText = '', classText = '') {
  var newElement = document.createElement(elementType);
  if(text != ''){
    var textContent = document.createTextNode(text);
    newElement.appendChild(textContent);
  }
  if(idText != ''){
    newElement.id = idText;
  }
  if(classText != ''){
    newElement.className = classText;
  }
  parentElement.appendChild(newElement);
  return newElement;
}
/**
 * Function that loads data from this spreadsheet:
 * https://docs.google.com/spreadsheets/d/1qvA4MoPhvNiN3oZ6R2kquw_i2labIn7QDddxOoNV_7E/edit
 */
function displayEventTypeData() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetID,
    range: 'event-types!A2:F',
  }).then(function(response) {
    clearContent();
    var range = response.result;
    if (range.values.length > 0) {
      window.eventTypeSheetsValues = range.values;
      var eventTypeSelect = addCreateEventFields();
      for (var sheetIndex = 0; sheetIndex < range.values.length; sheetIndex++) {
        var row = range.values[sheetIndex];
        optionElement = appendContent(eventTypeSelect, 'OPTION', row[0]);
        optionElement.value = sheetIndex;
      }
      lastOptionElement = appendContent(eventTypeSelect, 'OPTION', 'Add New Event Type...');
      lastOptionElement.value = range.values.length;
      eventTypeChanged();
      listUpcomingEvents();
    } else {
      alertElement = appendContent(contentElement, 'P')
      alertElement.innerHTML = 'No data found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit" target="_blank">event-types sheet</a>.';
    }
  }, function(response) {
    appendContent(contentElement, 'P', 'Error: ' + response.result.error.message);
  });
}
// Function that adds fields to contentElement for creating events
function addCreateEventFields(){
  // add form
  var formWrapper = appendContent(contentElement, 'FORM', '', 'create-event-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  formWrapper.addEventListener('submit', createCalendarEvent);

  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Create New Event');
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div', '', 'content-holder');
  // add Event Type
  var eventTypeHolder = appendContent(contentHolder, 'div', '', '','form-item');
  var eventTypeLabel = appendContent(eventTypeHolder, 'label', 'Event Type:');
  eventTypeLabel.for = 'event-type-select';
  appendContent(eventTypeHolder, 'br');
  var eventTypeSelect = appendContent(eventTypeHolder, 'SELECT', '', 'event-type-select');
  eventTypeSelect.addEventListener('change', eventTypeChanged);
  // Add Date
  var dateHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var dateLabel = appendContent(dateHolder, 'label', 'Date:');
  dateLabel.for = 'date-picker';
  appendContent(dateHolder, 'br');
  var datePicker = appendContent(dateHolder, 'input', '','date-picker');
  datePicker.type = 'date';
  datePicker.min = getDate();
  datePicker.required = true;
  // Add Start Time
  var startTimeHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var startTimeLabel = appendContent(startTimeHolder, 'label', 'Start Time:');
  startTimeLabel.for = 'start-time';
  appendContent(startTimeHolder, 'br');
  var startTimePicker = appendContent(startTimeHolder, 'input', '', 'start-time');
  startTimePicker.type = 'time';
  startTimePicker.step = '900'
  startTimePicker.addEventListener('change', calculateEndTime);
  startTimePicker.required = true;
  // Add End Time
  var endTimeHolder = appendContent(contentHolder, 'div');
  endTimeHolder.className = 'form-item';
  var endTimeLabel = appendContent(endTimeHolder, 'label', 'End Time:');
  endTimeLabel.for = 'end-time';
  appendContent(endTimeHolder, 'br');
  var endTimePicker = appendContent(endTimeHolder, 'input', '', 'end-time');
  endTimePicker.type = 'time';
  endTimePicker.step = '900'
  endTimePicker.required = true;
  // Add Max Attendees
  var attendeesHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var attendeesLabel = appendContent(attendeesHolder, 'label', 'Max Attendees:');
  attendeesLabel.for = 'attendees-input';
  appendContent(attendeesHolder, 'br');
  var attendeesInput = appendContent(attendeesHolder, 'input', '', 'attendees-input');
  attendeesInput.type = 'number';
  attendeesInput.min = 0;
  attendeesInput.required = true;
  // add zoom link
  var linkHolder = appendContent(fieldSetWrapper, 'div', '', '', 'form-item');
  var linkLabel = appendContent(linkHolder, 'label', 'Zoom Link:');
  linkLabel.for = 'link-input';
  appendContent(fieldSetWrapper, 'br');
  var linkInput = appendContent(linkHolder, 'input', '', 'link-input', 'full-width');
  linkInput.required = true;
  // add buttons
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  var createButton = appendContent(buttonWrapper, 'button', 'Create Event', 'create-button', 'form-button');
  createButton.type = 'submit';

  var editButton = appendContent(buttonWrapper, 'button', 'Edit Event Type', 'edit-type-button', 'form-button');
  editButton.type = 'button';
  editButton.addEventListener('click', addEditTypeFields);
  return eventTypeSelect;
}
// Function to create new calendar event from the create event form
function createCalendarEvent(e){
  event.preventDefault();
  var eventSelect = document.getElementById('event-type-select');
  var datePicker = document.getElementById('date-picker');
  var startTimePicker = document.getElementById('start-time');
  var endTimePicker = document.getElementById('end-time');
  if(datePicker.value == '' || startTimePicker.value == '' || endTimePicker.value == ''){
    alert('Please fill out all of the fields in the new event form before creating an event.');
  } else {
    startDateTime = (new Date(datePicker.value + ' ' + startTimePicker.value + ':00').toISOString());
    endDateTime = (new Date(datePicker.value + ' ' + endTimePicker.value + ':00').toISOString());
    var newEvent = {
      'summary': eventSelect.options[eventSelect.selectedIndex].text,
      'location': document.getElementById('link-input').value,
      'description': eventTypeSheetsValues[eventSelect.value][2],
      'start': {
        'dateTime': startDateTime,
      },
      'end': {
        'dateTime': endDateTime,
      },
    }
    var request = gapi.client.calendar.events.insert({
      'calendarId': calendarID,
      'resource': newEvent
    });
    var blockerDiv = addBlocker();
    var alertDiv = appendContent(blockerDiv, 'div', '', 'alert');
    var alertHeader = appendContent(alertDiv, 'h2', 'Creating event...','alert-header');
    request.execute(function(event) {
      addEventToSheet(event);
    });
  }
}
// Function to add event to sheet
function addEventToSheet(event){
  var eventSelect = document.getElementById('event-type-select');
  var currentEventValues = eventTypeSheetsValues[eventSelect.value];
  var values = [
    [
      event.id,
      currentEventValues[3],
      currentEventValues[5]
    ],
  ];
  var body = {
    values: values
  };
  gapi.client.sheets.spreadsheets.values.append({
     spreadsheetId: sheetID,
     range: 'events',
     valueInputOption: valueInputOption,
     resource: body
  }).then((response) => {
    var result = response.result;
    console.log(`${result.updates.updatedCells} cells appended.`)
    var alertHeader = document.getElementById('alert-header');
    alertHeader.innerHTML = '';
    var alertLink = appendContent(alertHeader, 'a', 'New Event Created!');
    alertLink.href = event.htmlLink;
    alertLink.target = '_blank';
    appendContent(alertHeader, 'br');
    appendContent(alertHeader, 'br');
    var alertButton = appendContent(alertHeader, 'button', 'OK', '', 'form-button');
    alertButton.addEventListener('click', refreshData);
  });

}
/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents() {
  gapi.client.calendar.events.list({
    'calendarId': calendarID,
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 250,
    'orderBy': 'startTime'
  }).then(function(response) {
    var events = response.result.items;
    window.calendarEvents = events;
    // add calendar holder
    calendarHolder = appendContent(contentElement, 'form','', 'calendar-holder');
    calendarHolder.onkeypress = stopReturnSubmit(calendarHolder);
    calendarFieldset = appendContent(calendarHolder, 'fieldset');
    appendContent(calendarFieldset, 'legend', 'Upcoming events:');
    eventBucketHolder = appendContent(calendarFieldset, 'div', '', 'event-bucket-holder');
    if (events.length > 0) {
      // create buckets for event types
      for (var typeIndex = 0; typeIndex < eventTypeSheetsValues.length; typeIndex++) {
        var thisEventTypeName = eventTypeSheetsValues[typeIndex][0];
        var thisEventTypeID = thisEventTypeName.toLowerCase().replace(/\W/g, '-');
        thisEventTypeHolder = appendContent(eventBucketHolder, 'div', '', thisEventTypeID, 'event-bucket');
        appendContent(thisEventTypeHolder, 'label', thisEventTypeName);
      }
      otherTypeHolder = appendContent(eventBucketHolder, 'div', '','other-events', 'event-bucket');
      appendContent(otherTypeHolder, 'label', 'Other Events');

      for (var eventIndex = 0; eventIndex < events.length; eventIndex++) {
        var event = events[eventIndex];
        // check if bucket exist for current event
        var calendarEventTypeID = event.summary.toLowerCase().replace(/\W/g, '-');
        var calendarEventTypeHolder = document.getElementById(calendarEventTypeID);
        var otherType = false;
        if(typeof(calendarEventTypeHolder) == 'undefined' || calendarEventTypeHolder == null){
          calendarEventTypeHolder = otherTypeHolder; // set bucket to other if it doesn't
          otherType = true;
        }
        eventHolder = appendContent(calendarEventTypeHolder, 'div', '',event.id, 'event');
        if(otherType){
          appendContent(eventHolder, 'p', event.summary);
        }
        dateLine = appendContent(eventHolder, 'p');
        linkTag = appendContent(dateLine, 'a', getDateForDisplay(new Date(event.start.dateTime)));
        linkTag.href = event.htmlLink;
        linkTag.target = '_blank';
        var startDate = new Date(event.start.dateTime);
        var endDate = new Date(event.end.dateTime);
        appendContent(eventHolder, 'p', timeFromDate12(startDate));
        appendContent(eventHolder, 'p', ((endDate-startDate)/(1000 * 60)).toString() + ' mins');
        attendeeCount = 0;
        if(event.attendees != null){
          attendeeCount = event.attendees.length;
        }
        appendContent(eventHolder, 'p', 'Attendees: ' + attendeeCount.toString());
        var modifyButton = appendContent(eventHolder, 'button', 'Modify', '', 'event-button');
        modifyButton.type = 'button';
        modifyButton.setAttribute('data-event-id', event.id);
        modifyButton.setAttribute('onclick', 'addModifyEventFields(this)');
        var cancelButton = appendContent(eventHolder, 'button', 'Cancel', '', 'event-button');
        cancelButton.type = 'button';
        cancelButton.setAttribute('data-event-id', event.id);
        cancelButton.setAttribute('onclick', 'addCancelEventFields(this)');
      }
    } else {
      appendContent(eventBucketHolder, 'h2', 'No upcoming events found.');
    }
    displayFlowData();
  });
}

function displayFlowData() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetID,
    range: 'flows!A2:O',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      window.flowsSheetsValues = range.values;
      // add form
      var formWrapper = appendContent(contentElement, 'FORM', '', 'flows-form');
      formWrapper.onkeypress = stopReturnSubmit(formWrapper);
      formWrapper.addEventListener('submit', addNewFlowFields);

      // add fieldset
      var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
      // add legend
      appendContent(fieldSetWrapper, 'LEGEND', 'Flows:');
      // add flows box
      appendContent(fieldSetWrapper, 'h3', 'Displaying:');
      displayFlowsContainer = appendContent(fieldSetWrapper, 'div', '' , '', 'tools-box');
      appendContent(fieldSetWrapper, 'h3', 'Hidden:');
      hiddenFlowsContainer = appendContent(fieldSetWrapper, 'div', '' , '', 'tools-box');
      // add flows from sheets data
      for (var sheetIndex = 0; sheetIndex < range.values.length; sheetIndex++) {
        var row = range.values[sheetIndex];
        var flowsContainer = displayFlowsContainer;
        if(row[4] == 'FALSE'){
          flowsContainer = hiddenFlowsContainer;
        }
        var flowContainer = appendContent(flowsContainer, 'div', '', '', 'tool');
        if(row[3] == 'TRUE'){
          flowContainer.classList.add('important');
          flowContainer.classList.add('shiny');
        }

        var flowLink = appendContent(flowContainer, 'a');
        flowLink.setAttribute('flow-index', sheetIndex);
        flowLink.setAttribute('onclick', 'addEditFlowFields(this)');
        var flowTitle = appendContent(flowLink, 'h3', row[0], '', 'tool-header');
        var flowDescription = appendContent(flowLink, 'div', '', '', 'tool-description');
        flowDescription.innerHTML = row[2];
      }
      var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
      var newFlowButton = appendContent(buttonWrapper, 'button', 'Add New Flow', '','form-button');
    } else {
      alertElement = appendContent(contentElement, 'P')
      alertElement.innerHTML = 'No data found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit" target="_blank">event-types sheet</a>.';
    }
  }, function(response) {
    appendContent(contentElement, 'P', 'Error: ' + response.result.error.message);
  });
}
// Function to add new flow
function addNewFlowFields(e){
  e.preventDefault();
  var flowIndex = flowsSheetsValues.length;
  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = addBlocker();
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM' ,'', 'new-flow-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Add Flow');
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div', '', 'new-content-holder');
  // add Title
  var flowTitleHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var flowTitleLabel = appendContent(flowTitleHolder, 'label', 'Title:');
  flowTitleLabel.for = 'flow-title';
  appendContent(flowTitleHolder, 'br');
  var eventTypeInput = appendContent(flowTitleHolder, 'input', '', 'flow-title');
  appendContent(flowTitleHolder, 'br');
  // add Event Types select
  var eventTypesHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var eventTypesIncluded = appendContent(eventTypesHolder, 'label', 'Event Types:');
  eventTypesIncluded.for = 'event-types-select';
  appendContent(eventTypesHolder, 'br');
  var eventTypesSelect = appendContent(eventTypesHolder, 'select', '', 'event-types-select');
  eventTypesSelect.multiple = true;
  for(var eventTypeIndex = 0; eventTypeIndex < eventTypeSheetsValues.length; eventTypeIndex++){
    thisEventType = eventTypeSheetsValues[eventTypeIndex];
    var eventTypeOption = appendContent(eventTypesSelect, 'option', thisEventType[0]);
  }
  eventTypesSelect.setAttribute('onchange', 'eventTypesSelectionChanged(false)');
  // add important checkbox
  var importantHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var importantLabel = appendContent(importantHolder, 'label', 'Important: ');
  var importantInput = appendContent(importantLabel, 'input', '', 'important-input');
  importantInput.type = 'checkbox';
  appendContent(importantHolder, 'br');
  // add display on site checkbox
  var displayHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var displayLabel = appendContent(displayHolder, 'label', 'Display On Website: ');
  var displayInput = appendContent(displayLabel, 'input', '', 'display-input');
  displayInput.type = 'checkbox';
  appendContent(displayHolder, 'br');
  var linkHolder = appendContent(fieldSetWrapper, 'div', '', '', 'form-item');
  // add description
  var descLabel = appendContent(linkHolder, 'label', 'Description:');
  descLabel.for = 'desc-input';
  appendContent(linkHolder, 'br');
  var descInput = appendContent(linkHolder, 'textarea', '', 'desc-input', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Sign Up Page Copy holder
  var signupHolder = appendContent(linkHolder, 'div', '', 'signup-holder');
  // add Payment Page Copy
  var payementPageCopyLabel = appendContent(linkHolder, 'label', 'Payment Page Copy:');
  payementPageCopyLabel.for = 'payment-page-copy';
  appendContent(linkHolder, 'br');
  var payementPageCopyInput = appendContent(linkHolder, 'textarea', '', 'payment-page-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Thank You Page copy
  var thankYouPageLabel = appendContent(linkHolder, 'label', 'Thank You Page Copy:');
  thankYouPageLabel.for = 'thank-you-page-copy';
  appendContent(linkHolder, 'br');
  var thankYouPageInput = appendContent(linkHolder, 'textarea', '', 'thank-you-page-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Cancellation Email
  var cancellationEmailLabel = appendContent(linkHolder, 'label', 'Cancellation Email Copy:');
  cancellationEmailLabel.for = 'cancellation-copy';
  appendContent(linkHolder, 'br');
  var cancellationEmailInput = appendContent(linkHolder, 'textarea', '', 'cancellation-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Confirmation Email Copy
  var confirmationEmailCopyLabel = appendContent(linkHolder, 'label', 'Confirmation Email Copy:');
  confirmationEmailCopyLabel.for = 'confirmation-email-copy';
  appendContent(linkHolder, 'br');
  var confirmationEmailCopyInput = appendContent(linkHolder, 'textarea', '', 'confirmation-email-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Reminder Email holder
  var reminderHolder = appendContent(linkHolder, 'div', '', 'reminder-holder');
  // add Follow up Email Copy
  var followUpEmailCopyLabel = appendContent(linkHolder, 'label', 'Follow up Email Copy:');
  followUpEmailCopyLabel.for = 'follow-up-email-copy';
  appendContent(linkHolder, 'br');
  var followUpEmailCopyInput = appendContent(linkHolder, 'textarea', '', 'follow-up-email-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Follow up Email CTA
  var followUpEmailCTALabel = appendContent(linkHolder, 'label', 'Follow up Email CTA:');
  followUpEmailCTALabel.for = 'follow-up-email-cta';
  appendContent(linkHolder, 'br');
  var followUpEmailCTAInput = appendContent(linkHolder, 'textarea', '', 'follow-up-email-cta', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Follow up Email CTA Destination
  var followUpEmailCTADestLabel = appendContent(linkHolder, 'label', 'Follow up Email CTA Destination:');
  followUpEmailCTADestLabel.for = 'follow-up-email-cta-dest';
  appendContent(linkHolder, 'br');
  var followUpEmailCTADestInput = appendContent(linkHolder, 'input', '', 'follow-up-email-cta-dest', 'full-width');
  appendContent(linkHolder, 'br');
  // Update event type specific fields
  eventTypesSelectionChanged(false);
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  var cancelTypeButton = appendContent(buttonWrapper, 'button', 'Cancel', 'cancel-button', 'form-button');
  cancelTypeButton.type = 'button';
  cancelTypeButton.addEventListener('click', removeBlocker);
  var modifyButton = appendContent(buttonWrapper, 'button', 'Add Flow', 'modify-flow-button', 'form-button');
  modifyButton.type = 'button';
  modifyButton.setAttribute('flow-index', flowIndex);
  modifyButton.setAttribute('onclick', 'addFlow(this)');
}
// Function to update the fields that vary based on eventTypesSelected
function eventTypesSelectionChanged(populateData=false){
  var selectedEventTypesArray = getSelectedEventTypesArray();
  var signupHolder = document.getElementById('signup-holder');
  signupHolder.innerHTML = '';
  var reminderHolder = document.getElementById('reminder-holder');
  reminderHolder.innerHTML = '';
  if(populateData){
    signUpCopyData = JSON.parse(currentRow[5]);
    signUpCTAData = JSON.parse(currentRow[6]);
    reminderEmailCopyData = JSON.parse(currentRow[11]);
  }
  for(var optionIndex = 0; optionIndex < selectedEventTypesArray.length; optionIndex++){
    optionText = selectedEventTypesArray[optionIndex];
    // add Sign up copy
    var signUpCopyLabel = appendContent(signupHolder, 'label', 'Sign Up Page Copy for ' + optionText +':');
    appendContent(signUpCopyLabel, 'br');
    var signUpCopyInput = appendContent(signUpCopyLabel, 'textarea', '', '', 'rich-text');
    signUpCopyInput.classList.add('sign-up-page-copy');
    signUpCopyInput.setAttribute('data-event-type', optionText);
    appendContent(signupHolder, 'br');
    // add Sign Up Page CTA
    var signUpCTALabel = appendContent(signupHolder, 'label', 'Sign Up Page CTA for ' + optionText +':');
    appendContent(signUpCTALabel, 'br');
    var signUpCTAInput = appendContent(signUpCTALabel, 'textarea', '', '', 'rich-text');
    signUpCTAInput.classList.add('sign-up-page-cta');
    signUpCTAInput.setAttribute('data-event-type', optionText);
    appendContent(signupHolder, 'br');
    // add Reminder Email Copy
    var reminderEmailCopyLabel = appendContent(reminderHolder, 'label', 'Reminder Email Copy for ' + optionText +':');
    appendContent(reminderEmailCopyLabel, 'br');
    var reminderEmailCopyInput = appendContent(reminderEmailCopyLabel, 'textarea', '', '', 'rich-text');
    reminderEmailCopyInput.classList.add('reminder-email-copy');
    reminderEmailCopyInput.setAttribute('data-event-type', optionText);
    appendContent(reminderHolder, 'br');
    if(populateData){
      if(optionText in signUpCopyData){
        signUpCopyInput.value = signUpCopyData[optionText];
      }
      if(optionText in signUpCTAData){
        signUpCTAInput.value = signUpCTAData[optionText];
      }
      if(optionText in reminderEmailCopyData){
        reminderEmailCopyInput.value = reminderEmailCopyData[optionText];
      }
    }
  }
  // Enable rich text editors
  richTextInit();
}
// Function to return selectedEventTypesArray
function getSelectedEventTypesArray(){
  var selectedEventTypes = document.getElementById('event-types-select').selectedOptions;
  var selectedEventTypesArray = [];
  for(var optionIndex = 0; optionIndex < selectedEventTypes.length; optionIndex++){
    var theOption = selectedEventTypes[optionIndex];
    selectedEventTypesArray.push(theOption.text);
  }
  return selectedEventTypesArray;
}
// Function to get array of rich text content from tiny editors by classname
function getRichTextArray(className){
  var tinyEditors = document.getElementsByClassName(className);
  var richTextArray = {};
  for (var i = 0; i < tinyEditors.length; i++) {
    thisEditor = tinyEditors[i];
    eventTypeText = thisEditor.getAttribute('data-event-type');
    richTextArray[eventTypeText] = tinyMCE.get(thisEditor.id).getContent();
  }
  return richTextArray
}
// Function to add flow data to sheets
function addFlow(element){
  var flowIndex = element.getAttribute('flow-index');
  var selectedEventTypesArray = getSelectedEventTypesArray();
  var selectedEventTypesString = JSON.stringify(selectedEventTypesArray);
  var values = [
    [
      document.getElementById('flow-title').value,
      selectedEventTypesString,
      tinyMCE.get('desc-input').getContent(),
      document.getElementById('important-input').checked,
      document.getElementById('display-input').checked,
      JSON.stringify(getRichTextArray('sign-up-page-copy')),
      JSON.stringify(getRichTextArray('sign-up-page-cta')),
      tinyMCE.get('payment-page-copy').getContent(),
      tinyMCE.get('thank-you-page-copy').getContent(),
      tinyMCE.get('cancellation-copy').getContent(),
      tinyMCE.get('confirmation-email-copy').getContent(),
      JSON.stringify(getRichTextArray('reminder-email-copy')),
      tinyMCE.get('follow-up-email-copy').getContent(),
      tinyMCE.get('follow-up-email-cta').getContent(),
      document.getElementById('follow-up-email-cta-dest').value
    ],
  ];
  var body = {
    values: values
  };
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  var alertDiv = appendContent(blockerDiv, 'div', '', 'alert');
  var alertHeader = appendContent(alertDiv, 'h2', 'Adding Flow...','alert-header');
  gapi.client.sheets.spreadsheets.values.append({
     spreadsheetId: sheetID,
     range: 'flows',
     valueInputOption: valueInputOption,
     resource: body
  }).then((response) => {
    var result = response.result;
    console.log(`${result.updatedCells} cells updated.`);
    refreshData();
  });
}
// Function to edit existing flow
function addEditFlowFields(element){
  var flowIndex = element.getAttribute('flow-index');
  var row = flowsSheetsValues[flowIndex]
  window.currentRow = row;

  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = addBlocker();
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM' ,'', 'new-flow-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Edit Flow');
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div', '', 'new-content-holder');
  // add Title
  var flowTitleHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var flowTitleLabel = appendContent(flowTitleHolder, 'label', 'Title:');
  flowTitleLabel.for = 'flow-title';
  appendContent(flowTitleHolder, 'br');
  var eventTypeInput = appendContent(flowTitleHolder, 'input', '', 'flow-title');
  eventTypeInput.value = row[0];
  appendContent(flowTitleHolder, 'br');
  // add Event Types select
  var eventTypesHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var eventTypesIncluded = appendContent(eventTypesHolder, 'label', 'Event Types:');
  eventTypesIncluded.for = 'event-types-select';
  appendContent(eventTypesHolder, 'br');
  var eventTypesSelect = appendContent(eventTypesHolder, 'select', '', 'event-types-select');
  eventTypesSelect.multiple = true;
  for(var eventTypeIndex = 0; eventTypeIndex < eventTypeSheetsValues.length; eventTypeIndex++){
    thisEventType = eventTypeSheetsValues[eventTypeIndex];
    var eventTypeOption = appendContent(eventTypesSelect, 'option', thisEventType[0]);
    if (row[1].includes(thisEventType[0])){
      eventTypeOption.selected = true;
    }
  }
  eventTypesSelect.setAttribute('onchange', 'eventTypesSelectionChanged(true)');
  // add important checkbox
  var importantHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var importantLabel = appendContent(importantHolder, 'label', 'Important: ');
  var importantInput = appendContent(importantLabel, 'input', '', 'important-input');
  importantInput.type = 'checkbox';
  importantInput.checked = (row[3] == 'TRUE');
  appendContent(importantHolder, 'br');
  // add display on site checkbox
  var displayHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var displayLabel = appendContent(displayHolder, 'label', 'Display On Website: ');
  var displayInput = appendContent(displayLabel, 'input', '', 'display-input');
  displayInput.type = 'checkbox';
  displayInput.checked = (row[4] == 'TRUE');
  appendContent(displayHolder, 'br');
  var linkHolder = appendContent(fieldSetWrapper, 'div', '', '', 'form-item');
  // add description
  var descLabel = appendContent(linkHolder, 'label', 'Description:');
  descLabel.for = 'desc-input';
  appendContent(linkHolder, 'br');
  var descInput = appendContent(linkHolder, 'textarea', '', 'desc-input', 'rich-text');
  descInput.value = row[2];
  appendContent(linkHolder, 'br');
  // add Sign Up Page Copy holder
  var signupHolder = appendContent(linkHolder, 'div', '', 'signup-holder');
  // add Payment Page Copy
  var payementPageCopyLabel = appendContent(linkHolder, 'label', 'Payment Page Copy:');
  payementPageCopyLabel.for = 'payment-page-copy';
  appendContent(linkHolder, 'br');
  var payementPageCopyInput = appendContent(linkHolder, 'textarea', '', 'payment-page-copy', 'rich-text');
  payementPageCopyInput.value = row[7];
  appendContent(linkHolder, 'br');
  // add Thank You Page copy
  var thankYouPageLabel = appendContent(linkHolder, 'label', 'Thank You Page Copy:');
  thankYouPageLabel.for = 'thank-you-page-copy';
  appendContent(linkHolder, 'br');
  var thankYouPageInput = appendContent(linkHolder, 'textarea', '', 'thank-you-page-copy', 'rich-text');
  thankYouPageInput.value = row[8];
  appendContent(linkHolder, 'br');
  // add Cancellation Email
  var cancellationEmailLabel = appendContent(linkHolder, 'label', 'Cancellation Email Copy:');
  cancellationEmailLabel.for = 'cancellation-copy';
  appendContent(linkHolder, 'br');
  var cancellationEmailInput = appendContent(linkHolder, 'textarea', '', 'cancellation-copy', 'rich-text');
  cancellationEmailInput.value = row[9];
  appendContent(linkHolder, 'br');
  // add Confirmation Email Copy
  var confirmationEmailCopyLabel = appendContent(linkHolder, 'label', 'Confirmation Email Copy:');
  confirmationEmailCopyLabel.for = 'confirmation-email-copy';
  appendContent(linkHolder, 'br');
  var confirmationEmailCopyInput = appendContent(linkHolder, 'textarea', '', 'confirmation-email-copy', 'rich-text');
  confirmationEmailCopyInput.value = row[10];
  appendContent(linkHolder, 'br');
  // add Reminder Email holder
  var reminderHolder = appendContent(linkHolder, 'div', '', 'reminder-holder');
  // add Follow up Email Copy
  var followUpEmailCopyLabel = appendContent(linkHolder, 'label', 'Follow up Email Copy:');
  followUpEmailCopyLabel.for = 'follow-up-email-copy';
  appendContent(linkHolder, 'br');
  var followUpEmailCopyInput = appendContent(linkHolder, 'textarea', '', 'follow-up-email-copy', 'rich-text');
  followUpEmailCopyInput.value = row[12];
  appendContent(linkHolder, 'br');
  // add Follow up Email CTA
  var followUpEmailCTALabel = appendContent(linkHolder, 'label', 'Follow up Email CTA:');
  followUpEmailCTALabel.for = 'follow-up-email-cta';
  appendContent(linkHolder, 'br');
  var followUpEmailCTAInput = appendContent(linkHolder, 'textarea', '', 'follow-up-email-cta', 'rich-text');
  followUpEmailCTAInput.value = row[13];
  appendContent(linkHolder, 'br');
  // add Follow up Email CTA Destination
  var followUpEmailCTADestLabel = appendContent(linkHolder, 'label', 'Follow up Email CTA Destination:');
  followUpEmailCTADestLabel.for = 'follow-up-email-cta-dest';
  appendContent(linkHolder, 'br');
  var followUpEmailCTADestInput = appendContent(linkHolder, 'input', '', 'follow-up-email-cta-dest', 'full-width');
  followUpEmailCTADestInput.value = row[14];
  appendContent(linkHolder, 'br');
  // Enable rich text editors
  eventTypesSelectionChanged(true);
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  var cancelTypeButton = appendContent(buttonWrapper, 'button', 'Cancel', 'cancel-button', 'form-button');
  cancelTypeButton.type = 'button';
  cancelTypeButton.addEventListener('click', removeBlocker);
  var modifyButton = appendContent(buttonWrapper, 'button', 'Update Flow', 'modify-flow-button', 'form-button');
  modifyButton.type = 'button';
  modifyButton.setAttribute('flow-index', flowIndex);
  modifyButton.setAttribute('onclick', 'editFlow(this)');
}
// Function to update flow data in sheets
function editFlow(element){
  var flowIndex = element.getAttribute('flow-index');
  var selectedEventTypesArray = getSelectedEventTypesArray();
  var selectedEventTypesString = JSON.stringify(selectedEventTypesArray);
  var values = [
    [
      document.getElementById('flow-title').value,
      selectedEventTypesString,
      tinyMCE.get('desc-input').getContent(),
      document.getElementById('important-input').checked,
      document.getElementById('display-input').checked,
      JSON.stringify(getRichTextArray('sign-up-page-copy')),
      JSON.stringify(getRichTextArray('sign-up-page-cta')),
      tinyMCE.get('payment-page-copy').getContent(),
      tinyMCE.get('thank-you-page-copy').getContent(),
      tinyMCE.get('cancellation-copy').getContent(),
      tinyMCE.get('confirmation-email-copy').getContent(),
      JSON.stringify(getRichTextArray('reminder-email-copy')),
      tinyMCE.get('follow-up-email-copy').getContent(),
      tinyMCE.get('follow-up-email-cta').getContent(),
      document.getElementById('follow-up-email-cta-dest').value
    ],
  ];
  var body = {
    values: values
  };

  var range = 'flows!A' + (parseInt(flowIndex) + 2).toString() + ':O';
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  var alertDiv = appendContent(blockerDiv, 'div', '', 'alert');
  var alertHeader = appendContent(alertDiv, 'h2', 'Updating Flow...','alert-header');
  gapi.client.sheets.spreadsheets.values.update({
     spreadsheetId: sheetID,
     range: range,
     valueInputOption: valueInputOption,
     resource: body
  }).then((response) => {
    var result = response.result;
    console.log(`${result.updatedCells} cells updated.`);
    refreshData();
  });
}
// Function to prefent return key from submitting form
function stopReturnSubmit(e){
  if (e.keyCode == 13) {
    e.preventDefault();
  }
  if (e.keyCode == 27) {
    removeBlocker();
  }
}
// Function that adds fields to blockerDiv for modifying events
function addModifyEventFields(element){
  // get event id from element
  var eventID = element.getAttribute('data-event-id');
  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = addBlocker();
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM' ,'', 'modify-event-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Modify Event');
  // add container div
  var titleElement = appendContent(fieldSetWrapper, 'h2', 'Loading event data...');
  var contentHolder = appendContent(fieldSetWrapper, 'div', '', 'new-content-holder');
  // Pull event data from sheet
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetID,
    range: 'events!A2:C',
  }).then(function(response) {
    var range = response.result;
    // check if data was returned
    if (range.values.length > 0) {
      var eventFoundInSheets = false;
      // loop through data from sheets
      for (var sheetsIndex = 0; sheetsIndex < range.values.length; sheetsIndex++) {
        var row = range.values[sheetsIndex];
        if(row[0] == eventID){
          // found event in sheets
          eventFoundInSheets = true;
          eventFoundInCalendar = false;
          var rowNumber = sheetsIndex + 2;
          var rowRange = 'events!A' + rowNumber.toString() + ':B';
          // loop through data in calendar events
          for (var eventIndex = 0; eventIndex < calendarEvents.length; eventIndex++) {
            var thisEvent = calendarEvents[eventIndex];
            if(thisEvent.id == eventID){
              // found event in calendar events
              eventFoundInCalendar = true;
              contentHolder.innerHTML = '';
              titleElement.innerHTML = 'Modifying: ';
              var eventLink = appendContent(titleElement, 'a', thisEvent.summary, 'title-text');
              eventLink.href = thisEvent.htmlLink;
              eventLink.target = '_blank';
              // Add Date
              var dateHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
              var dateLabel = appendContent(dateHolder, 'label', 'Date:');
              dateLabel.for = 'new-date-picker';
              appendContent(dateHolder, 'br');
              var datePicker = appendContent(dateHolder, 'input', '','new-date-picker');
              datePicker.type = 'date';
              datePicker.min = getDate();
              var eventDate = getDateForInput(new Date(thisEvent.start.dateTime));
              datePicker.value = eventDate;
              // Add Start Time
              var startTimeHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
              var startTimeLabel = appendContent(startTimeHolder, 'label', 'Start Time:');
              startTimeLabel.for = 'new-start-time';
              appendContent(startTimeHolder, 'br');
              var startTimePicker = appendContent(startTimeHolder, 'input', '', 'new-start-time');
              startTimePicker.type = 'time';
              startTimePicker.step = '900'
              startTimePicker.addEventListener('change', calculateNewEndTime);
              var eventStart = timeFromDate24(new Date(thisEvent.start.dateTime));
              startTimePicker.value = eventStart;
              var eventDuration = new Date(thisEvent.end.dateTime) - new Date(thisEvent.start.dateTime);
              startTimePicker.setAttribute('data-event-duration', eventDuration)
              // Add End Time
              var endTimeHolder = appendContent(contentHolder, 'div');
              endTimeHolder.className = 'form-item';
              var endTimeLabel = appendContent(endTimeHolder, 'label', 'End Time:');
              endTimeLabel.for = 'new-end-time';
              appendContent(endTimeHolder, 'br');
              var endTimePicker = appendContent(endTimeHolder, 'input', '', 'new-end-time');
              endTimePicker.type = 'time';
              endTimePicker.step = '900'
              var eventEnd = timeFromDate24(new Date(thisEvent.end.dateTime));
              endTimePicker.value = eventEnd;
              // Add Max Attendees
              var attendeesHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
              var attendeesLabel = appendContent(attendeesHolder, 'label', 'Max Attendees:');
              attendeesLabel.for = 'new-attendees-input';
              appendContent(attendeesHolder, 'br');
              var attendeesInput = appendContent(attendeesHolder, 'input', '', 'new-attendees-input');
              attendeesInput.type = 'number';
              attendeesInput.min = 0;
              attendeesInput.value = row[1];
              // add zoom link
              var linkHolder = appendContent(fieldSetWrapper, 'div', '', '', 'form-item');
              var linkLabel = appendContent(linkHolder, 'label', 'Zoom Link:');
              linkLabel.for = 'new-link-input';
              appendContent(fieldSetWrapper, 'br');
              var linkInput = appendContent(linkHolder, 'input', '', 'new-link-input', 'full-width');
              linkInput.value = thisEvent.location;
              // add description
              var descLabel = appendContent(linkHolder, 'label', 'Description:');
              descLabel.for = 'desc-input';
              appendContent(linkHolder, 'br');
              var descInput = appendContent(linkHolder, 'textarea', '', 'desc-input', 'rich-text');
              descInput.value = thisEvent.description;
              appendContent(linkHolder, 'br');
              // add modify message
              var messageLabel = appendContent(linkHolder, 'label', 'Update Message:');
              messageLabel.for = 'message-input';
              appendContent(linkHolder, 'br');
              var messageInput = appendContent(linkHolder, 'textarea', '', 'message-input', 'rich-text');
              richTextInit();
              // add buttons
              var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
              var cancelTypeButton = appendContent(buttonWrapper, 'button', 'Cancel', 'cancel-button', 'form-button');
              cancelTypeButton.type = 'button';
              cancelTypeButton.addEventListener('click', removeBlocker);
              var modifyButton = appendContent(buttonWrapper, 'button', 'Update Event', 'modify-event-button', 'form-button');
              modifyButton.type = 'button';
              modifyButton.setAttribute('data-event-id', thisEvent.id);
              modifyButton.setAttribute('data-sheet-range', rowRange);
              modifyButton.setAttribute('onclick', 'modifyEvent(this)');
              break;
            }
          }
          if(!eventFoundInCalendar){
            alertElement = appendContent(contentHolder, 'P');
            alertElement.innerHTML = 'No data for this event found in <a href="https://calendar.google.com/calendar/embed?src=50be3j70c5a3rn6t55tii9r4g4%40group.calendar.google.com&ctz=America%2FNew_York" target="_blank">events calendar</a>. Please contact the developer.';
          }
          break;
        }
      }
      if(!eventFoundInSheets){
        alertElement = appendContent(contentHolder, 'P');
        alertElement.innerHTML = 'No data for this event found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit#gid=433114330" target="_blank">events sheet</a>. Please contact the developer.';
      }
    } else {
      alertElement = appendContent(contentHolder, 'P');
      alertElement.innerHTML = 'No data for events found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit#gid=433114330" target="_blank">events sheet</a>. Please contact the developer.';
    }
  }, function(response) {
    appendContent(contentHolder, 'P', 'Error: ' + response.result.error.message);
  });
}
// Function to modify event in sheets & calendar
function modifyEvent(element){
  // getting info from button
  var eventID = element.getAttribute('data-event-id');
  var sheetRange = element.getAttribute('data-sheet-range');
  // setting up data for sheets
  var values = [
    [
      eventID,
      document.getElementById('new-attendees-input').value
    ]
  ];
  var body = {
    values: values
  };
  var modifyForm = document.getElementById('modify-event-form');
  modifyForm.style.display = 'none';
  var blockerDiv = document.getElementById('blocker');
  var alertDiv = appendContent(blockerDiv, 'div', '', 'alert');
  var alertHeader = appendContent(alertDiv, 'h2', 'Updating event...','alert-header');
  // updating sheet
  gapi.client.sheets.spreadsheets.values.update({
     spreadsheetId: sheetID,
     range: sheetRange,
     valueInputOption: valueInputOption,
     resource: body
  }).then((response) => {
    var result = response.result;
    console.log(`${result.updatedCells} cells updated.`);
    // setting up data for calendar
    var newDate = document.getElementById('new-date-picker').value;
    var newStart = document.getElementById('new-start-time').value;
    var newEnd = document.getElementById('new-end-time').value;
    startDateTime = (new Date(newDate + ' ' + newStart + ':00').toISOString());
    endDateTime = (new Date(newDate + ' ' + newEnd + ':00').toISOString());
    var newEvent = {
      'summary': document.getElementById('title-text').textContent,
      'location': document.getElementById('new-link-input').value,
      'description': tinyMCE.get('desc-input').getContent(),
      'start': {
        'dateTime': startDateTime,
      },
      'end': {
        'dateTime': endDateTime,
      },
    }
    var request = gapi.client.calendar.events.patch({
      'calendarId': calendarID,
      'eventId': eventID,
      'resource': newEvent
    });
    request.execute(function(event) {
      refreshData();
    });
  }, function(response) {
    appendContent(contentElement, 'P', 'Error: ' + response.result.error.message);
  });
}
// Function that adds fields to blockerDiv for cancelling events
function addCancelEventFields(element){
  // get event id from element
  var eventID = element.getAttribute('data-event-id');
  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = addBlocker();
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM' ,'', 'cancel-event-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  formWrapper.setAttribute('onsubmit', 'cancelEvent(this);return false;');
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Cancel Event');
  // add container div
  var titleElement = appendContent(fieldSetWrapper, 'h2', 'Loading event data...');
  var contentHolder = appendContent(fieldSetWrapper, 'div', '', 'new-content-holder');
  // Pull event data from sheet
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetID,
    range: 'events!A2:C',
  }).then(function(response) {
    var range = response.result;
    // check if data was returned
    if (range.values.length > 0) {
      var eventFoundInSheets = false;
      // loop through data from sheets
      for (var sheetsIndex = 0; sheetsIndex < range.values.length; sheetsIndex++) {
        var row = range.values[sheetsIndex];
        if(row[0] == eventID){
          // found event in sheets
          eventFoundInSheets = true;
          eventFoundInCalendar = false;
          var rowNumber = sheetsIndex + 1;
          var rowRange = rowNumber.toString();
          // loop through data in calendar events
          for (var eventIndex = 0; eventIndex < calendarEvents.length; eventIndex++) {
            var thisEvent = calendarEvents[eventIndex];
            if(thisEvent.id == eventID){
              // found event in calendar events
              eventFoundInCalendar = true;
              contentHolder.innerHTML = '';
              titleElement.innerHTML = 'Canceling: ';
              var eventLink = appendContent(titleElement, 'a', thisEvent.summary, 'title-text');
              eventLink.href = thisEvent.htmlLink;
              eventLink.target = '_blank';
              var startDate = new Date(thisEvent.start.dateTime);
              var endDate = new Date(thisEvent.end.dateTime);
              appendContent(fieldSetWrapper, 'p', timeFromDate12(startDate));
              appendContent(fieldSetWrapper, 'p', ((endDate-startDate)/(1000 * 60)).toString() + ' mins');
              attendeeCount = 0;
              if(thisEvent.attendees != null){
                attendeeCount = thisEvent.attendees.length;
              }
              appendContent(fieldSetWrapper, 'p', 'Attendees: ' + attendeeCount.toString());
              appendContent(fieldSetWrapper, 'br');
              // add modify message
              var messageLabel = appendContent(fieldSetWrapper, 'label', 'Cancel Message:');
              messageLabel.for = 'message-input';
              appendContent(fieldSetWrapper, 'br');
              var messageInput = appendContent(fieldSetWrapper, 'textarea', '', 'message-input', 'rich-text');
              richTextInit();
              // add buttons
              var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
              var backButton = appendContent(buttonWrapper, 'button', 'Back', 'cancel-button', 'form-button');
              backButton.type = 'button';
              backButton.addEventListener('click', removeBlocker);
              var cancelEventButton = appendContent(buttonWrapper, 'button', 'Cancel Event', 'cancel-event-button', 'form-button');
              cancelEventButton.type = 'submit';
              formWrapper.setAttribute('data-event-id', thisEvent.id);
              formWrapper.setAttribute('data-sheet-range', rowRange);
              break;
            }
          }
          if(!eventFoundInCalendar){
            alertElement = appendContent(contentHolder, 'P');
            alertElement.innerHTML = 'No data for this event found in <a href="https://calendar.google.com/calendar/embed?src=50be3j70c5a3rn6t55tii9r4g4%40group.calendar.google.com&ctz=America%2FNew_York" target="_blank">events calendar</a>. Please contact the developer.';
          }
          break;
        }
      }
      if(!eventFoundInSheets){
        alertElement = appendContent(contentHolder, 'P');
        alertElement.innerHTML = 'No data for this event found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit#gid=433114330" target="_blank">events sheet</a>. Please contact the developer.';
      }
    } else {
      alertElement = appendContent(contentHolder, 'P');
      alertElement.innerHTML = 'No data for events found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit#gid=433114330" target="_blank">events sheet</a>. Please contact the developer.';
    }
  }, function(response) {
    appendContent(contentHolder, 'P', 'Error: ' + response.result.error.message);
  });
}
function cancelEvent(element){
  // getting info from button
  var eventID = element.getAttribute('data-event-id');
  var startRow = parseInt(element.getAttribute('data-sheet-range'));
  // updating display message
  var cancelForm = document.getElementById('cancel-event-form');
  cancelForm.style.display = 'none';
  var blockerDiv = document.getElementById('blocker');
  var alertDiv = appendContent(blockerDiv, 'div', '', 'alert');
  var alertHeader = appendContent(alertDiv, 'h2', 'Canceling event...','alert-header');
  gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetID,
    resource: {
      'requests':
      [
        {
          'deleteRange':
          {
            'range':
            {
              'sheetId': 433114330,
              'startRowIndex': startRow,
              'endRowIndex': startRow + 1
            },
            'shiftDimension': 'ROWS'
          }
        }
      ]
    }
  }).then((response) => {
    var result = response.result;
    console.log(result);
    var request = gapi.client.calendar.events.delete({
      'calendarId': calendarID,
      'eventId': eventID
    });
    request.execute(function(event) {
      refreshData();
    });
  }, function(response) {
    appendContent(contentElement, 'P', 'Error: ' + response.result.error.message);
  });
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
  yyyymmdd = (yyyy +'-'+ mm + '-' + dd);
  return yyyymmdd;
}
// Function to format provided date as mm/dd/yyyy
function getDateForDisplay(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');

    return month + '/' + day + '/' + year;
}
// Function to format provided date as yyyy-mm-dd
function getDateForInput(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');

    return year + '-' + month + '-' + day;
}
// Function to update fields from defaults
function eventTypeChanged(){
  var eventTypeSelect = document.getElementById('event-type-select');
  var eventTypeValue = eventTypeSelect.value;
  if(eventTypeSelect.value < eventTypeSheetsValues.length){
    var row = eventTypeSheetsValues[eventTypeValue]
    document.getElementById('attendees-input').value = row[3] ;
    document.getElementById('link-input').value = row[4] ;
    calculateEndTime();
  } else if (eventTypeSelect.value == eventTypeSheetsValues.length){
    addNewTypeFields();
  }
}
// Function that adds fields to blockerDiv for adding new event types
function addNewTypeFields(){
  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = addBlocker();
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM' ,'', 'new-type-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Add New Event Type');
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div', '', 'new-content-holder');
  // add Title
  var eventTypeHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var eventTypeLabel = appendContent(eventTypeHolder, 'label', 'Title:');
  eventTypeLabel.for = 'event-type-name';
  appendContent(eventTypeHolder, 'br');
  var eventTypeInput = appendContent(eventTypeHolder, 'input', '', 'event-type-name');
  // Add Run Time
  var runTimeHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var runTimeLabel = appendContent(runTimeHolder, 'label', 'Run Time:');
  runTimeLabel.for = 'run-time-input';
  appendContent(runTimeHolder, 'br');
  var runTimeInput = appendContent(runTimeHolder, 'input', '', 'run-time-input');
  runTimeInput.type = 'number';
  runTimeInput.min = 0;
  // Add Max Attendees
  var attendeesHolder = appendContent(contentHolder, 'div' , '', '', 'form-item');
  var attendeesLabel = appendContent(attendeesHolder, 'label', 'Max Attendees:');
  attendeesLabel.for = 'new-attendees-input';
  appendContent(attendeesHolder, 'br');
  var attendeesInput = appendContent(attendeesHolder, 'input', '','new-attendees-input');
  attendeesInput.type = 'number';
  attendeesInput.min = 0;
  // Add Cost
  var costHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var costLabel = appendContent(costHolder, 'label', 'Cost:');
  costLabel.for = 'cost-input';
  appendContent(costHolder, 'br');
  var costInput = appendContent(costHolder, 'input', '', 'cost-input');
  costInput.type = 'number';
  costInput.min = 0;
  costInput.addEventListener('change', toggleCostHidden);
  // add zoom link
  var linkHolder = appendContent(fieldSetWrapper, 'div', '', '', 'form-item');
  var linkLabel = appendContent(linkHolder, 'label', 'Zoom Link:');
  linkLabel.for = 'new-link-input';
  appendContent(linkHolder, 'br');
  var linkInput = appendContent(linkHolder, 'input', '', 'new-link-input', 'full-width');
  appendContent(linkHolder, 'br');
  // add description
  var descLabel = appendContent(linkHolder, 'label', 'Description:');
  descLabel.for = 'desc-input';
  appendContent(linkHolder, 'br');
  var descInput = appendContent(linkHolder, 'textarea', '', 'desc-input', 'rich-text');
  appendContent(linkHolder, 'br');
  richTextInit();
  // add buttons
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  var cancelTypeButton = appendContent(buttonWrapper, 'button', 'Cancel', 'cancel-button', 'form-button');
  cancelTypeButton.type = 'button';
  cancelTypeButton.addEventListener('click', removeBlocker);
  var createTypeButton = appendContent(buttonWrapper, 'button', 'Add New Event Type', 'new-type-button', 'form-button');
  createTypeButton.type = 'button';
  createTypeButton.addEventListener('click', addNewType);
}
// Function to add event type to spreadsheet
function addNewType(){
  var values = [
    [
      document.getElementById('event-type-name').value,
      document.getElementById('run-time-input').value,
      tinyMCE.get('desc-input').getContent(),
      document.getElementById('new-attendees-input').value,
      document.getElementById('new-link-input').value,
      document.getElementById('cost-input').value
    ],
  ];
  var body = {
    values: values
  };
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  var alertDiv = appendContent(blockerDiv, 'div', '', 'alert');
  var alertHeader = appendContent(alertDiv, 'h2', 'Adding Event Type...','alert-header');
  gapi.client.sheets.spreadsheets.values.append({
     spreadsheetId: sheetID,
     range: 'event-types',
     valueInputOption: valueInputOption,
     resource: body
  }).then((response) => {
    var result = response.result;
    console.log(`${result.updates.updatedCells} cells appended.`)
    refreshData();
  });
}
// Function to refresh data from sheets/calendar
function refreshData(){
  removeBlocker();
  clearContent();
  appendContent(contentElement, 'h2', 'Refreshing data...');
  displayEventTypeData();
}
// Function that adds fields to blockerDiv for editing event types
function addEditTypeFields(){
  // get current event type
  var eventTypeSelect = document.getElementById('event-type-select');
  var eventTypeValue = eventTypeSelect.value;
  var row = eventTypeSheetsValues[eventTypeValue]
  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = addBlocker();
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM' ,'', 'new-type-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Edit Event Type');
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div', '', 'new-content-holder');
  // add Title
  var eventTypeHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var eventTypeLabel = appendContent(eventTypeHolder, 'label', 'Title:');
  eventTypeLabel.for = 'event-type-name';
  appendContent(eventTypeHolder, 'br');
  var eventTypeInput = appendContent(eventTypeHolder, 'input', '', 'event-type-name');
  eventTypeInput.value = row[0];
  // Add Run Time
  var runTimeHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var runTimeLabel = appendContent(runTimeHolder, 'label', 'Run Time:');
  runTimeLabel.for = 'run-time-input';
  appendContent(runTimeHolder, 'br');
  var runTimeInput = appendContent(runTimeHolder, 'input', '', 'run-time-input');
  runTimeInput.type = 'number';
  runTimeInput.min = 0;
  runTimeInput.value = row[1];
  // Add Max Attendees
  var attendeesHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var attendeesLabel = appendContent(attendeesHolder, 'label', 'Max Attendees:');
  attendeesLabel.for = 'new-attendees-input';
  appendContent(attendeesHolder, 'br');
  var attendeesInput = appendContent(attendeesHolder, 'input', '' ,'new-attendees-input');
  attendeesInput.type = 'number';
  attendeesInput.min = 0;
  attendeesInput.value = row[3];
  // Add Cost
  var costHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var costLabel = appendContent(costHolder, 'label', 'Cost:');
  costLabel.for = 'cost-input';
  appendContent(costHolder, 'br');
  var costInput = appendContent(costHolder, 'input', '', 'cost-input');
  costInput.type = 'number';
  costInput.min = 0;
  costInput.value = row[5];
  costInput.addEventListener('change', toggleCostHidden);
  // add zoom link
  var linkHolder = appendContent(fieldSetWrapper, 'div', '', '', 'form-item');
  var linkLabel = appendContent(linkHolder, 'label', 'Zoom Link:');
  linkLabel.for = 'new-link-input';
  appendContent(linkHolder, 'br');
  var linkInput = appendContent(linkHolder, 'input', '', 'new-link-input', 'full-width');
  linkInput.value = row[4];
  appendContent(linkHolder, 'br');
  // add description
  var descLabel = appendContent(linkHolder, 'label', 'Description:');
  descLabel.for = 'desc-input';
  appendContent(linkHolder, 'br');
  var descInput = appendContent(linkHolder, 'textarea', '', 'desc-input', 'rich-text');
  descInput.onkeypress
  descInput.value = row[2];
  appendContent(linkHolder, 'br');
  // Enable rich text editors
  richTextInit();

  // add buttons
  var buttonWrapper = appendContent(fieldSetWrapper, 'div');
  buttonWrapper.id = 'button-wrapper';
  var cancelTypeButton = appendContent(buttonWrapper, 'button', 'Cancel');
  cancelTypeButton.id = 'cancel-button';
  cancelTypeButton.className = 'form-button';
  cancelTypeButton.type = 'button';
  cancelTypeButton.addEventListener('click', removeBlocker);
  var updateTypeButton = appendContent(buttonWrapper, 'button', 'Update Event Type');
  updateTypeButton.id = 'new-type-button';
  updateTypeButton.className = 'form-button';
  updateTypeButton.type = 'button';
  updateTypeButton.addEventListener('click', editEventType);
}
// Function to toggle display of cost-hidden divs
function toggleCostHidden(){
  var costInputValue = document.getElementById('cost-input').value;
  var costHiddenDivs = document.getElementsByClassName('cost-hidden');
  for (var divIndex = 0; divIndex < costHiddenDivs.length; divIndex++) {
    if(costInputValue > 0){
      costHiddenDivs[divIndex].style.display = 'block';
    } else {
      costHiddenDivs[divIndex].style.display = 'none';
    }
  }
}
// Function to remove blocker div
function removeBlocker(){
  var bodyElement = document.getElementsByTagName("body")[0];
  bodyElement.style.overflow = "auto";
  theBlocker = document.getElementById('blocker');
  if(theBlocker != null){
    document.getElementById('event-type-select').selectedIndex = 0;
    eventTypeChanged();
    theBlocker.remove();
  }
}
function addBlocker(){
  var bodyElement = document.getElementsByTagName("body")[0];
  bodyElement.style.overflow = "hidden";

  var blockerDiv = appendContent(signedinElement, 'div', '', 'blocker');
  return blockerDiv;
}
// function to update event type sheets info
function editEventType(){
  var values = [
    [
      document.getElementById('event-type-name').value,
      document.getElementById('run-time-input').value,
      tinyMCE.get('desc-input').getContent(),
      document.getElementById('new-attendees-input').value,
      document.getElementById('new-link-input').value,
      document.getElementById('cost-input').value
    ],
  ];
  var body = {
    values: values
  };

  var range = 'event-types!A' + (parseInt(document.getElementById('event-type-select').value) + 2).toString() + ':F';
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  var alertDiv = appendContent(blockerDiv, 'div', '', 'alert');
  var alertHeader = appendContent(alertDiv, 'h2', 'Updating Event Type...','alert-header');
  gapi.client.sheets.spreadsheets.values.update({
     spreadsheetId: sheetID,
     range: range,
     valueInputOption: valueInputOption,
     resource: body
  }).then((response) => {
    var result = response.result;
    console.log(`${result.updatedCells} cells updated.`);
    refreshData();
  });
}
// Function to update end time from duration
function calculateEndTime(){
  var startTimePicker = document.getElementById('start-time');
  if(startTimePicker.value !=''){
    var eventTypeSelect = document.getElementById('event-type-select');
    var eventTypeValue = eventTypeSelect.value;
    var row = eventTypeSheetsValues[eventTypeValue]
    var endTimePicker = document.getElementById('end-time');
    var defaultDuration = timeFromMins(parseInt(row[1]));
    endTimePicker.value = addTimes(startTimePicker.value, defaultDuration);
  }
}
function calculateNewEndTime(){
  var startTimePicker = document.getElementById('new-start-time');
  if(startTimePicker.value !=''){
    var newDate = document.getElementById('new-date-picker').value;
    var newStart = startTimePicker.value;
    var endTimePicker = document.getElementById('new-end-time');
    var startDateTime = Date.parse(newDate + ' ' + newStart);
    var eventDuration = parseInt(startTimePicker.getAttribute('data-event-duration'));
    endDateTime = new Date(startDateTime + eventDuration);
    endTimePicker.value = timeFromDate24(endDateTime);
  }
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

function timeFromDate12(date){
  return date.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
}
function timeFromDate24(date){
  return date.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'});
}
function displayQuotes() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetID,
    range: 'quotes!A2:B',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      window.quotesSheetsValues = range.values;
      // add form
      var formWrapper = appendContent(contentElement, 'FORM', '', 'quotes-form');
      formWrapper.onkeypress = stopReturnSubmit(formWrapper);
      formWrapper.addEventListener('submit', addNewQuote);

      // add fieldset
      var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
      // add legend
      appendContent(fieldSetWrapper, 'LEGEND', 'Quotes:');
      // add flows box
      quotesContainer = appendContent(fieldSetWrapper, 'div', '' , '', 'quotes-box');
      // add flows from sheets data
      for (var sheetIndex = 0; sheetIndex < range.values.length; sheetIndex++) {
        var row = range.values[sheetIndex];
        var quotesContainer = appendContent(flowsContainer, 'div', '', '', 'tool');
        var flowLink = appendContent(flowContainer, 'a');
        flowLink.setAttribute('flow-index', sheetIndex);
        flowLink.setAttribute('onclick', 'addEditFlowFields(this)');
        var flowTitle = appendContent(flowLink, 'h3', row[0], '', 'tool-header');
        var flowDescription = appendContent(flowLink, 'div', '', '', 'tool-description');
        flowDescription.innerHTML = row[2];
      }
      var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
      var newFlowButton = appendContent(buttonWrapper, 'button', 'Add New Flow', '','form-button');
    } else {
      alertElement = appendContent(contentElement, 'P')
      alertElement.innerHTML = 'No data found in <a href="https://docs.google.com/spreadsheets/d/' + sheetID + '/edit" target="_blank">event-types sheet</a>.';
    }
  }, function(response) {
    appendContent(contentElement, 'P', 'Error: ' + response.result.error.message);
  });
}
function addNewQuote(e){
  e.preventDefault();
  var quoteIndex = quotesSheetsValues.length;
  // add blocker to prevent accidentally clicking other buttons
  var blockerDiv = addBlocker();
  // add form
  var formWrapper = appendContent(blockerDiv, 'FORM' ,'', 'new-flow-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  // add fieldset
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add legend
  appendContent(fieldSetWrapper, 'LEGEND', 'Add Flow');
  // add container div
  var contentHolder = appendContent(fieldSetWrapper, 'div', '', 'new-content-holder');
  // add Title
  var flowTitleHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var flowTitleLabel = appendContent(flowTitleHolder, 'label', 'Title:');
  flowTitleLabel.for = 'flow-title';
  appendContent(flowTitleHolder, 'br');
  var eventTypeInput = appendContent(flowTitleHolder, 'input', '', 'flow-title');
  appendContent(flowTitleHolder, 'br');
  // add Event Types select
  var eventTypesHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var eventTypesIncluded = appendContent(eventTypesHolder, 'label', 'Event Types:');
  eventTypesIncluded.for = 'event-types-select';
  appendContent(eventTypesHolder, 'br');
  var eventTypesSelect = appendContent(eventTypesHolder, 'select', '', 'event-types-select');
  eventTypesSelect.multiple = true;
  for(var eventTypeIndex = 0; eventTypeIndex < eventTypeSheetsValues.length; eventTypeIndex++){
    thisEventType = eventTypeSheetsValues[eventTypeIndex];
    var eventTypeOption = appendContent(eventTypesSelect, 'option', thisEventType[0]);
  }
  eventTypesSelect.setAttribute('onchange', 'eventTypesSelectionChanged(false)');
  // add important checkbox
  var importantHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var importantLabel = appendContent(importantHolder, 'label', 'Important: ');
  var importantInput = appendContent(importantLabel, 'input', '', 'important-input');
  importantInput.type = 'checkbox';
  appendContent(importantHolder, 'br');
  // add display on site checkbox
  var displayHolder = appendContent(contentHolder, 'div', '', '', 'form-item');
  var displayLabel = appendContent(displayHolder, 'label', 'Display On Website: ');
  var displayInput = appendContent(displayLabel, 'input', '', 'display-input');
  displayInput.type = 'checkbox';
  appendContent(displayHolder, 'br');
  var linkHolder = appendContent(fieldSetWrapper, 'div', '', '', 'form-item');
  // add description
  var descLabel = appendContent(linkHolder, 'label', 'Description:');
  descLabel.for = 'desc-input';
  appendContent(linkHolder, 'br');
  var descInput = appendContent(linkHolder, 'textarea', '', 'desc-input', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Sign Up Page Copy holder
  var signupHolder = appendContent(linkHolder, 'div', '', 'signup-holder');
  // add Payment Page Copy
  var payementPageCopyLabel = appendContent(linkHolder, 'label', 'Payment Page Copy:');
  payementPageCopyLabel.for = 'payment-page-copy';
  appendContent(linkHolder, 'br');
  var payementPageCopyInput = appendContent(linkHolder, 'textarea', '', 'payment-page-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Thank You Page copy
  var thankYouPageLabel = appendContent(linkHolder, 'label', 'Thank You Page Copy:');
  thankYouPageLabel.for = 'thank-you-page-copy';
  appendContent(linkHolder, 'br');
  var thankYouPageInput = appendContent(linkHolder, 'textarea', '', 'thank-you-page-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Cancellation Email
  var cancellationEmailLabel = appendContent(linkHolder, 'label', 'Cancellation Email Copy:');
  cancellationEmailLabel.for = 'cancellation-copy';
  appendContent(linkHolder, 'br');
  var cancellationEmailInput = appendContent(linkHolder, 'textarea', '', 'cancellation-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Confirmation Email Copy
  var confirmationEmailCopyLabel = appendContent(linkHolder, 'label', 'Confirmation Email Copy:');
  confirmationEmailCopyLabel.for = 'confirmation-email-copy';
  appendContent(linkHolder, 'br');
  var confirmationEmailCopyInput = appendContent(linkHolder, 'textarea', '', 'confirmation-email-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Reminder Email holder
  var reminderHolder = appendContent(linkHolder, 'div', '', 'reminder-holder');
  // add Follow up Email Copy
  var followUpEmailCopyLabel = appendContent(linkHolder, 'label', 'Follow up Email Copy:');
  followUpEmailCopyLabel.for = 'follow-up-email-copy';
  appendContent(linkHolder, 'br');
  var followUpEmailCopyInput = appendContent(linkHolder, 'textarea', '', 'follow-up-email-copy', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Follow up Email CTA
  var followUpEmailCTALabel = appendContent(linkHolder, 'label', 'Follow up Email CTA:');
  followUpEmailCTALabel.for = 'follow-up-email-cta';
  appendContent(linkHolder, 'br');
  var followUpEmailCTAInput = appendContent(linkHolder, 'textarea', '', 'follow-up-email-cta', 'rich-text');
  appendContent(linkHolder, 'br');
  // add Follow up Email CTA Destination
  var followUpEmailCTADestLabel = appendContent(linkHolder, 'label', 'Follow up Email CTA Destination:');
  followUpEmailCTADestLabel.for = 'follow-up-email-cta-dest';
  appendContent(linkHolder, 'br');
  var followUpEmailCTADestInput = appendContent(linkHolder, 'input', '', 'follow-up-email-cta-dest', 'full-width');
  appendContent(linkHolder, 'br');
  // Update event type specific fields
  eventTypesSelectionChanged(false);
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  var cancelTypeButton = appendContent(buttonWrapper, 'button', 'Cancel', 'cancel-button', 'form-button');
  cancelTypeButton.type = 'button';
  cancelTypeButton.addEventListener('click', removeBlocker);
  var modifyButton = appendContent(buttonWrapper, 'button', 'Add Flow', 'modify-flow-button', 'form-button');
  modifyButton.type = 'button';
  modifyButton.setAttribute('flow-index', flowIndex);
  modifyButton.setAttribute('onclick', 'addFlow(this)');
}
