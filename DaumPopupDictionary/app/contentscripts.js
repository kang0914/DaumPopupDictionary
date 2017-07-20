var DaumPopupDictionary;
(function (DaumPopupDictionary) {
    DaumPopupDictionary.Setting = {
        g_appEnabled : true,
        g_popupWidth : 400,
        g_popupHeight : 300,
    };

    DaumPopupDictionary.Data = {};
    DaumPopupDictionary.Data.Default = {
        mainUrlName: "Daum(mobile)"
    };
    DaumPopupDictionary.Data.Urls = {
        getMainUrlInfo: function() {
            return this.List.find(function (item) { return item.name.toLowerCase() == DaumPopupDictionary.Data.Default.mainUrlName.toLowerCase(); });
        },
        List: [
            {
                name: "Daum(mobile)",
                tooltip: "팝업 검색하기",
                urlFormat : 'http://m.dic.daum.net/search.do?q={searchtext:endode}&dic=all',
                urlImg: chrome.extension.getURL("img/3d-dictionary32.png"),
                enabled: true,
                targetWindow: 0 // 0: iframe, 1: new tab
            },
            {
                name: "Daum",
                tooltip: "새 탭에서 검색하기",
                urlFormat: 'http://search.daum.net/search?w=tot&DA=YZR&t__nil_searchbox=btn&sug=&sugo=&q={searchtext:endode}',
                urlImg: chrome.extension.getURL("img/3d-dictionary32(new).png"),
                enabled: true,
                targetWindow: 1 // 0: iframe, 1: new tab
            },
            {
                name: "Naver(mobile)",
                urlFormat: 'http://m.krdic.naver.com/search/all/0/{searchtext:endode}?format=HTML&isMobile=true',
                urlImg: chrome.extension.getURL("img/3d-dictionary32.png"),
                enabled: false,
                targetWindow: 1 // 0: iframe, 1: new tab
            },
            {
                name: "Naver",
                urlFormat: 'https://search.naver.com/search.naver?where=nexearch&sm=top_sly.hst&fbm=1&acr=5&ie=utf8&query={searchtext:endode}',
                urlImg: chrome.extension.getURL("img/3d-dictionary32.png"),
                enabled: false,
                targetWindow: 1 // 0: iframe, 1: new tab
            },
        ]};

    DaumPopupDictionary.StringHelper = {
        checkSpace: function (str) {
            if (str.search(/\s/) != -1) {
                return true;
            } else
                return false;
        },
        checkSpecial: function (str) {
            var pattern = /[~!@\#$%^&*\()\-=+_']/gi;

            return pattern.test(str);
        },
        checkHangul: function (str) {
            var pattern = /^[가-힝]*$/; ///^[0-9a-zA-Z가-힝]*$/;

            return pattern.test(str);
        }
    };

    DaumPopupDictionary.Converter = {
        URLFormatToURL: function (urlFormat, searchtext) {

            var trans = "";

            if (urlFormat.indexOf("{searchtext:endode}") >= 0)
                trans = urlFormat.replace("{searchtext:endode}", encodeURIComponent(searchtext));

            return trans;
        }
    };

})(DaumPopupDictionary || (DaumPopupDictionary = {}));

(function (DPD) {

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
                collision: "flipfit",
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
            create: function (event, ui) {
                $('.ui-dialog').wrap('<div class="dpd" />');
            },
            open: function (event, ui) {
                $('.ui-widget-overlay').wrap('<div class="dpd" />');
            },
            close: function (event, ui) {
                $(".dpd").filter(function () {
                    if ($(this).text() == "")
                    {
                        return true;
                    }
                    return false;
                }).remove();
            }
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

    function getSelectionTextRect()
    {
        var sel = window.getSelection();
        var range = sel.getRangeAt(0).cloneRange();
        var rects = range.getClientRects();

        var minTop = 99999;
        var minLeft = 99999;
        var maxRight = 0;
        var maxBottom = 0;

        for (var i = 0; i < rects.length; i++) {
            var item = rects[i];

            minTop = Math.min(minTop, item.top);
            minLeft = Math.min(minLeft, item.left);
            maxRight = Math.max(maxRight, item.right);
            maxBottom = Math.max(maxBottom, item.bottom);
        }

        return { top:minTop, right:maxRight, bottom: maxBottom, left:minLeft };
    }

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

        var selectedText = getSelectionText().trim();

        var isOpenMiniPopup = isOpenMiniPopUp();

        if (isOpenMiniPopup & selectedText == "")
            closeMiniPopup();

        var isOpen = isOpenPopUp();

        if (isOpen && selectedText == "")
            closePopup();

        // 단어 검사
        if (selectedText == "")
            return;
        if (DaumPopupDictionary.StringHelper.checkSpace(selectedText))
            return;
        if (DaumPopupDictionary.StringHelper.checkSpecial(selectedText))
            return;

        // 팝업 닫기 및 삭제
        if (isOpen) {
            closePopup();
        }

        // 비활성화일 경우 중지
        if (DPD.Setting.g_appEnabled == false)
            return;

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

            var itemCnt = 0;
            DaumPopupDictionary.Data.Urls.List.forEach(function (item, index, array) {
                if (item.enabled == false)
                    return;
                
                itemCnt++;

                var urlFormat = item.urlFormat;
                var urlImg = item.urlImg;
                var urlConverted = DaumPopupDictionary.Converter.URLFormatToURL(urlFormat, selectedText);

                var command = document.createElement("img");
                command.src = urlImg;
                command.style.width = 34;
                command.style.height = 34;
                command.style.padding = 0;
                command.style.margin = "0px 2px 0px 0px";
                command.style.border = 2;
                command.title = item.tooltip;
                command.style.display = "inline-block";
                command.style.float = "left";
                $(command).button();
                $(command).click(function () {
                    if (item.targetWindow == 0)
                        createPopup(event, urlConverted);
                    else if (item.targetWindow == 1)
                    {
                        window.open(urlConverted);
                        closeMiniPopup();
                    }
                });
                divContainer.appendChild(command);
            });

            document.body.appendChild(divContainer);

            var calWidth = itemCnt * 36;

            var rect = getSelectionTextRect();
            var calLeft = (rect.left + rect.right) / 2 - (calWidth / 2);

            //console.log(rect.top + ", " + rect.right + ", " + rect.bottom + ", " + rect.left);
            // dialog 방식
            $("#divMiniPopup").dialog({
                draggable: false,
                resizable: false,
                modal: false,
                position: {
                    my: "left top",
                    at: "left+" + (window.scrollX + calLeft) + " top+" + (window.scrollY + rect.bottom + 5),
                    of: "body",
                    collision: "none",
                    using: function (position, feedback) {
                        $(this).css(position);
                        $("<div>")
                            .addClass("arrow")
                            //.addClass(feedback.vertical)  // 2017.07.16 by jw.kang 강제로 top 지정함.
                            .addClass("top")
                            .addClass(feedback.horizontal)
                            .appendTo(this);
                    }
                },
                width: "auto",
                minHeight: "auto",

                show: { effect: "fade", duration: 500 },
                hide: { effect: "fade", duration: 500 },
                classes: {
                    "ui-dialog": "ui-dialog-mini-popup"
                },

                create: function (event, ui) {
                    $('.ui-dialog').wrap('<div class="dpd" />');
                },
                open: function (event, ui) {
                    $('.ui-widget-overlay').wrap('<div class="dpd" />');
                },
                close: function(event, ui){
                    $(".dpd").filter(function () {
                        if ($(this).text() == "")
                        {
                            return true;
                        }
                        return false;
                    }).remove();
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
            //$("#divMiniPopup").width(calWidth).height(35);
            //$(".ui-dialog").width(calWidth).height(35);
        }
    };
})(DaumPopupDictionary);