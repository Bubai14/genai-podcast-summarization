function submitpodcastUrl() {
    const podcastUrlInput = document.getElementById('podcastUrl');
    const podcastUrl = podcastUrlInput.value;

    // Display spinner while processing
    const submitSpinner = document.getElementById('submitSpinner');
    submitSpinner.style.display = 'inline-block';

    // Clear any existing insights
    const insightOutput = document.getElementById('insightOutput');
    insightOutput.value = '';

    // Send the podcast URL to the backend for processing
    fetch('http://localhost:3000/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: podcastUrl })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        insightOutput.value = data.insights;
    })
    .catch(error => {
        console.error('Error:', error);
        insightOutput.value = 'An error occurred while generating insights.';
    })
    .finally(() => {
        // Hide spinner after processing
        submitSpinner.style.display = 'none';
    });
}


function generateInsight() {
    var inputText = document.getElementById("inputText").value;
    // Code to generate insight from the input text and send it to the server

    var insightOutput = document.getElementById("insightOutput");
    insightOutput.value = "This is a sample insight generated from the input text.";
    // Replace this with the actual generated insight from the server
}
