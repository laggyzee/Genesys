async function sendCannedMessage(responseId) {
    const platformClient = require('platformClient');
    const rapi = new platformClient.ResponseManagementApi();

    const conversationId = sessionStorage.getItem('gc_conversationId');
    const communicationId = sessionStorage.getItem('gc_communicationId');

    let opts = {
        "expand": "texts"
    };

    rapi.getResponsemanagementResponse(responseId, opts)
        .then((response) => {
            console.log(`getResponsemanagementResponse success! data: ${JSON.stringify(response, null, 2)}`);

            const content = response.texts[0].content;
            const plainText = extractTextFromHTML(content);

            const messageBody = {
                textBody: plainText
            };

            const capi = new platformClient.ConversationsApi();
            const opts = {
                "useNormalizedMessage": false
            };

            capi.postConversationsMessageCommunicationMessages(conversationId, communicationId, messageBody, opts)
                .then((data) => {
                    console.log(`postConversationsMessageCommunicationMessages success! data: ${JSON.stringify(data, null, 2)}`);
                })
                .catch((err) => {
                    console.log("There was a failure calling postConversationsMessageCommunicationMessages");
                    console.error(err);
                });
        })
        .catch((err) => {
            console.log("There was a failure calling getResponsemanagementResponse");
            console.error(err);
        });
}

function extractTextFromHTML(htmlString) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || '';
}

document.getElementById('away-message-btn').addEventListener('click', () => {
    sendCannedMessage('cbed3d48-a6a0-4253-ba5b-02ae4f2cf0e7');
});

document.getElementById('2fa-greenid-btn').addEventListener('click', () => {
    sendCannedMessage('20b43db2-df7f-4168-9d95-9d403b70f527');
});

document.getElementById('hold-message-btn').addEventListener('click', () => {
    sendCannedMessage('ea830f74-c5fb-42b0-bc4b-ef3b5f260c63');
});

document.getElementById('wrap-up-btn').addEventListener('click', () => {
    sendCannedMessage('63da658d-9f7d-4577-8104-8abbd6f53765');
});