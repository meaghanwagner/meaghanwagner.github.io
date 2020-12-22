/* Cross site */
// Function to toggle the mobile menu display
function burgerToggle() {
  var nav = document.getElementsByClassName('header-nav')[0];
  var main = document.getElementsByTagName('main')[0];
  if (nav.style.display === 'flex') {
    nav.style.display = 'none';
    main.style.marginTop = '0';
  } else {
    nav.style.display = 'flex';
    main.style.marginTop = '5.5rem';
  }
}
/* Reschedule form page */
var attendeeData = {};
function checkRescheduleUrl(){
  var rescheduleInputHolder = document.getElementById('reschedule-form-input');
  let urlParams = new URLSearchParams(location.search);
  window.attendeeData = {
    email : urlParams.get('email'),
    flowId : urlParams.get('flow')
  };
  if(attendeeData.email != null && attendeeData.flowId != null ){
    var rescheduleXHR = new XMLHttpRequest();
    rescheduleXHR.open('POST', 'https://meaghanwagner.com/php/echoRescheduleData.php');
    rescheduleXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    rescheduleXHR.onload = function() {
      // clear out event holder
      rescheduleInputHolder.innerHTML = '';
      appendContent(rescheduleInputHolder, 'p', 'Please select from the available event times below:');
      var rescheduleData = JSON.parse(rescheduleXHR.responseText);
      // extract objects from parsed data
      var calendarEvents = rescheduleData.calendarevents;
      var sheetEvents = rescheduleData.sheetevents.values;
      var flowArray = rescheduleData.sheetflows.values;
      var sheetAttendees = rescheduleData.sheetattendees.values;
      var currentEventData = rescheduleData.attendeeEvents;
      // set up current event array
      var currentEvents = [];
      var currentEventCount = Object.keys(currentEventData).length;
      // check if there are events to be rescheduled
      if(currentEventCount >0){
        for(var atndEventIndex = 0; atndEventIndex < currentEventCount; atndEventIndex++){
          currentEvents.push(currentEventData[atndEventIndex][0]);
          window.attendeeData.firstName = currentEventData[atndEventIndex][2];
          window.attendeeData.lastName = currentEventData[atndEventIndex][3];
        }
        window.attendeeData.currentEvents = currentEvents;
        // reformat flow array into object
        var flowData = buildFlowData(flowArray);
        for (const key in flowData) {
          if(key == attendeeData.flowId){
            var thisFlow = flowData[key];
            attendeeData.flow = thisFlow;
            for(var eventTypeIndex = 0; eventTypeIndex < thisFlow.eventTypesList.length; eventTypeIndex++){
              eventTypeName = thisFlow.eventTypesList[eventTypeIndex];
              appendContent(rescheduleInputHolder, 'h2', eventTypeName);
              eventTypeHolder = appendContent(rescheduleInputHolder, 'div', '','event-holder');
              // set up array to hold events added
              var eventsAdded = [];
              // check if there are events in calendar
              var eventCount = Object.keys(calendarEvents).length;
              if (eventCount > 0) {
                // get event data from sheets
                if(sheetEvents == null){
                  var sheetEventsCount = 0;
                } else {
                  var sheetEventsCount = Object.keys(sheetEvents).length;
                }
                // check if there are events in sheets
                if (sheetEventsCount > 0) {
                  // loop through events from calendar
                  for (var eventIndex = 0; eventIndex < eventCount; eventIndex++) {
                    var event = calendarEvents[eventIndex];
                    // loop through data from sheets
                    var eventFound = false;
                    // loop through sheets event data
                    for (var rowIndex = 0; rowIndex < sheetEventsCount; rowIndex++) {
                      var row = sheetEvents[rowIndex];
                      if (row[0] == event.id) {
                        // if event is in sheets data, add properties from sheet
                        eventFound = true;
                        event.maxAttendees = row[1];
                        event.cost = row[2];
                        break; // no reason to keep going, only one line per event
                      }
                    }
                    // Check if the event data was found in sheets
                    if (eventFound) {
                      if (event.summary == eventTypeName) {
                        // get attendees from sheets
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
                        if (event.maxAttendees > eventAttendees.length || currentEvents.includes(event.id)) {
                          event.availableSeats = event.maxAttendees - eventAttendees.length;
                          eventsAdded.push(event);
                          window.eventsList[event.id] = event;
                        }
                      }
                    } else {
                      // debug info for if event isn't in sheets
                      console.log("Couldn't find event data for " + event.id + ", which shouldn't happen. Please inform the developer.")
                      // no visible error message here because there may be other events found
                    }
                  }
                  // check if events available
                  if (eventsAdded.length > 0) {
                    // loop through events added
                    for (var eventAddedIndex = 0; eventAddedIndex < eventsAdded.length; eventAddedIndex++) {
                      var event = eventsAdded[eventAddedIndex];
                      // add event text to holder
                      var eventLabel = appendContent(eventTypeHolder, 'label')
                      var eventInput = appendContent(eventLabel, 'input', '', event.id);
                      eventInput.type = 'radio';
                      eventInput.name = eventTypeName;
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
                      if(currentEvents.includes(event.id)){
                        var currentEventstart = startDateTime;
                        eventInput.checked = true;
                        seatsElement.innerHTML = ' (keep current seat)';
                      }
                    }
                    // add option to cancel
                    var canceledId = '[canceled]';
                    var eventLabel = appendContent(eventTypeHolder, 'label')
                    var eventInput = appendContent(eventLabel, 'input', '', canceledId);
                    eventInput.type = 'radio';
                    eventInput.name = eventTypeName;
                    eventInput.value = canceledId;
                    eventInput.required = true;
                    eventLabel.for = canceledId;
                    // check if it's too late
                    var today = new Date();
                    var millisecondsperday = (60*60*24*1000);
                    var daysUntilEvent = (currentEventstart - today)/millisecondsperday;
                    if(daysUntilEvent > 1){
                      appendContent(eventLabel, 'span', 'Cancel reservation.');
                    } else {
                      appendContent(eventLabel, 'span', 'Cannot cancel reservation.');
                      eventInput.disabled = true;
                    }
                  } else {
                    couldntLoadData(rescheduleInputHolder);
                  }
                } else {
                  // debug info for if sheets events is empty
                  console.log("Couldn't find any events in sheet. Please inform the developer.")
                  couldntLoadData(rescheduleInputHolder);
                }
              } else {
                // debug info for if calendar events is empty
                console.log("Couldn't find any future events in calendar. Please inform the developer.")
                couldntLoadData(rescheduleInputHolder);
              }
            }
          }
        }
        // add confirm button
        var buttonWrapper = appendContent(rescheduleInputHolder, 'div', '', 'button-wrapper');
        var submitButton = appendContent(buttonWrapper, 'button', 'Submit', 'submit-button', 'form-button');
      } else {
        couldntLoadData(rescheduleInputHolder);
      }
    }
    rescheduleXHR.send(JSON.stringify(attendeeData));
  } else {
    couldntLoadData(rescheduleInputHolder);
  }
}
// function to handle no rescheduling data
function couldntLoadData(rescheduleInputHolder){
  rescheduleInputHolder.innerHTML = '<p>Could not load event data. ' +
  'Please email <a href="mailto:info@meaghanwagner.com">info@meaghanwagner.com</a> ' +
  'or use the <a href="../contact">Contact Form</a> to reschedule or cancel your reservation.</p>';
}
// function to submit rescheduling data
function submitRescheduledData(){
  try {
    attendeeData.events = {};
    var thisFlow = attendeeData.flow;
    attendeeData.newEvents = [];
    var submitButton = document.getElementById('submit-button');
    submitButton.innerHTML = 'Submitting...';
    var sendCancellation = false;
    var sendConfirmation = false;
    for(var eventTypeIndex = 0; eventTypeIndex < thisFlow.eventTypesList.length; eventTypeIndex++){
      eventTypeName = thisFlow.eventTypesList[eventTypeIndex];
      eventTypeInputs = document.getElementsByName(eventTypeName)
      for(var inputIndex = 0; inputIndex < eventTypeInputs.length; inputIndex++){
        var thisInput = eventTypeInputs[inputIndex];
        thisInput.disabled = true;
        if(thisInput.checked){
          attendeeData.newEvents.push(thisInput.id);
          if(thisInput.id == "[canceled]"){
            sendCancellation = true;
          } else if (!attendeeData.currentEvents.includes(thisInput.id)) {
            sendConfirmation = true;
            attendeeData.events[thisInput.id] = eventsList[thisInput.id];
          } else {
            attendeeData.events[thisInput.id] = eventsList[thisInput.id];
          }
        }
      }
    }
    var updateEventsXHR = new XMLHttpRequest();
    updateEventsXHR.open('POST', 'https://meaghanwagner.com/php/updateevents.php');
    updateEventsXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    updateEventsXHR.onload = function() {
      var rescheduleInputHolder = document.getElementById('reschedule-form-input');
      rescheduleInputHolder.innerHTML = '<p>Your events have been updated. ' +
      'Please email <a href="mailto:info@meaghanwagner.com">info@meaghanwagner.com</a> ' +
      'or use the <a href="../contact">Contact Form</a> if you have any questions or concerns.</p>';
      if(sendCancellation){
        // send cancellation email
        var cancellationXHR = new XMLHttpRequest();
        cancellationXHR.open('POST', 'https://meaghanwagner.com/php/sendcancellationemail.php');
        cancellationXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        cancellationXHR.onload = function() {
          if(cancellationXHR.responseText != 'cancellation email sent'){
            console.log(cancellationXHR.responseText);
          }
        }
        cancellationXHR.send(JSON.stringify(attendeeData));
      }
      if(sendConfirmation){
        // send confirmation email
        var confirmationXHR = new XMLHttpRequest();
        confirmationXHR.open('POST', 'https://meaghanwagner.com/php/sendconfirmationemail.php');
        confirmationXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        confirmationXHR.onload = function() {
          if(confirmationXHR.responseText != 'confirmation email sent'){
            console.log(confirmationXHR.responseText);
          }
        }
        confirmationXHR.send(JSON.stringify(attendeeData));
      }
    }
    updateEventsXHR.send(JSON.stringify(attendeeData));
  } catch(err) {
    console.log(err.message);
  }
}
/* Contact form page */
// function to send contact form
function submitContact(){
  // Get input elements
  var nameInput = document.getElementsByName("name")[0];
  var emailInput = document.getElementsByName("email")[0];
  var messageInput = document.getElementsByName("message")[0];
  // build obj to send to php
  contactData = {
    name: nameInput.value,
    email: emailInput.value,
    message: messageInput.value
  }
  // disable input
  nameInput.disabled = true;
  emailInput.disabled = true;
  messageInput.disabled = true;
  // Update text to sending
  var contactTextElement = document.getElementById('contact-text');
  contactTextElement.innerHTML = 'Sending message...'
  // send data to php
  var contactXHR = new XMLHttpRequest();
  contactXHR.open('POST', 'https://meaghanwagner.com/php/sendcontactemail.php');
  contactXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  contactXHR.onload = function() {
    // check if it succeeded
    if(contactXHR.responseText == "contact email sent"){
      contactTextElement.innerHTML = 'Message sent! Please allow one business day for a response. Thanks for reaching out!';
      document.getElementById('contact-form-input').style.display = 'none';
    } else {
      contactTextElement.innerHTML = "There was an error sending the message: " + contactXHR.responseText
    }
  }
  contactXHR.send(JSON.stringify(contactData));
  return false;
}
/* Work with Me Page */
// Calendly integration
function showCalendly(calendarType){
  var calendarURL = 'https://calendly.com/meaghan-wagner/consultation';
  if(calendarType == "team"){
    calendarURL = 'https://calendly.com/meaghan-wagner/30min'
  }
  // add blocker div
  var blockerDiv = addBlocker();
  // add form
  var calendlyHolder = addFormToBlocker('calendly-holder', 'blocker-form');
  // init calendly
  Calendly.initInlineWidget({
   url: calendarURL,
   parentElement: calendlyHolder,
   prefill: {},
   utm: {}
  });
  return false;
}
// function to show accountability form
function showAccountabilityForm(){
  // add blocker div
  var blockerDiv = addBlocker();
  // add form
  var accountabilityForm = addFormToBlocker('accountability-form', 'blocker-form');
  accountabilityForm.addEventListener('submit', submitAccountabilityForm);
  // add instructions text
  var fieldSetWrapper = appendContent(accountabilityForm, 'FIELDSET');
  appendContent(fieldSetWrapper, 'p', 'Please fill out the form below:');
  // add input fields
  var nameLabel = appendContent(fieldSetWrapper, 'label', 'Full Name', '','full-label-flex');
  var nameInput = appendContent(nameLabel, 'input', '', 'name-input');
  nameInput.type = 'text';
  nameInput.required = true;
  var emailLabel = appendContent(fieldSetWrapper, 'label', 'Email', '','full-label-flex');
  var emailInput = appendContent(emailLabel, 'input', '', 'email-input');
  emailInput.type = 'email';
  emailInput.required = true;
  appendContent(fieldSetWrapper, 'br');
  var resolutionsLabel = appendContent(fieldSetWrapper, 'label', 'How do you generally feel about New Year’s Resolutions?', '','full-label');
  appendContent(resolutionsLabel, 'br');
  var resolutionsInput = appendContent(resolutionsLabel, 'input', '', 'resolutions');
  resolutionsInput.required = true;
  appendContent(resolutionsLabel, 'br');
  // add holder for time slots
  var timeslotsHolder = appendContent(fieldSetWrapper, 'div', '', 'time-slot-holder')
  appendContent(timeslotsHolder, 'br');
  appendContent(timeslotsHolder, 'span','Choose up to 3 time slots for a bi-weekly 1 hour session from the options below:');
  appendContent(timeslotsHolder, 'br');
  var timeslots = ['Monday 11:00 AM','Monday 12:00 PM','Monday 2:00 PM','Friday 3:00 PM','Friday 4:00 PM','None of these work for me'];
  // loop through time slot options
  for(var timeslotIndex = 0; timeslotIndex < timeslots.length; timeslotIndex++){
    // add time slot input fields
    var timeslotText = timeslots[timeslotIndex];
    var timeslotLabel = appendContent(timeslotsHolder, 'label');
    var timeslotInput = appendContent(timeslotLabel, 'input');
    timeslotInput.name = 'timeslot';
    timeslotInput.type = 'checkbox';
    appendContent(timeslotLabel, 'span', timeslotText);
    appendContent(timeslotLabel, 'br');
    // special options for none of these
    if(timeslotText == 'None of these work for me'){
      timeslotInput.id = 'nopebox'
      timeslotInput.addEventListener('change', toggleNoneOfThese);
    } else {
      timeslotInput.addEventListener('change', validateTimeSlots);
    }
  }
  // add hidden input if none of these is selected
  var noneOfTheseLabel = appendContent(timeslotsHolder, 'label', 'Please suggest at least 3 preferred times:', 'none-of-these-label');
  appendContent(noneOfTheseLabel, 'br');
  var noneOfTheseInput = appendContent(noneOfTheseLabel, 'input', '', 'none-of-these-input');
  noneOfTheseInput.type = 'text';
  noneOfTheseLabel.style.display = 'none';
  appendContent(fieldSetWrapper, 'br');
  // add notes
  var notesLabel = appendContent(fieldSetWrapper, 'label', 'Please provide any additional notes or restrictions about your availability:', '','full-label');
  appendContent(notesLabel, 'br');
  var notesInput = appendContent(notesLabel, 'textarea', '', 'notes');
  appendContent(notesLabel, 'br');
  // add submit button
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  var submitButton = appendContent(buttonWrapper, 'button', 'Submit', 'submit-info', 'form-button');
}
// Function to display the none of these input
function toggleNoneOfThese(){
  // get none of these input
  var noneOfTheseLabel = document.getElementById('none-of-these-label');
  var noneOfTheseInput = document.getElementById('none-of-these-input');
  var timeslotsDisabled = false;
  // toggle hidden field display based on current display
  if(noneOfTheseLabel.style.display == 'none'){
    noneOfTheseLabel.style.display = 'inline';
    noneOfTheseInput.required = true;
    timeslotsDisabled = true;
  } else {
    noneOfTheseLabel.style.display = 'none';
    noneOfTheseInput.required = false;
  }
  // loop through remaining time slot options and en/disable them
  var timeslotInputs = document.getElementsByName('timeslot');
  for(var tsinputIndex = 0; tsinputIndex < timeslotInputs.length; tsinputIndex++){
    timeslotInput = timeslotInputs[tsinputIndex];
    if(timeslotInput.id != 'nopebox'){
      timeslotInput.checked = false; // uncheck the rest
      timeslotInput.disabled = timeslotsDisabled;
    }
  }
}
// Function to disable timeslots if 3 selected
function validateTimeSlots(){
  // count the time slots checked
  var checkedBoxes = 0;
  var timeslotInputs = document.getElementsByName('timeslot');
  for(var tsinputIndex = 0; tsinputIndex < timeslotInputs.length; tsinputIndex++){
    timeslotInput = timeslotInputs[tsinputIndex];
    if(timeslotInput.id != 'nopebox' && timeslotInput.checked){
      checkedBoxes++;
    }
  }
  // disable time slots if 3 are selected
  if(checkedBoxes < 3){
    for(var tsinputIndex = 0; tsinputIndex < timeslotInputs.length; tsinputIndex++){
      timeslotInput = timeslotInputs[tsinputIndex];
      timeslotInput.disabled = false;
    }
  } else {
    for(var tsinputIndex = 0; tsinputIndex < timeslotInputs.length; tsinputIndex++){
      timeslotInput = timeslotInputs[tsinputIndex];
      if(timeslotInput.id != 'nopebox' && !timeslotInput.checked){
        timeslotInput.disabled = true;
      }
    }
  }
}
// Function to submit the accountability form to sheets
function submitAccountabilityForm(e){
  e.preventDefault(); // prevent page from refreshing
  // disable submit button and update text
  var submitButton = document.getElementById('submit-info');
  submitButton.disabled = true;
  submitButton.innerHTML = "Submitting";
  // build timeslots array from checked timeslots
  var timeSlotsArray = [];
  var timeslotInputs = document.getElementsByName('timeslot');
  for(var tsinputIndex = 0; tsinputIndex < timeslotInputs.length; tsinputIndex++){
    timeslotInput = timeslotInputs[tsinputIndex];
    if(timeslotInput.checked){
      timeSlotsArray.push(timeslotInput.nextSibling.innerHTML);
    }
  }
  // check that at least 1 timeslot is checked
  if(timeSlotsArray.length == 0){
    // alert if no time slot checked
    alert("Please select at least one time slot.");
  } else {
    // check if nopebox is checked
    var nopebox = document.getElementById('nopebox');
    var timeSlotsString = "";
    if(nopebox.checked){
      // use the none of these input if checked
      timeSlotsString = document.getElementById('none-of-these-input').value;
    } else {
      // use the time slot array if not
      timeSlotsString = JSON.stringify(timeSlotsArray);
    }
    // build php object
    accountabilityData = {
      fullName : document.getElementById('name-input').value,
      email : document.getElementById('email-input').value,
      resolutions : document.getElementById('resolutions').value,
      timeSlots : timeSlotsString,
      notes : document.getElementById('notes').value
    }
    // send data to php
    var accountabilityXHR = new XMLHttpRequest();
    accountabilityXHR.open('POST', 'https://meaghanwagner.com/php/accountabilityapplication.php');
    accountabilityXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    accountabilityXHR.onload = function() {
      // update form with thanks info
      blockerDiv = document.getElementById('blocker');
      blockerDiv.innerHTML = "";
      var accountabilityForm = addFormToBlocker('accountability-form', 'blocker-form');
      var fieldSetWrapper = appendContent(accountabilityForm, 'FIELDSET');
      appendContent(fieldSetWrapper, 'p', 'Thanks for submitting your application! Please allow one business day for a response.');
    }
    accountabilityXHR.send(JSON.stringify(accountabilityData));
  }
}
/* Main page */
function checkHash(){
  removeBlocker();
  var hash = window.location.hash.substr(1);
  if (hash != ''){
    if(hash in flowData){
      loadSignUp(hash);
    }
  }
}
// empty object to hold flow data
var flowData = {};
// function to load flow data from sheets
function loadFlows(){
  // Add listener for changes in #
  window.addEventListener('hashchange', checkHash);
  // pull flow data from sheets via php
  var flowDataXHR = new XMLHttpRequest();
  flowDataXHR.open('GET', 'https://meaghanwagner.com/php/echoFlowData.php');
  flowDataXHR.onload = function() {
    // parse data returned
    var responseObj = JSON.parse(flowDataXHR.responseText);
    // extract flow data
    var flowArray = responseObj.sheetflows.values;
    // reformat data into object
    flowData = buildFlowData(flowArray);
    // get holder for flows
    flowsBox = document.getElementById('flow-box');
    // loop through flows
    for (const key in flowData) {
      var thisFlow = flowData[key];
      // check if the flow should be displayed
      if(thisFlow.displayOnSite == 'TRUE'){
        // append flow to flow box
        var flowContainer = appendContent(flowsBox, 'div', '', '', 'tool');
        // update style if important
        if(thisFlow.important == 'TRUE'){
          flowContainer.classList.add('important');
          flowContainer.classList.add('shiny');
        }
        // add link to flow
        var flowLink = appendContent(flowContainer, 'a');
        flowLink.setAttribute('onclick', "loadSignUp('" + key + "')");
        // add title
        var flowTitle = appendContent(flowLink, 'h3', thisFlow.flowName, '', 'tool-header');
        // add description
        var flowDescription = appendContent(flowLink, 'div', '', '', 'tool-description');
        flowDescription.innerHTML = thisFlow.flowDescription;
      }
    }
    // check if the # in the url has a flow in it
    checkHash();
  }
  flowDataXHR.send();
}
// Function to build out flow and event objects
function buildFlowData(flowArray){
  // set up flow holder object
  var flowData = {};
  var flowCount = Object.keys(flowArray).length;
  // loop through flow array
  for (var flowIndex = 0; flowIndex < flowCount; flowIndex++) {
    // build flow object
    var thisFlow = flowArray[flowIndex];
    // create id from name
    var flowId = thisFlow[0].toLowerCase().replace(/\W/g, '-');
    var thisFlowObj = {
      "flowName" : thisFlow[0],
      "eventTypesList" : JSON.parse(thisFlow[1]),
      "flowDescription" : thisFlow[2],
      "important" : thisFlow[3],
      "displayOnSite" : thisFlow[4],
      "signUpPageCopyList" : JSON.parse(thisFlow[5]),
      "signUpPageCTAList" : JSON.parse(thisFlow[6]),
      "paymentPageCopy" : thisFlow[7],
      "thankYouPageCopy" : thisFlow[8],
      "cancellationEmailCopy" : thisFlow[9],
      "confirmationEmailCopy" : thisFlow[10],
      "flowId" : flowId
    }
    flowData[flowId] = thisFlowObj;
  }
  // save flow holder object to window to access later
  window.flowData = flowData;
  return flowData;
}
// function to reload the signup page if it has multiple event types
function reloadSignUp(flowId, signUpIndex){
  addEventToSignupData();
  removeBlocker();
  loadSignUp(flowId, signUpIndex);
}
// empty object for storing signup data
var signupData = {};
// Function to add event to signupData
function addEventToSignupData(){
  var eventID = '';
  var eventSelects = document.getElementsByName('event');
  for (var i = 0, length = eventSelects.length; i < length; i++) {
    if (eventSelects[i].checked) {
      eventID = eventSelects[i].value;
      break;
    }
  }
  if (eventID != '') {
    signupData.events[eventID] = eventsList[eventID];
  }
}
// empty object to hold events
var eventData = {};
var eventsList = {};
// Function to sign up for a flow
function loadSignUp(flowId, signUpIndex=0) {
  // get flow by id
  var thisFlow = flowData[flowId];
  // set up signupData if index is 0
  if(signUpIndex == 0){
    signupData = {
      events : {},
      firstName : '',
      lastName : '',
      email : '',
      totalCost : 0,
      eventIndex : 0,
      flow : thisFlow
    }
  }
  // add blocker div
  var blockerDiv = addBlocker();
  // add signup form
  var formWrapper = addFormToBlocker('sign-up-form', 'blocker-form');
  // Check if signup is at the end of the event type list
  var lastSignupPage = false;
  if(signUpIndex == (thisFlow.eventTypesList.length -1)){
    // check if payment page copy is N/A
    if(thisFlow.paymentPageCopy.includes("N/A")){
      formWrapper.addEventListener('submit', loadFreeSignup);
    } else {
      formWrapper.addEventListener('submit', loadPayment);
    }
    lastSignupPage = true;
  } else {
    // if not last event type list load next event type
    formWrapper.setAttribute('onsubmit', "reloadSignUp('" + flowId + "', " + (signUpIndex + 1) + "); return false;");
  }
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // get signup copy from flow
  var theSignUpCopy = thisFlow.signUpPageCopyList[thisFlow.eventTypesList[signUpIndex]];
  // replace event list placeholder
  if(theSignUpCopy.includes('[event-list]')){
    theSignUpCopy = theSignUpCopy.replace('[event-list]', '<div id="event-holder"><p>Loading Upcoming Events...</p></div>')
  } else {
    // add it if it doesn't exist (shouldn't happen)
    theSignUpCopy += '<div id="event-holder"><p>Loading Upcoming Events...</p></div>';
  }
  // replace attendee input holder
  if(theSignUpCopy.includes('[attendee-input]')){
    theSignUpCopy = theSignUpCopy.replace('[attendee-input]', '<div id="input-holder"></div>')
  }
  // add copy to page
  fieldSetWrapper.innerHTML = theSignUpCopy;
  // add cancel button
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  // check if the event data has already been pulled
  if(isEmpty(eventData)){
    // get event data from php
    var eventDataXHR = new XMLHttpRequest();
    eventDataXHR.open('GET', 'https://meaghanwagner.com/php/echoEventData.php');
    eventDataXHR.onload = function() {
      var eventData = JSON.parse(eventDataXHR.responseText);
      window.eventData = eventData;
      loadSignupPage(signUpIndex);
    }
    eventDataXHR.send();
  } else {
    // don't pull data if it already exists
    loadSignupPage(signUpIndex);
  }
}
// function to populate signup page with event data
function loadSignupPage(signUpIndex){
  // get event holder created in previous function
  var eventHolder = document.getElementById('event-holder');
  // set up array to hold events added
  var eventsAdded = [];
  // pull flow info from signupData
  var thisFlow = signupData.flow;
  // pull calendar event info from eventData
  var calendarEvents = eventData.calendarevents;
  // check if there are events in calendar
  var eventCount = Object.keys(calendarEvents).length;
  if (eventCount > 0) {
    // get event data from sheets
    var sheetEvents = eventData.sheetevents.values;
    if(sheetEvents == null){
      var sheetEventsCount = 0;
    } else {
      var sheetEventsCount = Object.keys(sheetEvents).length;
    }
    // check if there are events in sheets
    if (sheetEventsCount > 0) {
      // loop through events from calendar
      for (var eventIndex = 0; eventIndex < eventCount; eventIndex++) {
        var event = calendarEvents[eventIndex];
        // loop through data from sheets
        var eventFound = false;
        // loop through sheets event data
        for (var rowIndex = 0; rowIndex < sheetEventsCount; rowIndex++) {
          var row = sheetEvents[rowIndex];
          if (row[0] == event.id) {
            // if event is in sheets data, add properties from sheet
            eventFound = true;
            event.maxAttendees = row[1];
            event.cost = row[2];
            break; // no reason to keep going, only one line per event
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
              window.eventsList[event.id] = event;
            }
          }
        } else {
          // debug info for if event isn't in sheets
          console.log("Couldn't find event data for " + event.id + ", which shouldn't happen. Please inform the developer.")
          // no visible error message here because there may be other events found
        }
      }
      // check if events available
      if (eventsAdded.length > 0) {
        // clear out event holder
        eventHolder.innerHTML = '';
        // loop through events added
        for (var eventAddedIndex = 0; eventAddedIndex < eventsAdded.length; eventAddedIndex++) {
          var event = eventsAdded[eventAddedIndex];
          // add event text to holder
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
        }
        replaceInputHolder();
        // add confirm button
        var buttonWrapper = document.getElementById('button-wrapper');
        var confirmButton = appendContent(buttonWrapper, 'button', '', 'confirm-button', 'form-button');
        confirmButton.innerHTML = thisFlow.signUpPageCTAList[thisFlow.eventTypesList[signUpIndex]];
      } else {
        loadNoEventsFoundError(eventHolder); // load visible error message
      }
    } else {
      // debug info for if sheets events is empty
      console.log("Couldn't find any events in sheet. Please inform the developer.")
      loadNoEventsFoundError(eventHolder); // load visible error message
    }
  } else {
    // debug info for if calendar events is empty
    console.log("Couldn't find any future events in calendar. Please inform the developer.")
    loadNoEventsFoundError(eventHolder); // load visible error message
  }
}
// function to replace input holder with attendee input fields
function replaceInputHolder(){
  var inputHolder = document.getElementById('input-holder');
  if(inputHolder != null){
    // add inputs
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
}
// function to replace cost holder with cost breakdown
function replaceCostHolder(){
  var costHolder = document.getElementById('cost-holder');
  if(costHolder != null){
    // add cost data
    var totalCost = 0;
    for (const eventID in signupData.events) {
      event = signupData.events[eventID];
      totalCost += parseInt(event.cost);
      var costText = event.summary + ": $" + event.cost;
      var eventCostHolder = appendContent(costHolder, 'p', costText,);
    }
    signupData.totalCost = totalCost;
    var totalCostText = "<strong>Total: $" + totalCost.toString() + "</strong>";
    var totalCostHolder = appendContent(costHolder, 'p');
    totalCostHolder.innerHTML = totalCostText;
  }
}
// function to replace payment holder with payment iframe
function replacePaymentHolder(){
  var paymentHolder = document.getElementById('payment-holder');
  if(paymentHolder != null){
    var paymentFrame = appendContent(paymentHolder, 'iframe', '', 'payment-frame');
    var paymentSource = ('https://meaghanwagner.com/pay-form/');
    paymentFrame.src = paymentSource;
    // send cost to iframe
    paymentFrame.addEventListener("load", () => {
      var amountData = {
        amount : signupData.totalCost
      }
      paymentFrame.contentWindow.postMessage(amountData, paymentSource);
    });
    // add listener for when payment completed
    window.addEventListener("message", event => {
      if(event.data.title == 'Payment Successful'){
        signupData.paymentInfo = event.data.result.payment;
        var paymentHolder = document.getElementById('payment-holder');
        paymentHolder.innerHTML = "<h2>Thank you for your payment!</h2>";
        appendContent(paymentHolder, 'br');
        var buttonWrapper = appendContent(paymentHolder, 'div', '', 'button-wrapper');
        var submitButton = appendContent(buttonWrapper, 'button', 'Submit', 'submit-info', 'form-button');
        submitButton.click();
      }
    });
  }
}
// function to replace calendar links in thank you page
function replaceCalendarLinks(){
  var calendarHolder = document.getElementById('calendar-links');
  if(calendarHolder != null){
    for (const eventID in signupData.events) {
      event = signupData.events[eventID];
      var eventLine = appendContent(calendarHolder, 'p')
      eventLine.innerHTML = '<strong>' + event.summary + '</strong>: ';
      // Outlook
      var eventDate = {
        start: event.start.dateTime,
        end: event.end.dateTime
      },
      summary = event.summary,
      description = event.description;
      eventLocation = event.location;
      var outlookAtag = appendContent(eventLine, 'a', 'Outlook');
      outlookAtag.href = makeIcsFile(eventDate, summary, description, eventLocation);
      var icsName = event.summary + ".ics";
      outlookAtag.setAttribute('download', icsName);
      appendContent(eventLine, 'span', ' ', '', 'calendar-space');
      // Google Calendar
      var startDateTime = convertDate(event.start.dateTime);
      var endDateTime = convertDate(event.end.dateTime);
      var googleCalLink = 'https://calendar.google.com/calendar/r/eventedit?text=' +
        encodeURIComponent(event.summary) +
        '&dates=' + startDateTime + '/' + endDateTime +
        '&details=' + encodeURIComponent(event.description) +
        '&location=' + event.location
      var googleAtag = appendContent(eventLine, 'a', 'Google Calendar');
      googleAtag.href = googleCalLink;
      googleAtag.target = '_blank';
    }
  }
}
// function to create ics file for outlook
function makeIcsFile(date, summary, description, eventLocation) {
  var test =
    "BEGIN:VCALENDAR\n" +
    "CALSCALE:GREGORIAN\n" +
    "METHOD:PUBLISH\n" +
    "PRODID:-//Test Cal//EN\n" +
    "VERSION:2.0\n" +
    "BEGIN:VEVENT\n" +
    "UID:test-1\n" +
    "DTSTART;VALUE=DATE:" +
    convertDate(date.start) +
    "\n" +
    "DTEND;VALUE=DATE:" +
    convertDate(date.end) +
    "\n" +
    "SUMMARY:" +
    summary +
    "\n" +
    "DESCRIPTION:" +
    description +
    "\n" +
    "LOCATION:" +
    eventLocation +
    "\n" +
    "END:VEVENT\n" +
    "END:VCALENDAR";

  var data = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(test);

  return data;
}
// function to convert date for ics file
function convertDate(date) {
  var newDate = new Date(date).toISOString();
  newDate = newDate.split("-");
  newDate = newDate.join("");
  newDate = newDate.split(":");
  newDate = newDate.join("");
  return newDate;
}
// Function to display no results for event type
function loadNoEventsFoundError(eventHolder) {
  eventHolder.innerHTML = '';
  var errorElement = appendContent(eventHolder, 'p');
  errorElement.innerHTML = 'Could not find any upcoming events. Please contact <a href="mailto:info@meaghanwagner.com">info@meaghanwagner.com</a> for further details.'
}
// bool to see if payment has already been submitted
var paymentSubmitted = false;
// Function to load payment page
function loadPayment(e){
  e.preventDefault();
  window.paymentSubmitted = false;
  addEventToSignupData();
  // blank out blocker
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  // add payment form
  var formWrapper = addFormToBlocker('payment-form', 'blocker-form');
  formWrapper.addEventListener('submit', paymentFormSubmitted);
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  var paymentPageCopy = signupData.flow.paymentPageCopy;
  // replace attendee input placeholder with div
  if(paymentPageCopy.includes('[attendee-input]')){
    paymentPageCopy = paymentPageCopy.replace('<p>[attendee-input]</p>', '<div id="input-holder"></div>')
  }
  // replace cost-list placeholder with div
  if(paymentPageCopy.includes('[cost-list]')){
    paymentPageCopy = paymentPageCopy.replace('<p>[cost-list]</p>', '<div id="cost-holder"></div>')
  }
  // replace payment input placeholder with div
  if(paymentPageCopy.includes('[payment-input]')){
    paymentPageCopy = paymentPageCopy.replace('<p>[payment-input]</p>', '<div id="payment-holder"></div>')
  }
  // update html displayed
  fieldSetWrapper.innerHTML = paymentPageCopy;
  // populate holders with info
  replaceInputHolder();
  replaceCostHolder();
  replacePaymentHolder();
}
// function to submit payment info if not already submitted
function paymentFormSubmitted(e){
  e.preventDefault();
  if(!paymentSubmitted){
    var submitButton = document.getElementById('submit-info');
    submitButton.disabled = true;
    submitButton.innerHTML = 'Submitting info';
    addAttendee();
    window.paymentSubmitted = true;
  }
}
// function to load flow without payment
function loadFreeSignup(e){
  e.preventDefault();
  addEventToSignupData();
  signupData.paymentInfo = {
    receiptUrl: 'N/A'
  }
  addAttendee();
}
// Function to add an attendee to sheets
function addAttendee() {
  // populate signupData from attendee input fields
  if(signupData.eventIndex == 0){
    signupData.email = document.getElementById('email-input').value;
    signupData.firstName = document.getElementById('first-name-input').value;
    signupData.lastName = document.getElementById('last-name-input').value;
  }
  // send data to php
  var attendeeXHR = new XMLHttpRequest();
  attendeeXHR.open('POST', 'https://meaghanwagner.com/php/addattendee.php');
  attendeeXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  attendeeXHR.onload = function() {
    // check if last event
    var eventCount = Object.keys(signupData.events).length;
    if(signupData.eventIndex == eventCount - 1){
      // show thank you page if last event
      showThankYouPage();
    } else {
      // add next event if not
      signupData.eventIndex += 1;
      addAttendee();
    }
  }
  attendeeXHR.send('event_id=' + Object.keys(signupData.events)[signupData.eventIndex] + '&email_address=' + signupData.email + '&first_name=' + signupData.firstName + '&last_name=' + signupData.lastName + '&flow_type=' + signupData.flow.flowId + '&payment_receipt=' + signupData.paymentInfo.receiptUrl);
}
// Function to show thank you page
function showThankYouPage() {
  // clear out blocker div
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  // add thank you form
  var formWrapper = addFormToBlocker('thank-you-form', 'blocker-form');
  formWrapper.addEventListener('submit', removeBlocker);
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  // add thankyou copy from flow
  var thankstext = signupData.flow.thankYouPageCopy;
  // replace calendar links placeholder with div
  if (thankstext.includes('[add-to-calendar-links]')) {
    thankstext = thankstext.replace('<p>[add-to-calendar-links]</p>', '<div id="calendar-links"></div>')
  }
  var thanksWrapper = appendContent(fieldSetWrapper, 'div')
  thanksWrapper.innerHTML = thankstext;
  replaceCalendarLinks(); // populate calendar links
  // send confirmation email
  var confirmationXHR = new XMLHttpRequest();
  confirmationXHR.open('POST', 'https://meaghanwagner.com/php/sendconfirmationemail.php');
  confirmationXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  confirmationXHR.onload = function() {
    if(confirmationXHR.responseText != 'confirmation email sent'){
      console.log(confirmationXHR.responseText);
    }
  }
  confirmationXHR.send(JSON.stringify(signupData));
}
/* Reusable functions */
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
// Function to add blockerDiv
function addBlocker(){
  // add blocker
  var bodyElement = document.getElementsByTagName("body")[0];
  var blockerDiv = appendContent(bodyElement, 'div', '', 'blocker');
  bodyElement.style.overflow = "hidden";
  return blockerDiv;
}
// Function to add form to blocker
function addFormToBlocker(formID, formClass){
  var blockerDiv = document.getElementById('blocker');
  var formWrapper = appendContent(blockerDiv, 'form', '', formID, formClass);
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  return formWrapper;
}
// Function to remove blocker div
function removeBlocker() {
  var blockerDiv = document.getElementById('blocker');
  if (blockerDiv != null) {
    blockerDiv.remove();
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
// function to check if object is empty
function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return JSON.stringify(obj) === JSON.stringify({});
}

/* Quotes carousel */
var slideIndex = 1;
function displayCarousel(){
  showSlides(slideIndex);
  var quotesXHR = new XMLHttpRequest();
  quotesXHR.open('POST', 'https://meaghanwagner.com/php/echoQuoteData.php');
  quotesXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  quotesXHR.onload = function() {
    var quotesData = JSON.parse(quotesXHR.responseText).values;
    var quotesCount = Object.keys(quotesData).length;
    // check if there are quotes to populate the carousel
    if(quotesCount > 0){
      slideHolder = document.getElementById('slide-holder');
      slideHolder.innerHTML = '';
      dotContainer = document.getElementsByClassName('dot-container')[0];
      dotContainer.innerHTML = '';

      for(var quoteIndex = 0; quoteIndex < quotesCount; quoteIndex++){
        var row = quotesData[quoteIndex];
        var quoteHolder = appendContent(slideHolder, 'div', '', '', 'mySlides');
        var quoteBody = appendContent(quoteHolder, 'p', row[0], '', 'quote');
        var quoteBy = appendContent(quoteHolder, 'p', row[1], '', 'quote-by');
        // add dot
        var dotIndex = quoteIndex + 1;
        var thisDot = appendContent(dotContainer, 'span', '', '', 'dot');
        thisDot.setAttribute('onclick', ('currentSlide(' + dotIndex + ')'));
      }
      showSlides(slideIndex);
    } else {
      // nothing to show
      console.log("No quotes to display from sheets. Leaving defaults.")
    }
  }
  quotesXHR.send(JSON.stringify(attendeeData));
}

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
}
