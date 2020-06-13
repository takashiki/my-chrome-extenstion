window.onload = function () {

    document.getElementById('getUserId').addEventListener('click', function () {
        chrome.storage.local.get('userId', function (result) {
            console.log(result.userId);
        });
    }, false);

    document.getElementById('getBookId').addEventListener('click', function () {
        chrome.storage.local.get(['bookId'], function (result) {
            console.log(result.bookId);
        });
    }, false);

    document.getElementById('getReviews').addEventListener('click', function () {
        getNotes();
    }, false);
}

function getData(url, callback) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', url, true);
    httpRequest.withCredentials = true;
    httpRequest.send();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            let data = httpRequest.responseText;
            callback(data);
        }
    };
}

function getNotes() {

    let markdown = '## 书评\n\n';

    chrome.storage.local.get(['bookId'], function (result) {
        if (!result.bookId) {
            console.error('书籍ID获取失败');
            return;
        }

        let bookId = result.bookId;
        let bookReview = '';
        let sparks = [];
        let rangeMap = {};

        // 获取标注数据
        let bookmarkApi = 'https://i.weread.qq.com/book/bookmarklist?bookId=' + bookId + '&type=1';
        getData(bookmarkApi, function (data) {
            let json = JSON.parse(data);
            bookmarks = json.updated;
            for (var i = 0; i < bookmarks.length; i++) {
                let range = bookmarks[i].range;
                let count = sparks.push({
                    quote: bookmarks[i].markText,
                    range: range.split('-')[0],
                    chapterUid: bookmarks[i].chapterUid,
                    style: bookmarks[i].style,
                    comment: '',
                });
                rangeMap[range] = count - 1;
            }

            // 获取书评数据
            let reviewApi = 'https://i.weread.qq.com/review/list?bookId=' + bookId + '&listType=11&mine=1&synckey=0&listMode=0';
            getData(reviewApi, function (data) {
                let json = JSON.parse(data);
                reviews = json.reviews;
                for (var i = 0; i < reviews.length; i++) {
                    let range = reviews[i].review.range;
                    if (!range) {
                        // range 为空的记录是整本书的书评
                        bookReview = reviews[i].review.content;
                    } else if (range in rangeMap) {
                        // 如果评论的引用文本也被划过线，就合并到一条记录里
                        sparks[rangeMap[range]].comment = reviews[i].review.content;
                    } else {
                        sparks.push({
                            quote: reviews[i].review.abstract,
                            chapterUid: reviews[i].review.chapterUid,
                            range: range.split('-')[0],
                            style: 0,
                            comment: reviews[i].review.content,
                        });
                    }
                }

                // 书评写入 markdown
                markdown += bookReview + '\n\n';

                // 对评论和标注按照章节顺序排序
                /* sparks.sort(function (x, y) {
                    return (x['chapterUid'] == y['chapterUid']) ? 
                    (x['range'] - y['range']) : 
                    (x['chapterUid'] - y['chapterUid']);
                }); */

                // 获取章节信息
                let chapterApi = 'https://i.weread.qq.com/book/chapterInfos?bookIds=' + bookId + '&syncKeys=0';
                getData(chapterApi, function(data) {
                    let json = JSON.parse(data);
                    let chapters = json.data[0].updated;
                    for (i = 0; i < chapters.length; i++) {
                        let note = '';
                        sparks.forEach(spark => {
                            if (spark.chapterUid != chapters[i].chapterUid) {
                                return;
                            }
                            
                            note += '> ' + spark.quote + '\n\n';

                            if (spark.comment) {
                                note += spark.comment + '\n\n';
                            }
                        });

                        if (!note) {
                            continue;
                        }

                        let chapter = chapters[i];
                        let titleLevel = '#'.repeat(chapter.level + 2);
                        markdown += titleLevel + ' ' + chapter.title + '\n\n' + note;
                    }

                    console.log(markdown);
                });
            });
        });
    });
}