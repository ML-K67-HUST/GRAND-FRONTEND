// Test script for transforming task data
document.addEventListener('DOMContentLoaded', function() {
  // Fetch test data
  fetch('static/js/test.json')
    .then(response => response.json())
    .then(data => {
      console.log('Original test data:', data);
      
      // Transform the data
      const transformedData = transformTasksForAnalysis(data.tasks);
      console.log('Transformed data for analysis:', transformedData);
      
      // Display results on page if needed
      if (document.getElementById('test-results')) {
        document.getElementById('test-results').textContent = 
          JSON.stringify(transformedData, null, 2);
      }
    })
    .catch(error => {
      console.error('Error testing transformation:', error);
    });
}); 