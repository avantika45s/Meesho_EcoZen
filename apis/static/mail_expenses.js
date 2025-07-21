// // document.addEventListener('DOMContentLoaded', function() {
// //     // Function to fetch mail expenses and update the table
// //     function fetchAndDisplayMailExpenses() {
// //         fetch('/api/mail_expenses') // Replace this URL with your API endpoint
// //             .then(response => response.json())
// //             .then(data => {
// //                 const tableBody = document.querySelector('#expenses-table tbody');
// //                 tableBody.innerHTML = ''; // Clear previous data

// //                 data.forEach(expense => {
// //                     const row = document.createElement('tr');
// //                     row.innerHTML = `
// //                         <td>${expense.date_of_purchase}</td>
// //                         <td>${expense.order_id}</td>
// //                         <td>${expense.platform}</td> 
// //                         <td>${expense.item}</td>
// //                         <td>${expense.category}</td>
// //                         <td>${expense.amount}</td>
// //                         <td>${expense.status}</td>
// //                         <td>${expense.feedback}</td>
// //                     `;
// //                     tableBody.appendChild(row);
// //                 });
// //             })
// //             .catch(error => console.error('Error fetching mail expenses:', error));
// //     }

// //     // Fetch and display mail expenses initially
// //     fetchAndDisplayMailExpenses();

// //     // Set up WebSocket connection for real-time updates
// //     const socket = new WebSocket('ws://localhost:8000/ws/mail_expenses/'); // Replace with your WebSocket URL

// //     socket.onmessage = function(event) {
// //         const newExpense = JSON.parse(event.data);
// //         const tableBody = document.querySelector('#expenses-table tbody');

// //         const row = document.createElement('tr');
// //         row.innerHTML = `
// //             <td>${newExpense.date_of_purchase}</td>
// //             <td>${newExpense.order_id}</td>
// //             <td>${newExpense.platform}</td> 
// //             <td>${newExpense.item}</td>
// //             <td>${newExpense.category}</td>
// //             <td>${newExpense.amount}</td>
// //             <td>${newExpense.status}</td>
// //             <td>${newExpense.feedback}</td>
// //         `;

// //         tableBody.insertBefore(row, tableBody.firstChild);
// //     };
// // });


// // mail_expenses.js

// document.addEventListener("DOMContentLoaded", function() {
//     const form = document.getElementById("mail_expenses_form");
//     form.addEventListener("submit", function(event) {
//         event.preventDefault(); // Prevent the default form submission

//         const userId = document.getElementById("user-id").value;
//         // const timePeriod = document.getElementById("time-period").value;

//         // Send AJAX request to your Django view
//         fetch(`/api/mail-expenses/?id=${userId}&time=${timePeriod}`, {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//         })
//         .then(response => response.json())
//         .then(data => {
//             // Update the table with the fetched data
//             const tableBody = document.getElementById("expenses-table");
//             tableBody.innerHTML = ""; // Clear existing table data
            
//             // Loop through the data and append rows to the table
//             data.forEach(expense => {
//                 const row = document.createElement("tr");
//                 row.innerHTML = `
//                     <td>${expense.date}</td>
//                     <td>${expense.orderId}</td>
//                     <td>${expense.platform}</td>
//                     <td>${expense.item}</td>
//                     <td>${expense.category}</td>
//                     <td>${expense.amount}</td>
//                     <td>${expense.status}</td>
//                     <td>${expense.feedback}</td>
//                 `;
//                 tableBody.appendChild(row);
//             });
//         })
//         .catch(error => {
//             console.error("Error:", error);
//         });
//     });
// });


// document.getElementById("expenseForm").addEventListener("submit", function(event) {
//     event.preventDefault();
//     const userId = document.getElementById("userId").value;
//     fetch(`/api/mail-expenses-view/?id=${userId}`)
//         .then(response => response.json())
//         .then(data => {
//             // Handle response data, maybe update table with fetched mail expenses
//             console.log(data);
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// });

// document.getElementById("expenseForm").addEventListener("submit", function(event) {
//     event.preventDefault();
//     const userId = document.getElementById("userId").value;
//     // Constructing the payload for the POST request
//     const payload = {
//         id: userId
//         // You can add more data to the payload if needed
//     };

//     fetch('/apis/mail_expense_view/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(payload) // Convert the payload to JSON string
//     })
//     .then(response => response.json())
//     .then(data => {
//         // Handle response data, maybe update table with fetched mail expenses
//         console.log(data);
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
// });




