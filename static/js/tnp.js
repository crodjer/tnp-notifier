/*
*   tnp-notifier: Traning and Placements Notices, Chrome Notifier
*   Copyright (C) 2011 Rohan Jain
*
*   This program is free software: you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var noticBoardURL = 'http://tp.iitkgp.ernet.in/notice/';
var noticeBaseURL = 'http://tp.iitkgp.ernet.in/notice/notice.php?sr_no='
var noticeDuration = 4000;
var noticeOverFlowLimit = 3;


function getNoticeCount(){
    return localStorage.getItem('unseenNotices');
}

function showNoticeCount(){
    chrome.browserAction.setBadgeText({text:getNoticeCount()});
}

function incrementNoticeCount(count){
    unseenNotices = Number(getNoticeCount());
    unseenNotices += count;
    localStorage.setItem('unseenNotices', unseenNotices.toString());
    showNoticeCount();
}

function clearNoticeCount(){
    localStorage.setItem('unseenNotices', '');
    showNoticeCount();
}

function notifier(notices){
    /*
    * Notifire for new notices. It can be improved by writing in an object
    * oriented way.
    */

    if (notices.length <= noticeOverFlowLimit ){
        $.each(notices, function(){
            notice = this;
            var notification = window.webkitNotifications.createNotification(
                'static/img/icon.jpg', 'T&P Update: ' + notice['time'], notice['title']);

            // Update and set the notices count
            incrementNoticeCount(1);

            notification.onclick = function(){
                window.open(noticeBaseURL + notice.id.toString() ,'_newtab');
                notification.cancel();
            };

            notification.ondisplay = function(){
                // Play the notification tune
                document.getElementById("notification-sound").play();

                // Remove the notification after some time
                setTimeout(function(){
                    notification.cancel();
                }, noticeDuration);
            }

            notification.show();
        });
    }

    // To many new notices. Don't display them all, just notify the count.
    else{
        var notification = window.webkitNotifications.createNotification(
            'static/img/icon.jpg', 'T&P Update', notices.length + ' new notices');

        // Update and set the notices count
        incrementNoticeCount(notices.length);

        notification.onclick = function(){
                window.open(noticBoardURL,'_newtab');
                notification.cancel();
            };

        notification.ondisplay = function(){
            // Play the notification tune
            document.getElementById("notification-sound").play();

            // Remove the notification after some time
            setTimeout(function(){
                notification.cancel();
            }, noticeDuration);
        }

        notification.show();
    }
}

function checkNotices(notifyFunction, displayFunction){
    /*
    * Checks for new notices and stores them in the local storage. Can
    * be used to notify about notices through notifyFunction argument
    * and display them (in popup) through displayFunction argument.
    */

    // Prevent a notices notification overflow on the installation of the
    // plugin.
    if (localStorage.getItem('setup-done')){
        notify = (typeof(notifyFunction)!='undefined')? true:false;
    }
    else{
        notify = false;
        localStorage.setItem('setup-done', true);
    }

    $.ajax({
        url: noticBoardURL,
        success: function(data){
            var notices = [];
            var lastID = 0;
            $("table tr", data).each(function(){
                cells = $("td", this);

                if (cells.length == 3){
                    titleElem = $("a", cells[2])[0];
                    // The ID of the notice
                    id = titleElem.getAttribute('href').match(/\d+/gi, '')[0],
                    stored_notice = localStorage.getItem(id);

                    // If an already stored notice exists
                    if (stored_notice){
                        console.log('Notice exists in storage');
                        notice = JSON.parse(stored_notice);
                    }

                    else{
                        // Get the rest info of notice, store and notify about
                        // it.
                        timeElem = $("font", cells[0])[0];
                        attachElem = cells[1];

                        notice = {
                            'id': id,
                            'title': titleElem.text,
                            'time': timeElem.innerHTML,
                            'attachment': $.trim(attachElem.innerHTML.replace(/&nbsp;/gi, '')) ? true:false
                        }

                        localStorage.setItem(id, JSON.stringify(notice));
                        notices.push(notice);
                    }

                    if (displayFunction){
                        displayFunction(notice);
                    }
                }
            });

            if(notices.length > 0 && notifyFunction && notify){
                notifyFunction(notices);
            }
        }
    });
}
