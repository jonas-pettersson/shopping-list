// Create an instance of a db object for us
// to store the open database in IndexedDB
let db;

const ul = document.querySelector("ul");
const input = document.querySelector("input");
const addBtn = document.querySelector("button");

addBtn.addEventListener("click", addItem);
input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    addItem();
  }
});

function addItem() {
  let newItem = { title: input.value };

  // open a read/write db transaction, ready for adding the data
  let transaction = db.transaction(["shopping_list_os"], "readwrite");

  // call an object store that's already been added to the database
  let objectStore = transaction.objectStore("shopping_list_os");

  // Make a request to add our newItem object to the object store
  let request = objectStore.add(newItem);
  request.onsuccess = function () {
    // Clear the form, ready for adding the next entry
    input.value = "";
  };

  // Report on the success of the transaction completing, when everything is done
  transaction.oncomplete = function () {
    console.log("Transaction completed: database modification finished.");

    // update the display of data to show the newly added item, by running displayData() again.
    displayData();
  };

  transaction.onerror = function () {
    console.log("Transaction not opened due to error");
  };
}

// Define the displayData() function
function displayData() {
  // Here we empty the contents of the list element each time the display is updated
  // If you didn't do this, you'd get duplicates listed each time a new note is added
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  // Open our object store and then get a cursor - which iterates through all the
  // different data items in the store
  let objectStore = db
    .transaction("shopping_list_os")
    .objectStore("shopping_list_os");

  objectStore.openCursor().onsuccess = function (e) {
    // Get a reference to the cursor
    let cursor = e.target.result;

    // If there is still another data item to iterate through, keep running this code
    if (cursor) {
      // Create a list item to put each data item inside when displaying it
      // structure the HTML fragment, and append it inside the list
      const li = document.createElement("li");
      const txtSpan = document.createElement("span");
      const delBtnSpan = document.createElement("span");

      li.appendChild(txtSpan);
      li.appendChild(delBtnSpan);
      ul.appendChild(li);

      // Put the data from the cursor inside the li

      txtSpan.textContent = cursor.value.title;
      delBtnSpan.textContent = "×";

      // Store the ID of the data item inside an attribute on the li, so we know
      // which item it corresponds to. This will be useful later when we want to delete items
      li.setAttribute("data-note-id", cursor.value.id);

      // formatting
      li.setAttribute("class", "w3-bar w3-hover-light-grey");
      txtSpan.setAttribute("class", "w3-bar-item");
      delBtnSpan.setAttribute(
        "class",
        "w3-bar-item w3-right w3-button w3-large w3-hover-red"
      );

      // Set an event handler so that when the button is clicked, the deleteItem()
      // function is run
      delBtnSpan.onclick = deleteItem;

      input.focus();

      // Iterate to the next item in the cursor
      cursor.continue();
    }
  };
}

function deleteItem(e) {
  // retrieve the name of the task we want to delete. We need
  // to convert it to a number before trying it use it with IDB; IDB key
  // values are type-sensitive.
  let noteId = Number(e.target.parentNode.getAttribute("data-note-id"));

  // open a database transaction and delete the task, finding it using the id we retrieved above
  let transaction = db.transaction(["shopping_list_os"], "readwrite");
  let objectStore = transaction.objectStore("shopping_list_os");
  let request = objectStore.delete(noteId);

  // report that the data item has been deleted
  transaction.oncomplete = function () {
    // delete the parent of the button
    // which is the list item, so it is no longer displayed
    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
    console.log("Note " + noteId + " deleted.");
  };
  input.focus();
}

window.onload = function () {
  console.log("test");
  // Open our database; it is created if it doesn't already exist
  // (see onupgradeneeded below)
  let request = window.indexedDB.open("shopping_list_db", 2);
  // onerror handler signifies that the database didn't open successfully
  request.onerror = function () {
    console.log("Database failed to open");
  };

  // onsuccess handler signifies that the database opened successfully
  request.onsuccess = function () {
    console.log("Database opened successfully");

    // Store the opened database object in the db variable. This is used a lot below
    db = request.result;

    // Run the displayData() function to display the notes already in the IDB
    displayData();
  };

  // Setup the database tables if this has not already been done
  request.onupgradeneeded = function (e) {
    // Grab a reference to the opened database
    let db = e.target.result;

    // Create an objectStore to store our notes in (basically like a single table)
    // including a auto-incrementing key
    let objectStore = db.createObjectStore("shopping_list_os", {
      keyPath: "id",
      autoIncrement: true,
    });

    // Define what data items the objectStore will contain
    objectStore.createIndex("title", "title", { unique: false });

    console.log("Database setup complete");
  };
};
