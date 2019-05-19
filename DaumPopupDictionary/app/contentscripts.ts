namespace DaumPopupDictionary {

    export enum PopupPosition {
        under,
        over,
    }

    export enum TargetWindowType {
        iframe = 0,
        new_tab,
    }

    export interface PopupItem {
        id: number,
        name: string,
        tooltip?: string,
        urlFormat: string,
        urlImg: string,
        enabled: boolean,
        targetWindow: TargetWindowType // 0: iframe, 1: new tab
    }

    export class Setting  {
        static g_appEnabled:boolean = true;
        static g_popupWidth:number = 300;
        static g_popupHeight: number = 400;

        static g_popupPosition: PopupPosition = PopupPosition.under;
    }

    export module Data {

        //export class Default  {
        //    static mainUrlName: string = "Daum(mobile)";
        //}

        export class Urls {
            //static getMainUrlInfo() {                        
            //    return this.List.find(function (item) {
            //        return item.name.toLowerCase() == DaumPopupDictionary.Data.Default.mainUrlName.toLowerCase();
            //    });
            //}

            static List: Array<PopupItem> = [
                {
                    id: 1,
                    name: "Daum(mobile)",
                    tooltip: "팝업 검색하기",
                    urlFormat: 'https://m.dic.daum.net/search.do?q={searchtext:endode}&dic=all',
                    urlImg: chrome.extension.getURL("img/3d-dictionary32.png"),
                    enabled: true,
                    targetWindow: TargetWindowType.iframe // 0: iframe, 1: new tab
                },
                {
                    id: 2,
                    name: "Daum",
                    tooltip: "새 탭에서 검색하기",
                    urlFormat: 'https://search.daum.net/search?w=tot&DA=YZR&t__nil_searchbox=btn&sug=&sugo=&q={searchtext:endode}',
                    urlImg: chrome.extension.getURL("img/3d-dictionary32(new).png"),
                    enabled: true,
                    targetWindow: TargetWindowType.new_tab // 0: iframe, 1: new tab
                },
                {
                    id: 3,
                    name: "Naver(mobile)",
                    urlFormat: 'https://m.krdic.naver.com/search/all/0/{searchtext:endode}?format=HTML&isMobile=true',
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
            ]
        };
    }

    export class StringHelper  {
        static checkSpace(str) {
            if (str.search(/\s/) != -1) {
                return true;
            } else
                return false;
        }

        static checkSpecial(str) {
            var pattern = /[~!@\#$%^&*\()\-=+_']/gi;

            return pattern.test(str);
        }

        static checkHangul(str) {
            var pattern = /^[가-힝]*$/; ///^[0-9a-zA-Z가-힝]*$/;

            return pattern.test(str);
        }
    };

    export class Converter  {
        static URLFormatToURL(urlFormat, searchtext) {

            var trans = "";

            if (urlFormat.indexOf("{searchtext:endode}") >= 0)
                trans = urlFormat.replace("{searchtext:endode}", encodeURIComponent(searchtext));

            return trans;
        }
    };

    export class Utils {
    
        static getSelectionText() {
            var text = "";
            var activeEl: any = document.activeElement;
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

        static getSelectionTextRect() {
            var sel = window.getSelection();
            var range = sel.getRangeAt(0).cloneRange();
            var rects = range.getClientRects();

            var minTop = 99999;
            var minLeft = 99999;
            var maxRight = 0;
            var maxBottom = 0;

            if (rects.length == 0)
                return null;

            for (var i = 0; i < rects.length; i++) {
                var item = rects[i];

                minTop = Math.min(minTop, item.top);
                minLeft = Math.min(minLeft, item.left);
                maxRight = Math.max(maxRight, item.right);
                maxBottom = Math.max(maxBottom, item.bottom);
            }

            return { top: minTop, right: maxRight, bottom: maxBottom, left: minLeft };
        }
    }

    export interface PopupOptions {
        elementID: string;
        onClickItem: (item: PopupItem) => void;
    }

    export class Popup {
        elementID: string;

        onClickItem: (item: PopupItem) => void;

        selectedText: string;

        popupIframe: DaumPopupDictionary.PopupEx;

        constructor(options: PopupOptions) {
            this.elementID = options.elementID;
            this.onClickItem = options.onClickItem;
        }

        isOpen(): boolean {
            if ($("#" + this.elementID).dialog("instance") == undefined)
                return false;

            return $("#" + this.elementID).dialog("isOpen");
        }

        close(): void {
            //console.log("mini close()");

            $("#" + this.elementID).dialog("close");
            $("#" + this.elementID).remove();
        }

        show(): void {
            //console.log("mini show()");

            let pos_my: string = "";
            let pos_at: string = "";

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
                    $('.ui-dialog-mini-popup').css("zIndex", 99999);                    
                },
            });
        }

        create(selectedText: string, popupItems: Array<DaumPopupDictionary.PopupItem>): void {
            //console.log("mini create()");

            this.selectedText = selectedText;

            var $container = $("<div>")
                .attr("id", this.elementID)
                .addClass("dpd-popup-box")
                .appendTo(document.body);

            popupItems.forEach((item, index, array) => {

                $("<img>")
                    .addClass("dpd-popup-box-img")
                    .attr("src", item.urlImg)
                    .attr("title", item.tooltip)
                    .button()
                    .click(() => {
                        if (this.onClickItem)
                            this.onClickItem(item);
                    })
                    .appendTo($container);                
            });

            this.show();
        }
    }

    export class PopupEx {
        elementID: string;

        constructor(eleID: string) {
            this.elementID = eleID;
        }

        isOpen(): boolean {
            if ($("#" + this.elementID).dialog("instance") == undefined)
                return false;

            return $("#" + this.elementID).dialog("isOpen");
        }

        close(): void {
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
        }

        show(): void {
            //console.log("popupEx show()");

            let pos_my: string = "";
            let pos_at: string = "";

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
                position:
                {
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

                minWidth: 300,
                minHeight: 400,

                show: { effect: "fade", duration: 500 },
                hide: { effect: "fade", duration: 500 },

                create: function (event, ui) {
                    $('.ui-dialog-titlebar').hide();
                    $('.ui-dialog-titlebar').parent().css("zIndex", 99999);
                },
            });
        }

        create(selectedText: string, newURL?): void {
            //console.log("popupEx create()");

            var $container = $("<div>")
                                        .attr("id", this.elementID)
                .addClass("dpd-popup-result-container")
                                        .appendTo(document.body);

            $("<iframe>")
                .attr("id", "iframePopup")
                .addClass("dpd-popup-result-iframe")
                .on("load", (event) => {
                    if (this.isOpen())
                        return;

                    this.show();
                })
                .attr("src", newURL)
                .appendTo($container);
        }
    }
}

