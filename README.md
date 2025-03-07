# new-todo-list

# My Hierarchical ToDo App

**Features**:
- Multiple user accounts (register, login)
- Each user can create multiple lists
- Each list can contain items, and each item can contain sub-items (infinite nesting allowed in data)
- Visually limit item creation to 3 levels deep (but you can remove that limit in `Item.js`)
- Drag-and-drop to move tasks, including sub-items, to any other item or list
- Mark tasks as complete
- Hide/show (collapse/expand) sub-items
- Beautiful design (white and light brown theme)
- Data is stored in a SQLite database via SQLAlchemy

**File Structure**:
- `server/` : Flask backend
  - `app.py` : All routes (register, login, CRUD for lists/items, etc.)
  - `models.py` : SQLAlchemy models (User, List, Item)
  - `requirements.txt` : Python dependencies
  - `database.db` : SQLite DB file (auto-generated)
- `client/` : React frontend
  - `public/index.html` : root HTML
  - `src/index.js` : entry for React
  - `src/components/` : React components
    - `Auth.js` : Login & registration UI
    - `App.js` : Main app logic (fetch data, drag-and-drop)
    - `List.js` : Renders a single list + top-level items
    - `Item.js` : Renders a single item, sub-items, complete toggle
  - `src/styles/` : CSS files for styling
  - `src/utils/api.js` : All API calls to Flask
  - `package.json` : Node dependencies
- `.gitignore` : standard ignores
- `README.md` : project overview (this file)

**Setup**:

1. **Server**:  
   ```bash
   cd server
   pip install -r requirements.txt
   python app.py
   ```
   Runs at http://127.0.0.1:5000
   Creates database.db if not present.

2. **Client**:
    ```bash
    cd client
    npm install
    npm start
    ```
    Runs at http://localhost:3000

3. **Usage**: 
    - Open the site. You’ll see a login / register page.
    - Register a user, then log in.
    - Create lists, add tasks, nest tasks, mark them complete move them around with drag-and-drop.

Testing:
There is no built-in test suite. 
