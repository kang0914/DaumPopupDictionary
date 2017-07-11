var DaumPopupDictionary;
(function (DaumPopupDictionary) {
    DaumPopupDictionary.Setting = {
        g_appEnabled : true,
        g_popupWidth : 400,
        g_popupHeight : 300,
    };
})(DaumPopupDictionary || (DaumPopupDictionary = {}));

(function (DPD) {

    var g_PrevSelectedText =  "";
    //var g_appEnabled = true;
    //var g_popupWidth = 400;
    //var g_popupHeight = 300;

    //console.log("chrome.storage.sync.get [get](" + JSON.stringify(DPD.Setting) + ")");

    chrome.storage.sync.get({
        appEnabled: DPD.Setting.g_appEnabled,
        popupWidth: DPD.Setting.g_popupWidth,
        popupHeight: DPD.Setting.g_popupHeight
    }, function (items) {
        //console.log("chrome.storage.sync.get [on](" +  JSON.stringify(items) + ")");

        DPD.Setting.g_appEnabled = items.appEnabled;
        DPD.Setting.g_popupWidth = items.popupWidth;
        DPD.Setting.g_popupHeight = items.popupHeight;
    });

    chrome.storage.onChanged.addListener(function (changes, namespace) {

        for (key in changes) {
            var storageChange = changes[key];

            if (key == "appEnabled")
            {
                DPD.Setting.g_appEnabled = storageChange.newValue;

                if (DPD.Setting.g_appEnabled == false)
                {
                    if(isOpenPopUp())
                    {
                        closePopup();
                    }
                }
            }
        }
    });

    function isOpenPopUp()
    {
        if ($("#divPopup").dialog("instance") == undefined)
            return false;

        return $("#divPopup").dialog("isOpen");
    }

    function isOpenMiniPopUp() {
        if ($("#divMiniPopup").dialog("instance") == undefined)
            return false;

        return $("#divMiniPopup").dialog("isOpen");
    }

    function closePopup()
    {
        var newPopupWidth = $("#divPopup").dialog("option", "width");
        var newPopupHeight = $("#divPopup").dialog("option", "height");

        chrome.storage.sync.set({
            popupWidth: newPopupWidth,
            popupHeight: newPopupHeight,
        }, function () {

        });

        DPD.Setting.g_popupWidth = newPopupWidth;
        DPD.Setting.g_popupHeight = newPopupHeight;

        //console.log("closePopup1 : " + newPopupWidth + ", " + newPopupHeight);
        //console.log("closePopup2 : " + DPD.Setting.g_popupWidth + ", " + DPD.Setting.g_popupHeight);

        $("#divPopup").dialog("close");
        $("#divPopup").remove();
    }

    function closeMiniPopup() {
        $("#divMiniPopup").dialog("close");
        $("#divMiniPopup").remove();
    }

    function showPopup(event) {
        //console.log("showPopup : " + DPD.Setting.g_popupWidth + ", " + DPD.Setting.g_popupHeight);
        // dialog 방식
        $("#divPopup").dialog({
            draggable: false,
            modal: false,
            position:
            {
                my: 'top+20',
                at: 'right',
                of: event,
                using: function (position, feedback) {
                    // 2017.07.03 by jw.kang
                    // 팝업이 움직일 경우 화살표가 여러개 생기는 문제가 있어서 추가함.
                    $(this).find('.arrow-searchpopup').remove();

                    $(this).css(position);
                    $("<div>")
                      .addClass("arrow-searchpopup")
                      .addClass(feedback.vertical)
                      .addClass(feedback.horizontal)
                      .appendTo(this);
                }
            },
            width: DPD.Setting.g_popupWidth,
            height: DPD.Setting.g_popupHeight,
            show: { effect: "fade", duration: 500 },
            hide: { effect: "fade", duration: 500 },
        });

        // 팝업 이외에 마우스 클릭 시 사라지도록 
        $(".ui-widget-overlay").click(function () {
            closePopup();
        });

        // 타이틀 숨기기
        $(".ui-dialog-titlebar").hide();

        //$("#iframePopup").contents().scrollTop($("#iframePopup").contents().scrollTop() + 150);

        // 백그라운드 색깔
        $(".ui-widget-overlay").css({
            background: "transparent",
        });
    }

    function createPopup(event, newURL)
    {
        //console.log("createPopup");

        // Container 생성
        if ($("#divPopup").dialog("instance") == undefined) {
            var divContainer2 = document.createElement("div");
            divContainer2.setAttribute("id", "divPopup");

            divContainer2.style.padding = 0;
            divContainer2.style.margin = 0;
            divContainer2.style.overflowX = "hidden";
            divContainer2.style.overflowY = "hidden";

            var ifrm2 = document.createElement("iframe");
            ifrm2.setAttribute("id", "iframePopup");
            ifrm2.style.width = "100%";
            ifrm2.style.height = "100%";
            ifrm2.style.border = 0;
            divContainer2.appendChild(ifrm2);

            document.body.appendChild(divContainer2);

            document.getElementById('iframePopup').onload = function () {
                closeMiniPopup();

                showPopup(event);
            };

            document.getElementById("iframePopup").setAttribute("src", newURL);
        }
    }

    //function getSelectionText() {
    //    var text = "";
    //    var activeEl = document.activeElement;
    //    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    //    if (
    //      (activeElTagName == "textarea") || (activeElTagName == "input" &&
    //      /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
    //      (typeof activeEl.selectionStart == "number")
    //    ) {
    //        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    //    } else if (window.getSelection) {
    //        text = window.getSelection().toString();
    //    }
    //    return text;
    //}

    function getSelectionText() {
        var text = "";
        var activeEl = document.activeElement;
        var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
        if (
          (activeElTagName == "textarea") || (activeElTagName == "input" &&
          /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
          (typeof activeEl.selectionStart == "number")
        ) {
            // 2017.07.12 by jw.kang
            // 입력창의 경우에는 제외
            text = "";
        } else if (window.getSelection) {
            text = window.getSelection().toString();
        }
        return text;
    }

    //function getSelectionText() {
    //    var text = "";
    //    if (window.getSelection) {
    //        text = window.getSelection().toString();
    //    }
    //    return text;
    //}

    document.onmousedown = function (event) {

        //console.log("document.onmousedown");

        if ($("#divMiniPopup").dialog("instance") != undefined)
        {
            var isHoveredMiniPopup = $("#divMiniPopup").is(":hover");

            var isOpenMiniPopup = isOpenMiniPopUp();

            if (isOpenMiniPopup && !isHoveredMiniPopup)
                closeMiniPopup();
        }
    }

    document.onmouseup = function (event) {

        var selectedText = getSelectionText();

        var isOpenMiniPopup = isOpenMiniPopUp();

        if (isOpenMiniPopup & selectedText == "")
            closeMiniPopup();

        var isOpen = isOpenPopUp();

        if (isOpen && selectedText == "")
        {
            closePopup();
        }

        if (selectedText == "")
            return;
        if (selectedText == g_PrevSelectedText)
            return;

        // 팝업 닫기 및 삭제
        if (isOpen) {
            closePopup();
        }

        // 비활성화일 경우 중지
        if (DPD.Setting.g_appEnabled == false)
            return;

        g_PrevSelectedText = selectedText;

        var newURL = "";

        // Daum
        newURL = 'http://m.dic.daum.net/search.do?q=' +
                      encodeURIComponent(selectedText) +
                      '&dic=all';;//'&dic=kor';

        // Naver
        //newURL = 'http://m.krdic.naver.com/search/all/0/' + 
        //         encodeURIComponent(selectedText) +
        //         '?format=HTML&isMobile=true';

        // create mini popup
        if ($("#divMiniPopup").dialog("instance") == undefined)
        {
            var divContainer = document.createElement("div");
            divContainer.setAttribute("id", "divMiniPopup");

            divContainer.style.padding = 0;
            divContainer.style.margin = "0px 0px 0px 1px";
            divContainer.style.overflowX = "hidden";
            divContainer.style.overflowY = "hidden";
            divContainer.style.border = 0;

            var command = document.createElement("img");
            command.src = chrome.extension.getURL("img/3d-dictionary32.png");
            command.style.width = 34;
            command.style.height = 34;
            command.style.padding = 0;
            command.style.border = 2;
            command.title = "검색 결과 보기";
            $(command).button();
            $(command).click(function () {
                createPopup(event, newURL);
            });
            divContainer.appendChild(command);

            document.body.appendChild(divContainer);

            // dialog 방식
            $("#divMiniPopup").dialog({
                draggable: false,
                resizable: false,
                modal: false,
                position:
                {
                    my: 'center top+12',
                    at: 'center bottom',
                    of: event,
                    using: function (position, feedback) {
                        $(this).css(position);
                        $("<div>")
                          .addClass("arrow")
                          .addClass(feedback.vertical)
                          .addClass(feedback.horizontal)
                          .appendTo(this);
                    }
                },
                width: 35,
                height: 70,
                maxWidth: 35,
                maxHeight: 70,
                minWidth: 35,
                minHeight: 70,
                show: { effect: "fade", duration: 500 },
                hide: { effect: "fade", duration: 500 },
                classes: {
                    "ui-dialog": "ui-dialog-mini-popup"
                }
            });

            // 팝업 이외에 마우스 클릭 시 사라지도록 
            $(".ui-widget-overlay").click(function () {
                closeMiniPopup();
            });
            // 타이틀 숨기기
            $(".ui-dialog-titlebar").hide();
            // 백그라운드 색깔
            $(".ui-widget-overlay").css({
                background: "transparent",
            });
            // 크기 맞추기
            $("#divMiniPopup").width(35).height(35);
            $(".ui-dialog").width(35).height(35);
        }
    };
})(DaumPopupDictionary);