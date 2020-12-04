function burgerToggle() {
  var x = document.getElementsByClassName("header-nav")[0];
  if (x.style.display === "flex") {
    x.style.display = "none";
  } else {
    x.style.display = "flex";
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
// Function to remove blocker div
function removeBlocker(){
  theBlocker = document.getElementById("blocker");
  if(theBlocker != null){
    theBlocker.remove();
  }
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

// Function to sign up for free options
function tryTheRevolution(){
  // add popup
  var mainElement = document.getElementById('main');
  var blockerDiv = appendContent(mainElement, 'div', '', 'blocker');
  // add form
  var formWrapper = appendContent(blockerDiv, 'form' ,'', 'try-the-revolution');
  formWrapper.onkeypress = stopReturnSubmit(formWrapper);
  var fieldSetWrapper = appendContent(formWrapper, 'FIELDSET');
  appendContent(fieldSetWrapper, 'LEGEND', 'Welcome to the Revolution! Claim your seat:');
  // add event holder
  var eventHolder = appendContent(fieldSetWrapper, 'div', '','date-holder');
  appendContent(eventHolder, "h2", "Loading Upcoming Events...");
  // add inputs
  var firstNameLabel = appendContent(fieldSetWrapper, "label", 'First Name:');
  firstNameLabel.for = "first-name-input";
  var firstNameInput = appendContent(fieldSetWrapper, 'input', '','first-name-input');
  appendContent(fieldSetWrapper, "br");
  var lastNameLabel = appendContent(fieldSetWrapper, "label", 'Last Name:');
  lastNameLabel.for = "last-name-input";
  var lastNameInput = appendContent(fieldSetWrapper, 'input', '','last-name-input');
  appendContent(fieldSetWrapper, "br");
  var emailLabel = appendContent(fieldSetWrapper, "label", 'Email:');
  emailLabel.for = "email-input";
  var emailInput = appendContent(fieldSetWrapper, 'input', '','email-input');
  // add buttons
  var buttonWrapper = appendContent(fieldSetWrapper, 'div', '', 'button-wrapper');
  var cancelTypeButton = appendContent(buttonWrapper, "button", 'Cancel', 'cancel-button', 'form-button');
  cancelTypeButton.type = "button";
  cancelTypeButton.addEventListener("click", removeBlocker);
  var confirmButton = appendContent(buttonWrapper, "button", 'Confirm', 'modify-event-button', 'form-button');
  confirmButton.type = "button";
  confirmButton.addEventListener("click", addAttendee);

  var eventsAdded = [];
  // get event data from calendar
  var calendarXHR = new XMLHttpRequest();
  calendarXHR.open('GET', 'https://gardenlifegame.com/megs_php/readcalendarevents.php');
  calendarXHR.onload = function() {
    var calendarData = JSON.parse(calendarXHR.responseText);
    var eventCount = Object.keys(calendarData).length;
    if(eventCount > 0){
      // get event data from sheets
      var eventsXHR = new XMLHttpRequest();
      eventsXHR.open('GET', 'https://gardenlifegame.com/megs_php/readsheetevents.php');
      eventsXHR.onload = function() {
        var sheetData = JSON.parse(eventsXHR.responseText);
        var rowCount = Object.keys(sheetData).length;
        if (rowCount > 0){
          // get attendees from sheets
          var attendeesXHR = new XMLHttpRequest();
          attendeesXHR.open('GET', 'https://gardenlifegame.com/megs_php/readsheetattendees.php');
          attendeesXHR.onload = function() {
            var attendeesData = JSON.parse(attendeesXHR.responseText);
            var totalAttendeesCount = Object.keys(attendeesData).length;
            // loop through events from calendar
            for (var eventIndex = 0; eventIndex < eventCount; eventIndex++) {
              var event = calendarData[eventIndex];
              // loop through data from sheets
              var eventFound = false;
              for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                var row = sheetData[rowIndex];
                if(row[0] == event.id){
                  eventFound = true;
                  event.maxAttendees = row[1];
                  event.cost = row[2];
                  break;
                }
              }
              // Check if the event data was found in sheets
              if(eventFound){
                if(event.cost == 0){
                  // Check if attendees is maxed out
                  var eventAttendees = [];
                  if(totalAttendeesCount > 0){
                    for (var attendeesRowIndex = 0; attendeesRowIndex < totalAttendeesCount; attendeesRowIndex++) {
                      var attendeeRow = attendeesData[attendeesRowIndex];
                      eventAttendees.push(attendeeRow);
                    }
                  }
                  if(event.maxAttendees > eventAttendees.length){
                    event.availableSlots = event.maxAttendees - eventAttendees.length;
                    eventsAdded.push(event);
                  }
                }
              } else {
                console.log("Couldn't find event data for " + event.id + ", which shouldn't happen. Please inform the developer." )
              }
            }
            // check if events available
            if(eventsAdded.length > 0){
              eventHolder.innerHTML = '';
              for (var eventAddedIndex = 0; eventAddedIndex < eventsAdded.length; eventAddedIndex++) {
                event = eventsAdded[eventAddedIndex];
                var eventInput = appendContent(eventHolder, 'input', '', event.id);
                eventInput.type = "radio";
                eventInput.name = "event";
                eventInput.value = event.id;
                var eventLabel = appendContent(eventHolder, 'label', event.start.dateTime)
                eventLabel.for = event.id;
              }
            } else {

            }
          }
          attendeesXHR.send();
        } else {
          console.log("Couldn't find any events in sheet. Please inform the developer." )
        }
      }
      eventsXHR.send();
    } else {
      console.log("Couldn't find any future events in calendar. Please inform the developer." )
    }
  }
  calendarXHR.send();
}

function addAttendee(){
  var eventID = "";
  var eventSelects = document.getElementsByName('event');
  for (var i = 0, length = eventSelects.length; i < length; i++) {
    if (eventSelects[i].checked) {
      eventID = eventSelects[i].value;
      break;
    }
  }
  if(eventID != ""){
    emailAddress = document.getElementById('email-input').value;
    firstName = document.getElementById('first-name-input').value;
    lastNAme = document.getElementById('last-name-input').value;
    if(emailAddress == "" || firstName == "" || lastNAme == ""){
      alert("Please fill out the form with your info!");
    } else {
      var attendeeXHR = new XMLHttpRequest();
      attendeeXHR.open('POST', 'https://gardenlifegame.com/megs_php/addattendee.php');
      attendeeXHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      attendeeXHR.onload = function() {
        console.log(attendeeXHR.responseText);
      }
      attendeeXHR.send("event_id=" + eventID + "&email_address=" + emailAddress + "&first_name=" + firstName + "&last_name=" + lastNAme);
    }
  } else {
    alert("Please select an event to sign up for!");
  }
}
