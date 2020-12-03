function burgerToggle() {
  var x = document.getElementsByClassName("header-nav")[0];
  if (x.style.display === "flex") {
    x.style.display = "none";
  } else {
    x.style.display = "flex";
  }
}

function getHost(){
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://gardenlifegame.com/megs_php/check_host.php');
  xhr.onload = function() {
    alert(xhr.responseText);
  }
  xhr.send();
}
