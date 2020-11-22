/*
Login authentication
*/
var id_token;
function onSignIn(googleUser) {
  window.googleUser = googleUser;
  var id_token = googleUser.getAuthResponse().id_token;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://gardenlifegame.com/megs_php/tokensignin.php');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function() {
    if(xhr.responseText.startsWith("0")){
      console.log('Signed in as: ' + xhr.responseText);
      var profile = googleUser.getBasicProfile();
      document.getElementById('username').innerHTML = profile.getName();
      document.getElementById('userimage').src = profile.getImageUrl();
      document.getElementById('signed-in').style.display = "block";
      document.getElementById('signed-out').style.display = "none";
      checkAllowed(profile.getEmail());
    }
    else
    {
      document.getElementById('prompt').innerHTML = "Could not verify login, please try again. If the problem persists, please contact the developer.";
    }
  };
  window.id_token = id_token;
  xhr.send('id_token=' + id_token);
}
/* Check email allowed */
function checkAllowed(email_address){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://gardenlifegame.com/megs_php/checkemail.php');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function() {
    if(xhr.responseText.startsWith("0")){
      document.getElementById('access-response').innerHTML = xhr.responseText.substring(2);
      loadSpreadSheetData();
    } else {
      document.getElementById('access-response').innerHTML = "Access Denied for " + email_address;
    }
  }
  xhr.send('email_address=' + email_address);
  xhr.send('id_token=' + window.id_token);
}
function loadSpreadSheetData(){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://gardenlifegame.com/megs_php/checkemail.php');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function() {
      document.getElementById('spreadsheet-data').innerHTML = xhr.responseText.substring(2);
  };
  xhr.send('id_token=' + window.id_token);
}
/* Sign out of Google*/
function signOut() {
  window.googleUser = null;
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
  document.getElementById('signed-in').style.display = "none";
  document.getElementById('signed-out').style.display = "grid";
  document.getElementById('access-response').innerHTML = "Access not checked";
  window.id_token = "";
}

/*
Calendar Authentication
*/
function authenticate() {
  return gapi.auth2.getAuthInstance()
      .signIn({scope: "https://www.googleapis.com/auth/calendar"})
      .then(function() { console.log("Sign-in successful"); },
            function(err) { console.error("Error signing in", err); });
}
function loadClient() {
  return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/calendar/v3/rest")
      .then(function() { console.log("GAPI client loaded for API"); },
            function(err) { console.error("Error loading GAPI client for API", err); });
}
// Make sure the client is loaded and sign-in is complete before calling this method.
function execute() {
  return gapi.client.calendar.acl.list({
    "calendarId": "dpue6nf78ovmrqksfdvv4g9vo8@group.calendar.google.com",
    "showDeleted": false
  })
      .then(function(response) {
              // Handle the results here (response.result has the parsed body).
              console.log("Response", response);
            },
            function(err) { console.error("Execute error", err); });
}
gapi.load("client:auth2", function() {
  gapi.auth2.init({client_id: "115789183473-o3tfpd9msrldlnjtuvrlfaql70u2a9vr.apps.googleusercontent.com"});
});
