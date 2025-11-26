Kasatria 3D People Visualization

A 3D interactive data-visualization web application built for the Kasatria preliminary assignment.
This project integrates Google Sign-In, Google Sheets, and Three.js CSS3DRenderer to dynamically display people data in multiple 3D layouts.

🚀 Live Demo

Webpage:
https://hafdoon05.github.io/kasatria-3d-visualization/

📊 Google Sheet

The Google Sheet containing the imported CSV data has been shared with the reviewer as required.

🔧 Technologies Used

Three.js (CSS3DRenderer)

Google Identity Services (OAuth2 Login)

Google Sheets CSV API

HTML / CSS / JavaScript

GitHub Pages Hosting

🧩 Features
✔ Google Sign-In Authentication

Users must sign in using their Google account before accessing the visualization.

✔ Dynamic Data Loading

People data is retrieved directly from the Google Sheet (CSV URL) at runtime.

✔ 3D Interactive Tiles

Each person is displayed as a stylized 3D card showing:

Country (top-left)

Age (top-right)

Photo

Full Name

Interest

✔ Net Worth Color Coding

Cards are highlighted with glowing borders depending on net worth:

Red → < 100K

Orange → 100K–199,999

Green → ≥ 200K

✔ Four 3D Layouts

Users can switch between:

Table (20×10)

Sphere

Double Helix (custom requirement)

Grid (5×4×10)

Includes smooth transitions using Three.js & TWEEN animations.

📁 Project Structure
├── index.html
├── main.js
└── assets/

🛠 How to Run Locally

Clone the repository:

git clone https://github.com/Hafdoon05/kasatria-3d-visualization.git


Open the folder in VS Code.

Start using Live Server:

Right-click index.html → Open with Live Server

Login using Google to view the 3D visualization.

🌐 Deployment

The project is hosted using GitHub Pages.
Any updates pushed to the main branch automatically update the live page.

📄 License

This project is licensed under the MIT License.
