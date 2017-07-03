// Saves options to chrome.storage.sync.
function save_options() {
    //var color = document.getElementById('color').value;
    var bEnabled = document.getElementById('cbEnabled').checked;
    chrome.storage.sync.set({
        appEnabled: bEnabled
    }, function () {
        alert('status');
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            alert('status');
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        appEnabled: true
    }, function (items) {
        //document.getElementById('color').value = items.favoriteColor;
        document.getElementById('cbEnabled').checked = items.appEnabled;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);