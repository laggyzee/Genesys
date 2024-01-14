// Instantiate API instance
const apiInstance = new platformClient.ConversationsApi();

// Get the customerParticipantId from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const customerParticipantId = getQueryParam("customerParticipantId");

// Get the elements
const listbox = document.querySelector('gux-listbox');
const outcomeBadge = document.querySelector('#outcomeBadge');

// Set the initial value of the outcome variable
let outcome = sessionStorage.getItem(`outcome_${customerParticipantId}`) || 'Outcome Not Set';
outcomeBadge.textContent = outcome;

// If there's a saved outcome for the conversation, set it and color the badge green
if (sessionStorage.getItem(`outcome_${customerParticipantId}`)) {
  listbox.value = outcome.split(' ')[0]; // Use the first word as the outcome type
  outcomeBadge.color = 'green';
}

// Add an event listener to the listbox element
listbox.addEventListener('change', (event) => {
  // Get the selected option value
  const selectedValue = event.target.value;

  // Update the outcome variable and badge
  switch (selectedValue) {
    case 'Query':
      outcome = 'Query Selected';
      outcomeBadge.color = 'green';
      break;
    case 'Escalated':
      outcome = 'Escalated Selected';
      outcomeBadge.color = 'green';
      break;
    case 'Resolved':
      outcome = 'Resolved Selected';
      outcomeBadge.color = 'green';
      break;
    case 'Unresolved Chat':
      outcome = 'Unresolved Chat Selected';
      outcomeBadge.color = 'green';
      break;
    case 'Mid Flight':
      outcome = 'Mid Flight Selected';
      outcomeBadge.color = 'green';
      break;
    default:
      outcome = 'Outcome Not Set';
      outcomeBadge.color = 'red';
      break;
  }

  // Save the selected outcome for the conversation
  sessionStorage.setItem(`outcome_${customerParticipantId}`, outcome);

  outcomeBadge.textContent = outcome;

  // Update the participant attributes with the selected outcome
  const conversationId = window.conversationId;
  const participantId = customerParticipantId;
  const body = {
    attributes: {
      outcome: selectedValue
    }
  };

  apiInstance.patchConversationParticipantAttributes(conversationId, participantId, body)
    .then(() => {
      console.log("patchConversationParticipantAttributes returned successfully.");
    })
    .catch((err) => {
      console.log("There was a failure calling patchConversationParticipantAttributes");
      console.error(err);
    });

  // Set the externalTag on the conversation
  const conversationBody = {
    externalTag: selectedValue
  };

  apiInstance.putConversationTags(conversationId, conversationBody)
    .then((data) => {
      console.log(`putConversationTags success! data: ${JSON.stringify(data, null, 2)}`);
    })
    .catch((err) => {
      console.log("There was a failure calling putConversationTags");
      console.error(err);
    });
});
