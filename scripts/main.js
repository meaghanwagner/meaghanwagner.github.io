// Function to toggle the burger menu
function burgerToggle() {
  var x = document.getElementsByClassName('header-nav')[0];
  if (x.style.display === 'flex') {
    x.style.display = 'none';
  } else {
    x.style.display = 'flex';
  }
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
  if (text != '') {
    var textContent = document.createTextNode(text);
    newElement.appendChild(textContent);
  }
  if (idText != '') {
    newElement.id = idText;
  }
  if (classText != '') {
    newElement.className = classText;
  }
  parentElement.appendChild(newElement);
  return newElement;
}
// Function to remove blocker div
function removeBlocker() {
  var theBlocker = document.getElementById('blocker');
  if (theBlocker != null) {
    theBlocker.remove();
  }
  var bodyElement = document.getElementsByTagName("body")[0];
  bodyElement.style.overflow = "auto";
}
// Function to prefent return key from submitting form
function stopReturnSubmit(e) {
  if (e.keyCode == 13) {
    e.preventDefault();
  }
  if (e.keyCode == 27) {
    removeBlocker();
  }
}
// empty object to hold flow data
var flowData = [];
// function to load flow data from sheets
function loadFlows(){
  var flowDataXHR = new XMLHttpRequest();
  flowDataXHR.open('GET', 'https://gardenlifegame.com/megs_php/echoFlowData.php');
  flowDataXHR.onload = function() {
    var flowArray = JSON.parse(flowDataXHR.responseText).values;
    flowData = buildFlowData(flowArray);
    window.flowData = flowData;
    flowsBox = document.getElementById('flow-box');
    var flowCount = flowData.length;
    for (var flowIndex = 0; flowIndex < flowCount; flowIndex++) {
      var thisFlow = flowData[flowIndex];
      if(thisFlow.displayOnSite == 'TRUE'){
        var flowContainer = appendContent(flowsBox, 'div', '', '', 'tool');
        if(thisFlow.important == 'TRUE'){
          flowContainer.classList.add('important');
          flowContainer.classList.add('shiny');
        }
        var flowLink = appendContent(flowContainer, 'a');
        flowLink.setAttribute('onclick', 'loadSignUp(' + flowIndex + ')');
        var flowTitle = appendContent(flowLink, 'h3', thisFlow.flowType, '', 'tool-header');
        var flowDescription = appendContent(flowLink, 'div', '', '', 'tool-description');
        flowDescription.innerHTML = thisFlow.flowDescription;
      }
    }

  }
  flowDataXHR.send();
}
function buildFlowData(flowArray){
  var flowData = [];
  var flowCount = Object.keys(flowArray).length;
  for (var flowIndex = 0; flowIndex < flowCount; flowIndex++) {
    var thisFlow = flowArray[flowIndex];
    var thisFlowObj = {
      "flowType" : thisFlow[0],
      "eventTypesList" : JSON.parse(thisFlow[1]),
      "flowDescription" : thisFlow[2],
      "important" : thisFlow[3],
      "displayOnSite" : thisFlow[4],
      "signUpPageCopyList" : JSON.parse(thisFlow[5]),
      "signUpPageCTAList" : JSON.parse(thisFlow[6]),
      "paymentPageCopy" : thisFlow[7],
      "thankYouPageCopy" : thisFlow[8],
      "thankYouPageTotalsCopy" : thisFlow[9]
    }
    flowData.push(thisFlowObj);
  }
  return flowData;
}
// empty object to hold events
var eventsList = {};
function reloadSignUp(flowIndex, signUpIndex){
  removeBlocker();
  loadSignUp(flowIndex, signUpIndex);
}
// Function to sign up for a flow
function loadSignUp(flowIndex, signUpIndex=0) {
  var thisFlow = flowData[flowIndex];
  // add popup
  var bodyElement = document.getElementsByTagName("body")[0];
  var blockerDiv = appendContent(bodyElement, 'div', '', 'blocker');
  bodyElement.style.overflow = "hidden";
  // add form
  var formWrapper = appendContent(blockerDiv, 'form', '', 'sign-up-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  if(signUpIndex == (thisFlow.eventTypesList.length -1)){
    formWrapper.addEventListener('submit', addAttendee);
  } else {
    formWrapper.setAttribute('onsubmit', 'reloadSignUp(' + flowIndex + ', ' + (signUpIndex + 1) + '); return false;');
  }
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  var theSignUpCopy = thisFlow.signUpPageCopyList[thisFlow.eventTypesList[signUpIndex]];
  if(theSignUpCopy.includes('[event-list]')){
    theSignUpCopy = theSignUpCopy.replace('[event-list]', '<div id="event-holder"><p>Loading Upcoming Events...</p></div>')
  } else {
    theSignUpCopy += '<div id="event-holder"><p>Loading Upcoming Events...</p></div>';
  }
  var loadAttendeeInput = false;
  if(theSignUpCopy.includes('[attendee-input]')){
    theSignUpCopy = theSignUpCopy.replace('[attendee-input]', '<div id="input-holder"></div>')
    loadAttendeeInput = true;
  }
  fieldSetWrapper.innerHTML = theSignUpCopy;
  var eventHolder = document.getElementById('event-holder');
  // add cancel button
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  var cancelTypeButton = appendContent(buttonWrapper, 'button', 'Close', 'cancel-button', 'form-button');
  cancelTypeButton.type = 'button';
  cancelTypeButton.addEventListener('click', removeBlocker);

  var eventsAdded = [];
  // get event data from calendar
  var eventDataXHR = new XMLHttpRequest();
  eventDataXHR.open('GET', 'https://gardenlifegame.com/megs_php/echoEventData.php');
  eventDataXHR.onload = function() {
    var eventData = JSON.parse(eventDataXHR.responseText);
    var calendarEvents = eventData.calendarevents;
    var eventCount = Object.keys(calendarEvents).length;
    if (eventCount > 0) {
      // get event data from sheets
      var sheetEvents = eventData.sheetevents.values;
      if(sheetEvents == null){
        var sheetEventsCount = 0;
      } else {
        var sheetEventsCount = Object.keys(sheetEvents).length;
      }
      if (sheetEventsCount > 0) {
        // loop through events from calendar
        for (var eventIndex = 0; eventIndex < eventCount; eventIndex++) {
          var event = calendarEvents[eventIndex];
          // loop through data from sheets
          var eventFound = false;
          for (var rowIndex = 0; rowIndex < sheetEventsCount; rowIndex++) {
            var row = sheetEvents[rowIndex];
            if (row[0] == event.id) {
              eventFound = true;
              event.maxAttendees = row[1];
              event.cost = row[2];
              event.thankYouText = row[6];
              break;
            }
          }
          // Check if the event data was found in sheets
          if (eventFound) {
            if (event.summary == thisFlow.eventTypesList[signUpIndex]) {
              // get attendees from sheets
              var sheetAttendees = eventData.sheetattendees.values;
              if(sheetAttendees == null){
                var totalAttendeesCount = 0;
              } else {
                var totalAttendeesCount = Object.keys(sheetAttendees).length;
              }
              // Check if attendees is maxed out
              var eventAttendees = [];
              if (totalAttendeesCount > 0) {
                for (var attendeesRowIndex = 0; attendeesRowIndex < totalAttendeesCount; attendeesRowIndex++) {
                  var attendeeRow = sheetAttendees[attendeesRowIndex];
                  if (attendeeRow[0] == event.id) {
                    eventAttendees.push(attendeeRow);
                  }
                }
              }
              if (event.maxAttendees > eventAttendees.length) {
                event.availableSeats = event.maxAttendees - eventAttendees.length;
                eventsAdded.push(event);
              }
            }
          } else {
            console.log("Couldn't find event data for " + event.id + ", which shouldn't happen. Please inform the developer.")
          }
        }
        // check if events available
        if (eventsAdded.length > 0) {
          eventHolder.innerHTML = '';
          for (var eventAddedIndex = 0; eventAddedIndex < eventsAdded.length; eventAddedIndex++) {
            eventsList[event.id] = event;
            var event = eventsAdded[eventAddedIndex];
            var eventLabel = appendContent(eventHolder, 'label')
            var eventInput = appendContent(eventLabel, 'input', '', event.id);
            eventInput.type = 'radio';
            eventInput.name = 'event';
            eventInput.value = event.id;
            eventInput.required = true;
            eventLabel.for = event.id;
            var startDateTime = new Date(event.start.dateTime);
            var endDateTime = new Date(event.end.dateTime);
            appendContent(eventLabel, 'span', getDateForDisplay(startDateTime), '', 'event-date');
            appendContent(eventLabel, 'span', ' ' + timeFromDate12(startDateTime), '', 'event-start');
            appendContent(eventLabel, 'span', '-' + timeFromDate12(endDateTime), '', 'event-end');
            seatsElement = appendContent(eventLabel, 'span', '', '', 'event-seats');
            seatsElement.innerHTML = ' (' + event.availableSeats.toString() + '&#160;seats&#160;available)';
            appendContent(eventHolder, 'br')
          }
          if(loadAttendeeInput){
            // add inputs
            var inputHolder = document.getElementById('input-holder');
            var nameHolder = appendContent(inputHolder, 'div', '', 'name-holder')
            var firstNameLabel = appendContent(nameHolder, 'label', 'First Name:', '', 'form-label');
            firstNameLabel.for = 'first-name-input';
            var firstNameInput = appendContent(firstNameLabel, 'input', '', 'first-name-input', 'name-input');
            firstNameInput.required = true;
            var lastNameLabel = appendContent(nameHolder, 'label', 'Last Name:', '', 'form-label');
            lastNameLabel.for = 'last-name-input';
            var lastNameInput = appendContent(lastNameLabel, 'input', '', 'last-name-input', 'name-input');
            lastNameInput.required = true;
            var emailLabel = appendContent(inputHolder, 'label', 'Email:', 'email-label');
            emailLabel.for = 'email-input';
            var emailInput = appendContent(emailLabel, 'input', '', 'email-input', '', 'form-label');
            emailInput.type = "email";
            emailInput.required = true;
          }
          // add confirm button
          var confirmButton = appendContent(buttonWrapper, 'button', '', 'modify-event-button', 'form-button');
          confirmButton.innerHTML = thisFlow.signUpPageCTAList[thisFlow.eventTypesList[signUpIndex]];
        } else {
          loadNoEventsFoundError(eventHolder);
        }
      } else {
        console.log("Couldn't find any events in sheet. Please inform the developer.")
        loadNoEventsFoundError(eventHolder);
      }
    } else {
      console.log("Couldn't find any future events in calendar. Please inform the developer.")
      loadNoEventsFoundError(eventHolder);
    }
  }
  eventDataXHR.send();
}
// Function to display no results
function loadNoEventsFoundError(eventHolder) {
  eventHolder.innerHTML = '';
  var errorElement = appendContent(eventHolder, 'p');
  errorElement.innerHTML = 'Could not find any upcoming events. Please contact <a href="mailto:info@meaghanwagner.com">info@meaghanwagner.com</a> for further details.'
}

