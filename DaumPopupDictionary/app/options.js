// Saves options to chrome.storage.sync.
function save_options() {

    var bEnabled = document.getElementById('cbEnabled').checked;
    var popupPosition = $(':radio[name="radioPopupPosition"]:checked').val();

    chrome.storage.sync.set({
        appEnabled: bEnabled,
        popupPosition: popupPosition
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = '옵션이 저장되었습니다.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {

    chrome.storage.sync.get({
        appEnabled: true,
        popupPosition: 0, // 0: under, 1: over
    }, function (items) {
        // 사용유무
        document.getElementById('cbEnabled').checked = items.appEnabled;
        // 팝업위치
        $('input:radio[name=radioPopupPosition]:input[value=' + items.popupPosition + ']').attr("checked", true)
                                                                                          .parents("label").addClass("active")
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

$(function () {

});