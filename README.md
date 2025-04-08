# Vaibhav Furnishings - Shop Management System

A complete admin-only inventory and sales management web application for a small furnishing shop. The application allows tracking sales, managing inventory, generating invoices via WhatsApp, and browsing products in a virtual showroom.

## Features

### 1. Sales Tracking (Live Updates)
- Record sales in real time
- View daily, weekly, monthly, and yearly total sales
- Each sale includes product details, quantity, price, date, and customer contact information

### 2. Inventory Management
- Add, edit, and delete products with details including name, category, quality/type, stock quantity, selling price, and purchase price
- Automatic stock updates when sales are recorded
- Dashboard view with filters by category, price range, etc.

### 3. WhatsApp Invoicing
- Send automatically generated invoices to customers via WhatsApp
- Invoices include item details, price, total, and a thank you note

### 4. Virtual Showroom
- Browse inventory items in a clean, filterable UI
- Filter by category, price range, or quality
- Quickly create sales from the showroom view

### 5. Reports
- View sales reports for any date range
- Calculate profit based on purchase and selling prices
- Export reports to CSV format

## How to Run

This is a client-side application built with HTML, CSS, and JavaScript. No server or build process is required.

1. Clone or download this repository
2. Open the `index.html` file in your web browser
3. That's it! The application will load with sample data

## Technologies Used

- HTML5 for structure
- CSS3 for styling
- Vanilla JavaScript for functionality
- Font Awesome for icons
- Local Storage for data persistence

## Data Storage

All data is stored in the browser's local storage. This means:
- The data will persist between sessions on the same device and browser
- The data will NOT be shared between different devices or browsers
- Clearing browser data will erase all shop data

## Sample Data

The application comes with sample products and sales data for demonstration purposes. This data will be automatically loaded the first time you open the application.

## Compatible Browsers

The application works best in modern browsers such as:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

## License

This project is developed for educational and demonstration purposes.

🧾 Key Features:

1. **Sales Tracking (Live Updates)**:
   - A section to record every sale in real time.
   - Shows **daily, weekly, monthly, and yearly** total sales in a straightforward format (no graphs/charts, just numbers).
   - Each sale includes: product name, quantity, selling price, date, and customer's mobile number.

2. **Inventory Management**:
   - Add each product with: name, category, quality/type, stock quantity, selling price, purchase price (visible only to admin).
   - On sale, the inventory automatically deducts stock.
   - Show a simple dashboard view of all items in inventory with filters (by category, price range, etc.).

3. **WhatsApp Invoicing**:
   - When a sale is entered, send an auto-generated invoice to the customer's **WhatsApp** via their mobile number (include item, price, total, and thanks note). 
   - The UI can have a "Send Invoice" button after entering sale.

4. **Virtual Showroom**:
   - Display the inventory items in a clean, filterable UI for browsing.
   - Can filter by category (e.g. carpets), price range, or quality.
   - This is only for in-shop viewing so that customers can be shown the available options directly from the app.

🧩 UI/UX Requirements:

- No login or signup – app opens directly on the dashboard/home.
- Clean, professional design matching the **home furnishing/retail theme**.
- Use styled text for branding (no logo space needed).
- Responsive design with a functional **header, footer, and navbar**.
- Simple navigation: Dashboard, Add Product, Sales Entry, Showroom, Reports.
- No customer-side pages (no About Us, Testimonials, or Contact Us).
- Keep color palette soft and professional (light grays, whites, subtle colors).

💡 Optional Enhancements:
- Add a simple profit/loss calculation: based on purchase and selling prices + manually entered expenses.
- Filter products that are **low in stock**.
- Export sales report in plain text or CSV.

📦 Technologies:
Use only **HTML, CSS, and JavaScript** (vanilla or optionally lightweight libraries like Alpine.js). Keep the structure modular and maintainable.

