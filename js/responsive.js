// Basic responsive JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Responsive JS loaded');
  
  // Add any responsive behavior here
  function handleResize() {
    const width = window.innerWidth;
    if (width < 768) {
      document.body.classList.add('mobile');
    } else {
      document.body.classList.remove('mobile');
    }
  }
  
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial call
});