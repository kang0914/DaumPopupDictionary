// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value
    chrome.storage.sync.get({
        appEnabled: true
    }, function (items) {
        document.getElementById('cbEnabled').checked = items.appEnabled;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);

//document.querySelector('#go-to-options').addEventListener('click', function () {
//    if (chrome.runtime.openOptionsPage) {
//        // New way to open options pages, if supported (Chrome 42+).
//        chrome.runtime.openOptionsPage();
//    } else {
//        // Reasonable fallback.
//        window.open(chrome.runtime.getURL('options.html'));
//    }
//});

document.getElementById('cbEnabled').addEventListener('click', function () {
    var bEnabled = document.getElementById('cbEnabled').checked;
    chrome.storage.sync.set({
        appEnabled: bEnabled
    }, function () {
        
    });
});