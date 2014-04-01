/*jshint browser:true */
/*global chrome */
chrome.app.runtime.onLaunched.addListener(function () {
    var w = 520, h = 600,
        left = screen.width/2 - w/2,
        top = screen.height/2 - h/2 - 12;
    chrome.app.window.create('index.html', {width: w, height: h, left: left, top: top});
});
