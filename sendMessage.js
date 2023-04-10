document.querySelectorAll('gux-button').forEach(button => {
    button.addEventListener('click', () => {
        const responseId = button.getAttribute('data-id');
        if (responseId) {
            sendCannedMessage(responseId);
        }
    });
});


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

// Add this function to sendMessage.js

async function getExternalContactId(conversationId) {
    try {
      const data = await apiInstance.getAnalyticsConversationDetails(conversationId);
      
      const customerParticipant = data.participants.find(participant => participant.purpose === 'customer');
  
      if (customerParticipant) {
        const externalContactId = customerParticipant.externalContactId;
        console.log('External Contact ID:', externalContactId);
        return externalContactId;
      } else {
        console.log('Customer participant not found');
      }
    } catch (err) {
      console.log("There was a failure calling getAnalyticsConversationDetails");
      console.error(err);
    }
  }
  

  async function fetchData(conversationId) {
    const externalContactId = await getExternalContactId(conversationId);
    getLastThreeConversations(externalContactId);
  }
  
  function getLastThreeConversations(externalContactId) {
    const endDate = moment().toISOString();
    const startDate = moment().subtract(29, 'days').toISOString();
  
    const body = {
      "interval": `${startDate}/${endDate}`,
      "order": "asc",
      "orderBy": "conversationStart",
      "paging": {
        "pageSize": "3",
        "pageNumber": 1
      },
      "segmentFilters": [
        {
          "type": "and",
          "predicates": [
            {
              "type": "dimension",
              "dimension": "externalContactId",
              "operator": "matches",
              "value": externalContactId
            }
          ]
        }
      ]
    };
  
    apiInstance.postAnalyticsConversationsDetailsQuery(body)
      .then((data) => {
        console.log(`postAnalyticsConversationsDetailsQuery success! data: ${JSON.stringify(data, null, 2)}`);
      })
      .catch((err) => {
        console.log("There was a failure calling postAnalyticsConversationsDetailsQuery");
        console.error(err);
      });
  }
  