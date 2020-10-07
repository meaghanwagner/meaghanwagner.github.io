function burgerToggle() {
  var x = document.getElementsByClassName("header-nav")[0];
  if (x.style.display === "flex") {
    x.style.display = "none";
  } else {
    x.style.display = "flex";
  }
}
