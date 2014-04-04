var unmark              = (unmark === undefined) ? {} : unmark;
unmark.bookmarks        = {};
unmark.bookmarks.list   = [];
unmark.bookmarks.totals = {};
unmark.bookmarks.timers = {};
unmark.bookmarks.to_save = [];
unmark.bookmarks.current_w = 0;

unmark.bookmarks.digest = function()
{
    unmark.bookmarks.totals.total      = $('input[id^="import-"]:checked').length;
    unmark.bookmarks.totals.success    = 0;
    unmark.bookmarks.totals.failed     = 0;
    unmark.bookmarks.totals.processed  = 0;
    unmark.bookmarks.to_save           = [];
    unmark.bookmarks.current_w         = 0;

    if (unmark.bookmarks.totals.total > 0) {
        $('#progress').html('0%').fadeIn('fast').width('25px');
        var eyed = '';
        $('input[id^="import-"]:checked').each(function()
        {
            eyed = $(this).attr('id').split('-')[1];
            unmark.bookmarks.to_save.push('url=' + unmark.urlEncode(unmark.bookmarks.list[eyed].url) + '&title=' + unmark.urlEncode(unmark.bookmarks.list[eyed].title) + '&notes=' + unmark.urlEncode('#chromeImport'));
        });
        unmark.bookmarks.save();

        unmark.bookmarks.timers.message = setInterval(function()
        {
            if (unmark.bookmarks.totals.total == unmark.bookmarks.totals.processed) {
                clearInterval(unmark.bookmarks.timers.message);
                unmark.bookmarks.writeMessage(unmark.bookmarks.totals.success + ' out of ' + unmark.bookmarks.totals.total + ' bookmarks successfully saved to Unmark.');
                $('#progress').fadeOut();
            }
        }, 1);
    }
    else {
        unmark.bookmarks.writeMessage('Please select at least one bookmark to import.');
    }
};

unmark.bookmarks.fail = function(obj)
{
    var status = obj.status || -1;
    var err    = (status == '500' || status == '404' || obj.error === undefined) ? 'Something went wrong.' : (status == '403') ? 'Please log into your account first and then try again.' : obj.error;
    status     = (status > 0 && status != '403') ? ' (' + status + ')' : '';
    unmark.bookmarks.writeMessage(err + status);
};

unmark.bookmarks.get = function(bookmarks)
{
    bookmarks.forEach(function(bookmark) {
        if (bookmark.children && bookmark.children.length > 0) {
            unmark.bookmarks.get(bookmark.children);
        }
        else if (bookmark.url !== undefined && bookmark.url.indexOf('http') == 0) {
            unmark.bookmarks.list.push({'title': bookmark.title, 'url': bookmark.url, 'id': bookmark.id});
        }
    });
};

unmark.bookmarks.save = function()
{
    if (unmark.bookmarks.to_save.length > 0) {
        unmark.ajax(unmark.paths.add, unmark.bookmarks.to_save.shift(), 'POST',
        function(obj)
        {
            if (obj.mark) {
                unmark.bookmarks.totals.success += 1;
            }
            else {
                unmark.bookmarks.totals.failed += 1;
            }
            unmark.bookmarks.update();
        },
        function(obj)
        {
            unmark.bookmarks.totals.failed    += 1;
            unmark.bookmarks.update();
        });
    }
};

unmark.bookmarks.set = function()
{
    var bookmarks = $('#bookmarks');
    for (var i in unmark.bookmarks.list) {
        bookmarks.append('<input type="checkbox" id="import-' + i + '" name="bookmark-' + i + '">&nbsp;&nbsp;<label for="import-' + i + '">' + unmark.bookmarks.list[i].title + '</label><br>');
    }
};

unmark.bookmarks.update = function()
{
    var max_width  = 800;
    var min_width  = 25;
    var growth_per = Math.floor(max_width / unmark.bookmarks.totals.total);
    unmark.bookmarks.totals.processed += 1;
    unmark.bookmarks.current_w += growth_per;
    unmark.bookmarks.current_w = (unmark.bookmarks.current_w < min_width) ? min_width : unmark.bookmarks.current_w;
    unmark.bookmarks.current_w = (unmark.bookmarks.current_w > max_width) ? max_width : unmark.bookmarks.current_w;
    $('#progress').width(unmark.bookmarks.current_w + 'px').html(Math.ceil((unmark.bookmarks.totals.processed / unmark.bookmarks.totals.total) * 100) + '%');
    unmark.bookmarks.save();
};

unmark.bookmarks.writeMessage = function(msg)
{
    $('#message').html(msg).slideDown('fast');
};

chrome.bookmarks.getTree(function(bookmarks)
{
  unmark.bookmarks.get(bookmarks);
  unmark.bookmarks.set();
});

/*chrome.bookmarks.onCreated.addListener(function(id, bookmark)
{

});*/

$(document).ready(function()
{

    $('#select').click(function(e)
    {
        e.preventDefault();
        $('input[id^="import-"]').prop('checked', true);
    });

    $('#deselect').click(function(e)
    {
        e.preventDefault();
        $('input[id^="import-"]').prop('checked', false);
    });

    $('#digest').click(function(e)
    {
        e.preventDefault();
        unmark.ajax(unmark.paths.ping, '', 'GET', unmark.bookmarks.digest, unmark.bookmarks.fail);
    });
});