// Function to add an attendee to sheets
function addAttendee(e) {
  e.preventDefault();
  var eventID = '';
  var eventSelects = document.getElementsByName('event');
  for (var i = 0, length = eventSelects.length; i < length; i++) {
    if (eventSelects[i].checked) {
      eventID = eventSelects[i].value;
      break;
    }
  }
  if (eventID != '') {
    emailAddress = document.getElementById('email-input').value;
    firstName = document.getElementById('first-name-input').value;
    lastName = document.getElementById('last-name-input').value;
    if (emailAddress == '' || firstName == '' || lastName == '') {
      alert('Please fill out the form with your info!');
    } else {
      var attendeeXHR = new XMLHttpRequest();
      attendeeXHR.open('POST', 'https://gardenlifegame.com/megs_php/addattendee.php');
      attendeeXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      attendeeXHR.onload = function() {
        var attendeeArray = {
          eventId: eventID,
          firstName: firstName,
          lastName: lastName,
          email: emailAddress
        };
        showThankYouPage(attendeeArray);
      }
      attendeeXHR.send('event_id=' + eventID + '&email_address=' + emailAddress + '&first_name=' + firstName + '&last_name=' + lastName);
    }
  } else {
    alert('Please select an event to sign up for!');
  }
}
// Function to show thank you page
function showThankYouPage(attendeeArray) {
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  var formWrapper = appendContent(blockerDiv, 'form', '', 'thank-you');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  formWrapper.addEventListener('submit', removeBlocker);
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  var legendElement = appendContent(fieldSetWrapper, 'LEGEND', 'Thank You!');
  var thankstext = eventsList[attendeeArray.eventId].thankYouText;
  if (thankstext.includes('[outlook-link]')) {
    thankstext = thankstext.replace('[outlook-link]', '<a id="outlook-link">Outlook</a>')
  }
  if (thankstext.includes('[google-cal-link]')) {
    thankstext = thankstext.replace('[google-cal-link]', '<a id="google-cal-link">Google Calendar</a>')
  }
  var thanksWrapper = appendContent(fieldSetWrapper, 'div')
  thanksWrapper.innerHTML = thankstext;
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  appendContent(buttonWrapper, 'button', 'Close', '', 'form-button');

}
// Function to format provided date as mm/dd/yyyy
function getDateForDisplay(date) {
  let year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');

  return month + '/' + day + '/' + year;
}
// function to get time from datetime for display
function timeFromDate12(date) {
  return date.toLocaleTimeString('en-US', {
    timeStyle: 'short'
  });
}

function timeFromDate24(date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
