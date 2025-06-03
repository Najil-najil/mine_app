document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const websiteTitle = document.getElementById('website-title'); // For potential dynamic changes

    // Pop-up elements
    const popupMessage = document.getElementById('popup-message');
    const popupText = document.getElementById('popup-text');
    const popupCloseBtn = document.getElementById('popup-close');

    // --- Utility Functions ---
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const showPopup = (message) => {
        popupText.textContent = message;
        popupMessage.style.display = 'block';
    };

    popupCloseBtn.addEventListener('click', () => {
        popupMessage.style.display = 'none';
    });

    // --- Data Storage (localStorage) ---
    const storageKeys = {
        expenses: 'ankExpenses',
        classDetails: 'ankClassDetails',
        savedMessages: 'ankSavedMessages'
    };

    const saveData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const loadData = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    };

    // --- Tab Switching ---
    const activateTab = (tabId) => {
        tabContents.forEach(content => {
            content.style.display = content.id === tabId ? 'block' : 'none';
        });
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Specific actions when a tab is activated
        if (tabId === 'addExpenses') {
            document.getElementById('expense-date').value = getTodayDate();
        } else if (tabId === 'addClassDetails') {
            document.getElementById('class-date-class').value = getTodayDate();
            document.getElementById('class-date-done').value = getTodayDate();
        } else if (tabId === 'viewExpenses') {
            renderViewExpenses();
        } else if (tabId === 'viewClassDetails') {
            renderViewClassDetails();
        } else if (tabId === 'saved') {
            renderSavedMessages();
            document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            activateTab(tab.dataset.tab);
        });
    });

    // --- Add Expenses Tab ---
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newExpense = {
                id: Date.now(), // Unique ID
                date: document.getElementById('expense-date').value,
                food: parseInt(document.getElementById('expense-food').value) || 0,
                bus: parseInt(document.getElementById('expense-bus').value) || 0,
                others: parseInt(document.getElementById('expense-others').value) || 0,
            };

            const expenses = loadData(storageKeys.expenses);
            expenses.push(newExpense);
            saveData(storageKeys.expenses, expenses);

            expenseForm.reset();
            document.getElementById('expense-date').value = getTodayDate(); // Reset date to today
            showPopup('EXPENSE ADDED SUCCESSFULLY');
        });
    }

    // --- Add Class Details Tab ---
    const classDetailsForm = document.getElementById('class-details-form');
    if (classDetailsForm) {
        classDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newClassDetail = {
                id: Date.now(),
                subject: document.getElementById('class-subject').value,
                title: document.getElementById('class-title').value.trim(),
                unit: parseFloat(document.getElementById('class-unit').value),
                classNum: document.getElementById('class-number').value ? parseInt(document.getElementById('class-number').value) : null,
                dateClass: document.getElementById('class-date-class').value,
                dateDone: document.getElementById('class-date-done').value,
                createdNote: document.getElementById('class-created-note').value,
            };

            const classDetails = loadData(storageKeys.classDetails);
            classDetails.push(newClassDetail);
            saveData(storageKeys.classDetails, classDetails);

            classDetailsForm.reset();
            document.getElementById('class-date-class').value = getTodayDate();
            document.getElementById('class-date-done').value = getTodayDate();
            showPopup('CLASS DETAIL ADDED SUCCESSFULLY');
        });
    }

    // --- View Expenses Tab ---
    const weeklyTotalEl = document.getElementById('weekly-total');
    const overallTotalEl = document.getElementById('overall-total');
    const expenseGraphEl = document.getElementById('expense-graph');
    const allExpensesListEl = document.getElementById('all-expenses-list');

    const getStartOfWeek = (date) => { // Monday as start of week
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    };
    
    const formatDateForCompare = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const renderViewExpenses = () => {
        const expenses = loadData(storageKeys.expenses).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date desc
        let weeklyTotal = 0;
        let overallTotal = 0;

        const today = new Date();
        const startOfWeek = getStartOfWeek(today);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const formattedStartOfWeek = formatDateForCompare(startOfWeek);
        const formattedEndOfWeek = formatDateForCompare(endOfWeek);

        expenses.forEach(exp => {
            const expenseTotal = exp.food + exp.bus + exp.others;
            overallTotal += expenseTotal;
            const expDate = new Date(exp.date);
            const formattedExpDate = exp.date; // Already YYYY-MM-DD

            if (formattedExpDate >= formattedStartOfWeek && formattedExpDate <= formattedEndOfWeek) {
                weeklyTotal += expenseTotal;
            }
        });

        if (weeklyTotalEl) weeklyTotalEl.textContent = weeklyTotal;
        if (overallTotalEl) overallTotalEl.textContent = overallTotal;

        // Render Graph (simple version for last 7 entries, or 7 days if data dense)
        if (expenseGraphEl) {
            expenseGraphEl.innerHTML = ''; // Clear previous graph
            const dailyTotals = {};
            expenses.forEach(exp => {
                const total = exp.food + exp.bus + exp.others;
                dailyTotals[exp.date] = (dailyTotals[exp.date] || 0) + total;
            });

            const sortedDates = Object.keys(dailyTotals).sort((a, b) => new Date(a) - new Date(b));
            const recentDates = sortedDates.slice(-7); // Last 7 days with expenses

            let maxTotal = 0;
            recentDates.forEach(date => {
                if (dailyTotals[date] > maxTotal) maxTotal = dailyTotals[date];
            });
            if (maxTotal === 0) maxTotal = 1; // Avoid division by zero for height percentage

            recentDates.forEach(date => {
                const bar = document.createElement('div');
                bar.classList.add('graph-bar');
                const dayTotal = dailyTotals[date];
                bar.style.height = `${(dayTotal / maxTotal) * 90}%`; // 90% of graph height
                bar.style.width = `${100 / recentDates.length - 2}%`; // Adjust width based on number of bars

                const valueSpan = document.createElement('span');
                valueSpan.classList.add('bar-value');
                valueSpan.textContent = dayTotal;

                const dateSpan = document.createElement('span');
                dateSpan.classList.add('bar-date');
                dateSpan.textContent = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                bar.appendChild(valueSpan);
                bar.appendChild(dateSpan);
                expenseGraphEl.appendChild(bar);
            });
             if (recentDates.length === 0) {
                expenseGraphEl.innerHTML = '<p>Not enough data for graph.</p>';
            }
        }

        // Render All Expenses List
        if (allExpensesListEl) {
            allExpensesListEl.innerHTML = '<h3>All Saved Expenses (Recent First)</h3>'; // Reset
            if (expenses.length === 0) {
                allExpensesListEl.innerHTML += '<p>No expenses recorded yet.</p>';
                return;
            }
            expenses.forEach(exp => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('expense-item');
                itemDiv.dataset.id = exp.id;

                itemDiv.innerHTML = `
                    <strong>Date:</strong> <input type="date" class="edit-expense-date" value="${exp.date}">
                    <strong>Food:</strong> <input type="number" class="edit-expense-food" value="${exp.food}">
                    <strong>Bus:</strong> <input type="number" class="edit-expense-bus" value="${exp.bus}">
                    <strong>Others:</strong> <input type="number" class="edit-expense-others" value="${exp.others}">
                    <button class="save-edit-expense-btn">Save Edit</button>
                    <button class="delete-expense-btn">Delete</button>
                `;
                allExpensesListEl.appendChild(itemDiv);
            });

            // Add event listeners for edit/delete
            allExpensesListEl.querySelectorAll('.save-edit-expense-btn').forEach(button => {
                button.addEventListener('click', (e) => saveEditedExpense(e.target.closest('.expense-item').dataset.id));
            });
            allExpensesListEl.querySelectorAll('.delete-expense-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteExpense(e.target.closest('.expense-item').dataset.id));
            });
        }
    };

    const saveEditedExpense = (id) => {
        const itemId = parseInt(id);
        const itemDiv = document.querySelector(`.expense-item[data-id='${itemId}']`);
        if (!itemDiv) return;

        const updatedExpense = {
            id: itemId,
            date: itemDiv.querySelector('.edit-expense-date').value,
            food: parseInt(itemDiv.querySelector('.edit-expense-food').value) || 0,
            bus: parseInt(itemDiv.querySelector('.edit-expense-bus').value) || 0,
            others: parseInt(itemDiv.querySelector('.edit-expense-others').value) || 0,
        };

        let expenses = loadData(storageKeys.expenses);
        expenses = expenses.map(exp => exp.id === itemId ? updatedExpense : exp);
        saveData(storageKeys.expenses, expenses);
        showPopup('Expense updated!');
        renderViewExpenses(); // Re-render to reflect changes and totals
    };

    const deleteExpense = (id) => {
        const itemId = parseInt(id);
        if (confirm('Are you sure you want to delete this expense?')) {
            let expenses = loadData(storageKeys.expenses);
            expenses = expenses.filter(exp => exp.id !== itemId);
            saveData(storageKeys.expenses, expenses);
            showPopup('Expense deleted!');
            renderViewExpenses(); // Re-render
        }
    };


    // --- View Class Details Tab ---
    const classSubjectCategoriesEl = document.getElementById('class-subject-categories');
    const classTitlesListEl = document.getElementById('class-titles-list');
    const classFullDetailsEl = document.getElementById('class-full-details');

    const renderViewClassDetails = () => {
        const classDetails = loadData(storageKeys.classDetails).sort((a,b) => (a.subject || "").localeCompare(b.subject || "") || (a.title || "").localeCompare(b.title || ""));

        if (classSubjectCategoriesEl) classSubjectCategoriesEl.innerHTML = '';
        if (classTitlesListEl) classTitlesListEl.innerHTML = '';
        if (classFullDetailsEl) classFullDetailsEl.innerHTML = '';

        const subjects = [...new Set(classDetails.map(item => item.subject))].sort();
        
        if (subjects.length === 0 && classSubjectCategoriesEl) {
            classSubjectCategoriesEl.innerHTML = '<p>No class details recorded yet.</p>';
            return;
        }

        subjects.forEach(subject => {
            const button = document.createElement('button');
            button.textContent = subject;
            button.addEventListener('click', () => displayTitlesForSubject(subject, classDetails));
            if (classSubjectCategoriesEl) classSubjectCategoriesEl.appendChild(button);
        });
    };

    const displayTitlesForSubject = (subject, allDetails) => {
        if (classTitlesListEl) classTitlesListEl.innerHTML = '';
        if (classFullDetailsEl) classFullDetailsEl.innerHTML = '';

        const itemsForSubject = allDetails.filter(item => item.subject === subject)
                                          .sort((a,b) => (a.title || "").localeCompare(b.title || ""));
        
        if (itemsForSubject.length === 0 && classTitlesListEl) {
             classTitlesListEl.innerHTML = '<p>No entries for this subject.</p>';
            return;
        }

        itemsForSubject.forEach(item => {
            const button = document.createElement('button');
            button.textContent = item.title || `Unit ${item.unit} (No Title)`;
            button.addEventListener('click', () => displayFullClassDetail(item.id, allDetails));
            if (classTitlesListEl) classTitlesListEl.appendChild(button);
        });
    };

    const displayFullClassDetail = (itemId, allDetails) => {
        if (classFullDetailsEl) classFullDetailsEl.innerHTML = '';
        const item = allDetails.find(d => d.id === itemId);
        if (!item) return;

        const detailDiv = document.createElement('div');
        detailDiv.classList.add('class-detail-entry');
        detailDiv.innerHTML = `
            <p><strong>Subject:</strong> ${item.subject}</p>
            <p><strong>Title:</strong> ${item.title || 'N/A'}</p>
            <p><strong>Unit/Chapter No.:</strong> ${item.unit}</p>
            <p><strong>Class Number:</strong> ${item.classNum || 'N/A'}</p>
            <p><strong>Date of Class:</strong> ${item.dateClass ? new Date(item.dateClass).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Date of Done:</strong> ${new Date(item.dateDone).toLocaleDateString()}</p>
            <p><strong>Created Note:</strong> ${item.createdNote}</p>
            <button class="delete-class-btn" data-id="${item.id}">Delete</button>
        `;
        if (classFullDetailsEl) classFullDetailsEl.appendChild(detailDiv);

        classFullDetailsEl.querySelector('.delete-class-btn').addEventListener('click', (e) => {
            deleteClassDetail(parseInt(e.target.dataset.id));
        });
    };

    const deleteClassDetail = (id) => {
         if (confirm('Are you sure you want to delete this class detail?')) {
            let classDetails = loadData(storageKeys.classDetails);
            classDetails = classDetails.filter(item => item.id !== id);
            saveData(storageKeys.classDetails, classDetails);
            showPopup('Class detail deleted!');
            renderViewClassDetails(); // Re-render the entire view
        }
    };

    // --- Saved (Chat) Tab ---
    const chatMessagesEl = document.getElementById('chat-messages');
    const chatMessageInput = document.getElementById('chat-message-input');
    const sendChatMessageBtn = document.getElementById('send-chat-message');

    const renderSavedMessages = () => {
        if (!chatMessagesEl) return;
        chatMessagesEl.innerHTML = '';
        const messages = loadData(storageKeys.savedMessages).sort((a, b) => b.id - a.id); // Sort by ID (timestamp) desc

        if (messages.length === 0) {
            chatMessagesEl.innerHTML = '<p style="text-align:center; color:#888;">No messages saved yet.</p>';
        } else {
            messages.forEach(msg => {
                const messageBox = document.createElement('div');
                messageBox.classList.add('chat-message-box');
                
                const textP = document.createElement('p');
                textP.classList.add('message-text');
                textP.textContent = msg.text;

                const dateP = document.createElement('p');
                dateP.classList.add('message-date');
                dateP.textContent = new Date(msg.timestamp).toLocaleString();

                messageBox.appendChild(textP);
                messageBox.appendChild(dateP);
                chatMessagesEl.appendChild(messageBox);
            });
        }
        // Scroll to bottom (newest messages)
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    };

    if (sendChatMessageBtn) {
        sendChatMessageBtn.addEventListener('click', () => {
            const text = chatMessageInput.value.trim();
            if (text === '') return;

            const newMessage = {
                id: Date.now(), // Using timestamp as ID for sorting
                text: text,
                timestamp: new Date().toISOString() // Store full timestamp
            };

            const messages = loadData(storageKeys.savedMessages);
            messages.push(newMessage);
            saveData(storageKeys.savedMessages, messages);

            chatMessageInput.value = '';
            showPopup('MESSAGE ADDED SUCCESSFULLY');
            renderSavedMessages(); // Re-render messages
        });
    }
     if (chatMessageInput) {
        chatMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent new line on enter
                sendChatMessageBtn.click();
            }
        });
    }


    // --- Initial Setup ---
    // Set default dates for input fields (if not already handled by tab activation)
    const expenseDateInput = document.getElementById('expense-date');
    if (expenseDateInput) expenseDateInput.value = getTodayDate();
    
    const classDateClassInput = document.getElementById('class-date-class');
    if (classDateClassInput) classDateClassInput.value = getTodayDate();
    
    const classDateDoneInput = document.getElementById('class-date-done');
    if (classDateDoneInput) classDateDoneInput.value = getTodayDate();

    // Activate the default tab ('Add expences')
    activateTab('addExpenses');
});
