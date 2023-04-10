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
      "order": "desc",
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

      // Process and display the data in the table
      displayConversationsInTable(data.conversations);
    })
    .catch((err) => {
      console.log("There was a failure calling postAnalyticsConversationsDetailsQuery");
      console.error(err);
    });
}

async function fetchWrapUpCodeName(codeId) {
    const routingApiInstance = new platformClient.RoutingApi();
  
    try {
      const wrapUpData = await routingApiInstance.getRoutingWrapupcode(codeId);
      return wrapUpData.name;
    } catch (err) {
      console.log("There was a failure calling getRoutingWrapupcode");
      console.error(err);
      return '-';
    }
  }
  
  async function displayConversationsInTable(conversations) {
    const tableBody = document.querySelector('#conversations-table tbody');
    tableBody.innerHTML = ''; // Clear the table body
  
    for (const conversation of conversations) {
      const customerParticipant = conversation.participants.find(participant => participant.purpose === 'customer') || 
                                   conversation.participants.find(participant => participant.purpose === 'external');
      const agentParticipant = conversation.participants.find(participant => participant.purpose === 'agent');
  
      if (!customerParticipant || !agentParticipant) {
        console.error('Missing customer/external or agent participant for conversation:', conversation.conversationId);
        continue; // Skip this conversation
      }
  
      const mediaType = customerParticipant.sessions[0].mediaType;
      const interactionStarted = formatDate(conversation.conversationStart);
  
      // Get wrap up data from the agent participant's segments
      const wrapUpSegment = agentParticipant.sessions[0].segments.find(segment => segment.segmentType === 'wrapup');
      const lastWrapUpCode = wrapUpSegment ? wrapUpSegment.wrapUpCode || '-' : '-';
      const wrapUpNotes = wrapUpSegment ? wrapUpSegment.wrapUpNote || '-' : '-';
  
      // Get the human-readable wrap-up code
      const wrapUpCodeName = await fetchWrapUpCodeName(lastWrapUpCode);
  
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${mediaType}</td>
        <td>${interactionStarted}</td>
        <td>${wrapUpCodeName}</td>
        <td>${wrapUpNotes}</td>
      `;
  
      tableBody.appendChild(row);
    }
  }
  
  
  
  
  
  