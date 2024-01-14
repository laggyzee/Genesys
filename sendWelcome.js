'use strict' //Enables strict mode is JavaScript

let gc_region = getParameterByName('gc_region')
let gc_clientId = getParameterByName('gc_clientId')
let gc_redirectUrl = getParameterByName('gc_redirectUrl')
let gc_interactionState = getParameterByName('gc_interactionState')
let gc_conversationId = getParameterByName('gc_conversationId')
let gc_communicationId = getParameterByName('gc_communicationId')
let gc_messageType = getParameterByName('gc_messageType')
let pdr_brand = getParameterByName('pdr_brand')

let body = {
  textBody: "Hi, Welcome to Coles Mobile. How can I help you today?"
};

let opts = {
  "useNormalizedMessage": false // Boolean | If true, response removes deprecated fields (textBody, media, stickers)
};

gc_region ? sessionStorage.setItem('gc_region', gc_region) : gc_region = sessionStorage.getItem('gc_region')
gc_clientId ? sessionStorage.setItem('gc_clientId', gc_clientId) : gc_clientId = sessionStorage.getItem('gc_clientId')
gc_redirectUrl ? sessionStorage.setItem('gc_redirectUrl', gc_redirectUrl) : gc_redirectUrl = sessionStorage.getItem('gc_redirectUrl')
gc_interactionState ? sessionStorage.setItem('gc_interactionState', gc_interactionState) : gc_interactionState = sessionStorage.getItem('gc_interactionState')
gc_conversationId ? sessionStorage.setItem('gc_conversationId', gc_conversationId) : gc_conversationId = sessionStorage.getItem('gc_conversationId')
gc_communicationId ? sessionStorage.setItem('gc_communicationId', gc_communicationId) : gc_communicationId = sessionStorage.getItem('gc_communicationId')
gc_messageType ? sessionStorage.setItem('gc_messageType', gc_messageType) : gc_messageType = sessionStorage.getItem('gc_messageType')
pdr_brand ? sessionStorage.setItem('pdr_brand', pdr_brand) : pdr_brand = sessionStorage.getItem('pdr_brand')

let platformClient = require('platformClient')
const client = platformClient.ApiClient.instance
const uapi = new platformClient.UsersApi()
const capi = new platformClient.ConversationsApi();
const convApi = new platformClient.ConversationsApi();
const wmapi = new platformClient.WebMessagingApi();
const napi = new platformClient.NotificationsApi();

window.conversationId = gc_conversationId;

async function start() {
  try {
    client.setEnvironment(gc_region)
    client.setPersistSettings(true, '_mm_')

    console.log('%cLogging in to Genesys Cloud', 'color: green')
    await client.loginImplicitGrant(gc_clientId, gc_redirectUrl, {})

    // GET Current UserId
    let user = await uapi.getUsersMe({})
    window.currentUserId = user.id; // Store the user ID in a global variable
    console.log("User object: ", user) // Add this line to inspect the user object
    let agentName = user.name;
    let agentFirstName = agentName.split(' ')[0]; // Split the name and get the first part (first name)

    // Update the textBody with agentFirstName
    body.textBody = `Hi, you're speaking with ${agentFirstName}, how can I help you today?`;

    console.log(gc_communicationId)
    console.log(gc_conversationId)

    //Set the variables on the HTML page
    document.getElementById('communicationId').textContent = gc_communicationId;
    document.getElementById('interactionState').textContent = gc_interactionState;
    document.getElementById('conversationId').textContent = gc_conversationId;

    await checkConnectionAndSendMessage(body.textBody)

    //Enter in additional starting code.
    try {
      // Need to store wss as only can have 15 per agent. Also bad practice to create multiple
      if (sessionStorage.getItem("gc_channelid")) {
        console.log("channelid already exists...");
        var channelid = sessionStorage.getItem("gc_channelid");

        let callsTopic = `v2.users.${user.id}.conversations.messages`;
        // prettier-ignore
        await napi.postNotificationsChannelSubscriptions(channelid, [{id: callsTopic}])
        console.log(
          `%cSubscribed to topic ${callsTopic}`,
          "color: green"
        );
      } else {
        let channel = await napi.postNotificationsChannels();
        console.log("Created Notification Channel: ", channel);

        let callsTopic = `v2.users.${user.id}.conversations.messages`;
        // prettier-ignore
        await napi.postNotificationsChannelSubscriptions(channel.id, [{id: callsTopic}])
        console.log(`Subscribed to topic ${callsTopic}`);
        sessionStorage.setItem("gc_channelid", channel.id);
      }
    } catch (err) {
      console.error("Notification Error: ", err);
    }

    // Create websocket for events
    try {
      let socket = new WebSocket(
        `wss://streaming.${gc_region}/channels/${sessionStorage.getItem(
          "gc_channelid"
        )}`
      );

      let handlingFailure = false;

      socket.onmessage = async function (event) {
        let details = JSON.parse(event.data);
        if (details.topicName.includes("messages")) {
          let agentParticipant = details.eventBody.participants
            .slice()
            .reverse()
            .find(
              (p) => p.purpose === "agent" && p.state === "connected"
            );
          if (agentParticipant) {
            let failedMessage = agentParticipant.messages?.find(
              (msg) => msg.messageStatus === "delivery-failed"
            );
            if (failedMessage && !handlingFailure) {
              handlingFailure = true;
              console.log(
                "Found a message that failed delivery. Sending a final message to the customer and disconnecting the participant..."
              );
              try {
                let conversationId = details.eventBody.id;
                let participantId = agentParticipant.id;
                let body = { state: "disconnected" };
      
                // Send the final message to the customer before disconnecting
                await sendMessage("It appears that you've stepped away from our chat. For now, we'll be ending this conversation, but please don't hesitate to reconnect whenever you're ready. Rest assured, your conversation history will remain accessible, so you can easily pick up where you left off. We're always here to assist you with any further inquiries or concerns you may have. Take care!");
      
                // Then disconnect the participant
                await capi.patchConversationParticipant(conversationId, participantId, body);
                console.log("Participant disconnected");
                handlingFailure = false;
              } catch (err) {
                console.error("Error while disconnecting the participant: ", err);
                handlingFailure = false;
              }
            }
          }
        }
      };

    } catch (err) {
      console.error("Websocket Error: ", err);
    } 

  } catch (err) {
    console.log('Error: ', err)
  }
} // End of start() function


async function checkConnectionAndSendMessage(message) {
  let intervalId = setInterval(async () => {
    if (gc_interactionState === 'Connected' && !sessionStorage.getItem(`messageSent-${gc_conversationId}`)) {
      await sendMessage(message)
      clearInterval(intervalId)
    }
  }, 1000) // Check every 1 seconds
}

async function sendMessage(message) {
  try {
    let messageBody = {
      textBody: message
    };
    await capi.postConversationsMessageCommunicationMessages(gc_conversationId, gc_communicationId, messageBody, opts)
    console.log(`Message sent successfully: ${message}`)
    sessionStorage.setItem(`messageSent-${gc_conversationId}`, true)
  } catch (err) {
    console.log("There was a failure calling postConversationsMessageCommunicationMessages")
    console.error(err)
  }
}


// JavaScript Native way to get Url Parameters for config
function getParameterByName(name, url) {
  if (!url) url = window.location.href
  name = name.replace(/[\[\]]/g, '\\$&')
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}
