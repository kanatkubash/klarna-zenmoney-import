window.xhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.setRequestHeader = function (...arg) {
  if (arg[0] == "authorization") {
    navigator.clipboard
      .writeText(arg[1].substring("Bearer ".length))
      .then(() => console.info("Got access token"));
  }
  return window.xhrSetRequestHeader.call(this, ...arg);
};
