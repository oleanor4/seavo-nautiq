/* ===== Image Modal Functionality ===== */

// Function to open image in modal
function openImageModal(imageSrc) {
  console.log('Opening image modal with:', imageSrc); // Debug line
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");
  
  if (modal && modalImage) {
    modalImage.src = imageSrc;
    modal.style.display = "flex";
    console.log('Modal opened successfully'); // Debug line
  } else {
    console.error('Modal elements not found:', { modal, modalImage }); // Debug line
  }
}

// Function to close image modal
function closeImageModal() {
  const modal = document.getElementById("image-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Initialize image modal functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  console.log('Modal.js DOM loaded'); // Debug line
  
  // Close modal when clicking overlay
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.onclick = closeImageModal;
    console.log('Modal overlay click handler attached'); // Debug line
  }
  
  // Close modal when pressing Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      closeImageModal();
    }
  });
});

// Make functions globally available
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;