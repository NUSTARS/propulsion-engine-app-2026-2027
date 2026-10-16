// test_sequence_editor.js
//
// functionality for creating and editing test sequences

// constants
const dragArea = document.getElementById("dragArea");
const topBlock = document.getElementById("startBlock");


// variables
var mainSequenceStack = [topBlock];


// Used to determine whether to insert piece and where
function compareDistanceToAllStackItems(element) {

  let topBlockRect = topBlock.getBoundingClientRect();
  let elementRect = element.getBoundingClientRect();

  // Finds where the closest distance between top of dragged piece and bottom of each stack piece
  let minX = topBlockRect.left;
  let maxX = topBlockRect.right;

  let horizontalBuffer = 5000;
  let verticalBuffer = 2000;

  // First check if y is within horizontal stack bounds
  if (elementRect.right < minX - horizontalBuffer || elementRect.left > maxX + horizontalBuffer) {

    // Out of horizontal range of main stack, cannot add to stack
    return -1;

  }

  let closestYComparison = Math.abs(topBlockRect.bottom - elementRect.top);
  let closestPieceIndex = 0;

  for (let i = 1; i < mainSequenceStack.length; i++) {
    let curYComparison = Math.abs(mainSequenceStack[i].getBoundingClientRect().bottom - elementRect.top);

    closestYComparison = min(closestYComparison, curYComparison);
    closestPieceIndex = i;
  }

  if (closestYComparison < verticalBuffer) {
    return closestPieceIndex;
  } else {
    return -1;
  }
}


function addDraggability(element) {
  let offsetX, offsetY;
  let cur_x;

  element.addEventListener("mousedown", e => {
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    function onMove(e) {
      const rect = dragArea.getBoundingClientRect();
      const rawX = e.clientX - rect.left - offsetX;
      const rawY = e.clientY - rect.top - offsetY;

      const elementRect = element.getBoundingClientRect();

      // Clamp position inside the draggable area
      const x = Math.min(Math.max(rawX, 0 - rect.x), rect.width - elementRect.width);
      const y = Math.min(Math.max(rawY, 0), rect.height - elementRect.height);

      element.style.left = x + "px";
      element.style.top = y + "px";

      cur_x = x;

      checkCombination(element);
    }

    function onUp() {


      // ELEMENT DROP HANDLING


      let closestPieceIndex = compareDistanceToAllStackItems(element);


      if (cur_x + element.getBoundingClientRect().width < 0) {

        // Delete draggable element if let go over piece selection area (to the left of drag area)
        element.remove();

      } else if (cur_x < 0) {

        // Element dropped in empty space (just leave in place)
        element.style.left = 0 + "px";

      } else if (closestPieceIndex != -1) {

        let otherPiece = mainSequenceStack[closestPieceIndex];
        let otherPieceRect = otherPiece.getBoundingClientRect();

        // Element dropped next to stack (insert or place at bottom)
        let bottomPosition = otherPieceRect.bottom - otherPieceRect.height;
        let leftPosition = otherPieceRect.left - otherPieceRect.width;

        element.style.top = bottomPosition + "px";
        element.style.left = leftPosition + "px";

        // Let go
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);

        // Add to main stack
        mainSequenceStack.appendChild(element);

      }


      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
}


// When piece button (in left panel) is pressed, create new piece in dragArea
function createDraggableDiv(name) {
  var draggableDiv = document.createElement('div');
  draggableDiv.className = "draggableItem";
  draggableDiv.id = "testDragBlock";
  draggableDiv.innerHTML = name;
  dragArea.appendChild(draggableDiv);
  addDraggability(draggableDiv);
}


// Handle item dragging
document.querySelectorAll(".draggableItem").forEach(element => {
  addDraggability(element);
});