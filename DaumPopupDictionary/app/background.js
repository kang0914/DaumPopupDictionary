chrome.commands.onCommand.addListener(function (command) {

    if (command == "toggle-application-enabled")
    {
        chrome.storage.sync.get({
            appEnabled: true
        }, function (items) {
            chrome.storage.sync.set({
                appEnabled: !items.appEnabled
            }, function () {

            })
        });
    }

});