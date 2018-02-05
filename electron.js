var electron = require('electron'),
    storage = require('electron-json-storage'),
    setCookie = require('set-cookie-parser'),
    mainWindow;

function loadApp(oauth_code) {
    mainWindow.loadURL('file://' + __dirname + '/www/index.html?oauth_code=' + oauth_code);
}

function getOauthCookie(cookie) {
    if (cookie.name === 'oauth_code') {
        storage.set('oauth_code', {oauth_code: cookie.value});
        loadApp(cookie.value);
    }
}

function getCookies(error, cookies) {
    cookies.forEach(getOauthCookie);
}

function getOauthCode() {
    if (mainWindow.getURL().indexOf('/o/oauth2/programmatic_auth') > 0) {
        electron.session.defaultSession.cookies.get({}, getCookies);
    }
}

function checkStoredOauthCode(error, data) {
    if (data.oauth_code) {
        loadApp(data.oauth_code);
    } else {
        mainWindow.loadURL('https://accounts.google.com/o/oauth2/programmatic_auth?hl=en&scope=https%3A%2F%2Fwww.google.com%2Faccounts%2FOAuthLogin+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&client_id=936475272427.apps.googleusercontent.com&access_type=offline&delegated_client_id=183697946088-m3jnlsqshjhh5lbvg05k46q1k4qqtrgn.apps.googleusercontent.com&top_level_cookie=1');
    }
}

function createWindow() {
    mainWindow = new electron.BrowserWindow();
    mainWindow.webContents.on('did-finish-load', getOauthCode);
    electron.session.defaultSession.webRequest.onBeforeSendHeaders(function (details, callback) {
        details.requestHeaders.origin = 'talkgadget.google.com';
        callback({cancel: false, requestHeaders: details.requestHeaders});
    });
    electron.session.defaultSession.webRequest.onHeadersReceived([], function (details, callback) {
        if (mainWindow.getURL().indexOf('SAPISID') < 0 && details.responseHeaders['set-cookie']) {
            var cookies = setCookie.parse(details.responseHeaders['set-cookie'])
            cookies.forEach(function (cookie) {
                if (cookie.name == 'SAPISID') {
                    storage.get('oauth_code', function (error, data) {
                        //mainWindow.loadURL('file://' + __dirname + '/www/index.html?oauth_code=' + data.oauth_code + '&SAPISID=' + cookie.value);
                        mainWindow.webContents.executeJavaScript(
                            "window.store.putCookie(new tough.Cookie({key: 'SAPISID',value: '" + cookie.value + "', domain: 'talkgadget.google.com', path: '/', secure: true }), function (error) { if (error) { console.log(error); } } );"
                        );
                    });
                }
            });
        }
        callback({});
    })
    storage.get('oauth_code', checkStoredOauthCode);
}

electron.app.on('ready', createWindow);
