// Function to display the authenticated member page
async function displayAuthenticatedMemberPage() {
    // Read the token from cookies
    const tokenValue = getCookie("token");
  
    if (!tokenValue) {
      // If the token is not found, redirect the user to the sign-in page
      window.location.href = "/sign-in.html"; // Replace with your sign-in page URL
    } else {
      // Extract the email address from the token (assuming it's a JWT)
      const decodedToken = JSON.parse(atob(tokenValue.split(".")[1]));
      const userEmail = decodedToken.email;
  
      // Display the user's email on the page
      document.getElementById("userEmail").textContent = userEmail;
  
      // Check if the user account exists in the database
      const accountExists = await checkAccountExists(userEmail);
  
      if (!accountExists) {
        // If the account does not exist, display a message
        document.getElementById("message").textContent = "User account does not exist.";
      }
  
      // Add event listener to handle sign-out button click
      document.getElementById("signOutButton").addEventListener("click", handleSignOut);
    }
  }
  
  // Function to check if the user account exists in the database
  async function checkAccountExists(email) {
    try {
      const response = await fetch("/check-member-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
  
      const result = await response.json();
      return response.ok && result.exists;
    } catch (error) {
      console.error("Error:", error);
      return false; // Return false if an error occurs
    }
  }
  