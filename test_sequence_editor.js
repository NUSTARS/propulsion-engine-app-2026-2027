// test_sequence_editor.js
//
// functionality for creating and editing test sequences

// constants
const dragArea = document.getElementById("dragArea");
const topBlock = document.getElementById("startBlock");
const filenameInput = document.getElementById("filenameInput");
const sequenceButtonArea = document.getElementById("savedSequencesDisplay");


// variables
var mainSequenceStack = [topBlock];


// Used to determine whether to insert piece and where
function compareDistanceToAllStackItems(element) {

  let topBlockRect = topBlock.getBoundingClientRect();
  let elementRect = element.getBoundingClientRect();
  let dragAreaRect = dragArea.getBoundingClientRect();

  // Finds where the closest distance between top of dragged piece and bottom of each stack piece
  let minX = topBlockRect.left;
  let maxX = topBlockRect.right;

  let elementCenter = (elementRect.left + elementRect.right) / 2;

  let horizontalBuffer = 50;
  let verticalBuffer = 50;


  // First check if y is within horizontal stack bounds
  if (elementCenter > maxX + horizontalBuffer || elementCenter < minX - horizontalBuffer) {

    // Out of horizontal range of main stack, cannot add to stack
    return -1;

  }


  let closestYComparison = Math.abs(topBlockRect.bottom - elementRect.top);
  let closestPieceIndex = 0;

  for (let i = 1; i < mainSequenceStack.length; i++) {
    let curYComparison = Math.abs(mainSequenceStack[i].getBoundingClientRect().bottom - elementRect.top);

    if (closestYComparison != Math.min(closestYComparison, curYComparison)) {
      closestYComparison = curYComparison;
      closestPieceIndex = i;
    }
  }

  if (closestYComparison < verticalBuffer) {
    return closestPieceIndex;
  } else {
    return -1;
  }
}



function convertSequenceToDicts() {
  let sequenceDictArray = [];
  for (let i = 1; i < mainSequenceStack.length; i++) {
    let currentDict = {}

    currentDict["id"] = mainSequenceStack[i].id ? mainSequenceStack[i].id : "";
    currentDict["innerText"] = mainSequenceStack[i].innerText ? mainSequenceStack[i].innerText : "";

    sequenceDictArray.push(currentDict);
  }
  return sequenceDictArray;
}



function saveCurrentSequence() {
  let sequenceDictArray = convertSequenceToDicts();
  if (filenameInput.value != "") {
    electronAPI.saveSequence(sequenceDictArray, filenameInput.value);
  } else {
    alert("Filename cannot be empty");
  }
}


window.electronAPI.saveSequenceResponse((success, err) => {
  if (success) {
    alert("Saved successfully to folder 'created_sequences'!");
    updateSavedSequenceButtons();
  } else {
    alert(err);
  }
});



function updateMainStackVisuals() {
  let lastBottom = topBlock.getBoundingClientRect().bottom - dragArea.getBoundingClientRect().top;

  let topBlockRect = topBlock.getBoundingClientRect();
  let dragAreaRect = dragArea.getBoundingClientRect();

  for (let i = 1; i < mainSequenceStack.length; i++) {
    mainSequenceStack[i].style.top = lastBottom + "px";
    mainSequenceStack[i].style.left = ((topBlockRect.left + topBlockRect.right) / 2) - (mainSequenceStack[i].getBoundingClientRect().width / 2) - dragAreaRect.left + "px";
    lastBottom = mainSequenceStack[i].getBoundingClientRect().bottom - dragAreaRect.top;
  }
}


async function updateSavedSequenceButtons() {
  const allSequenceFiles = await window.electronAPI.allSequenceFiles();

  // Clear current sequence buttons
  sequenceButtonArea.replaceChildren();
  
  // Create and add sequence buttons
  for (const file of allSequenceFiles) {
    var curButton = document.createElement('button');
    curButton.className = "sequenceReferenceButton";
    curButton.id = file;
    curButton.innerHTML = file;
    curButton.onclick = function() {loadSavedSequence(file);};
    sequenceButtonArea.appendChild(curButton);
  }
}


async function loadSavedSequence(filename) {
  const sequenceFileContents = await window.electronAPI.sequenceFileContents(filename);
  filenameInput.value = filename;

  // Clear current dragArea elements
  const dragChildren = dragArea.querySelectorAll(".draggableItem");
  dragChildren.forEach(child => {
    dragArea.removeChild(child);
  });

  mainSequenceStack = [topBlock];

  // Create div for each value in json file
  for (let i = 0; i < sequenceFileContents.length; i++) {
    // Extract fields from saved file data per div element
    let id = "id" in sequenceFileContents[i] ? sequenceFileContents[i].id : "";
    let innerText = "innerText" in sequenceFileContents[i] ? sequenceFileContents[i].innerText : "";

    // Create div and add to stack (read in order)
    var curDiv = document.createElement('div');

    curDiv.className = "draggableItem";
    curDiv.id = id;
    curDiv.innerText = innerText;


    addDraggability(curDiv);
    dragArea.appendChild(curDiv);
    mainSequenceStack.push(curDiv);
  }
  updateMainStackVisuals();
}


window.addEventListener('resize', () => {
  updateMainStackVisuals();
});


function addDraggability(element) {
  let offsetX, offsetY;
  let cur_x;

  element.addEventListener("mousedown", e => {
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    // Handle when dragged element is in the main sequence stack
    if (mainSequenceStack.includes(element)) {
      const elementIndex = mainSequenceStack.indexOf(element);
      mainSequenceStack.splice(elementIndex, 1); // magic value 1 means remove 1 element
      updateMainStackVisuals();
    }

    function onMove(e) {
      element.style.zIndex = 100;
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

      //checkCombination(element);
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

        // Add to main stack at closest index found
        mainSequenceStack.splice(closestPieceIndex + 1, 0, element);

        updateMainStackVisuals();
      }

      element.style.zIndex = 1;

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

updateSavedSequenceButtons();