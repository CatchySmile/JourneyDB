// Global variable to store the currently selected file key and editing state.
var currentKey = null;
var editingKey = null;

function createNewJSON() {
    var usernameInput = document.getElementById('username');
    var username = usernameInput.value;
    // Cap username to 32 characters if longer.
    if (username.length > 32) {
        username = username.substring(0, 32);
        usernameInput.value = username;
    }
    
    var wdym = document.getElementById('wdym').value;
    
    // Gather custom fields from the dynamic container.
    var customFields = {};
    document.querySelectorAll('.customFieldPair').forEach(function(pair) { /* ...existing code... */ });

    // Create new file key: sanitize username and generate a UID.
    var sanitizedUsername = username.replace(/[^A-Za-z0-9]/g, '');
    var uid = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    
    var key = uid + '_' + sanitizedUsername;
    
    // Create the data object.
    var data = {
        username: username,
        wdym: wdym,
        additionalFields: customFields
    };
    
    var jsonStr = JSON.stringify(data, null, 2);
    
    // Save in local storage.
    localStorage.setItem(key, jsonStr);
    console.log("Data saved with key:", key);
    
    refreshFileViewer();
}

function updateExistingJSON(key) {
    // Retrieve form input values.
    var username = document.getElementById('username').value;
    var wdym = document.getElementById('wdym').value;
    
    // Gather custom fields.
    var customFields = {};
    document.querySelectorAll('.customFieldPair').forEach(function(pair) {
        var fieldName = pair.querySelector('.customFieldName').value.trim();
        var fieldValue = pair.querySelector('.customFieldValue').value.trim();
        if (fieldName !== '') {
            customFields[fieldName] = fieldValue;
        }
    });
    
    // Create the data object.
    var data = {
        username: username,
        wdym: wdym,
        additionalFields: customFields
    };
    
    var jsonStr = JSON.stringify(data, null, 2);
    
    // Overwrite stored JSON for the given key.
    localStorage.setItem(key, jsonStr);
    console.log("Data updated for key:", key);
    
    // Reset editing state.
    editingKey = null;
    document.querySelector('#userForm button[type="submit"]').textContent = "Create JSON";
    refreshFileViewer();
}

// Enhanced form submission with create/update logic.
document.getElementById("userForm").addEventListener("submit", function(e) {
    e.preventDefault();
    var usernameField = document.getElementById('username');
    var wdymField = document.getElementById('wdym');
    if (usernameField.value.trim() === "" || wdymField.value.trim() === "") {
        alert("Please fill in all required fields.");
        return;
    }
    if (editingKey) {
        updateExistingJSON(editingKey);
    } else {
        createNewJSON();
    }
});

// Add event listener for the Edit button.
document.getElementById("editFile").addEventListener("click", function() {
    if (!currentKey) {
        alert("Please select a file to edit.");
        return;
    }
    var fileContent = localStorage.getItem(currentKey);
    try {
        var parsedData = JSON.parse(fileContent);
        // Populate form fields.
        document.getElementById("username").value = parsedData.username;
        document.getElementById("wdym").value = parsedData.wdym;
        // Clear any existing custom fields.
        var container = document.getElementById("customFieldsContainer");
        container.innerHTML = "";
        for (var field in parsedData.additionalFields) {
            if (parsedData.additionalFields.hasOwnProperty(field)) {
                var fieldPair = document.createElement('div');
                fieldPair.className = "customFieldPair";
                
                var fieldNameInput = document.createElement('input');
                fieldNameInput.type = "text";
                fieldNameInput.placeholder = "Interests, Aliases, etc...";
                fieldNameInput.className = "customFieldName";
                fieldNameInput.value = field;
                
                var fieldValueInput = document.createElement('input');
                fieldValueInput.type = "text";
                fieldValueInput.placeholder = "Additional information...";
                fieldValueInput.className = "customFieldValue";
                fieldValueInput.value = parsedData.additionalFields[field];
                
                var removeBtn = document.createElement('button');
                removeBtn.type = "button";
                removeBtn.textContent = "−";
                removeBtn.className = "remove-button";
                removeBtn.addEventListener('click', function() {
                    container.removeChild(fieldPair);
                });
                
                fieldPair.appendChild(fieldNameInput);
                fieldPair.appendChild(fieldValueInput);
                fieldPair.appendChild(removeBtn);
                
                container.appendChild(fieldPair);
            }
        }
        editingKey = currentKey;
        // Change submit button text to indicate update mode.
        document.querySelector('#userForm button[type="submit"]').textContent = "Update JSON";
    } catch (e) {
        alert("Error parsing JSON file for editing.");
    }
});

