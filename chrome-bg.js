/*jshint browser:true */
/*global chrome */
chrome.app.runtime.onLaunched.addListener(function () {
    var w = 520, h = 600,
        left = screen.width - w - 12,
        top = screen.height/2 - h/2;
    chrome.app.window.create('index.html', {
        width: w,
        height: h,
        left: left,
        top: top,
    });
});
