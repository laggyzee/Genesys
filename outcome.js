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

// Constants
const DEFAULT_OUTCOME = 'Outcome Not Set';
const OUTCOME_COLOR = 'green';
const OUTCOME_NOT_SET_COLOR = 'red';

// Set the initial value of the outcome variable
let outcome = sessionStorage.getItem(`outcome_${customerParticipantId}`) || DEFAULT_OUTCOME;
outcomeBadge.textContent = outcome;

// If there's a saved outcome for the conversation, set it and color the badge green
if (sessionStorage.getItem(`outcome_${customerParticipantId}`)) {
  listbox.value = outcome.split(' ')[0]; // Use the first word as the outcome type
  outcomeBadge.color = OUTCOME_COLOR;
}

// Function to update outcome and badge
function updateOutcome(selectedValue) {
  switch (selectedValue) {
    case 'Query':
    case 'Escalated':
    case 'Resolved':
    case 'Unresolved':
    case 'Mid Flight':
      outcome = `${selectedValue} Selected`;
      outcomeBadge.color = OUTCOME_COLOR;
      break;
    default:
      outcome = DEFAULT_OUTCOME;
      outcomeBadge.color = OUTCOME_NOT_SET_COLOR;
      break;
  }
  outcomeBadge.textContent = outcome;
  sessionStorage.setItem(`outcome_${customerParticipantId}`, outcome);
}

// Function to update participant attributes
function updateParticipantAttributes(conversationId, participantId, selectedValue) {
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
      console.error("Error in patchConversationParticipantAttributes:", err);
    });
}

// Function to set external tag
function setExternalTag(conversationId, selectedValue) {
  const conversationBody = {
    externalTag: selectedValue
  };

  apiInstance.putConversationTags(conversationId, conversationBody)
    .then((data) => {
      console.log(`putConversationTags success! data: ${JSON.stringify(data, null, 2)}`);
    })
    .catch((err) => {
      console.error("Error in putConversationTags:", err);
    });
}

// Add an event listener to the listbox element
listbox.addEventListener('change', (event) => {
  const selectedValue = event.target.value;

  // Update the outcome and badge
  updateOutcome(selectedValue);

  // Update the participant attributes and set the external tag
  const conversationId = window.conversationId;
  const participantId = customerParticipantId;
  updateParticipantAttributes(conversationId, participantId, selectedValue);
  setExternalTag(conversationId, selectedValue);
});