// Add event listener for the add field button.
document.getElementById('addFieldButton').addEventListener('click', function() {
    var container = document.getElementById('customFieldsContainer');
    
    // Create a container for the custom field pair.
    var fieldPair = document.createElement('div');
    fieldPair.className = "customFieldPair";
    
    // Input for custom field name.
    var fieldNameInput = document.createElement('input');
    fieldNameInput.type = "text";
    fieldNameInput.placeholder = "Interests, Aliases, etc...";
    fieldNameInput.className = "customFieldName";
    
    // Input for custom field value.
    var fieldValueInput = document.createElement('input');
    fieldValueInput.type = "text";
    fieldValueInput.placeholder = "Additional information...";
    fieldValueInput.className = "customFieldValue";
    
    // Create a minus button to remove the custom field pair.
    var removeBtn = document.createElement('button');
    removeBtn.type = "button";
    removeBtn.textContent = "−";
    removeBtn.className = "remove-button";
    removeBtn.addEventListener('click', function() {
        container.removeChild(fieldPair);
    });
    
    // Append the inputs and remove button to the field pair container.
    fieldPair.appendChild(fieldNameInput);
    fieldPair.appendChild(fieldValueInput);
    fieldPair.appendChild(removeBtn);
    
    // Append the pair to the container.
    container.appendChild(fieldPair);
});

function renderJSONTree(obj) {
    var html = '<ul>';
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                html += '<li><strong>' + key + '</strong>: ' + renderJSONTree(obj[key]) + '</li>';
            } else {
                html += '<li><strong>' + key + '</strong>: ' + obj[key] + '</li>';
            }
        }
    }
    html += '</ul>';
    return html;
}

function refreshFileViewer() {
    var fileViewer = document.getElementById('fileViewer');
    fileViewer.innerHTML = ""; // clear previous list
    
    // Get the search query and convert to lower case for case-insensitive matching.
    var searchQuery = document.getElementById("fileSearch").value.trim().toLowerCase();
    var multiSelect = document.getElementById('massSelect').checked;

    Object.keys(localStorage).forEach(function(key) {
        // Filter based on the search query.
        if (searchQuery && key.toLowerCase().indexOf(searchQuery) === -1) {
            return;  // Skip keys that do not match.
        }
        
        var fileItem = document.createElement("div");
        fileItem.style.padding = "5px";
        fileItem.style.borderBottom = "1px solid #ccc";
        fileItem.style.cursor = "pointer";

        if (multiSelect) {
            // Create a checkbox for multi-select mode.
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "fileSelector";
            checkbox.value = key;
            fileItem.appendChild(checkbox);

            var span = document.createElement("span");
            span.textContent = " " + key;
            fileItem.appendChild(span);
        } else {
            // Single-select mode: clicking sets the currentKey and displays its content.
            fileItem.textContent = key;
            fileItem.addEventListener("click", function() {
                currentKey = key;
                var fileContent = localStorage.getItem(key);
                document.getElementById("fileText").textContent = fileContent;
                try {
                    var parsedData = JSON.parse(fileContent);
                    document.getElementById("jsonGraph").innerHTML = renderJSONTree(parsedData);
                } catch (e) {
                    document.getElementById("jsonGraph").innerHTML = "Error parsing JSON";
                }
            });
        }
        fileViewer.appendChild(fileItem);
    });
}

