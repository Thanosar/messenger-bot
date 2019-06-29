const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const PAGE_ACCESS_TOKEN = 'EAAGc6IGuD6kBAPknO2ZAG19m1UwIrBZCao5BxdtYfoujlr5WPHSBpkFPRRcN67fsQlQN0fOu0qrgJsj9Lr4v1fS5EiYrck2R0jpmAWSALBOMprO1UoNriZAEYEJSL6ZCmPa48L6xsai1cAImxB4B45DQ229ZBNlXv6BZAdPSQZAmFh0B9ZADMIdqglftZCBIjgHcZD';

const app = express();

app.use(bodyParser.json());


// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

    let body = req.body;

    if (body.object === 'page') {

        body.entry.forEach(function (entry) {

            let webhook_event = entry.messaging[0];
            let sender_psid = webhook_event.sender.id;

            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });


        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === PAGE_ACCESS_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});


async function handleMessage(sender_psid, received_message) {
    let response;

    let user = await _getUser(sender_psid);

    if (received_message.text) {

        switch (received_message.text) {
            case 'Γειά':
            case 'Καλησπέρα':
            case 'Καλημέρα':
            case 'Γεια σας':
            case 'hello':
            case 'hi':
                response = {
                    "text": `${received_message.text} ${user}. Καλωσήρθατε στην μηχανή αναζήτησης πακέτων του 18-24 Travel!`
                };
                break;

            default:
                response = {
                    "text": `Καλωσήρθατε ${user} στην μηχανή αναζήτησης πακέτων του 18-24 Travel!`
                }
        }

    } else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }
    callSendAPI(sender_psid, response);
}


function handlePostback(sender_psid, received_postback) {

}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    axios.post(`https://graph.facebook.com/v2.6/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, request_body)
        .then(res => {
            console.log('message sent!')
        })
        .catch((e) => {
            console.log(console.error("Unable to send message:" + e));
        });
}

async function _getUser(id) {
    let user = {
        first_name: "",
        last_name: "",
        id: "",
    };
    await axios.get(`https://graph.facebook.com/${id}?fields=first_name,last_name&access_token=${PAGE_ACCESS_TOKEN}`)
        .then(res => {
            user = res.data
        })
        .catch(e => console.log(e));
    return user ? user.first_name + ' ' + user.last_name : "";
}

app.listen(3000, () => {
    console.log('Server runs on port 3000');
});
