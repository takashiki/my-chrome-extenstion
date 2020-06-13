let element = document.getElementsByClassName('wr_bookCover_img');
let list = element.item(0).src.split('/');
let bookId = list[list.length - 2];
chrome.storage.local.set({
    'bookId': bookId
}, function() {
    console.log('书籍ID: ' + bookId + ' 已保存');
});

chrome.runtime.sendMessage({injected: true}, function(response) {
	console.log('收到来自后台的回复：' + response);
});