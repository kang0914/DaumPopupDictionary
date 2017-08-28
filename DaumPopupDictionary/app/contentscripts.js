var DaumPopupDictionary;
(function (DaumPopupDictionary) {
    (function (PopupPosition) {
        PopupPosition[PopupPosition["under"] = 0] = "under";
        PopupPosition[PopupPosition["over"] = 1] = "over";
    })(DaumPopupDictionary.PopupPosition || (DaumPopupDictionary.PopupPosition = {}));
    var PopupPosition = DaumPopupDictionary.PopupPosition;
    (function (TargetWindowType) {
        TargetWindowType[TargetWindowType["iframe"] = 0] = "iframe";
        TargetWindowType[TargetWindowType["new_tab"] = 1] = "new_tab";
    })(DaumPopupDictionary.TargetWindowType || (DaumPopupDictionary.TargetWindowType = {}));
    var TargetWindowType = DaumPopupDictionary.TargetWindowType;
    var Setting = (function () {
        function Setting() {
        }
        Setting.g_appEnabled = true;
        Setting.g_popupWidth = 400;
        Setting.g_popupHeight = 300;
        Setting.g_popupPosition = PopupPosition.under;
        return Setting;
    }());
    DaumPopupDictionary.Setting = Setting;
    var Data;
    (function (Data) {
        //export class Default  {
        //    static mainUrlName: string = "Daum(mobile)";
        //}
        var Urls = (function () {
            function Urls() {
            }
            //static getMainUrlInfo() {                        
            //    return this.List.find(function (item) {
            //        return item.name.toLowerCase() == DaumPopupDictionary.Data.Default.mainUrlName.toLowerCase();
            //    });
            //}
            Urls.List = [
                {
                    id: 1,
                    name: "Daum(mobile)",
                    tooltip: "팝업 검색하기",
                    urlFormat: 'http://m.dic.daum.net/search.do?q={searchtext:endode}&dic=all',
                    urlImg: chrome.extension.getURL("img/3d-dictionary32.png"),
                    enabled: true,
                    targetWindow: TargetWindowType.iframe // 0: iframe, 1: new tab
                },
                {
                    id: 2,
                    name: "Daum",
                    tooltip: "새 탭에서 검색하기",
                    urlFormat: 'http://search.daum.net/search?w=tot&DA=YZR&t__nil_searchbox=btn&sug=&sugo=&q={searchtext:endode}',
                    urlImg: chrome.extension.getURL("img/3d-dictionary32(new).png"),
                    enabled: true,
                    targetWindow: TargetWindowType.new_tab // 0: iframe, 1: new tab
                },
                {
                    id: 3,
                    name: "Naver(mobile)",
                    urlFormat: 'http://m.krdic.naver.com/search/all/0/{searchtext:endode}?format=HTML&isMobile=true',
                    urlImg: chrome.extension.getURL("img/3d-dictionary32.png"),
                    enabled: false,
                    targetWindow: TargetWindowType.new_tab // 0: iframe, 1: new tab
                },
                {
                    id: 4,
                    name: "Naver",
                    urlFormat: 'https://search.naver.com/search.naver?where=nexearch&sm=top_sly.hst&fbm=1&acr=5&ie=utf8&query={searchtext:endode}',
                    urlImg: chrome.extension.getURL("img/3d-dictionary32.png"),
                    enabled: false,
                    targetWindow: TargetWindowType.new_tab // 0: iframe, 1: new tab
                },
            ];
            return Urls;
        }());
        Data.Urls = Urls;
        ;
    })(Data = DaumPopupDictionary.Data || (DaumPopupDictionary.Data = {}));
    var StringHelper = (function () {
        function StringHelper() {
        }
        StringHelper.checkSpace = function (str) {
            if (str.search(/\s/) != -1) {
                return true;
            }
            else
                return false;
        };
        StringHelper.checkSpecial = function (str) {
            var pattern = /[~!@\#$%^&*\()\-=+_']/gi;
            return pattern.test(str);
        };
        StringHelper.checkHangul = function (str) {
            var pattern = /^[가-힝]*$/; ///^[0-9a-zA-Z가-힝]*$/;
            return pattern.test(str);
        };
        return StringHelper;
    }());
    DaumPopupDictionary.StringHelper = StringHelper;
    ;
    var Converter = (function () {
        function Converter() {
        }
        Converter.URLFormatToURL = function (urlFormat, searchtext) {
            var trans = "";
            if (urlFormat.indexOf("{searchtext:endode}") >= 0)
                trans = urlFormat.replace("{searchtext:endode}", encodeURIComponent(searchtext));
            return trans;
        };
        return Converter;
    }());
    DaumPopupDictionary.Converter = Converter;
    ;
    var Utils = (function () {
        function Utils() {
        }
        Utils.getSelectionText = function () {
            var text = "";
            var activeEl = document.activeElement;
            var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
            if ((activeElTagName == "textarea") || (activeElTagName == "input" &&
                /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
                (typeof activeEl.selectionStart == "number")) {
                // 2017.07.12 by jw.kang
                // 입력창의 경우에는 제외
                text = "";
            }
            else if (window.getSelection) {
                text = window.getSelection().toString();
            }
            return text;
        };
        Utils.getSelectionTextRect = function () {
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
            return { top: minTop, right: maxRight, bottom: maxBottom, left: minLeft };
        };
        return Utils;
    }());
    DaumPopupDictionary.Utils = Utils;
    var Popup = (function () {
        function Popup(options) {
            this.elementID = options.elementID;
            this.onClickItem = options.onClickItem;
        }
        Popup.prototype.isOpen = function () {
            if ($("#" + this.elementID).dialog("instance") == undefined)
                return false;
            return $("#" + this.elementID).dialog("isOpen");
        };
        Popup.prototype.close = function () {
            //console.log("mini close()");
            $("#" + this.elementID).dialog("close");
            $("#" + this.elementID).remove();
        };
        Popup.prototype.show = function () {
            //console.log("mini show()");
            var pos_my = "";
            var pos_at = "";
            switch (DaumPopupDictionary.Setting.g_popupPosition) {
                case DaumPopupDictionary.PopupPosition.under:
                    pos_my = "center top+5";
                    pos_at = "center bottom";
                    break;
                case DaumPopupDictionary.PopupPosition.over:
                    pos_my = "center bottom-5";
                    pos_at = "center top";
                    break;
            }
            // dialog 방식
            $("#" + this.elementID).dialog({
                draggable: false,
                resizable: false,
                modal: false,
                position: {
                    //아래
                    my: pos_my,
                    at: pos_at,
                    of: "#divSelectedText",
                    collision: "flip",
                    using: function (position, feedback) {
                        $(this).css(position);
                        $("<div>")
                            .addClass("arrow")
                            .addClass(feedback.vertical)
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
                    $('.ui-dialog-titlebar').hide();
                },
            });
        };
        Popup.prototype.create = function (selectedText, popupItems) {
            //console.log("mini create()");
            var _this = this;
            this.selectedText = selectedText;
            var $container = $("<div>")
                .attr("id", this.elementID)
                .addClass("dpd-popup-box")
                .appendTo(document.body);
            popupItems.forEach(function (item, index, array) {
                $("<img>")
                    .addClass("dpd-popup-box-img")
                    .attr("src", item.urlImg)
                    .attr("title", item.tooltip)
                    .button()
                    .click(function () {
                    if (_this.onClickItem)
                        _this.onClickItem(item);
                })
                    .appendTo($container);
            });
            this.show();
        };
        return Popup;
    }());
    DaumPopupDictionary.Popup = Popup;
    var PopupEx = (function () {
        function PopupEx(eleID) {
            this.elementID = eleID;
        }
        PopupEx.prototype.isOpen = function () {
            if ($("#" + this.elementID).dialog("instance") == undefined)
                return false;
            return $("#" + this.elementID).dialog("isOpen");
        };
        PopupEx.prototype.close = function () {
            //console.log("popupEx close()");
            var newPopupWidth = $("#" + this.elementID).dialog("option", "width");
            var newPopupHeight = $("#" + this.elementID).dialog("option", "height");
            chrome.storage.sync.set({
                popupWidth: newPopupWidth,
                popupHeight: newPopupHeight,
            }, function () {
                // Empty
            });
            DaumPopupDictionary.Setting.g_popupWidth = newPopupWidth;
            DaumPopupDictionary.Setting.g_popupHeight = newPopupHeight;
            $("#" + this.elementID).dialog("close");
            $("#" + this.elementID).remove();
        };
        PopupEx.prototype.show = function () {
            //console.log("popupEx show()");
            var pos_my = "";
            var pos_at = "";
            switch (DaumPopupDictionary.Setting.g_popupPosition) {
                case DaumPopupDictionary.PopupPosition.under:
                    pos_my = "center top+5";
                    pos_at = "center bottom";
                    break;
                case DaumPopupDictionary.PopupPosition.over:
                    pos_my = "center bottom-5";
                    pos_at = "center top";
                    break;
            }
            // dialog 방식
            $("#" + this.elementID).dialog({
                draggable: false,
                modal: false,
                position: {
                    //아래
                    my: pos_my,
                    at: pos_at,
                    of: "#divSelectedText",
                    collision: "flip",
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
                width: DaumPopupDictionary.Setting.g_popupWidth,
                height: DaumPopupDictionary.Setting.g_popupHeight,
                show: { effect: "fade", duration: 500 },
                hide: { effect: "fade", duration: 500 },
                create: function (event, ui) {
                    $('.ui-dialog-titlebar').hide();
                },
            });
        };
        PopupEx.prototype.create = function (selectedText, newURL) {
            //console.log("popupEx create()");
            var _this = this;
            var $container = $("<div>")
                .attr("id", this.elementID)
                .addClass("dpd-popup-result-container")
                .appendTo(document.body);
            $("<iframe>")
                .attr("id", "iframePopup")
                .addClass("dpd-popup-result-iframe")
                .on("load", function () {
                if (_this.isOpen())
                    return;
                _this.show();
            })
                .attr("src", newURL)
                .appendTo($container);
        };
        return PopupEx;
    }());
    DaumPopupDictionary.PopupEx = PopupEx;
})(DaumPopupDictionary || (DaumPopupDictionary = {}));
$(document).ready(function () {
    // 설정값 가져오기
    chrome.storage.sync.get({
        appEnabled: DaumPopupDictionary.Setting.g_appEnabled,
        popupWidth: DaumPopupDictionary.Setting.g_popupWidth,
        popupHeight: DaumPopupDictionary.Setting.g_popupHeight,
        popupPosition: DaumPopupDictionary.Setting.g_popupPosition
    }, function (items) {
        DaumPopupDictionary.Setting.g_appEnabled = items.appEnabled;
        DaumPopupDictionary.Setting.g_popupWidth = items.popupWidth;
        DaumPopupDictionary.Setting.g_popupHeight = items.popupHeight;
        DaumPopupDictionary.Setting.g_popupPosition = parseInt(items.popupPosition);
        if (DaumPopupDictionary.Setting.g_popupWidth < 300)
            DaumPopupDictionary.Setting.g_popupWidth = 300;
        if (DaumPopupDictionary.Setting.g_popupHeight < 200)
            DaumPopupDictionary.Setting.g_popupHeight = 200;
    });
    // 설정값 변경 이벤트 등록
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (var key in changes) {
            var storageChange = changes[key];
            if (key == "appEnabled") {
                DaumPopupDictionary.Setting.g_appEnabled = storageChange.newValue;
            }
            else if (key == "popupPosition") {
                DaumPopupDictionary.Setting.g_popupPosition = parseInt(storageChange.newValue);
            }
        }
    });
    document.addEventListener("selectionchange", function () {
        isSelectionChanged = true;
        if (popupMini && popupMini.isOpen()) {
            popupMini.close();
            $("#divSelectedText").remove();
        }
        if (popupIframe && popupIframe.isOpen()) {
            popupIframe.close();
            $("#divSelectedText").remove();
        }
    });
    var isSelectionChanged = false;
    var popupMini = null;
    var popupIframe = null;
    $(document.body).mouseup(function () {
        if (isSelectionChanged === false)
            return;
        var selectedText = DaumPopupDictionary.Utils.getSelectionText().trim();
        // 단어 검사
        if (selectedText == "")
            return;
        if (DaumPopupDictionary.StringHelper.checkSpace(selectedText))
            return;
        if (DaumPopupDictionary.StringHelper.checkSpecial(selectedText))
            return;
        // 비활성화일 경우 중지
        if (DaumPopupDictionary.Setting.g_appEnabled == false)
            return;
        // 테스트        
        $("#divSelectedText").remove();
        var rect = DaumPopupDictionary.Utils.getSelectionTextRect();
        $("<div>")
            .attr("id", "divSelectedText")
            .css("left", rect.left + window.scrollX)
            .css("top", rect.top + window.scrollY)
            .css("width", rect.right - rect.left)
            .css("height", rect.bottom - rect.top)
            .css("position", "absolute")
            .appendTo(document.body);
        //$("<div / >")
        //    .attr("id", "divSelectedText")
        //    .css("left", rect.left + window.scrollX + ((rect.right - rect.left)/2) )
        //    .css("top", rect.top + window.scrollY)
        //    .css("width", 1)
        //    .css("height", rect.bottom - rect.top)
        //    .css("position", "absolute")
        //    .appendTo(document.body);
        // 테스트 끝
        if (!popupMini) {
            popupMini = new DaumPopupDictionary.Popup({
                elementID: "divMiniPopup",
                onClickItem: popupMini_onClickItem
            });
        }
        var enabledItems = DaumPopupDictionary.Data.Urls.List.filter(function (item, index, array) {
            return item.enabled;
        });
        popupMini.create(selectedText, enabledItems);
        isSelectionChanged = false;
    });
    function popupMini_onClickItem(item) {
        // 팝업 닫기
        popupMini.close();
        // 동작
        var urlConverted = DaumPopupDictionary.Converter.URLFormatToURL(item.urlFormat, popupMini.selectedText);
        switch (item.targetWindow) {
            case DaumPopupDictionary.TargetWindowType.iframe:
                {
                    if (popupIframe === null) {
                        popupIframe = new DaumPopupDictionary.PopupEx("divPopup");
                    }
                    popupIframe.create(popupMini.selectedText, urlConverted);
                }
                break;
            case DaumPopupDictionary.TargetWindowType.new_tab:
                {
                    window.open(urlConverted);
                }
                break;
        }
    }
});
//# sourceMappingURL=contentscripts.js.map