$(document).ready(function () {    

    // 설정값 가져오기
    chrome.storage.sync.get({
        appEnabled: DaumPopupDictionary.Setting.g_appEnabled,
        popupWidth: DaumPopupDictionary.Setting.g_popupWidth,
        popupHeight: DaumPopupDictionary.Setting.g_popupHeight,
        popupPosition: DaumPopupDictionary.Setting.g_popupPosition
    }, function (items: any) {
        DaumPopupDictionary.Setting.g_appEnabled = items.appEnabled;
        DaumPopupDictionary.Setting.g_popupWidth = items.popupWidth;
        DaumPopupDictionary.Setting.g_popupHeight = items.popupHeight;
        DaumPopupDictionary.Setting.g_popupPosition = parseInt(items.popupPosition);

        if (DaumPopupDictionary.Setting.g_popupWidth < 300)
            DaumPopupDictionary.Setting.g_popupWidth = 300;

        if (DaumPopupDictionary.Setting.g_popupHeight < 400)
            DaumPopupDictionary.Setting.g_popupHeight = 400;
    });

    // 설정값 변경 이벤트 등록
    chrome.storage.onChanged.addListener(function (changes, namespace) {

        for (let key in changes) {
            var storageChange = changes[key];

            if (key == "appEnabled") {
                DaumPopupDictionary.Setting.g_appEnabled = storageChange.newValue;
            }else if (key == "popupPosition") {
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
    var popupMini: DaumPopupDictionary.Popup = null;
    var popupIframe: DaumPopupDictionary.PopupEx = null;

    $(document.body).mouseup(function () {

        if (isSelectionChanged === false)
            return;

        var selectedText = DaumPopupDictionary.Utils.getSelectionText().trim();

        // 단어 검사
        if (selectedText == "")
            return;
        // 스페이스 포함여부 검사
        //if (DaumPopupDictionary.StringHelper.checkSpace(selectedText))
        //    return;
        // 특수문자 포함여부 검사
        if (DaumPopupDictionary.StringHelper.checkSpecial(selectedText))
            return;

        // 비활성화일 경우 중지
        if (DaumPopupDictionary.Setting.g_appEnabled == false)
            return;

        // 테스트        
        $("#divSelectedText").remove();

        var rect = DaumPopupDictionary.Utils.getSelectionTextRect();

        if (rect == null)
            return;

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

        let enabledItems: Array<DaumPopupDictionary.PopupItem> =
            DaumPopupDictionary.Data.Urls.List.filter((item, index, array) => {            
                return item.enabled;
            });

        popupMini.create(selectedText, enabledItems);

        isSelectionChanged = false;
    });

    function popupMini_onClickItem(item: DaumPopupDictionary.PopupItem) {

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

    // 다음 모바일 페이지의 상단 검색창에 포커스가 이동할 경우 기본값으로 해당 검색어가 들어가도록 함.(안드로이드 버전과 동일)
    $("input#q.tf_keyword").focus(function () {
        var keyword = $("input#q.tf_keyword").attr("value"); $("input#q.tf_keyword").val(keyword);
    });
});