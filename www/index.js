process.stdout = require('browser-stdout')();
var Client = require('hangupsjs'),
    simpleQueryString = require('simple-query-string'),
    tough  = require('tough-cookie'),
    store = new tough.MemoryCookieStore(),
    params = {};

if (typeof window === 'object') {
    window.tough = tough;
    window.store = store;
    params = simpleQueryString.parse(window.location.search);
}

var creds = function() {
  return {
    auth: function () {
        return params.oauth_code;
    }
  };
};

var client = new Client(
    {
        jarstore: store,
        rtokenpath: 'foo.txt'
    }
);

client.loglevel('debug');
client.on('connected', function () {
    client.syncrecentconversations().then(
        function (result) {
            result.conversation_state.forEach(
                function (conversation) {
                    var participants = '';
                    conversation.conversation.participant_data.forEach(
                        function (participant) {
                            if (participant.fallback_name) {
                                participants += participant.fallback_name + ', ';
                            }
                        }
                    )
                    document.getElementById('convList').insertAdjacentHTML('beforeend', '<li>' + participants + '</li>');
                }
            );
        }
    );
});
client.connect(creds);
