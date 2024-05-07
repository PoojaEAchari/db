document.addEventListener('DOMContentLoaded', function () {
    const addItemForm = document.getElementById('addItemForm');
    const deleteSelectedItemsBtn = document.getElementById('deleteSelectedItemsBtn');
    const refreshItemsBtn = document.getElementById('refreshItemsBtn');
    const alertBox = document.getElementById('alertBox');

    // Function to fetch items from backend and render them
    function getItems() {
        fetch('/items')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('itemTableBody');
                tableBody.innerHTML = '';
                data.forEach((item, index) => {
                    const [id, name, quantity, unit] = item; // Destructure the item array
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${index + 1}</td>
                    <td><div class="checkbox-container"><input type="checkbox" value="${id}"></div></td>
                    <td>${name}</td>
                    <td>${quantity}</td>
                    <td>${unit}</td>
                    <td>
                       <button class="edit" onclick="editItem(${id}, '${name}', '${quantity}', '${unit}')">Edit</button>
                    </td>
                    <td>
                       <button class="delete" onclick="deleteItem(${id})">Delete</button>
                    </td>`;

                    tableBody.appendChild(row);
                });
            });
    }

    function showCustomPrompt(message, defaultValue, callback) {
        const promptContainer = document.createElement('div');
        promptContainer.className = 'custom-prompt';
    
        const promptMessage = document.createElement('p');
        promptMessage.textContent = message;
    
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.value = defaultValue;
    
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'OK';
        confirmButton.addEventListener('click', function() {
            const value = inputField.value;
            document.body.removeChild(promptContainer);
            callback(value);
        });
    
        promptContainer.appendChild(promptMessage);
        promptContainer.appendChild(inputField);
        promptContainer.appendChild(confirmButton);
        
    
        document.body.appendChild(promptContainer);
    
        inputField.focus();
    }
    // Variable to track if edit operation is in progress
let editInProgress = false;

// Function to edit item
window.editItem = function (id, oldName, oldQuantity, oldUnit) {
    // Check if edit is already in progress
    if (editInProgress) {
        showAlert('Edit in progress. Please complete the current edit before starting a new one.', 'error');
        return;
    }

    // Set edit in progress flag to true
    editInProgress = true;

    showCustomPrompt('ENTER NEW NAME:', oldName, function(newName) {
        showCustomPrompt('ENTER NEW QUANTITY:', oldQuantity, function(newQuantity) {
            showCustomPrompt('ENTER NEW UNIT:', oldUnit, function(newUnit) {
                const newQuantityString = `${newQuantity} ${newUnit}`; // Concatenate quantity and unit
                fetch(`/items/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: newName, quantity: newQuantityString }) // Send both name and quantity
                })
                .then(response => response.json())
                .then(data => {
                    showAlert(data.message);
                    getItems();
                    // Reset edit in progress flag
                    editInProgress = false;
                })
                .catch(error => {
                    showAlert('Error updating item. Please try again.', 'error');
                    console.error('Error updating item:', error);
                    // Reset edit in progress flag
                    editInProgress = false;
                });
            });
        });
    });
};

    // Function to delete selected items
    function deleteSelectedItems() {
        const checkboxes = document.querySelectorAll('#itemTableBody input[type="checkbox"]:checked');
        if (checkboxes.length === 0) {
            showAlert('No items to delete.', 'error');
            return;
        }
        checkboxes.forEach(checkbox => {
            deleteItem(checkbox.value);
        });
    }

    // Function to refresh items by truncating the table
    function refreshItems() {
        fetch('/refresh', {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                showAlert(data.message);
                getItems();
            })
            .catch(error => {
                showAlert('Error refreshing items. Please try again.', 'error');
                console.error('Error refreshing items:', error);
            });
    }

    // Function to display alert
    function showAlert(message, type = 'success') {
        alertBox.style.display = 'block';
        alertBox.textContent = message;
        if (type === 'success') {
            alertBox.style.backgroundColor = '#28a745';
        } else {
            alertBox.style.backgroundColor = '#dc3545';
        }
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 3000); // Hide alert after 3 seconds
    }

    // Function to add new item
    addItemForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const name = document.getElementById('itemName').value;
        const quantity = document.getElementById('itemQuantity').value;
        const quantityUnit = document.getElementById('quantityUnit').value; // Get selected quantity unit
        const date = document.getElementById('itemDate').value; // Get selected date

        if (quantityUnit === "" || date === "") { // Check if both quantity unit and date are selected
            showAlert('Please select both a quantity unit and a date.', 'error');
            return;
        }

        const quantityString = `${quantity} ${quantityUnit}`; // Concatenate quantity and unit
        fetch('/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, quantity: quantityString, date }) // Send name, quantity, and date
        })
            .then(response => response.json())
            .then(data => {
                showAlert(data.message);
                getItems();
                addItemForm.reset();
            })
            .catch(error => {
                showAlert('Error adding item. Please try again.', 'error');
                console.error('Error adding item:', error);
            });
    });

    // Function to delete item
    window.deleteItem = function (id) {
        fetch(`/items/${id}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                showAlert(data.message);
                getItems();
            })
            .catch(error => {
                showAlert('Error deleting item. Please try again.', 'error');
                console.error('Error deleting item:', error);
            });
    };

    // Event listener for delete selected items button
    deleteSelectedItemsBtn.addEventListener('click', deleteSelectedItems);

    // Event listener for refresh items button
    refreshItemsBtn.addEventListener('click', refreshItems);

    // Initial fetch to render items
    getItems();

    // Function to show items for selected date
    document.getElementById('showItemsBtn').addEventListener('click', function () {
        const selectedDate = document.getElementById('selectedDate').value;
        if (selectedDate === '') {
            showAlert('No date selected. Please select a date.', 'error');
            return;
        }
        fetch(`/items/${selectedDate}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const selectedDateItemsContainer = document.getElementById('selectedDateItemsContainer');
                const selectedDateItemsTable = document.getElementById('selectedDateItemsTable');
                const selectedDateHeading = document.getElementById('selectedDateHeading');
                selectedDateItemsTable.innerHTML = ''; // Clear previous items
                if (data.length === 0) {
                    showAlert('No items found for selected date', 'error');
                    return;
                }
                selectedDateHeading.textContent = `Selected Date: ${selectedDate}`;
                data.forEach(item => {
                    const [id, name, quantity, unit] = item;
                    const row = selectedDateItemsTable.insertRow();
                    row.innerHTML = `<td>${name}</td>
                                     <td>${quantity}</td>
                                     <td>${unit}</td>`;
                });
                selectedDateItemsContainer.style.display = 'block'; // Show the container
                document.body.style.overflow = 'hidden'; // Disable scrolling

                showAlert('Items found for selected date', 'success');
            })
            .catch(error => {
                showAlert('Error fetching items. Please try again.', 'error');
                console.error('Error fetching items:', error);
            });
    });

    // Event listener for closing selected date items container
    document.getElementById('closeSelectedDateItemsBtn').addEventListener('click', function () {
        closeSelectedDateItemsContainer();
    });

    // Function to close selected date items container and reset date input
    function closeSelectedDateItemsContainer() {
        const selectedDateItemsContainer = document.getElementById('selectedDateItemsContainer');
        selectedDateItemsContainer.style.display = 'none';
        document.getElementById('selectedDate').value = ''; // Reset date input
        document.body.style.overflow = 'auto'; // Enable scrolling
    }

    // Function to search for items
    function searchItems() {
        const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();

        if (searchInput === "") {
            showAlert('Please enter an item to search.', 'error');
            return;
        }

        const items = document.querySelectorAll('#itemTableBody tr');
        let found = false; // Flag to track if any items are found
        items.forEach(item => {
            const itemName = item.querySelector('td:nth-child(3)').textContent.toLowerCase(); // Assuming item name is in the third column
            if (itemName.includes(searchInput)) {
                item.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Highlight matching items
                item.style.fontWeight = 'bold'; // Make text bold for matching items
                item.style.color = '#ffffff'; // White font color for matching items
                found = true; // Set found flag to true if any item is found
            } else {
                item.style.backgroundColor = ''; // Reset background color for non-matching items
                item.style.fontWeight = ''; // Reset font weight for non-matching items
                item.style.color = ''; // Reset font color for non-matching items
            }
        });

        // Display alert based on whether items are found
        if (found) {
            showAlert('Item found', 'success');
        } else {
            showAlert('Item not found', 'error');
        }
    }

    // Event listener for search button
    document.getElementById('searchButton').addEventListener('click', searchItems);

    // Function to reset item styles and remove alert
    function resetWindow(event) {
        // Check if the click event occurred within the search input or search button
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        if (event.target !== searchInput && event.target !== searchButton) {
            // Reset item highlighting
            const items = document.querySelectorAll('#itemTableBody tr');
            items.forEach(item => {
                item.style.backgroundColor = ''; // Reset background color for all items
                item.style.color = ''; // Reset font color for all items
                item.style.fontWeight = ''; // Reset font weight for all items
            });

            searchInput.value = '';
        }
    }

    // Event listener for window click event to reset the window
    window.addEventListener('click', resetWindow);

    
});
