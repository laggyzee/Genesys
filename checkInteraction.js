

// Check if the externalOrganizationId is already stored
let storedExternalOrgId = sessionStorage.getItem(`externalOrgId_${gc_conversationId}`);
if (storedExternalOrgId) {
  const badge = document.querySelector('#interactionBadge');
  badge.color = 'green';
  badge.textContent = 'Interaction Linked';
} else {
  // If not, start checking for it
  let checkIntervalId = setInterval(() => {
    capi.getConversation(gc_conversationId)
      .then((data) => {
        console.log(`getConversation success! data: ${JSON.stringify(data, null, 2)}`);
        for (const participant of data.participants) {
          if (participant.externalOrganizationId) {
            const badge = document.querySelector('#interactionBadge');
            badge.color = 'green';
            badge.textContent = 'Interaction Linked';
            sessionStorage.setItem(`externalOrgId_${gc_conversationId}`, participant.externalOrganizationId);
            clearInterval(checkIntervalId);
            break;
          }
        }
      })
      .catch((err) => {
        console.log("There was a failure calling getConversation");
        console.error(err);
      });
  }, 5000); // Check every 5 seconds
}