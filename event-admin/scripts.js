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
  xhr.send('email_address=' + email_address + '&id_token=' + window.id_token);
}
/* Pull data from spreadsheet */
function loadSpreadSheetData(){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://gardenlifegame.com/megs_php/readsheets.php');
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