// Download the currently selected file(s) as a ZIP.
document.getElementById("downloadOne").addEventListener("click", function() {
    var zip = new JSZip();
    var multiSelect = document.getElementById("massSelect").checked;

    if (multiSelect) {
        var selectors = document.querySelectorAll(".fileSelector:checked");
        if (selectors.length === 0) {
            alert("Please select at least one file from the list.");
            return;
        }
        selectors.forEach(function(checkbox) {
            var key = checkbox.value;
            var rawJSON = localStorage.getItem(key);
            var graphicalHTML = "";
            try {
                var parsedData = JSON.parse(rawJSON);
                graphicalHTML = renderJSONTree(parsedData);
            } catch (e) {
                graphicalHTML = "Error parsing JSON";
            }
            var htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Graphical View - ${key}</title>
    <style>
        body { font-family: sans-serif; }
        ul { list-style: none; padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>Graphical View of ${key}</h1>
    ${graphicalHTML}
</body>
</html>
            `;
            zip.file(key + ".json", rawJSON);
            zip.file(key + "_view.html", htmlContent);
        });
    } else {
        if (!currentKey) {
            alert("Please select a file from the list first.");
            return;
        }
        var rawJSON = localStorage.getItem(currentKey);
        var graphicalHTML = "";
        try {
            var parsedData = JSON.parse(rawJSON);
            graphicalHTML = renderJSONTree(parsedData);
        } catch (e) {
            graphicalHTML = "Error parsing JSON";
        }
        var htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Graphical View - ${currentKey}</title>
    <style>
        body { font-family: sans-serif; }
        ul { list-style: none; padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>Graphical View of ${currentKey}</h1>
    ${graphicalHTML}
</body>
</html>
        `;
        zip.file(currentKey + ".json", rawJSON);
        zip.file(currentKey + "_view.html", htmlContent);
    }
    
    zip.generateAsync({ type: "blob" }).then(function(content) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = "download.zip";
        a.click();
    });
});

// Delete the currently selected file(s).
document.getElementById("DeleteFile").addEventListener("click", function() {
    var multiSelect = document.getElementById("massSelect").checked;
    if (multiSelect) {
        var selectors = document.querySelectorAll(".fileSelector:checked");
        if (selectors.length === 0) {
            alert("Please select at least one file from the list.");
            return;
        }
        if (window.confirm("Are you sure you want to delete the selected file(s)?")) {
            selectors.forEach(function(checkbox) {
                localStorage.removeItem(checkbox.value);
            });
            refreshFileViewer();
            document.getElementById("fileText").textContent = "";
            document.getElementById("jsonGraph").innerHTML = "";
        }
    } else {
        if (!currentKey) {
            alert("Please select a file from the list first.");
            return;
        }
        if (window.confirm("Are you sure you want to delete the file (" + currentKey + ")?")) {
            localStorage.removeItem(currentKey);
            currentKey = null;
            document.getElementById("fileText").textContent = "";
            document.getElementById("jsonGraph").innerHTML = "";
            refreshFileViewer();
        }
    }
});

// Listen for changes in the search field
document.getElementById("fileSearch").addEventListener("input", function() {
    refreshFileViewer();
});

// Re-render the file viewer 
document.getElementById("massSelect").addEventListener("change", function() {
    refreshFileViewer();
});

// Toggle raw view 
document.getElementById("rawViewToggle").addEventListener("change", function() {
    var fileContent = document.getElementById("fileContent");
    var graphicalView = document.getElementById("graphicalView");
    if (this.checked) {
        fileContent.style.display = "block";
        graphicalView.style.display = "none";
    } else {
        fileContent.style.display = "none";
        graphicalView.style.display = "block";
    }
});

// Clear Local Storage with confirmation prompt
document.getElementById("clearStorage").addEventListener("click", function() {
    if (window.confirm("Are you sure you want to clear all local storage?")) {
        localStorage.clear();
        refreshFileViewer(); 
        alert("Local storage cleared.");
    }
});

// Download All Files as a ZIP
document.getElementById("downloadAll").addEventListener("click", function() {
    var zip = new JSZip();
    Object.keys(localStorage).forEach(function(key) {
        var rawJSON = localStorage.getItem(key);
        zip.file(key + ".json", rawJSON);
    });
    zip.generateAsync({ type: "blob" }).then(function(content) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = "all_files.zip";
        a.click();
    });
});

// Listen to Import files
document.getElementById("importFile").addEventListener("click", function() {
    document.getElementById("fileImport").click();
});

// Listen for file selections
document.getElementById("fileImport").addEventListener("change", function(event) {
    var files = event.target.files;
    var totalFiles = files.length;
    var completedCount = 0;
    var logEntries = [];
    
    Array.from(files).forEach(function(file) {
        // Check if its larger than 1024 KB (1 MB)
        if (file.size > 1024 * 1024) {
            var fileSizeKB = (file.size / 1024).toFixed(2);
            if (!window.confirm("Are you sure you want to import " + file.name + "? It is " + fileSizeKB + " KB. Importing large files can cause lag and potentially cause issues.")) {
                logEntries.push("SKIPPED: " + file.name + " - Import cancelled due to large file size");
                completedCount++;
                if (completedCount === totalFiles) {
                    finishImport(logEntries);
                }
                return; // Skip reading this file.
            }
        }
        
        var reader = new FileReader();
        reader.onload = function(e) {
            var fileContent = e.target.result;
            try {
                JSON.parse(fileContent); // validate JSON
                localStorage.setItem(file.name, fileContent);
                logEntries.push("SUCCESS: " + file.name);
            } catch (err) {
                console.error("Error importing " + file.name, err);
                logEntries.push("FAILED: " + file.name + " - Invalid JSON");
            }
            completedCount++;
            if (completedCount === totalFiles) {
                finishImport(logEntries);
            }
        };
        reader.onerror = function() {
            logEntries.push("FAILED: " + file.name + " - FileReader error");
            completedCount++;
            if (completedCount === totalFiles) {
                finishImport(logEntries);
            }
        };
        reader.readAsText(file);
    });
    // Clear input
    event.target.value = "";
});

function finishImport(logEntries) {
    refreshFileViewer();
    var logBlob = new Blob([logEntries.join("\n")], { type: "text/plain" });
    var logUrl = URL.createObjectURL(logBlob);
    alert("File(s) successfully imported!\nLog: " + logUrl);
}
// Helper function to sanitize user inputs
function sanitize(input) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(input));
    return div.innerHTML;
}

