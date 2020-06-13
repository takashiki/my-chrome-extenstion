function setUserId() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        let url = tabs[0].url;
        chrome.cookies.get({
            url: url,
            name: 'wr_vid'
        }, function (cookie) {
            if (cookie == null) {
                console.log("获取cookie失败");
            } else {
                let userId = cookie.value.toString();
                chrome.storage.local.set({
                    'userId': userId
                }, function () {
                    console.log('用户ID: ' + userId + ' 已保存');
                });
            }
        });
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    setUserId();
});