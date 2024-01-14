// Assuming responseUserPreference is imported or defined elsewhere
var responseUserPreference;

setTimeout(function() {
  fetch('responseUserPreference.json')
    .then(response => response.json())
    .then(data => {
      responseUserPreference = data;
      // Call populateUserPreferencesButtons after the data is loaded
      populateUserPreferencesButtons();
    });
}, 2000); // Delay by 2 seconds // Replace this with the actual data from responseUserPreference.json

// Delay the execution of populateUserPreferencesButtons by 2 seconds
setTimeout(populateUserPreferencesButtons, 2000);

function populateUserPreferencesButtons() {
  console.log('currentUserId:', window.currentUserId); // Check found userId
  console.log('users:', responseUserPreference.users); // Check users array
  var userPreferencesButtons = document.getElementById('userPreferencesButtons');

  // Find the user with the current user ID
  var currentUserPreferences = responseUserPreference.users.find(user => user.userId === window.currentUserId)?.details;

  // Check if currentUserPreferences is defined
  if (currentUserPreferences) {
    currentUserPreferences.forEach(detail => {
      var button = document.createElement('gux-button');
      button.setAttribute('data-id', detail.ID);
      button.setAttribute('accent', 'primary'); // Add the accent attribute
      button.style.minWidth = '150px'; // Add the style
      button.textContent = detail.Name;
      button.className = 'quick-sends__buttons'; // Add the same class as the original buttons

      // Create the gux-icon element and append it to the button
      var icon = document.createElement('gux-icon');
      icon.setAttribute('icon-name', 'message-reply');
      button.prepend(icon);

      // Add the event listener to the new button
      button.addEventListener('click', () => {
        const responseId = button.getAttribute('data-id');
        if (responseId) {
          sendCannedMessage(responseId);
        }
      });

      userPreferencesButtons.appendChild(button);
    });
  } else {
    console.error('No details found for the current user');
  }
}