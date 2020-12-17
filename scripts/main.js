window.addEventListener('hashchange', checkHash);
// Function to toggle the burger menu
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
// function to send contact form
function submitContact(){
  var nameInput = document.getElementsByName("name")[0];
  var emailInput = document.getElementsByName("email")[0];
  var messageInput = document.getElementsByName("message")[0];
  contactData = {
    name: nameInput.value,
    email: emailInput.value,
    message: messageInput.value
  }
  nameInput.disabled = true;
  emailInput.disabled = true;
  messageInput.disabled = true;
  var contactTextElement = document.getElementById('contact-text');
  contactTextElement.innerHTML = 'Sending message...'
  // send confirmation email
  var contactXHR = new XMLHttpRequest();
  contactXHR.open('POST', 'https://meaghanwagner.com/php/sendcontactemail.php');
  contactXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  contactXHR.onload = function() {
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
// Calendly integration
function showCalendly(){
  // add blocker
  var bodyElement = document.getElementsByTagName("body")[0];
  var blockerDiv = appendContent(bodyElement, 'div', '', 'blocker');
  bodyElement.style.overflow = "hidden";
  // add form
  var calendlyHolder = appendContent(blockerDiv, 'form', '', 'calendly-holder', 'flow-form');
  var xButton = appendContent(calendlyHolder, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  Calendly.initInlineWidget({
   url: 'https://calendly.com/meaghan-wagner/consultation',
   parentElement: calendlyHolder,
   prefill: {},
   utm: {}
  });
  return false;
}
// empty object to hold flow data
var flowData = {};
var eventTypeData = {};
// function to load flow data from sheets
function loadFlows(){
  var flowDataXHR = new XMLHttpRequest();
  flowDataXHR.open('GET', 'https://meaghanwagner.com/php/echoFlowData.php');
  flowDataXHR.onload = function() {
    var responseObj = JSON.parse(flowDataXHR.responseText);
    var flowArray = responseObj.sheetflows.values;
    var eventTypesArray = responseObj.sheeteventtypes.values;
    flowData = buildFlowData(flowArray, eventTypesArray);
    flowsBox = document.getElementById('flow-box');
    for (const key in flowData) {
      var thisFlow = flowData[key];
      if(thisFlow.displayOnSite == 'TRUE'){
        var flowContainer = appendContent(flowsBox, 'div', '', '', 'tool');
        if(thisFlow.important == 'TRUE'){
          flowContainer.classList.add('important');
          flowContainer.classList.add('shiny');
        }
        var flowLink = appendContent(flowContainer, 'a');
        flowLink.setAttribute('onclick', "loadSignUp('" + key + "')");
        var flowTitle = appendContent(flowLink, 'h3', thisFlow.flowName, '', 'tool-header');
        var flowDescription = appendContent(flowLink, 'div', '', '', 'tool-description');
        flowDescription.innerHTML = thisFlow.flowDescription;
      }
    }
    checkHash();
  }
  flowDataXHR.send();
}

function checkHash(){
  removeBlocker();
  var hash = window.location.hash.substr(1);
  if (hash != ''){
    if(hash in flowData){
      loadSignUp(hash);
    }
  }
}
function buildFlowData(flowArray, eventTypesArray){
  var eventTypeData = {};
  var eventTypeCount = Object.keys(eventTypesArray).length;
  for (var eventTypeIndex = 0; eventTypeIndex < eventTypeCount; eventTypeIndex++) {
    var thisEventType = eventTypesArray[eventTypeIndex];
    var thisEventTypeObj = {
      "runTime" : thisEventType[1],
      "description" : thisEventType[2],
      "maxAttendees" : thisEventType[3],
      "zoomLink" : thisEventType[4],
      "cost" : thisEventType[5]
    }
    eventTypeData[thisEventType[0]] = thisEventTypeObj;
  }
  window.eventTypeData = eventTypeData;
  var flowData = {};
  var flowCount = Object.keys(flowArray).length;
  for (var flowIndex = 0; flowIndex < flowCount; flowIndex++) {
    var thisFlow = flowArray[flowIndex];
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
      "thankYouPageTotalsCopy" : thisFlow[9],
      "confirmationEmailCopy" : thisFlow[10],
      "flowId" : flowId
    }
    flowData[flowId] = thisFlowObj;
  }
  window.flowData = flowData;
  return flowData;
}
// empty object to hold events
var eventData = {};
var eventsList = {};
function reloadSignUp(flowId, signUpIndex){
  addEventToSignupData();
  removeBlocker();
  loadSignUp(flowId, signUpIndex);
}
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
// empty object for storing signup data
var signupData = {};
// Function to sign up for a flow
function loadSignUp(flowId, signUpIndex=0) {
  var thisFlow = flowData[flowId];
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
  // add popup
  var bodyElement = document.getElementsByTagName("body")[0];
  var blockerDiv = appendContent(bodyElement, 'div', '', 'blocker');
  bodyElement.style.overflow = "hidden";
  // add form
  var formWrapper = appendContent(blockerDiv, 'form', '', 'sign-up-form', 'flow-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  // Check if signup is at the end of the list
  var lastSignupPage = false;
  if(signUpIndex == (thisFlow.eventTypesList.length -1)){
    if(thisFlow.paymentPageCopy.includes("N/A")){
      formWrapper.addEventListener('submit', loadFreeSignup);
    } else {
      formWrapper.addEventListener('submit', loadPayment);
    }
    lastSignupPage = true;
  } else {
    formWrapper.setAttribute('onsubmit', "reloadSignUp('" + flowId + "', " + (signUpIndex + 1) + "); return false;");
  }
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  var theSignUpCopy = thisFlow.signUpPageCopyList[thisFlow.eventTypesList[signUpIndex]];
  if(theSignUpCopy.includes('[event-list]')){
    theSignUpCopy = theSignUpCopy.replace('[event-list]', '<div id="event-holder"><p>Loading Upcoming Events...</p></div>')
  } else {
    theSignUpCopy += '<div id="event-holder"><p>Loading Upcoming Events...</p></div>';
  }
  if(theSignUpCopy.includes('[attendee-input]')){
    theSignUpCopy = theSignUpCopy.replace('[attendee-input]', '<div id="input-holder"></div>')
  }
  fieldSetWrapper.innerHTML = theSignUpCopy;
  // add cancel button
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');

  if(isEmpty(eventData)){
    // get event data from calendar
    var eventDataXHR = new XMLHttpRequest();
    eventDataXHR.open('GET', 'https://meaghanwagner.com/php/echoEventData.php');
    eventDataXHR.onload = function() {
      var eventData = JSON.parse(eventDataXHR.responseText);
      window.eventData = eventData;
      loadSignupPage(signUpIndex);
    }
    eventDataXHR.send();
  } else {
    loadSignupPage(signUpIndex);
  }
}

function loadSignupPage(signUpIndex){
  var eventHolder = document.getElementById('event-holder');
  var eventsAdded = [];
  var thisFlow = signupData.flow;
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
              window.eventsList[event.id] = event;
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
        }
        replaceInputHolder();
        // add confirm button
        var buttonWrapper = document.getElementById('button-wrapper');
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
function replacePaymentHolder(){
  var paymentHolder = document.getElementById('payment-holder');
  if(paymentHolder != null){
    var paymentFrame = appendContent(paymentHolder, 'iframe', '', 'payment-frame');
    var paymentSource = ('https://meaghanwagner.com/pay-form/');
    paymentFrame.src = paymentSource;
    paymentFrame.addEventListener("load", () => {
      var amountData = {
        amount : signupData.totalCost
      }
      paymentFrame.contentWindow.postMessage(amountData, paymentSource);
    });
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
function convertDate(date) {
  var newDate = new Date(date).toISOString();
  newDate = newDate.split("-");
  newDate = newDate.join("");
  newDate = newDate.split(":");
  newDate = newDate.join("");
  return newDate;
}
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


// Function to display no results
function loadNoEventsFoundError(eventHolder) {
  eventHolder.innerHTML = '';
  var errorElement = appendContent(eventHolder, 'p');
  errorElement.innerHTML = 'Could not find any upcoming events. Please contact <a href="mailto:info@meaghanwagner.com">info@meaghanwagner.com</a> for further details.'
}
var paymentSubmitted = false;
// Function to load payment page
function loadPayment(e){
  window.paymentSubmitted = false;
  e.preventDefault();
  addEventToSignupData();
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  var formWrapper = appendContent(blockerDiv, 'form', '', 'payment-form', 'flow-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  formWrapper.addEventListener('submit', paymentFormSubmitted);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  var paymentPageCopy = signupData.flow.paymentPageCopy;
  if(paymentPageCopy.includes('[attendee-input]')){
    paymentPageCopy = paymentPageCopy.replace('<p>[attendee-input]</p>', '<div id="input-holder"></div>')
  }
  if(paymentPageCopy.includes('[cost-list]')){
    paymentPageCopy = paymentPageCopy.replace('<p>[cost-list]</p>', '<div id="cost-holder"></div>')
  }
  if(paymentPageCopy.includes('[payment-input]')){
    paymentPageCopy = paymentPageCopy.replace('<p>[payment-input]</p>', '<div id="payment-holder"></div>')
  }
  fieldSetWrapper.innerHTML = paymentPageCopy;
  replaceInputHolder();
  replaceCostHolder();
  replacePaymentHolder();
}
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
  if(signupData.eventIndex == 0){
    signupData.email = document.getElementById('email-input').value;
    signupData.firstName = document.getElementById('first-name-input').value;
    signupData.lastName = document.getElementById('last-name-input').value;
  }
  var attendeeXHR = new XMLHttpRequest();
  attendeeXHR.open('POST', 'https://meaghanwagner.com/php/addattendee.php');
  attendeeXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  attendeeXHR.onload = function() {
    var eventCount = Object.keys(signupData.events).length;
    if(signupData.eventIndex == eventCount - 1){
      showThankYouPage();
    } else {
      signupData.eventIndex += 1;
      addAttendee();
    }
  }
  attendeeXHR.send('event_id=' + Object.keys(signupData.events)[signupData.eventIndex] + '&email_address=' + signupData.email + '&first_name=' + signupData.firstName + '&last_name=' + signupData.lastName + '&flow_type=' + signupData.flow.flowId + '&payment_receipt=' + signupData.paymentInfo.receiptUrl);
}
// Function to show thank you page
function showThankYouPage() {
  var blockerDiv = document.getElementById('blocker');
  blockerDiv.innerHTML = '';
  var formWrapper = appendContent(blockerDiv, 'form', '', 'thank-you-form', 'flow-form');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  formWrapper.addEventListener('submit', removeBlocker);
  var xButton = appendContent(formWrapper, 'a', 'x', 'x-button');
  xButton.addEventListener('click', removeBlocker);
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  var thankstext = signupData.flow.thankYouPageCopy;
  if (thankstext.includes('[add-to-calendar-links]')) {
    thankstext = thankstext.replace('<p>[add-to-calendar-links]</p>', '<div id="calendar-links"></div>')
  }
  var thanksWrapper = appendContent(fieldSetWrapper, 'div')
  thanksWrapper.innerHTML = thankstext;
  replaceCalendarLinks();
  // making json smaller for php
  var phpEvents = [];
  for (const eventID in signupData.events) {
    var event = signupData.events[eventID];
    var thisPhpEvent = {
      startDate : event.start.dateTime,
      summary : event.summary
    }
    phpEvents.push(thisPhpEvent);
  }

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
// function to check if object is empty
function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}