function createNewJSON() {
    var usernameInput = document.getElementById('username');
    // Sanitize input
    var username = sanitize(usernameInput.value);
    if (username.length > 32) {
        username = username.substring(0, 32);
        usernameInput.value = username;
    }
    
    var wdym = sanitize(document.getElementById('wdym').value);
    
    // Gather additional (custom) fields while sanitizing entries.
    var customFields = {};
    document.querySelectorAll('.customFieldPair').forEach(function(pair) {
        var fieldName = sanitize(pair.querySelector('.customFieldName').value.trim());
        var fieldValue = sanitize(pair.querySelector('.customFieldValue').value.trim());
        if (fieldName !== '') {
            customFields[fieldName] = fieldValue;
        }
    });
    
    // Sanitize username for key
    var sanitizedUsername = username.replace(/[^A-Za-z0-9]/g, '');
    var uid = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    var key = uid + '_' + sanitizedUsername;
    
    var data = {
        username: username,
        wdym: wdym,
        additionalFields: customFields
    };
    
    var jsonStr = JSON.stringify(data, null, 2);
    localStorage.setItem(key, jsonStr);
    console.log("Data saved with key:", key);
    refreshFileViewer();
}

function updateExistingJSON(key) {
    var username = sanitize(document.getElementById('username').value);
    var wdym = sanitize(document.getElementById('wdym').value);
    
    var customFields = {};
    document.querySelectorAll('.customFieldPair').forEach(function(pair) {
        var fieldName = sanitize(pair.querySelector('.customFieldName').value.trim());
        var fieldValue = sanitize(pair.querySelector('.customFieldValue').value.trim());
        if (fieldName !== '') {
            customFields[fieldName] = fieldValue;
        }
    });
    
    var data = {
        username: username,
        wdym: wdym,
        additionalFields: customFields
    };
    
    var jsonStr = JSON.stringify(data, null, 2);
    localStorage.setItem(key, jsonStr);
    console.log("Data updated for key:", key);
    editingKey = null;
    document.querySelector('#userForm button[type="submit"]').textContent = "Create JSON";
    refreshFileViewer();
}
// Initialize file viewer on page load.
window.addEventListener("load", refreshFileViewer);