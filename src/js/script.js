document.addEventListener("DOMContentLoaded", () => {
    // Add header function
    function createHeader() {
        const header = document.createElement('header');
        header.classList.add('page-header');
        
        header.innerHTML = `
            <div class="header-top">
                <a href="https://bitmates.io/" target="_blank" class="image-link">
                    <img src="https://bitmates.io/assets/BitmatesLogo1-DL6rVBW_.png" alt="Logo" class="zoom-effect">
                </a>
            </div>
        `;

        return header;
    }

    // Insert header
    document.body.insertBefore(createHeader(), document.body.firstChild);

    const apiUrl = "https://bitmatemediator.net/game/v1/onlineplayers";
    
    async function fetchServerList() {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const uniqueWorlds = [...new Set(data.players.map(player => player.world))];
            
            // Server mapping
            const serverMapping = [
                { name: "Server 2", world: "eu-west-2.bitmates.online" },
                { name: "Server 3", world: "us-east-3.bitmates.online" },
                { name: "Server 4", world: "br-4.bitmates.online" },
                { name: "Server 5", world: "us-east-5.bitmates.online" }
            ];

            // Filter only online servers
            return serverMapping.filter(server => uniqueWorlds.includes(server.world));
        } catch (error) {
            console.error("Error loading servers:", error);
            throw error;
        }
    }

    // Load saved data from localStorage
    function loadSavedData() {
        const savedData = localStorage.getItem('npcQuestData');
        return savedData ? JSON.parse(savedData) : {};
    }

    // Save data to localStorage
    function saveData(data) {
        localStorage.setItem('npcQuestData', JSON.stringify(data));
    }

    function updateRowHighlighting(row) {
        const cells = Array.from(row.getElementsByTagName('td')).slice(1);
        
        // Remove all color classes first
        cells.forEach(cell => {
            cell.classList.remove('value-highest', 'value-high', 'value-medium', 'value-low', 'value-lowest');
        });

        // Get unique non-zero values
        const values = [...new Set(cells
            .map(cell => parseInt(cell.textContent) || 0)
            .filter(value => value > 0))]
            .sort((a, b) => b - a); // Order from highest to lowest

        if (values.length === 0) return;

        // Apply colors based on unique values
        cells.forEach(cell => {
            const cellValue = parseInt(cell.textContent) || 0;
            if (cellValue === 0) return;

            const index = values.indexOf(cellValue);
            const position = index / (values.length - 1 || 1);

            if (values.length === 1 || index === 0) {
                cell.classList.add('value-highest'); // Dark green for the highest
            } else if (position <= 0.25) {
                cell.classList.add('value-high'); // Light green
            } else if (position <= 0.5) {
                cell.classList.add('value-medium'); // Yellow
            } else if (position <= 0.75) {
                cell.classList.add('value-low'); // Orange
            } else {
                cell.classList.add('value-lowest'); // Red for the lowest
            }
        });
    }

    function updateTotals(table, servers, savedData) {
        // Remove existing total row if exists
        const lastRow = table.querySelector('tr:last-child');
        if (lastRow && lastRow.querySelector('td:first-child').textContent === 'TOTAL') {
            table.removeChild(lastRow);
        }

        // Create new total row
        const totalRow = document.createElement("tr");
        totalRow.style.borderTop = "3px solid #3f2832"; // Thicker border
        
        // TOTAL cell title
        const totalLabelCell = document.createElement("td");
        totalLabelCell.textContent = "TOTAL";
        totalLabelCell.style.fontWeight = "bold";
        totalLabelCell.style.backgroundColor = "#C9A77D";
        totalRow.appendChild(totalLabelCell);

        // Calculate all totals first to determine highest
        const totals = servers.map(server => ({
            server: server,
            total: Object.entries(savedData)
                .filter(([key]) => key.includes(server.world))
                .reduce((sum, [_, value]) => sum + (parseInt(value) || 0), 0)
        }));

        const nonZeroTotals = totals.filter(item => item.total > 0)
            .sort((a, b) => b.total - a.total);

        // Add total cells with colors
        totals.forEach(({server, total}) => {
            const totalCell = document.createElement("td");
            totalCell.style.fontWeight = "bold";
            totalCell.textContent = total;

            if (nonZeroTotals.length > 0) {
                const position = nonZeroTotals.findIndex(t => t.total === total);
                if (position !== -1) {
                    const normalizedPosition = position / (nonZeroTotals.length - 1 || 1);

                    if (nonZeroTotals.length === 1 || position === 0) {
                        totalCell.style.backgroundColor = "#2E7D32"; // Dark green
                    } else if (normalizedPosition <= 0.25) {
                        totalCell.style.backgroundColor = "#4CAF50"; // Light green
                    } else if (normalizedPosition <= 0.5) {
                        totalCell.style.backgroundColor = "#FFEB3B"; // Yellow
                    } else if (normalizedPosition <= 0.75) {
                        totalCell.style.backgroundColor = "#FFA726"; // Orange
                    } else {
                        totalCell.style.backgroundColor = "#EF5350"; // Red
                    }
                } else {
                    totalCell.style.backgroundColor = "#C9A77D"; // Default color if no value
                }
            } else {
                totalCell.style.backgroundColor = "#C9A77D"; // Default color if no values
            }

            totalRow.appendChild(totalCell);
        });

        table.appendChild(totalRow);
    }

    function clearColumn(serverWorld) {
        const savedData = loadSavedData();
        Object.keys(savedData).forEach(key => {
            if (key.includes(serverWorld)) {
                delete savedData[key];
            }
        });
        saveData(savedData);
        initialize(); // Reload entire table
    }

    function clearRow(npcName) {
        const savedData = loadSavedData();
        Object.keys(savedData).forEach(key => {
            if (key.startsWith(npcName + '-')) {
                delete savedData[key];
            }
        });
        saveData(savedData);
        initialize(); // Reload entire table
    }

    function clearAll() {
        localStorage.removeItem('npcQuestData');
        initialize();
    }

    function createQuestTable(servers) {
        const contentDiv = document.getElementById("content");
        
        // Create main container
        const container = document.createElement("div");
        container.className = "content-container";
        
        // Create Clear All button
        const clearAllButton = document.createElement("button");
        clearAllButton.innerHTML = "Clear all";
        clearAllButton.className = "delete-btn clear-all-btn";
        clearAllButton.title = "Clear all data";
        clearAllButton.onclick = clearAll;

        // Create table
        const table = document.createElement("table");
        table.className = "npc-table";

        // Add elements to container
        container.appendChild(clearAllButton);
        container.appendChild(table);

        const npcs = [
            "Wilson", "Elda", "Chop", "Pascal", "Yatiri", "Rusty",
            "Benoit", "Sage", "Tinker", "Blooby", "King Leo", "Milton"
        ];

        const savedData = loadSavedData();

        // Create header row with delete column buttons
        const headerRow = document.createElement("tr");
        const npcHeader = document.createElement("th");
        npcHeader.textContent = "NPC";
        headerRow.appendChild(npcHeader);

        servers.forEach(server => {
            const th = document.createElement("th");
            const headerCell = document.createElement("div");
            headerCell.className = "header-cell";
            
            const serverName = document.createElement("span");
            serverName.textContent = server.name;
            
            const deleteBtn = document.createElement("button");
            deleteBtn.innerHTML = "×";
            deleteBtn.className = "delete-btn";
            deleteBtn.title = "Clear column";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                clearColumn(server.world);
                initialize();
            };

            headerCell.appendChild(serverName);
            headerCell.appendChild(deleteBtn);
            th.appendChild(headerCell);
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Create rows for each NPC
        npcs.forEach(npcName => {
            const row = document.createElement("tr");
            
            // NPC name cell with delete button
            const nameCell = document.createElement("td");
            const npcCell = document.createElement("div");
            npcCell.className = "npc-cell";
            
            const name = document.createElement("span");
            name.textContent = npcName;
            
            const deleteBtn = document.createElement("button");
            deleteBtn.innerHTML = "×";
            deleteBtn.className = "delete-btn";
            deleteBtn.title = "Clear row";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                clearRow(npcName);
                initialize();
            };

            npcCell.appendChild(name);
            npcCell.appendChild(deleteBtn);
            nameCell.appendChild(npcCell);
            row.appendChild(nameCell);

            servers.forEach(server => {
                const cell = document.createElement("td");
                cell.className = "editable";
                const savedValue = savedData[`${npcName}-${server.world}`] || 0;
                cell.textContent = savedValue;

                // Make cell editable on click
                cell.addEventListener('click', function() {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.min = "0";
                    input.placeholder = "";
                    input.value = this.textContent === "0" ? "" : this.textContent;
                    input.className = 'cell-input';
                    
                    input.onblur = function() {
                        const newValue = parseInt(this.value) || 0;
                        cell.textContent = newValue;
                        savedData[`${npcName}-${server.world}`] = newValue;
                        saveData(savedData);
                        updateRowHighlighting(row);
                        updateTotals(table, servers, savedData);
                        
                        // Update statistics
                        const statsSection = createStatsSection(servers, savedData);
                        const oldStats = document.querySelector('.stats-section');
                        if (oldStats) {
                            oldStats.replaceWith(statsSection);
                        }
                    };

                    input.onkeydown = function(e) {
                        const currentCell = this.parentElement;
                        const currentRow = currentCell.parentElement;
                        const allRows = Array.from(table.getElementsByTagName('tr'));
                        const currentRowIndex = allRows.indexOf(currentRow);
                        const nextRow = allRows[currentRowIndex + 1];
                        const isLastRow = currentRowIndex === allRows.length - 2;
                        
                        if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            
                            // Save current value
                            const newValue = parseInt(this.value) || 0;
                            cell.textContent = newValue;
                            savedData[`${npcName}-${server.world}`] = newValue;
                            saveData(savedData);
                            updateRowHighlighting(currentRow);
                            updateTotals(table, servers, savedData);
                            
                            // Update statistics
                            const statsSection = createStatsSection(servers, savedData);
                            const oldStats = document.querySelector('.stats-section');
                            if (oldStats) {
                                oldStats.replaceWith(statsSection);
                            }

                            // If it's the last row, move to next column in first row
                            if (isLastRow) {
                                const cells = Array.from(currentRow.cells);
                                const currentCellIndex = cells.indexOf(currentCell);
                                
                                // Find next column
                                const nextColumnIndex = currentCellIndex + 1;
                                
                                // If next column exists
                                if (nextColumnIndex < cells.length) {
                                    // Find first row with editable cells (after header)
                                    const firstDataRow = allRows[1]; // index 1 because 0 is the header
                                    const nextCell = firstDataRow.cells[nextColumnIndex];
                                    
                                    if (nextCell && nextCell.classList.contains('editable')) {
                                        nextCell.click();
                                    }
                                } else {
                                    // If no next column exists, go back to first column of first row
                                    const firstDataRow = allRows[1];
                                    const firstEditableCell = Array.from(firstDataRow.cells).find(cell => cell.classList.contains('editable'));
                                    if (firstEditableCell) {
                                        firstEditableCell.click();
                                    }
                                }
                            } else {
                                // Normal behavior for other rows
                                if (nextRow && nextRow.querySelector('td:first-child').textContent !== 'TOTAL') {
                                    const cellIndex = Array.from(currentRow.cells).indexOf(currentCell);
                                    const nextCell = nextRow.cells[cellIndex];
                                    
                                    if (nextCell.classList.contains('editable')) {
                                        nextCell.click();
                                    }
                                }
                            }
                        }
                    };

                    this.textContent = '';
                    this.appendChild(input);
                    input.focus();
                });

                row.appendChild(cell);
            });

            table.appendChild(row);
            updateRowHighlighting(row);
        });

        // Remove original total creation and use updateTotals function
        updateTotals(table, servers, savedData);

        // Add statistics section after table
        const statsSection = createStatsSection(servers, savedData);
        container.appendChild(statsSection);

        // Clear previous content and add new container
        contentDiv.innerHTML = "";
        contentDiv.appendChild(container);
    }

    async function initialize() {
        try {
            const servers = await fetchServerList();
            createQuestTable(servers);
        } catch (error) {
            console.error("Error initializing quest table:", error);
            document.getElementById("content").innerHTML = "<h2 class='error-text'>Error loading quest data.</h2>";
        }
    }

    // Initialize the table
    initialize();

    function createStatsSection(servers, savedData) {
        const statsDiv = document.createElement('div');
        statsDiv.className = 'stats-section';

        // Calculate totals by server
        const serverTotals = servers.map(server => ({
            name: server.name,
            world: server.world,
            total: Object.entries(savedData)
                .filter(([key]) => key.includes(server.world))
                .reduce((sum, [_, value]) => sum + (parseInt(value) || 0), 0)
        })).sort((a, b) => b.total - a.total);

        // Calculate best value for each NPC
        const npcs = [
            "Wilson", "Elda", "Chop", "Pascal", "Yatin", "Rusty",
            "Benoit", "Sage", "Tinker", "Blooby", "King Leo", "Milton"
        ];

        const bestNpcsTotal = npcs.reduce((sum, npc) => {
            const npcValues = servers.map(server => 
                parseInt(savedData[`${npc}-${server.world}`] || 0)
            );
            return sum + Math.max(...npcValues);
        }, 0);

        // Find servers with values greater than zero
        const activeServers = serverTotals.filter(server => server.total > 0);
        
        // Create statistics elements
        statsHTML = `
            <div class="stat-item">
                <span class="stat-label">Best server:</span>
                <span class="stat-value" style="color: #2E7D32">
                    ${activeServers.length > 0 ? `${activeServers[0].name} (${activeServers[0].total})` : 'None (0)'}
                </span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Worst server:</span>
                <span class="stat-value" style="color: #EF5350">
                    ${activeServers.length > 0 ? `${activeServers[activeServers.length - 1].name} (${activeServers[activeServers.length - 1].total})` : 'None (0)'}
                </span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Best NPCs total:</span>
                <span class="stat-value">${bestNpcsTotal}</span>
            </div>
        `;

        statsDiv.innerHTML = statsHTML;
        return statsDiv;
    }
}); 