'use strict' //Enables strict mode is JavaScript
let gc_region = getParameterByName('gc_region')
let gc_clientId = getParameterByName('gc_clientId')
let gc_redirectUrl = getParameterByName('gc_redirectUrl')
let gc_interactionState = getParameterByName('gc_interactionState')
let gc_conversationId = getParameterByName('gc_conversationId')
let gc_communicationId = getParameterByName('gc_communicationId')
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

let platformClient = require('platformClient')
const client = platformClient.ApiClient.instance
const uapi = new platformClient.UsersApi()
const capi = new platformClient.ConversationsApi();
const convApi = new platformClient.ConversationsApi();


window.conversationId = gc_conversationId;

async function start() {
  try {
    client.setEnvironment(gc_region)
    client.setPersistSettings(true, '_mm_')

    console.log('%cLogging in to Genesys Cloud', 'color: green')
    await client.loginImplicitGrant(gc_clientId, gc_redirectUrl, {})

    //GET Current UserId
    let user = await uapi.getUsersMe({})
    console.log("User object: ", user) // Add this line to inspect the user object
    let agentName = user.name;
    let agentFirstName = agentName.split(' ')[0]; // Split the name and get the first part (first name)



    // Update the textBody with agentFirstName
    body.textBody = `Hi, Welcome to Coles Mobile. You're speaking with ${agentFirstName}, how can I help you today?`;

    console.log(gc_communicationId)
    console.log(gc_conversationId)

    //Set the variables on the HTML page
    document.getElementById('communicationId').textContent = gc_communicationId;
    document.getElementById('interactionState').textContent = gc_interactionState;
    document.getElementById('conversationId').textContent = gc_conversationId;

    await checkConnectionAndSendMessage()

    //Enter in starting code.
  } catch (err) {
    console.log('Error: ', err)
  }
} //End of start() function


async function checkConnectionAndSendMessage() {
  let intervalId = setInterval(async () => {
    if (gc_interactionState === 'Connected' && !sessionStorage.getItem(`messageSent-${gc_conversationId}`)) {
      await sendMessage()
      clearInterval(intervalId)
    }
  }, 5000) // Check every 5 seconds
}

async function sendMessage() {
  try {
    await capi.postConversationsMessageCommunicationMessages(gc_conversationId, gc_communicationId, body, opts)
    console.log(`Message sent successfully`)
    sessionStorage.setItem(`messageSent-${gc_conversationId}`, true)
  } catch (err) {
    console.log("There was a failure calling postConversationsMessageCommunicationMessages")
    console.error(err)
  }
}

//JavaScript Native way to get Url Parameters for config
function getParameterByName(name, url) {
  if (!url) url = window.location.href
  name = name.replace(/[\[\]]/g, '$&')
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}